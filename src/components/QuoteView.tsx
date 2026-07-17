"use client";

import { useState } from "react";
import { apiPost } from "@/lib/clientApi";
import { formatSeconds } from "@/lib/format";
import type { TaskState } from "@/lib/viewTypes";

interface Props {
  token: string;
  state: TaskState;
  onChanged: () => Promise<unknown>;
}

export default function QuoteView({ state, onChanged }: Props) {
  const { task, pool } = state;
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setAccepting(true);
    setError(null);
    try {
      await apiPost(`/api/tasks/${task.id}/accept`, {});
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "接受失败");
      setAccepting(false);
    }
  }

  return (
    <section className="flex flex-col gap-5 pt-6">
      <h1 className="text-xs uppercase tracking-[0.3em] opacity-60">交换报价</h1>

      {task.prompt && (
        <div className="border border-neutral-800 p-3">
          <p className="text-[11px] uppercase tracking-widest opacity-40">
            Agent 复述任务
          </p>
          <p className="mt-2 text-sm leading-relaxed">{task.prompt}</p>
        </div>
      )}

      <dl className="divide-y divide-neutral-800 border border-neutral-800 text-sm">
        <div className="flex justify-between p-3">
          <dt className="opacity-60">预计机器劳动</dt>
          <dd>{formatSeconds(task.quoteLaborSecondsEst)}</dd>
        </div>
        <div className="flex justify-between p-3">
          <dt className="opacity-60">需要人类注意力</dt>
          <dd>{formatSeconds(pool.requiredSeconds)}</dd>
        </div>
      </dl>

      {task.quoteSummary && (
        <p className="text-xs leading-relaxed opacity-50">{task.quoteSummary}</p>
      )}

      <p className="border-l-2 border-neutral-600 pl-3 text-xs leading-relaxed opacity-70">
        声明：机器劳动真实发生、过程可追踪，但结果不保证令人满意。接受即开始交易。
      </p>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {task.isCreator ? (
        <button
          onClick={accept}
          disabled={accepting}
          className="border border-neutral-500 py-3 text-sm tracking-widest disabled:opacity-30"
        >
          {accepting ? "征召中…" : "接受报价，开始交易"}
        </button>
      ) : (
        <p className="text-xs opacity-50">仅任务发起人可接受报价。</p>
      )}
    </section>
  );
}
