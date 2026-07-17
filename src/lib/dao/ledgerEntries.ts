import { getDb } from "../db";
import type { LedgerEntry } from "../schemas";

type NewLedgerEntry = Omit<LedgerEntry, "id">;

export const ledgerEntriesDao = {
  add(entry: NewLedgerEntry): void {
    getDb()
      .prepare(
        `INSERT INTO ledger_entries (task_id, entry_type, amount, unit, source_id, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        entry.task_id, entry.entry_type, entry.amount, entry.unit,
        entry.source_id, entry.note, entry.created_at,
      );
  },

  deleteByType(taskId: string, entryType: LedgerEntry["entry_type"]): void {
    getDb()
      .prepare("DELETE FROM ledger_entries WHERE task_id = ? AND entry_type = ?")
      .run(taskId, entryType);
  },

  listByTask(taskId: string): LedgerEntry[] {
    const rows = getDb()
      .prepare("SELECT * FROM ledger_entries WHERE task_id = ? ORDER BY id ASC")
      .all(taskId);
    return rows as LedgerEntry[];
  },

  sumByType(taskId: string, entryType: LedgerEntry["entry_type"]): number {
    const row = getDb()
      .prepare(
        "SELECT COALESCE(SUM(amount), 0) AS total FROM ledger_entries WHERE task_id = ? AND entry_type = ?",
      )
      .get(taskId, entryType) as { total: number };
    return row.total;
  },
};
