import { getDb } from "../db";
import type { Participant } from "../schemas";

export const participantsDao = {
  create(p: Participant): Participant {
    getDb()
      .prepare("INSERT INTO participants (id, codename, created_at) VALUES (?, ?, ?)")
      .run(p.id, p.codename, p.created_at);
    return p;
  },

  get(id: string): Participant | null {
    const row = getDb().prepare("SELECT * FROM participants WHERE id = ?").get(id);
    return (row as Participant | undefined) ?? null;
  },
};
