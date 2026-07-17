import { getDb } from "../db";
import type { AgentEvent } from "../schemas";

export const agentEventsDao = {
  add(runId: string, kind: AgentEvent["kind"], summary: string, ts: string): void {
    getDb()
      .prepare("INSERT INTO agent_events (run_id, ts, kind, summary) VALUES (?, ?, ?, ?)")
      .run(runId, ts, kind, summary);
  },

  latestByTask(taskId: string, limit: number): AgentEvent[] {
    const rows = getDb()
      .prepare(
        `SELECT e.* FROM agent_events e
         JOIN agent_runs r ON r.id = e.run_id
         WHERE r.task_id = ? ORDER BY e.id DESC LIMIT ?`,
      )
      .all(taskId, limit);
    return (rows as AgentEvent[]).reverse();
  },
};
