import { ledgerEntriesDao } from "../dao/ledgerEntries";
import { tasksDao } from "../dao/tasks";

export function listArchive(cursor: string | null, limit = 20) {
  const rows = tasksDao.listPublicDecided(limit + 1, cursor);
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const bills = page.map((t) => ({
    taskId: t.id,
    shareToken: t.share_token,
    status: t.status,
    verdict: t.verdict,
    poolSeconds: t.attention_pool_seconds,
    laborTokens: Math.round(ledgerEntriesDao.sumByType(t.id, "labor_tokens")),
    createdAt: t.created_at,
  }));
  const nextCursor = hasMore ? page[page.length - 1].created_at : null;
  return { bills, nextCursor };
}
