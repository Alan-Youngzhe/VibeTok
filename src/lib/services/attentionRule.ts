import { HEARTBEAT_MAX_GAP_SECONDS } from "../config";

// 有效观看计时规则（TECH_SPEC §7 模块四）：两次心跳均 visible+playing 且间隔 ≤8s 才累计
export function accrueSeconds(
  prev: { ts: string; visible: number; playing: number } | null,
  curr: { ts: string; visible: boolean; playing: boolean },
): number {
  if (!prev) return 0;
  if (!(prev.visible === 1 && prev.playing === 1 && curr.visible && curr.playing)) return 0;
  const gap = (Date.parse(curr.ts) - Date.parse(prev.ts)) / 1000;
  if (!Number.isFinite(gap) || gap <= 0 || gap > HEARTBEAT_MAX_GAP_SECONDS) return 0;
  return Math.round(gap);
}
