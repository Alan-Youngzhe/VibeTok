import { attentionSessionsDao } from "@/lib/dao/attentionSessions";
import { tasksDao } from "@/lib/dao/tasks";
import { errorJson, json } from "@/lib/http";
import { newId } from "@/lib/ids";
import { getOrCreateParticipant } from "@/lib/participant";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const task = tasksDao.get(id);
  if (!task) return errorJson("not_found", "任务不存在", 404);
  const participant = await getOrCreateParticipant();
  const now = new Date().toISOString();
  const session = attentionSessionsDao.create({
    id: newId(),
    task_id: id,
    participant_id: participant.id,
    started_at: now,
    last_heartbeat_at: null,
    effective_seconds: 0,
    cards_watched: 0,
  });
  return json(
    { session: { id: session.id }, participant: { codename: participant.codename } },
    { status: 201 },
  );
}
