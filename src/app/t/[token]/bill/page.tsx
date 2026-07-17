"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/clientApi";
import { formatNumber, formatSeconds, statusLabel } from "@/lib/format";
import type { Bill, TaskState } from "@/lib/viewTypes";

export default function BillPage() {
  const token = useParams<{ token: string }>().token;
  const [bill, setBill] = useState<Bill | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const state = await apiGet<TaskState>(`/api/t/${token}`);
        const res = await apiGet<{ bill: Bill }>(`/api/tasks/${state.task.id}/bill`);
        setBill(res.bill);
      } catch (e) {
        setError(e instanceof Error ? e.message : "账单加载失败");
      }
    })();
  }, [token]);

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/t/${token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-sm opacity-70">
        {error}
      </main>
    );
  }
  if (!bill) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-sm opacity-50">
        正在结算账本…
      </main>
    );
  }

  const { human, machine, delivery, verdict } = bill;

  return (
    <main className="mx-auto min-h-screen max-w-md p-6">
      <h1 className="text-xs uppercase tracking-[0.3em] opacity-60">
        公开人机劳动账单
      </h1>

      <Segment title="人类支付">
        <Row k="有效注意力" v={formatSeconds(human.attentionSeconds)} />
        <Row k="协作补贴加成" v={formatSeconds(human.multiplierBonusSeconds)} />
        <Row k="注意力池合计" v={formatSeconds(human.poolSeconds)} />
        <Row k="报价所需" v={formatSeconds(human.requiredSeconds)} />
        <Row k="参与人数" v={`${human.participants.length} 人`} />
        {human.participants.length > 0 && (
          <ul className="mt-1 flex flex-col gap-1 pt-1 text-xs opacity-60">
            {human.participants.map((p, i) => (
              <li key={i} className="flex justify-between">
                <span>{p.codename}</span>
                <span>{formatSeconds(p.effectiveSeconds)}</span>
              </li>
            ))}
          </ul>
        )}
      </Segment>

      <Segment title="机器劳动">
        {machine ? (
          <>
            <Row k="真实耗时" v={formatSeconds(machine.durationSeconds)} />
            <Row
              k="消耗 tokens"
              v={`${formatNumber((machine.tokensInput ?? 0) + (machine.tokensOutput ?? 0))}（出 ${formatNumber(machine.tokensOutput ?? 0)}）`}
            />
            <Row k="执行轮次" v={`${machine.numTurns ?? 0} 次`} />
            <Row k="失败次数" v={`${machine.numToolErrors} 次`} />
            <Row k="模型成本" v={machine.costUsd != null ? `$${machine.costUsd.toFixed(4)}` : "—"} />
            <Row k="终止原因" v={machine.exitReason ?? "—"} />
          </>
        ) : (
          <p className="text-xs opacity-50">尚无执行记录。</p>
        )}
      </Segment>

      <Segment title="交付">
        <Row k="任务状态" v={statusLabel(delivery.status)} />
        <Row k="产物文件" v={`${delivery.artifacts.length} 个`} />
        {delivery.artifacts.map((a) => (
          <div key={a.id} className="flex justify-between text-xs opacity-60">
            <span className="truncate">{a.filename}</span>
            <span className="shrink-0">{formatNumber(a.sizeBytes ?? 0)}B</span>
          </div>
        ))}
      </Segment>

      <Segment title="人类裁决">
        <p className="text-lg tracking-[0.2em]">
          {verdict === "worth" ? "值得" : verdict === "not_worth" ? "不值得" : "尚未裁决"}
        </p>
      </Segment>

      <p className="mt-4 text-[11px] leading-relaxed opacity-40">{bill.subsidyNote}</p>

      <button
        onClick={copyShare}
        className="mt-5 w-full border border-neutral-700 py-3 text-xs tracking-widest"
      >
        {copied ? "助力链接已复制" : "复制助力链接（邀请他人加入注意力池）"}
      </button>
      <Link
        href={`/t/${token}`}
        className="mt-3 block text-center text-xs underline opacity-60"
      >
        返回任务
      </Link>
    </main>
  );
}

function Segment({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 border border-neutral-800 p-3">
      <h2 className="text-[11px] uppercase tracking-widest opacity-40">{title}</h2>
      <div className="mt-2 flex flex-col gap-1 text-sm">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="opacity-60">{k}</span>
      <span>{v}</span>
    </div>
  );
}
