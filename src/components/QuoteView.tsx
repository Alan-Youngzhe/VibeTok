"use client";

import { useState } from "react";
import Masthead from "@/components/Masthead";
import Seal from "@/components/Seal";
import { apiPost } from "@/lib/clientApi";
import { TOKENS_PER_ATTENTION_SECOND } from "@/lib/config";
import { formatSeconds } from "@/lib/format";
import type { TaskState } from "@/lib/viewTypes";

interface Props {
  token: string;
  state: TaskState;
  onChanged: () => Promise<unknown>;
}

export default function QuoteView({ token, state, onChanged }: Props) {
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
    <section>
      <Masthead
        code="B-02"
        title="交换报价与征召令"
        serial={token}
        stamp={<Seal text="待接受" sub="QUOTED" />}
      />

      {task.prompt && (
        <div className="mt-6 border border-line bg-paper p-3">
          <p className="text-[10px] uppercase tracking-[0.28em] text-faint">
            本局复核 · 申请事项
          </p>
          <p className="mt-2 text-sm leading-relaxed text-bone">{task.prompt}</p>
        </div>
      )}

      <p className="mt-6 text-[10px] uppercase tracking-[0.28em] text-faint">
        交换条款
      </p>
      <dl className="mt-2 flex flex-col border-y border-line">
        <Term k="预计机器劳动" v={formatSeconds(task.quoteLaborSecondsEst)} />
        <Term k="应付人类注意力" v={formatSeconds(pool.requiredSeconds)} emphasize />
        <Term k="兑换率" v={`1 秒注意力 ⇄ ${TOKENS_PER_ATTENTION_SECOND} tokens`} />
      </dl>

      {task.quoteSummary && (
        <p className="mt-4 text-xs leading-relaxed text-ash">{task.quoteSummary}</p>
      )}

      <p className="mt-5 border-l-2 border-seal pl-3 text-xs leading-relaxed text-ash">
        声明：机器劳动真实发生、过程可追踪，结果不予担保。
        <span className="text-bone">钤印即开始交易，注意力开始计价。</span>
      </p>

      {error && (
        <p className="mt-4 text-xs text-sealbright">受召失败：{error}</p>
      )}

      {task.isCreator ? (
        <button
          onClick={accept}
          disabled={accepting}
          className="mt-6 w-full border border-ash py-3 text-sm tracking-[0.22em] text-bone transition-colors hover:border-bone disabled:cursor-not-allowed disabled:border-line disabled:text-faint"
        >
          {accepting ? "征召中…" : "受召 · 接受报价并开始交易"}
        </button>
      ) : (
        <p className="mt-6 border border-line p-3 text-xs text-ash">
          你并非本文书发起人。仅发起人可钤印受召。
        </p>
      )}
    </section>
  );
}

function Term({
  k,
  v,
  emphasize,
}: {
  k: string;
  v: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-baseline border-b border-line py-3 last:border-b-0 text-sm">
      <span className="text-ash">{k}</span>
      <span className="leader" />
      <span
        className={`figure tracking-[0.08em] ${emphasize ? "text-sealbright" : "text-bone"}`}
      >
        {v}
      </span>
    </div>
  );
}
