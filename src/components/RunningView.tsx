"use client";

import Link from "next/link";
import { useState } from "react";
import Masthead from "@/components/Masthead";
import Seal from "@/components/Seal";
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
  const filled = pool.requiredSeconds
    ? Math.min(1, pool.earnedSeconds / pool.requiredSeconds)
    : 0;

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
    <section>
      <Masthead
        code="C-03"
        title="征召令 · 供养台账"
        serial={token}
        stamp={<Seal text="供养中" sub={statusLabel(task.status)} />}
      />

      <p className="mt-6 text-sm leading-loose text-bone">
        AI 正在工作。<span className="text-ash">人类请继续消费内容。</span>
      </p>

      <div className="mt-5 grid grid-cols-2 border border-line">
        <Cell label="已赚取机器劳动" value={formatSeconds(run?.durationSeconds ?? 0)} accent />
        <Cell label="已消耗 tokens" value={formatNumber(run?.tokensTotal ?? 0)} border />
        <Cell label="注意力池" value={formatSeconds(pool.earnedSeconds)} top />
        <Cell label="报价所需" value={formatSeconds(pool.requiredSeconds)} top border />
      </div>

      <div className="mt-3">
        <div className="h-[3px] w-full bg-line">
          <div
            className="h-full bg-seal transition-[width] duration-700"
            style={{ width: `${filled * 100}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-ash">
          <span>
            参与 {pool.participantCount} 人 · 协作倍率 ×{pool.multiplier}
          </span>
          <span className="figure">
            {remaining > 0 ? `尚缺 ${formatSeconds(remaining)}` : "已满额"}
          </span>
        </div>
      </div>

      <div className="mt-6 border border-line bg-paper p-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-faint">
          机器实时操作 · 逐条记档
        </p>
        <ul className="mt-2 flex flex-col gap-1.5 font-mono text-[11px] leading-relaxed text-ash">
          {run && run.latestEvents.length > 0 ? (
            run.latestEvents.map((e, i) => (
              <li key={i} className="truncate">
                <span className="text-faint">·</span> {e.summary}
              </li>
            ))
          ) : (
            <li className="text-faint">正在启动子进程…</li>
          )}
        </ul>
      </div>

      <Link
        href={`/t/${token}/watch`}
        className="mt-6 block border border-ash py-3 text-center text-sm tracking-[0.22em] text-bone transition-colors hover:border-bone"
      >
        进入观看 · 供养 Agent
      </Link>

      <div className="mt-6 border-t border-line pt-4">
        <p className="border-l-2 border-seal pl-3 text-xs leading-relaxed text-ash">
          我的 Agent 还缺{" "}
          <span className="text-bone figure">{formatSeconds(remaining)}</span>{" "}
          人类注意力。请帮我供养它。
        </p>
        <button
          onClick={copyShare}
          className="mt-3 w-full border border-line py-2 text-[11px] tracking-[0.22em] text-ash transition-colors hover:border-ash hover:text-bone"
        >
          {copied ? "征召链接已复制" : "复制征召链接 · 拉人入池"}
        </button>
      </div>
    </section>
  );
}

function Cell({
  label,
  value,
  accent,
  top,
  border,
}: {
  label: string;
  value: string;
  accent?: boolean;
  top?: boolean;
  border?: boolean;
}) {
  return (
    <div
      className={`p-3 ${top ? "border-t border-line" : ""} ${border ? "border-l border-line" : ""}`}
    >
      <p className="text-[10px] tracking-[0.12em] text-faint">{label}</p>
      <p className={`mt-1 figure text-lg tracking-[0.06em] ${accent ? "text-sealbright" : "text-bone"}`}>
        {value}
      </p>
    </div>
  );
}
