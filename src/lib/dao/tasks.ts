import { getDb } from "../db";
import type { Task, TaskStatus } from "../schemas";

export const tasksDao = {
  create(t: Task): Task {
    getDb()
      .prepare(
        `INSERT INTO tasks (
          id, creator_id, prompt, status, quote_summary, quote_labor_seconds_est,
          quote_attention_seconds, attention_pool_seconds, verdict, verdict_at,
          share_token, is_public, reveal_content, error_message, created_at,
          accepted_at, finished_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        t.id, t.creator_id, t.prompt, t.status, t.quote_summary,
        t.quote_labor_seconds_est, t.quote_attention_seconds, t.attention_pool_seconds,
        t.verdict, t.verdict_at, t.share_token, t.is_public, t.reveal_content,
        t.error_message, t.created_at, t.accepted_at, t.finished_at,
      );
    return t;
  },

  get(id: string): Task | null {
    const row = getDb().prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    return (row as Task | undefined) ?? null;
  },

  getByShareToken(token: string): Task | null {
    const row = getDb().prepare("SELECT * FROM tasks WHERE share_token = ?").get(token);
    return (row as Task | undefined) ?? null;
  },

  setStatus(id: string, status: TaskStatus): void {
    getDb().prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, id);
  },

  markAccepted(id: string, acceptedAt: string): void {
    getDb()
      .prepare("UPDATE tasks SET status = 'accepted', accepted_at = ? WHERE id = ?")
      .run(acceptedAt, id);
  },

  setPoolSeconds(id: string, seconds: number): void {
    getDb().prepare("UPDATE tasks SET attention_pool_seconds = ? WHERE id = ?").run(seconds, id);
  },

  setVerdict(id: string, verdict: "worth" | "not_worth", verdictAt: string): void {
    getDb()
      .prepare("UPDATE tasks SET verdict = ?, verdict_at = ? WHERE id = ?")
      .run(verdict, verdictAt, id);
  },

  markFinished(id: string, status: TaskStatus, finishedAt: string, errorMessage: string | null): void {
    getDb()
      .prepare("UPDATE tasks SET status = ?, finished_at = ?, error_message = ? WHERE id = ?")
      .run(status, finishedAt, errorMessage, id);
  },

  setRevealContent(id: string, reveal: 0 | 1): void {
    getDb().prepare("UPDATE tasks SET reveal_content = ? WHERE id = ?").run(reveal, id);
  },

  listPublicDecided(limit: number, beforeCreatedAt: string | null): Task[] {
    const db = getDb();
    const rows = beforeCreatedAt
      ? db
          .prepare(
            `SELECT * FROM tasks WHERE is_public = 1 AND verdict IS NOT NULL AND created_at < ?
             ORDER BY created_at DESC LIMIT ?`,
          )
          .all(beforeCreatedAt, limit)
      : db
          .prepare(
            `SELECT * FROM tasks WHERE is_public = 1 AND verdict IS NOT NULL
             ORDER BY created_at DESC LIMIT ?`,
          )
          .all(limit);
    return rows as Task[];
  },
};
