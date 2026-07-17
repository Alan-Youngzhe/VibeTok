import { z } from "zod";

// DB 行 schema —— 类型一律经 z.infer 推导，不手写重复类型
const boolInt = z.union([z.literal(0), z.literal(1)]);

export const participantSchema = z.object({
  id: z.string(),
  codename: z.string(),
  created_at: z.string(),
});

export const taskStatusSchema = z.enum([
  "quoted",
  "accepted",
  "running",
  "succeeded",
  "failed",
  "timeout",
  "token_limit",
]);

export const taskSchema = z.object({
  id: z.string(),
  creator_id: z.string(),
  prompt: z.string(),
  status: taskStatusSchema,
  quote_summary: z.string().nullable(),
  quote_labor_seconds_est: z.number().nullable(),
  quote_attention_seconds: z.number().nullable(),
  attention_pool_seconds: z.number(),
  verdict: z.enum(["worth", "not_worth"]).nullable(),
  verdict_at: z.string().nullable(),
  share_token: z.string(),
  is_public: boolInt,
  reveal_content: boolInt,
  error_message: z.string().nullable(),
  created_at: z.string(),
  accepted_at: z.string().nullable(),
  finished_at: z.string().nullable(),
});

export const agentRunSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  started_at: z.string(),
  finished_at: z.string().nullable(),
  exit_reason: z.enum(["completed", "timeout", "token_limit", "error"]).nullable(),
  duration_seconds: z.number().nullable(),
  tokens_input: z.number().nullable(),
  tokens_output: z.number().nullable(),
  num_turns: z.number().nullable(),
  num_tool_errors: z.number(),
  cost_usd: z.number().nullable(),
  workspace_dir: z.string(),
});

export const agentEventSchema = z.object({
  id: z.number(),
  run_id: z.string(),
  ts: z.string(),
  kind: z.enum(["tool_use", "text", "error", "system"]),
  summary: z.string(),
});

export const attentionSessionSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  participant_id: z.string(),
  started_at: z.string(),
  last_heartbeat_at: z.string().nullable(),
  effective_seconds: z.number(),
  cards_watched: z.number(),
});

export const heartbeatSchema = z.object({
  id: z.number(),
  session_id: z.string(),
  ts: z.string(),
  visible: boolInt,
  playing: boolInt,
});

export const ledgerEntrySchema = z.object({
  id: z.number(),
  task_id: z.string(),
  entry_type: z.enum([
    "attention_earned",
    "multiplier_bonus",
    "labor_tokens",
    "platform_subsidy",
  ]),
  amount: z.number(),
  unit: z.enum(["seconds", "tokens", "usd"]),
  source_id: z.string().nullable(),
  note: z.string().nullable(),
  created_at: z.string(),
});

export const artifactSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  filename: z.string(),
  path: z.string(),
  mime: z.string().nullable(),
  size_bytes: z.number().nullable(),
  created_at: z.string(),
});

export const contentCardSchema = z.object({
  id: z.string(),
  kind: z.enum(["generative", "video"]),
  title: z.string(),
  src: z.string().nullable(),
  duration_seconds: z.number(),
  theme: z.enum(["labor", "ai", "consumption"]).nullable(),
});

export type Participant = z.infer<typeof participantSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type Task = z.infer<typeof taskSchema>;
export type AgentRun = z.infer<typeof agentRunSchema>;
export type AgentEvent = z.infer<typeof agentEventSchema>;
export type AttentionSession = z.infer<typeof attentionSessionSchema>;
export type Heartbeat = z.infer<typeof heartbeatSchema>;
export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;
export type Artifact = z.infer<typeof artifactSchema>;
export type ContentCard = z.infer<typeof contentCardSchema>;
