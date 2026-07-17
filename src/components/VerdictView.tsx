"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ArtifactPreview from "@/components/ArtifactPreview";
import Masthead from "@/components/Masthead";
import Seal from "@/components/Seal";
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
    <section>
      <Masthead
        code="D-04"
        title="交付裁决书"
        serial={token}
        stamp={
          <Seal
            text={succeeded ? "已交付" : "执行失败"}
            sub={statusLabel(task.status)}
          />
        }
      />

      {task.errorMessage && (
        <p className="mt-6 border-l-2 border-seal pl-3 text-xs leading-relaxed text-ash">
          {task.errorMessage}
          <span className="mt-1 block text-faint">
            失败亦是社会实验的结果，已如实归档。
          </span>
        </p>
      )}

      <div className="mt-6 border border-line bg-paper p-3">
        <p className="text-[10px] uppercase tracking-[0.28em] text-faint">
          机器交付物
        </p>
        {artifacts.length > 0 ? (
          <div className="mt-3 flex flex-col gap-3">
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
          <div className="mt-2 text-xs leading-relaxed text-ash">
            {succeeded ? "本次未产出文件。" : "未产出可交付文件。"}
            {run && run.latestEvents.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 font-mono text-faint">
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
        <div className="mt-6 flex items-center justify-between border border-line p-4">
          <span className="text-xs uppercase tracking-[0.28em] text-faint">
            人类裁决 · 已钤印
          </span>
          <Seal
            text={task.verdict === "worth" ? "值得" : "不值得"}
            sub="SEALED"
          />
        </div>
      ) : task.isCreator ? (
        <div className="mt-6">
          <p className="text-sm leading-relaxed text-bone">
            机器交付的结果，值得你付出的注意力吗？
          </p>
          {error && <p className="mt-2 text-xs text-sealbright">裁决失败：{error}</p>}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={() => decide("worth")}
              disabled={submitting}
              className="border border-ash py-3 text-sm tracking-[0.22em] text-bone transition-colors hover:border-bone disabled:cursor-not-allowed disabled:opacity-30"
            >
              值得
            </button>
            <button
              onClick={() => decide("not_worth")}
              disabled={submitting}
              className="border border-seal py-3 text-sm tracking-[0.22em] text-sealbright transition-colors hover:bg-seal/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              不值得
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-6 border border-line p-3 text-xs text-ash">
          等待本文书发起人裁决。
        </p>
      )}

      <Link
        href={`/t/${token}/bill`}
        className="mt-6 block border border-line py-3 text-center text-sm tracking-[0.22em] text-ash transition-colors hover:border-ash hover:text-bone"
      >
        调阅公开人机劳动账单
      </Link>
    </section>
  );
}
