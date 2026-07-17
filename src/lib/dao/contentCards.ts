import { getDb } from "../db";
import type { ContentCard } from "../schemas";

export const contentCardsDao = {
  insert(c: ContentCard): void {
    getDb()
      .prepare(
        `INSERT OR REPLACE INTO content_cards (id, kind, title, src, duration_seconds, theme)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(c.id, c.kind, c.title, c.src, c.duration_seconds, c.theme);
  },

  all(): ContentCard[] {
    const rows = getDb().prepare("SELECT * FROM content_cards ORDER BY id ASC").all();
    return rows as ContentCard[];
  },

  count(): number {
    const row = getDb().prepare("SELECT COUNT(*) AS n FROM content_cards").get() as { n: number };
    return row.n;
  },
};
