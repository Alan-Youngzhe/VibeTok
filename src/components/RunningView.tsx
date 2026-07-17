"use client";

import Link from "next/link";
import { useState } from "react";
import { formatNumber, formatSeconds, statusLabel } from "@/lib/format";
import type { TaskState } from "@/lib/viewTypes";

interface Props {
  token: string;
  state: TaskState;
}

export default function RunningView({ token, state }: Props) {
  const { task, run, pool } = state;
  const [copied, setCopied] = useState(false);
  const remaining = Math.max(0, (pool.requiredSeconds ?? 0) - pool.earnedSeconds);

  async function copyShare() {
    const url = `${window.location.origin}/t/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="flex flex-col gap-5 pt-6">
      <div>
        <h1 className="text-xs uppercase tracking-[0.3em] opacity-60">
          {statusLabel(task.status)}
        </h1>
        <p className="mt-2 text-sm leading-relaxed">
          AI 正在工作。人类请继续消费内容。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px border border-neutral-800 bg-neutral-800 text-sm">
        <Cell label="已赚取机器劳动" value={formatSeconds(run?.durationSeconds ?? 0)} />
        <Cell label="已消耗 tokens" value={formatNumber(run?.tokensTotal ?? 0)} />
        <Cell label="注意力池" value={formatSeconds(pool.earnedSeconds)} />
        <Cell label="报价所需" value={formatSeconds(pool.requiredSeconds)} />
      </div>

      <div className="text-xs opacity-60">
        参与者 {pool.participantCount} 人 · 协作倍率 ×{pool.multiplier}
        {remaining > 0 ? ` · 还差 ${formatSeconds(remaining)}` : " · 已满额"}
      </div>

      <div className="border border-neutral-800 p-3">
        <p className="text-[11px] uppercase tracking-widest opacity-40">
          Agent 实时操作
        </p>
        <ul className="mt-2 flex flex-col gap-1 text-xs opacity-80">
          {run && run.latestEvents.length > 0 ? (
            run.latestEvents.map((e, i) => (
              <li key={i} className="truncate">
                · {e.summary}
              </li>
            ))
          ) : (
            <li className="opacity-50">正在启动子进程…</li>
          )}
        </ul>
      </div>

      <Link
        href={`/t/${token}/watch`}
        className="border border-neutral-500 py-3 text-center text-sm tracking-widest"
      >
        进入观看，供养 Agent
      </Link>

      <div className="border-t border-neutral-800 pt-4">
        <p className="text-xs leading-relaxed opacity-60">
          我的 Agent 还缺 {formatSeconds(remaining)} 人类注意力。请帮我供养它。
        </p>
        <button
          onClick={copyShare}
          className="mt-2 w-full border border-neutral-700 py-2 text-xs tracking-widest"
        >
          {copied ? "助力链接已复制" : "复制助力链接"}
        </button>
      </div>
    </section>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--background)] p-3">
      <p className="text-[11px] opacity-40">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
