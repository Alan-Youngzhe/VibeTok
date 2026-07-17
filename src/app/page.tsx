"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-between p-6">
      <header className="pt-8">
        <h1 className="text-xl tracking-[0.3em]">VIBETOK</h1>
        <p className="mt-3 text-sm leading-relaxed opacity-70">
          人类贡献注意力，换取机器劳动。
          <br />
          你描述任务，机器替你执行；你观看内容，为机器供养算力。
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <label className="text-xs uppercase tracking-widest opacity-60">
          劳动申请
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
          maxLength={2000}
          placeholder="描述你希望 Agent 完成的任务，例如：写一段快速排序的 TypeScript 实现并存成文件。"
          className="w-full resize-none border border-neutral-700 bg-transparent p-3 text-sm outline-none focus:border-neutral-400"
        />
        <div className="flex items-center justify-between text-xs opacity-50">
          <span>{prompt.length} / 2000</span>
          <span>结果不保证令人满意</span>
        </div>
        {error && <p className="text-xs text-red-400">申请失败：{error}</p>}
        <button
          onClick={submit}
          disabled={disabled}
          className="border border-neutral-500 py-3 text-sm tracking-widest disabled:opacity-30"
        >
          {submitting ? "提交中…" : "提交劳动申请"}
        </button>
      </section>

      <footer className="pb-6 pt-8 text-[11px] leading-relaxed opacity-40">
        本兑换由实验预算补贴，非广告收入。机器劳动真实发生、过程可追踪，
        但不保证任何开放式任务最终令人满意。
      </footer>
    </main>
  );
}
