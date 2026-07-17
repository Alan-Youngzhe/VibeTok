import { getDb } from "../db";
import type { Artifact } from "../schemas";

export const artifactsDao = {
  add(a: Artifact): void {
    getDb()
      .prepare(
        `INSERT INTO artifacts (id, task_id, filename, path, mime, size_bytes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(a.id, a.task_id, a.filename, a.path, a.mime, a.size_bytes, a.created_at);
  },

  get(id: string): Artifact | null {
    const row = getDb().prepare("SELECT * FROM artifacts WHERE id = ?").get(id);
    return (row as Artifact | undefined) ?? null;
  },

  listByTask(taskId: string): Artifact[] {
    const rows = getDb()
      .prepare("SELECT * FROM artifacts WHERE task_id = ? ORDER BY created_at ASC")
      .all(taskId);
    return rows as Artifact[];
  },
};
