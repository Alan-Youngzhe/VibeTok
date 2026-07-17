import type { DatabaseSync } from "node:sqlite";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS participants (
  id          TEXT PRIMARY KEY,
  codename    TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id                       TEXT PRIMARY KEY,
  creator_id               TEXT NOT NULL REFERENCES participants(id),
  prompt                   TEXT NOT NULL,
  status                   TEXT NOT NULL,
  quote_summary            TEXT,
  quote_labor_seconds_est  INTEGER,
  quote_attention_seconds  INTEGER,
  attention_pool_seconds   INTEGER NOT NULL DEFAULT 0,
  verdict                  TEXT,
  verdict_at               TEXT,
  share_token              TEXT NOT NULL UNIQUE,
  is_public                INTEGER NOT NULL DEFAULT 1,
  reveal_content           INTEGER NOT NULL DEFAULT 0,
  error_message            TEXT,
  created_at               TEXT NOT NULL,
  accepted_at              TEXT,
  finished_at              TEXT
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id               TEXT PRIMARY KEY,
  task_id          TEXT NOT NULL REFERENCES tasks(id),
  started_at       TEXT NOT NULL,
  finished_at      TEXT,
  exit_reason      TEXT,
  duration_seconds INTEGER,
  tokens_input     INTEGER,
  tokens_output    INTEGER,
  num_turns        INTEGER,
  num_tool_errors  INTEGER NOT NULL DEFAULT 0,
  cost_usd         REAL,
  workspace_dir    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS agent_events (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id   TEXT NOT NULL REFERENCES agent_runs(id),
  ts       TEXT NOT NULL,
  kind     TEXT NOT NULL,
  summary  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS attention_sessions (
  id                 TEXT PRIMARY KEY,
  task_id            TEXT NOT NULL REFERENCES tasks(id),
  participant_id     TEXT NOT NULL REFERENCES participants(id),
  started_at         TEXT NOT NULL,
  last_heartbeat_at  TEXT,
  effective_seconds  INTEGER NOT NULL DEFAULT 0,
  cards_watched      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS attention_heartbeats (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id  TEXT NOT NULL REFERENCES attention_sessions(id),
  ts          TEXT NOT NULL,
  visible     INTEGER NOT NULL,
  playing     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id     TEXT NOT NULL REFERENCES tasks(id),
  entry_type  TEXT NOT NULL,
  amount      REAL NOT NULL,
  unit        TEXT NOT NULL,
  source_id   TEXT,
  note        TEXT,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS artifacts (
  id          TEXT PRIMARY KEY,
  task_id     TEXT NOT NULL REFERENCES tasks(id),
  filename    TEXT NOT NULL,
  path        TEXT NOT NULL,
  mime        TEXT,
  size_bytes  INTEGER,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_cards (
  id               TEXT PRIMARY KEY,
  kind             TEXT NOT NULL,
  title            TEXT NOT NULL,
  src              TEXT,
  duration_seconds INTEGER NOT NULL,
  theme            TEXT
);

CREATE INDEX IF NOT EXISTS idx_tasks_share_token ON tasks(share_token);
CREATE INDEX IF NOT EXISTS idx_runs_task ON agent_runs(task_id);
CREATE INDEX IF NOT EXISTS idx_events_run ON agent_events(run_id);
CREATE INDEX IF NOT EXISTS idx_sessions_task ON attention_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_heartbeats_session ON attention_heartbeats(session_id);
CREATE INDEX IF NOT EXISTS idx_ledger_task ON ledger_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_task ON artifacts(task_id);
`;

export function runMigrations(db: DatabaseSync): void {
  db.exec(SCHEMA);
}
