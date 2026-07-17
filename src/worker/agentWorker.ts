import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { WORKER_MAX_OUTPUT_TOKENS, WORKER_MAX_WALL_MS } from "../lib/config";
import { agentEventsDao } from "../lib/dao/agentEvents";
import { agentRunsDao } from "../lib/dao/agentRuns";
import { artifactsDao } from "../lib/dao/artifacts";
import { ledgerEntriesDao } from "../lib/dao/ledgerEntries";
import { tasksDao } from "../lib/dao/tasks";
import { newId } from "../lib/ids";
import type { AgentRun, TaskStatus } from "../lib/schemas";

interface ContentBlock {
  type: string;
  text?: string;
  name?: string;
  is_error?: boolean;
}
interface StreamMessage {
  type?: string;
  subtype?: string;
  num_turns?: number;
  total_cost_usd?: number;
  usage?: { input_tokens?: number; output_tokens?: number };
  message?: {
    content?: ContentBlock[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };
}

function oneLine(s: string): string {
  return s.replace(/\s+/g, " ").trim().slice(0, 200);
}

function scanArtifacts(taskId: string, outDir: string, ts: string): number {
  if (!fs.existsSync(outDir)) return 0;
  let count = 0;
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const stat = fs.statSync(full);
        artifactsDao.add({
          id: newId(),
          task_id: taskId,
          filename: path.relative(outDir, full),
          path: full,
          mime: null,
          size_bytes: stat.size,
          created_at: ts,
        });
        count += 1;
      }
    }
  };
  walk(outDir);
  return count;
}

// 真实执行任务：spawn claude -p，解析 stream-json，强制时长/token 硬上限，如实记账
export async function runTask(taskId: string): Promise<void> {
  const task = tasksDao.get(taskId);
  if (!task) return;

  const workspaceDir = path.join(process.cwd(), "data", "workspaces", taskId);
  const outDir = path.join(workspaceDir, "out");
  fs.mkdirSync(outDir, { recursive: true });

  const runId = newId();
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  agentRunsDao.create({
    id: runId,
    task_id: taskId,
    started_at: startedAt,
    finished_at: null,
    exit_reason: null,
    duration_seconds: null,
    tokens_input: null,
    tokens_output: null,
    num_turns: null,
    num_tool_errors: 0,
    cost_usd: null,
    workspace_dir: workspaceDir,
  });
  tasksDao.setStatus(taskId, "running");

  const prompt = `${task.prompt}\n\n（工作区约定：请把最终交付物写入当前目录下的 ./out/ 文件夹。）`;
  const args = [
    "-p",
    prompt,
    "--output-format",
    "stream-json",
    "--verbose",
    "--dangerously-skip-permissions",
  ];
  const child = spawn("claude", args, { cwd: workspaceDir, env: process.env });

  let inputTokens = 0;
  let outputTokens = 0;
  let numTurns = 0;
  let numToolErrors = 0;
  let costUsd: number | null = null;
  let exitReason: AgentRun["exit_reason"] = "completed";
  let terminated = false;
  let buf = "";

  const forceKill = (reason: NonNullable<AgentRun["exit_reason"]>) => {
    if (terminated) return;
    terminated = true;
    exitReason = reason;
    child.kill("SIGTERM");
    setTimeout(() => child.kill("SIGKILL"), 5000);
  };

  const wallTimer = setTimeout(() => forceKill("timeout"), WORKER_MAX_WALL_MS);

  const handleLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg: StreamMessage;
    try {
      msg = JSON.parse(trimmed) as StreamMessage;
    } catch {
      return;
    }
    const ts = new Date().toISOString();
    if (msg.type === "system") {
      agentEventsDao.add(runId, "system", `系统事件：${msg.subtype ?? "init"}`, ts);
    } else if (msg.type === "assistant" && msg.message) {
      for (const block of msg.message.content ?? []) {
        if (block.type === "text" && block.text?.trim()) {
          agentEventsDao.add(runId, "text", oneLine(block.text), ts);
        } else if (block.type === "tool_use") {
          agentEventsDao.add(runId, "tool_use", `调用工具 ${block.name ?? "?"}`, ts);
        }
      }
      const u = msg.message.usage;
      if (u) {
        outputTokens = Math.max(outputTokens, u.output_tokens ?? 0);
        inputTokens = Math.max(inputTokens, u.input_tokens ?? 0);
      }
      if (outputTokens >= WORKER_MAX_OUTPUT_TOKENS) forceKill("token_limit");
    } else if (msg.type === "user" && msg.message) {
      for (const block of msg.message.content ?? []) {
        if (block.type === "tool_result" && block.is_error) {
          numToolErrors += 1;
          agentEventsDao.add(runId, "error", "工具执行失败", ts);
        }
      }
    } else if (msg.type === "result") {
      if (typeof msg.num_turns === "number") numTurns = msg.num_turns;
      if (typeof msg.total_cost_usd === "number") costUsd = msg.total_cost_usd;
      if (msg.usage) {
        outputTokens = Math.max(outputTokens, msg.usage.output_tokens ?? outputTokens);
        inputTokens = Math.max(inputTokens, msg.usage.input_tokens ?? inputTokens);
      }
      if (msg.subtype && msg.subtype !== "success" && !terminated) exitReason = "error";
    }
  };

  child.stdout.on("data", (chunk: Buffer) => {
    buf += chunk.toString();
    let idx = buf.indexOf("\n");
    while (idx >= 0) {
      handleLine(buf.slice(0, idx));
      buf = buf.slice(idx + 1);
      idx = buf.indexOf("\n");
    }
  });
  child.stderr.on("data", () => {});

  await new Promise<void>((resolve) => {
    child.on("close", () => resolve());
    child.on("error", (err: Error) => {
      exitReason = "error";
      agentEventsDao.add(runId, "error", `进程错误：${oneLine(err.message)}`, new Date().toISOString());
      resolve();
    });
  });
  clearTimeout(wallTimer);
  if (buf.trim()) handleLine(buf);

  const finishedAt = new Date().toISOString();
  const durationSeconds = Math.round((Date.now() - startMs) / 1000);
  agentRunsDao.finish(runId, {
    finished_at: finishedAt,
    exit_reason: exitReason,
    duration_seconds: durationSeconds,
    tokens_input: inputTokens,
    tokens_output: outputTokens,
    num_turns: numTurns,
    num_tool_errors: numToolErrors,
    cost_usd: costUsd,
  });

  // 真实记账：模型输出 tokens 与成本单独入账，账本不写伪造数字
  if (outputTokens > 0) {
    ledgerEntriesDao.add({
      task_id: taskId,
      entry_type: "labor_tokens",
      amount: outputTokens,
      unit: "tokens",
      source_id: runId,
      note: "模型输出 tokens（真实用量）",
      created_at: finishedAt,
    });
  }
  if (costUsd != null) {
    ledgerEntriesDao.add({
      task_id: taskId,
      entry_type: "platform_subsidy",
      amount: costUsd,
      unit: "usd",
      source_id: runId,
      note: "实验预算补贴，非广告收入",
      created_at: finishedAt,
    });
  }

  scanArtifacts(taskId, outDir, finishedAt);

  const finalStatus: TaskStatus =
    exitReason === "completed"
      ? "succeeded"
      : exitReason === "timeout"
        ? "timeout"
        : exitReason === "token_limit"
          ? "token_limit"
          : "failed";
  const errorMessage = exitReason === "completed" ? null : `执行终止：${exitReason}`;
  tasksDao.markFinished(taskId, finalStatus, finishedAt, errorMessage);
}
