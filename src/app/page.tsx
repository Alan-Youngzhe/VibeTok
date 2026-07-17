"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Masthead from "@/components/Masthead";
import Seal from "@/components/Seal";
import { apiPost } from "@/lib/clientApi";

interface CreatedTask {
  task: { shareToken: string };
}

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = submitting || prompt.trim().length === 0;

  async function submit() {
    if (disabled) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiPost<CreatedTask>("/api/tasks", { prompt: prompt.trim() });
      router.push(`/t/${res.task.shareToken}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pb-8">
      <Masthead
        code="A-01"
        title="机器劳动申请书"
        stamp={<Seal text="待受理" sub="INTAKE" />}
      />

      <p className="mt-6 text-sm leading-loose text-ash">
        填写你要移交给机器的劳动。本局代为执行，
        <span className="text-bone">你以注意力偿付</span>。
        机器劳动真实发生、过程可追踪，结果不予担保。
      </p>

      <section className="mt-7 flex flex-1 flex-col">
        <div className="flex items-baseline justify-between">
          <label
            htmlFor="apply"
            className="text-[10px] uppercase tracking-[0.28em] text-faint"
          >
            甲 · 申请事项（劳动内容）
          </label>
          <span className="text-[10px] tracking-[0.2em] text-faint figure">
            {prompt.length} / 2000
          </span>
        </div>
        <textarea
          id="apply"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={7}
          maxLength={2000}
          placeholder="据实填写。例：撰写一段快速排序的 TypeScript 实现并保存为文件。"
          className="mt-2 w-full resize-none border border-line bg-paper p-3 text-sm leading-relaxed text-bone outline-none placeholder:text-faint focus:border-ash"
        />

        <div className="mt-4 border-y border-line py-3 text-[11px] leading-relaxed text-ash">
          <span className="text-faint">乙 · 声明　</span>
          本局仅担保机器劳动真实发生、逐次记账，
          <span className="text-bone">不担保任何开放式任务令你满意</span>。
          失败亦如实归档，不予隐藏。
        </div>

        {error && (
          <p className="mt-3 border-l-2 border-seal pl-3 text-xs text-sealbright">
            申请驳回：{error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={disabled}
          className="mt-5 border border-ash py-3 text-sm tracking-[0.22em] text-bone transition-colors hover:border-bone disabled:cursor-not-allowed disabled:border-line disabled:text-faint"
        >
          {submitting ? "移交本局…" : "钤印提交 · 移交机器劳动"}
        </button>
      </section>

      <footer className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-4 text-[10px] leading-relaxed text-faint">
        <span>
          本兑换由实验预算补贴，非广告收入。
          <br />
          注意力入，机器劳动出。
        </span>
        <span className="shrink-0 tracking-[0.2em]">FORM A-01</span>
      </footer>
    </main>
  );
}
