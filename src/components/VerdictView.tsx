"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ArtifactPreview from "@/components/ArtifactPreview";
import { apiGet, apiPost } from "@/lib/clientApi";
import { statusLabel } from "@/lib/format";
import type { Bill, TaskState } from "@/lib/viewTypes";

interface Props {
  token: string;
  state: TaskState;
  onChanged: () => Promise<unknown>;
}

export default function VerdictView({ token, state, onChanged }: Props) {
  const { task, run } = state;
  const [bill, setBill] = useState<Bill | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ bill: Bill }>(`/api/tasks/${task.id}/bill`)
      .then((r) => setBill(r.bill))
      .catch(() => setBill(null));
  }, [task.id]);

  async function decide(verdict: "worth" | "not_worth") {
    setSubmitting(true);
    setError(null);
    try {
      await apiPost(`/api/tasks/${task.id}/verdict`, { verdict });
      await onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "裁决失败");
      setSubmitting(false);
    }
  }

  const artifacts = bill?.delivery.artifacts ?? [];
  const succeeded = task.status === "succeeded";

  return (
    <section className="flex flex-col gap-5 pt-6">
      <h1 className="text-xs uppercase tracking-[0.3em] opacity-60">
        交付与裁决 · {statusLabel(task.status)}
      </h1>

      {task.errorMessage && (
        <p className="border-l-2 border-red-700 pl-3 text-xs leading-relaxed opacity-80">
          {task.errorMessage}（失败也是社会实验的结果，已如实记账）
        </p>
      )}

      <div className="border border-neutral-800 p-3">
        <p className="text-[11px] uppercase tracking-widest opacity-40">
          机器交付的结果
        </p>
        {artifacts.length > 0 ? (
          <div className="mt-2 flex flex-col gap-3">
            {artifacts.map((a) => (
              <ArtifactPreview
                key={a.id}
                taskId={task.id}
                artifactId={a.id}
                filename={a.filename}
                sizeBytes={a.sizeBytes}
              />
            ))}
          </div>
        ) : (
          <div className="mt-2 text-xs opacity-70">
            {succeeded ? "本次未产出文件。" : "未产出可交付文件。"}
            {run && run.latestEvents.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1">
                {run.latestEvents
                  .filter((e) => e.kind === "text")
                  .map((e, i) => (
                    <li key={i}>· {e.summary}</li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {task.verdict ? (
        <div className="border border-neutral-700 p-3 text-sm">
          你的裁决：
          <span className="ml-2 tracking-widest">
            {task.verdict === "worth" ? "值得" : "不值得"}
          </span>
        </div>
      ) : task.isCreator ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-relaxed">
            机器交付的结果，值得你付出的注意力吗？
          </p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => decide("worth")}
              disabled={submitting}
              className="border border-neutral-500 py-3 text-sm tracking-widest disabled:opacity-30"
            >
              值得
            </button>
            <button
              onClick={() => decide("not_worth")}
              disabled={submitting}
              className="border border-neutral-500 py-3 text-sm tracking-widest disabled:opacity-30"
            >
              不值得
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs opacity-50">等待任务发起人裁决。</p>
      )}

      <Link
        href={`/t/${token}/bill`}
        className="border border-neutral-700 py-3 text-center text-sm tracking-widest"
      >
        查看公开人机劳动账单
      </Link>
    </section>
  );
}
