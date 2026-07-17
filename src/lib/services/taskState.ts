import { MULTIPLIER_MIN_EFFECTIVE_SECONDS, multiplierForParticipants } from "../config";
import { agentEventsDao } from "../dao/agentEvents";
import { agentRunsDao } from "../dao/agentRuns";
import { attentionSessionsDao } from "../dao/attentionSessions";
import type { Task } from "../schemas";

// 默认隐藏 prompt：仅创建者或 reveal_content=1 时返回原文（TECH_SPEC §6 隐私默认）
export function toPublicTask(task: Task, viewerId: string | null) {
  const canSeeContent = task.reveal_content === 1 || viewerId === task.creator_id;
  return {
    id: task.id,
    shareToken: task.share_token,
    status: task.status,
    prompt: canSeeContent ? task.prompt : null,
    quoteSummary: task.quote_summary,
    quoteLaborSecondsEst: task.quote_labor_seconds_est,
    quoteAttentionSeconds: task.quote_attention_seconds,
    attentionPoolSeconds: task.attention_pool_seconds,
    verdict: task.verdict,
    isCreator: viewerId === task.creator_id,
    revealContent: task.reveal_content === 1,
    createdAt: task.created_at,
    finishedAt: task.finished_at,
    errorMessage: task.error_message,
  };
}

export function buildTaskState(task: Task, viewerId: string | null) {
  const run = agentRunsDao.latestByTask(task.id);
  const latestEvents = agentEventsDao.latestByTask(task.id, 8);
  const participantCount = attentionSessionsDao.countEffectiveParticipants(
    task.id,
    MULTIPLIER_MIN_EFFECTIVE_SECONDS,
  );
  const multiplier = multiplierForParticipants(Math.max(participantCount, 1));
  return {
    task: toPublicTask(task, viewerId),
    run: run
      ? {
          durationSeconds: run.duration_seconds,
          tokensTotal: (run.tokens_input ?? 0) + (run.tokens_output ?? 0),
          tokensOutput: run.tokens_output,
          numTurns: run.num_turns,
          exitReason: run.exit_reason,
          latestEvents: latestEvents.map((e) => ({ ts: e.ts, kind: e.kind, summary: e.summary })),
        }
      : null,
    pool: {
      earnedSeconds: task.attention_pool_seconds,
      requiredSeconds: task.quote_attention_seconds,
      participantCount,
      multiplier,
    },
  };
}
