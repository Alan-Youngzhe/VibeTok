"use client";

import type { ContentCardView } from "@/lib/viewTypes";

// 内容频道占位：冷峻监视器美学，单色 + 去饱和微染，禁止蓝紫渐变
const THEME: Record<string, { label: string; channel: string; tint: string; accent: string }> = {
  labor: { label: "劳动", channel: "CH·01", tint: "#13110d", accent: "#c9c6bd" },
  ai: { label: "机器", channel: "CH·02", tint: "#0d0f10", accent: "#c9c6bd" },
  consumption: { label: "消费", channel: "CH·03", tint: "#150d0c", accent: "#c24a3d" },
};

export default function ContentCard({
  card,
  playing,
}: {
  card: ContentCardView;
  playing: boolean;
}) {
  const theme = THEME[card.theme ?? "ai"] ?? THEME.ai;
  return (
    <div
      className="relative flex h-full w-full flex-col justify-between overflow-hidden px-7 py-16"
      style={{ background: theme.tint, color: theme.accent }}
    >
      {/* 缓慢扫描线 */}
      {playing && (
        <div
          className="scan-sweep pointer-events-none absolute inset-x-0 top-0 h-16"
          style={{
            background: `linear-gradient(to bottom, transparent, ${theme.accent}14, transparent)`,
          }}
        />
      )}

      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] opacity-55">
        <span>
          {theme.label} · {card.src}
        </span>
        <span className="figure">{theme.channel}</span>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] opacity-40">
          频道播放中
        </p>
        <h2 className="mt-3 text-[2rem] leading-tight tracking-[0.14em]">
          {card.title}
        </h2>
        <div className="mt-8 flex items-end gap-1.5" aria-hidden>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <span
              key={i}
              className={`inline-block w-2 ${playing ? "supply-pulse" : ""}`}
              style={{
                height: `${10 + (i % 4) * 8}px`,
                background: theme.accent,
                opacity: 0.3 + (i % 3) * 0.22,
                animationDelay: `${i * 140}ms`,
              }}
            />
          ))}
        </div>
      </div>

      <p className="max-w-[16rem] text-[10px] leading-relaxed opacity-35">
        自制生成式视觉素材，无版权风险、不接广告。你正在观看的每一秒都被计价并兑换为算力。
      </p>
    </div>
  );
}
