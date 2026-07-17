import { SUBSIDY_NOTE, TOKENS_PER_ATTENTION_SECOND } from "../config";
import { agentRunsDao } from "../dao/agentRuns";
import { artifactsDao } from "../dao/artifacts";
import { attentionSessionsDao } from "../dao/attentionSessions";
import { ledgerEntriesDao } from "../dao/ledgerEntries";
import type { Task } from "../schemas";

// 账单四段全部由账本聚合，无任何手写数字（TECH_SPEC §5 模块二/六）
export function buildBill(task: Task) {
  const base = Math.round(ledgerEntriesDao.sumByType(task.id, "attention_earned"));
  const bonus = Math.round(ledgerEntriesDao.sumByType(task.id, "multiplier_bonus"));
  const run = agentRunsDao.latestByTask(task.id);
  const contributors = attentionSessionsDao.contributors(task.id);
  const artifacts = artifactsDao.listByTask(task.id);
  return {
    human: {
      attentionSeconds: base,
      multiplierBonusSeconds: bonus,
      poolSeconds: base + bonus,
      requiredSeconds: task.quote_attention_seconds,
      participants: contributors,
    },
    machine: run
      ? {
          tokensInput: run.tokens_input,
          tokensOutput: run.tokens_output,
          durationSeconds: run.duration_seconds,
          numTurns: run.num_turns,
          numToolErrors: run.num_tool_errors,
          costUsd: run.cost_usd,
          exitReason: run.exit_reason,
        }
      : null,
    delivery: {
      status: task.status,
      revealContent: task.reveal_content === 1,
      artifacts: artifacts.map((a) => ({
        id: a.id,
        filename: a.filename,
        sizeBytes: a.size_bytes,
      })),
    },
    verdict: task.verdict,
    subsidyNote: `${SUBSIDY_NOTE}（1 秒有效注意力 = ${TOKENS_PER_ATTENTION_SECOND} tokens 预算）`,
  };
}
