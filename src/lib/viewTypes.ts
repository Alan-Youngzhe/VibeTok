import type { ContentCard } from "./schemas";
import type { buildBill } from "./services/ledger";
import type { buildTaskState } from "./services/taskState";

export type ContentCardView = ContentCard;

// 前端视图类型：一律从服务端返回结构 z.infer/ReturnType 推导，避免手写重复类型漂移
export type TaskState = ReturnType<typeof buildTaskState>;
export type PublicTask = TaskState["task"];
export type RunState = NonNullable<TaskState["run"]>;
export type PoolState = TaskState["pool"];
export type Bill = ReturnType<typeof buildBill>;

export const TERMINAL_STATUSES = [
  "succeeded",
  "failed",
  "timeout",
  "token_limit",
] as const;

export function isTerminalStatus(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}
