import { getDb } from "../db";
import type { AttentionSession } from "../schemas";

export interface Contributor {
  codename: string;
  effectiveSeconds: number;
}

export const attentionSessionsDao = {
  create(s: AttentionSession): AttentionSession {
    getDb()
      .prepare(
        `INSERT INTO attention_sessions (
          id, task_id, participant_id, started_at, last_heartbeat_at,
          effective_seconds, cards_watched
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        s.id, s.task_id, s.participant_id, s.started_at,
        s.last_heartbeat_at, s.effective_seconds, s.cards_watched,
      );
    return s;
  },

  get(id: string): AttentionSession | null {
    const row = getDb().prepare("SELECT * FROM attention_sessions WHERE id = ?").get(id);
    return (row as AttentionSession | undefined) ?? null;
  },

  update(
    id: string,
    fields: { last_heartbeat_at: string; effective_seconds: number; cards_watched: number },
  ): void {
    getDb()
      .prepare(
        `UPDATE attention_sessions SET last_heartbeat_at = ?, effective_seconds = ?, cards_watched = ?
         WHERE id = ?`,
      )
      .run(fields.last_heartbeat_at, fields.effective_seconds, fields.cards_watched, id);
  },

  countEffectiveParticipants(taskId: string, minSeconds: number): number {
    const row = getDb()
      .prepare(
        `SELECT COUNT(DISTINCT participant_id) AS n FROM attention_sessions
         WHERE task_id = ? AND effective_seconds >= ?`,
      )
      .get(taskId, minSeconds) as { n: number };
    return row.n;
  },

  contributors(taskId: string): Contributor[] {
    const rows = getDb()
      .prepare(
        `SELECT p.codename AS codename, SUM(s.effective_seconds) AS effectiveSeconds
         FROM attention_sessions s JOIN participants p ON p.id = s.participant_id
         WHERE s.task_id = ?
         GROUP BY s.participant_id
         HAVING effectiveSeconds > 0
         ORDER BY effectiveSeconds DESC`,
      )
      .all(taskId);
    return rows as unknown as Contributor[];
  },
};
