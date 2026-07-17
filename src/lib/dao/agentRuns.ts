import { getDb } from "../db";
import type { AgentRun } from "../schemas";

export const agentRunsDao = {
  create(run: AgentRun): AgentRun {
    getDb()
      .prepare(
        `INSERT INTO agent_runs (
          id, task_id, started_at, finished_at, exit_reason, duration_seconds,
          tokens_input, tokens_output, num_turns, num_tool_errors, cost_usd, workspace_dir
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        run.id, run.task_id, run.started_at, run.finished_at, run.exit_reason,
        run.duration_seconds, run.tokens_input, run.tokens_output, run.num_turns,
        run.num_tool_errors, run.cost_usd, run.workspace_dir,
      );
    return run;
  },

  finish(
    id: string,
    fields: {
      finished_at: string;
      exit_reason: AgentRun["exit_reason"];
      duration_seconds: number;
      tokens_input: number;
      tokens_output: number;
      num_turns: number;
      num_tool_errors: number;
      cost_usd: number | null;
    },
  ): void {
    getDb()
      .prepare(
        `UPDATE agent_runs SET finished_at = ?, exit_reason = ?, duration_seconds = ?,
         tokens_input = ?, tokens_output = ?, num_turns = ?, num_tool_errors = ?, cost_usd = ?
         WHERE id = ?`,
      )
      .run(
        fields.finished_at, fields.exit_reason, fields.duration_seconds,
        fields.tokens_input, fields.tokens_output, fields.num_turns,
        fields.num_tool_errors, fields.cost_usd, id,
      );
  },

  latestByTask(taskId: string): AgentRun | null {
    const row = getDb()
      .prepare("SELECT * FROM agent_runs WHERE task_id = ? ORDER BY started_at DESC LIMIT 1")
      .get(taskId);
    return (row as AgentRun | undefined) ?? null;
  },
};
