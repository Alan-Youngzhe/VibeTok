"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import QuoteView from "@/components/QuoteView";
import RunningView from "@/components/RunningView";
import VerdictView from "@/components/VerdictView";
import { apiGet } from "@/lib/clientApi";
import { isTerminalStatus, type TaskState } from "@/lib/viewTypes";

export default function TaskPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [state, setState] = useState<TaskState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await apiGet<TaskState>(`/api/t/${token}`);
      setState(next);
      setError(null);
      return next.task.status;
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
      return null;
    }
  }, [token]);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      const status = await load();
      if (!active) return;
      if (status && !isTerminalStatus(status) && status !== "quoted") {
        timer.current = setTimeout(tick, 2000);
      }
    };
    void tick();
    return () => {
      active = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);

  if (error && !state) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-sm opacity-70">
        {error}
      </main>
    );
  }
  if (!state) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-sm opacity-50">
        正在解析交换…
      </main>
    );
  }

  const status = state.task.status;
  return (
    <main className="mx-auto min-h-screen max-w-md p-6">
      {status === "quoted" && (
        <QuoteView token={token} state={state} onChanged={load} />
      )}
      {(status === "accepted" || status === "running") && (
        <RunningView token={token} state={state} />
      )}
      {isTerminalStatus(status) && (
        <VerdictView token={token} state={state} onChanged={load} />
      )}
    </main>
  );
}
