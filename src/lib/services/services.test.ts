import { describe, expect, it } from "vitest";
import { multiplierForParticipants } from "../config";
import { accrueSeconds } from "./attentionRule";
import { buildQuote } from "./quote";

const at = (s: number): string => new Date(1_700_000_000_000 + s * 1000).toISOString();

describe("buildQuote", () => {
  it("向上取整到 30s 且标注估算值", () => {
    const q = buildQuote("帮我写一首关于劳动的诗");
    expect(q.attentionSeconds % 30).toBe(0);
    expect(q.attentionSeconds).toBeGreaterThan(0);
    expect(q.laborSecondsEst).toBeGreaterThan(0);
    expect(q.summary).toContain("估算值");
  });
});

describe("accrueSeconds", () => {
  it("两次心跳均 visible+playing 且间隔≤8s 才累计", () => {
    expect(accrueSeconds({ ts: at(0), visible: 1, playing: 1 }, { ts: at(5), visible: true, playing: true })).toBe(5);
  });
  it("间隔过大不计入", () => {
    expect(accrueSeconds({ ts: at(0), visible: 1, playing: 1 }, { ts: at(20), visible: true, playing: true })).toBe(0);
  });
  it("不可见不计入", () => {
    expect(accrueSeconds({ ts: at(0), visible: 1, playing: 1 }, { ts: at(4), visible: false, playing: true })).toBe(0);
  });
  it("无上一心跳不计入", () => {
    expect(accrueSeconds(null, { ts: at(4), visible: true, playing: true })).toBe(0);
  });
});

describe("multiplierForParticipants", () => {
  it("阶梯与封顶", () => {
    expect(multiplierForParticipants(1)).toBe(1.0);
    expect(multiplierForParticipants(2)).toBe(1.2);
    expect(multiplierForParticipants(3)).toBe(1.5);
    expect(multiplierForParticipants(10)).toBe(1.5);
  });
});
