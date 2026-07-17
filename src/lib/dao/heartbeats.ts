import { getDb } from "../db";

export const heartbeatsDao = {
  add(sessionId: string, ts: string, visible: 0 | 1, playing: 0 | 1): void {
    getDb()
      .prepare("INSERT INTO attention_heartbeats (session_id, ts, visible, playing) VALUES (?, ?, ?, ?)")
      .run(sessionId, ts, visible, playing);
  },

  last(sessionId: string): { ts: string; visible: number; playing: number } | null {
    const row = getDb()
      .prepare("SELECT ts, visible, playing FROM attention_heartbeats WHERE session_id = ? ORDER BY id DESC LIMIT 1")
      .get(sessionId);
    return (row as { ts: string; visible: number; playing: number } | undefined) ?? null;
  },
};
