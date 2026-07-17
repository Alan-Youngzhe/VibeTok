"use client";

import type { ContentCardView } from "@/lib/viewTypes";

const THEME: Record<string, { label: string; accent: string; bg: string }> = {
  labor: { label: "劳动", accent: "#c9a227", bg: "#161310" },
  ai: { label: "机器", accent: "#3a7ca5", bg: "#0d1418" },
  consumption: { label: "消费", accent: "#a5453a", bg: "#180f0e" },
};

// 生成式视觉占位卡片：主题配色 + 单调动效，视觉风格化留给下一棒 [VT-UI]
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
      className="flex h-full w-full flex-col items-center justify-center px-8 text-center"
      style={{ background: theme.bg, color: theme.accent }}
    >
      <span className="text-[11px] uppercase tracking-[0.4em] opacity-60">
        {theme.label} · {card.src}
      </span>
      <h2 className="mt-6 text-3xl tracking-[0.2em]">{card.title}</h2>
      <div className="mt-10 flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`inline-block h-8 w-2 ${playing ? "animate-pulse" : ""}`}
            style={{
              background: theme.accent,
              opacity: 0.25 + (i % 3) * 0.25,
              animationDelay: `${i * 120}ms`,
            }}
          />
        ))}
      </div>
      <p className="mt-10 max-w-xs text-[11px] leading-relaxed opacity-40">
        自制生成式视觉素材，无版权风险、不接广告。你正在观看的每一秒都被计价并兑换为算力。
      </p>
    </div>
  );
}
