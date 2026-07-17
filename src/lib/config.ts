// 兑换率与硬上限：写死为配置常量，账单明示（TECH_SPEC §2/§4）
export const TOKENS_PER_ATTENTION_SECOND = 400;
export const QUOTE_ROUND_SECONDS = 30;

// Agent Worker 硬上限（不可放宽，TECH_SPEC §1）
export const WORKER_MAX_WALL_MS = 10 * 60 * 1000;
export const WORKER_MAX_OUTPUT_TOKENS = 50_000;

// 有效观看计时规则（TECH_SPEC §7 模块四）
export const HEARTBEAT_MAX_GAP_SECONDS = 8;

// 协作倍率（TECH_SPEC §6-Q4）
export const MULTIPLIER_MIN_EFFECTIVE_SECONDS = 30;
export function multiplierForParticipants(count: number): number {
  if (count >= 3) return 1.5;
  if (count === 2) return 1.2;
  return 1.0;
}

export const SUBSIDY_NOTE = "本兑换由实验预算补贴，非广告收入";
