"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ContentCard from "@/components/ContentCard";
import { apiGet, apiPost } from "@/lib/clientApi";
import { TOKENS_PER_ATTENTION_SECOND } from "@/lib/config";
import { formatNumber, formatSeconds } from "@/lib/format";
import { isTerminalStatus, type ContentCardView, type TaskState } from "@/lib/viewTypes";

const HEARTBEAT_MS = 5000;
const CARD_MS = 15000;

export default function WatchPage() {
  const token = useParams<{ token: string }>().token;
  const [cards, setCards] = useState<ContentCardView[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [effectiveSeconds, setEffectiveSeconds] = useState(0);
  const [laborSeconds, setLaborSeconds] = useState(0);
  const [tokensTotal, setTokensTotal] = useState(0);
  const [finished, setFinished] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionId = useRef<string | null>(null);
  const cardIdRef = useRef<string>("card");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const state = await apiGet<TaskState>(`/api/t/${token}`);
        const session = await apiPost<{ session: { id: string } }>(
          `/api/tasks/${state.task.id}/sessions`,
          {},
        );
        const cardRes = await apiGet<{ cards: ContentCardView[] }>("/api/cards");
        if (cancelled) return;
        sessionId.current = session.session.id;
        setCards(cardRes.cards);
        setLaborSeconds(state.run?.durationSeconds ?? 0);
        setTokensTotal(state.run?.tokensTotal ?? 0);
        setFinished(isTerminalStatus(state.task.status));
        setReady(true);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "无法进入观看流");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!ready || cards.length === 0) return;
    cardIdRef.current = cards[cardIndex % cards.length]?.id ?? "card";
  }, [ready, cards, cardIndex]);

  useEffect(() => {
    if (!ready) return;
    const beat = async () => {
      if (!sessionId.current) return;
      try {
        const res = await apiPost<{ effectiveSeconds: number; poolSeconds: number }>(
          `/api/sessions/${sessionId.current}/heartbeat`,
          {
            visible: document.visibilityState === "visible",
            playing: !finished,
            cardId: cardIdRef.current,
          },
        );
        setEffectiveSeconds(res.effectiveSeconds);
      } catch {
        /* 网络抖动忽略，下次心跳补上 */
      }
    };
    const hb = setInterval(beat, HEARTBEAT_MS);
    const adv = setInterval(() => setCardIndex((i) => i + 1), CARD_MS);
    const poll = setInterval(async () => {
      try {
        const state = await apiGet<TaskState>(`/api/t/${token}`);
        setLaborSeconds(state.run?.durationSeconds ?? 0);
        setTokensTotal(state.run?.tokensTotal ?? 0);
        setFinished(isTerminalStatus(state.task.status));
      } catch {
        /* 忽略 */
      }
    }, 4000);
    void beat();
    return () => {
      clearInterval(hb);
      clearInterval(adv);
      clearInterval(poll);
    };
  }, [ready, token, finished]);

  if (error) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center p-6 text-sm text-ash">
        {error}
      </main>
    );
  }

  const exchangedTokens = effectiveSeconds * TOKENS_PER_ATTENTION_SECOND;
  const current = cards.length > 0 ? cards[cardIndex % cards.length] : null;

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-ink">
      {current ? <ContentCard card={current} playing={!finished} /> : null}

      {/* 顶部：征用状态条 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent p-4 pb-8">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-bone/80">
          <span>注意力征用 · C-03</span>
          <span className="flex items-center gap-1.5">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full bg-seal ${finished ? "" : "supply-pulse"}`}
            />
            {finished ? "征用结束" : "计价中"}
          </span>
        </div>
        <p className="mt-2 text-sm tracking-[0.06em] text-bone">
          {finished ? "机器劳动已结束。" : "AI 正在工作。人类请继续消费内容。"}
        </p>
      </div>

      {/* 底部：兑换台账 */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 pt-10">
        <p className="text-[11px] leading-relaxed text-bone/85">
          你已为 Agent 赚取{" "}
          <span className="figure text-sealbright">{formatSeconds(laborSeconds)}</span>{" "}
          机器劳动。
          <br />
          本段注意力已兑换为{" "}
          <span className="figure text-sealbright">{formatNumber(exchangedTokens)}</span>{" "}
          tokens。
        </p>

        <div className="mt-3 grid grid-cols-3 border border-white/15 text-center">
          <Stat label="有效注意力" value={formatSeconds(effectiveSeconds)} />
          <Stat label="赚取机器劳动" value={formatSeconds(laborSeconds)} border />
          <Stat label="兑换 tokens" value={formatNumber(exchangedTokens)} border />
        </div>

        <p className="mt-2 text-[10px] leading-relaxed text-bone/45">
          实时消耗 {formatNumber(tokensTotal)} tokens · 前台可见才计价，切后台自动暂停。
        </p>

        {finished && (
          <Link
            href={`/t/${token}`}
            className="pointer-events-auto mt-3 block border border-bone/50 bg-black/60 py-3 text-center text-sm tracking-[0.22em] text-bone"
          >
            机器已停工 · 前往裁决
          </Link>
        )}
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  border,
}: {
  label: string;
  value: string;
  border?: boolean;
}) {
  return (
    <div className={`bg-black/50 p-2 ${border ? "border-l border-white/15" : ""}`}>
      <p className="text-[9px] tracking-[0.12em] text-bone/45">{label}</p>
      <p className="mt-1 figure text-sm text-bone">{value}</p>
    </div>
  );
}
