"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Masthead from "@/components/Masthead";
import Seal from "@/components/Seal";
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
      <main className="flex min-h-[100dvh] items-center justify-center p-6 text-sm text-ash">
        {error}
      </main>
    );
  }
  if (!bill) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center p-6 text-sm text-faint">
        正在结算账本…
      </main>
    );
  }

  const { human, machine, delivery, verdict } = bill;
  const serial = token.slice(0, 8).toUpperCase();
  const verdictLabel =
    verdict === "worth" ? "值得" : verdict === "not_worth" ? "不值得" : "尚未裁决";

  return (
    <main className="mx-auto min-h-[100dvh] max-w-md px-6 pb-10">
      <Masthead
        code="E-05"
        title="人机劳动结算账单"
        serial={token}
        stamp={<Seal text={verdictLabel} sub="人类裁决" />}
      />

      {/* 对账摘要：截图核心 */}
      <section className="mt-6 border border-line">
        <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
          <FaceCol
            tag="人类支付"
            value={formatSeconds(human.poolSeconds)}
            note="注意力"
          />
          <div className="flex items-center justify-center border-x border-line px-3 text-ash">
            ⇄
          </div>
          <FaceCol
            tag="机器劳动"
            value={formatSeconds(machine?.durationSeconds ?? 0)}
            note="真实耗时"
            accent
          />
        </div>
        <p className="border-t border-line px-3 py-2 text-[10px] tracking-[0.14em] text-faint">
          {human.participants.length} 人参与 · 消耗{" "}
          {formatNumber((machine?.tokensInput ?? 0) + (machine?.tokensOutput ?? 0))} tokens ·
          裁决 {verdictLabel}
        </p>
      </section>

      <Segment mark="甲" title="人类支付">
        <Row k="有效注意力" v={formatSeconds(human.attentionSeconds)} />
        <Row k="协作补贴加成" v={formatSeconds(human.multiplierBonusSeconds)} sub />
        <Row k="注意力池合计" v={formatSeconds(human.poolSeconds)} />
        <Row k="报价所需" v={formatSeconds(human.requiredSeconds)} />
        <Row k="参与人数" v={`${human.participants.length} 人`} />
        {human.participants.length > 0 && (
          <ul className="mt-1 flex flex-col gap-1 border-t border-line pt-2 text-xs text-ash">
            {human.participants.map((p, i) => (
              <li key={i} className="flex items-baseline">
                <span className="text-faint">{p.codename}</span>
                <span className="leader" />
                <span className="figure">{formatSeconds(p.effectiveSeconds)}</span>
              </li>
            ))}
          </ul>
        )}
      </Segment>

      <Segment mark="乙" title="机器劳动">
        {machine ? (
          <>
            <Row k="真实耗时" v={formatSeconds(machine.durationSeconds)} />
            <Row
              k="消耗 tokens"
              v={`${formatNumber((machine.tokensInput ?? 0) + (machine.tokensOutput ?? 0))}`}
            />
            <Row k="其中输出" v={`${formatNumber(machine.tokensOutput ?? 0)}`} sub />
            <Row k="执行轮次" v={`${machine.numTurns ?? 0} 次`} />
            <Row k="失败次数" v={`${machine.numToolErrors} 次`} />
            <Row
              k="模型成本"
              v={machine.costUsd != null ? `$${machine.costUsd.toFixed(4)}` : "—"}
            />
            <Row k="终止原因" v={machine.exitReason ?? "—"} />
          </>
        ) : (
          <p className="text-xs text-ash">尚无执行记录。</p>
        )}
      </Segment>

      <Segment mark="丙" title="交付">
        <Row k="任务状态" v={statusLabel(delivery.status)} />
        <Row k="产物文件" v={`${delivery.artifacts.length} 个`} />
        {delivery.artifacts.map((a) => (
          <div key={a.id} className="flex items-baseline text-xs text-ash">
            <span className="truncate text-faint">{a.filename}</span>
            <span className="leader" />
            <span className="figure shrink-0">{formatNumber(a.sizeBytes ?? 0)}B</span>
          </div>
        ))}
      </Segment>

      <Segment mark="丁" title="人类裁决">
        <div className="flex items-center justify-between">
          <span className="text-xs leading-relaxed text-ash">
            机器交付的结果，
            <br />
            值得付出的注意力吗？
          </span>
          <Seal
            text={verdictLabel}
            sub={verdict ? "SEALED" : "PENDING"}
            size="lg"
          />
        </div>
      </Segment>

      {/* 存档真实性条 */}
      <div className="mt-6 border-y border-dashed border-line py-4">
        <p className="text-[11px] leading-relaxed text-faint">{bill.subsidyNote}。</p>
        <p className="mt-2 text-[11px] leading-relaxed text-ash">
          此账单不可修饰，成功、失败与争议一并归入
          <span className="text-bone">人机劳动档案馆</span>。
        </p>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="flex h-8 items-end gap-[2px]" aria-hidden>
            {serial.split("").map((c, i) => (
              <span
                key={i}
                className="inline-block w-[3px] bg-ash"
                style={{
                  height: `${12 + ((c.charCodeAt(0) % 6) * 4)}px`,
                  opacity: 0.35 + (i % 3) * 0.2,
                }}
              />
            ))}
          </div>
          <span className="figure text-[10px] tracking-[0.2em] text-faint">
            档号 {serial}
          </span>
        </div>
      </div>

      <button
        onClick={copyShare}
        className="mt-5 w-full border border-ash py-3 text-xs tracking-[0.22em] text-bone transition-colors hover:border-bone"
      >
        {copied ? "征召链接已复制" : "复制征召链接 · 邀他人入注意力池"}
      </button>
      <Link
        href={`/t/${token}`}
        className="mt-3 block text-center text-xs tracking-[0.18em] text-faint underline underline-offset-4 hover:text-ash"
      >
        返回文书
      </Link>
    </main>
  );
}

function FaceCol({
  tag,
  value,
  note,
  accent,
}: {
  tag: string;
  value: string;
  note: string;
  accent?: boolean;
}) {
  return (
    <div className="px-3 py-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-faint">{tag}</p>
      <p
        className={`mt-2 figure text-xl leading-tight tracking-[0.04em] ${accent ? "text-sealbright" : "text-bone"}`}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] tracking-[0.14em] text-faint">{note}</p>
    </div>
  );
}

function Segment({
  mark,
  title,
  children,
}: {
  mark: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 border border-line">
      <h2 className="flex items-center gap-2 border-b border-line px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-faint">
        <span className="text-sealbright">{mark}</span>
        <span>{title}</span>
      </h2>
      <div className="ledger-lines flex flex-col gap-1 px-3 py-2 text-sm">
        {children}
      </div>
    </section>
  );
}

function Row({ k, v, sub }: { k: string; v: string; sub?: boolean }) {
  return (
    <div className="flex items-baseline">
      <span className={sub ? "text-faint" : "text-ash"}>{k}</span>
      <span className="leader" />
      <span
        className={`figure tracking-[0.06em] ${sub ? "text-ash" : "text-bone"}`}
      >
        {v}
      </span>
    </div>
  );
}
