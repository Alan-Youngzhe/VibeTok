import { MULTIPLIER_MIN_EFFECTIVE_SECONDS, multiplierForParticipants } from "../config";
import { attentionSessionsDao } from "../dao/attentionSessions";
import { heartbeatsDao } from "../dao/heartbeats";
import { ledgerEntriesDao } from "../dao/ledgerEntries";
import { tasksDao } from "../dao/tasks";
import { accrueSeconds } from "./attentionRule";

export { accrueSeconds } from "./attentionRule";

const CARD_SECONDS = 15;

export interface PoolState {
  base: number;
  multiplier: number;
  bonus: number;
  pool: number;
  participants: number;
}

// 注意力池 = 真实观看秒数 + 协作补贴倍率加成（补贴单独入账，TECH_SPEC §5 模块二/五）
export function recomputePool(taskId: string): PoolState {
  const base = Math.round(ledgerEntriesDao.sumByType(taskId, "attention_earned"));
  const participants = attentionSessionsDao.countEffectiveParticipants(
    taskId,
    MULTIPLIER_MIN_EFFECTIVE_SECONDS,
  );
  const multiplier = multiplierForParticipants(Math.max(participants, 1));
  const bonus = Math.round(base * (multiplier - 1));
  const pool = base + bonus;
  ledgerEntriesDao.deleteByType(taskId, "multiplier_bonus");
  if (bonus > 0) {
    ledgerEntriesDao.add({
      task_id: taskId,
      entry_type: "multiplier_bonus",
      amount: bonus,
      unit: "seconds",
      source_id: null,
      note: `${participants} 人协作 ×${multiplier}，VibeTok 协作补贴`,
      created_at: new Date().toISOString(),
    });
  }
  tasksDao.setPoolSeconds(taskId, pool);
  return { base, multiplier, bonus, pool, participants };
}

export function processHeartbeat(
  sessionId: string,
  input: { visible: boolean; playing: boolean; cardId: string },
): { effectiveSeconds: number; poolSeconds: number } {
  const session = attentionSessionsDao.get(sessionId);
  if (!session) throw new Error("session_not_found");
  const ts = new Date().toISOString();
  const prev = heartbeatsDao.last(sessionId);
  const delta = accrueSeconds(prev, { ts, visible: input.visible, playing: input.playing });
  heartbeatsDao.add(sessionId, ts, input.visible ? 1 : 0, input.playing ? 1 : 0);
  const effectiveSeconds = session.effective_seconds + delta;
  attentionSessionsDao.update(sessionId, {
    last_heartbeat_at: ts,
    effective_seconds: effectiveSeconds,
    cards_watched: Math.floor(effectiveSeconds / CARD_SECONDS),
  });
  if (delta > 0) {
    ledgerEntriesDao.add({
      task_id: session.task_id,
      entry_type: "attention_earned",
      amount: delta,
      unit: "seconds",
      source_id: sessionId,
      note: null,
      created_at: ts,
    });
  }
  const pool = recomputePool(session.task_id);
  return { effectiveSeconds, poolSeconds: pool.pool };
}
