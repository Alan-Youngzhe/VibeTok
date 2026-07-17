import { tasksDao } from "@/lib/dao/tasks";
import { errorJson, json } from "@/lib/http";
import { getOrCreateParticipant } from "@/lib/participant";
import { verdictBody } from "@/lib/schemas";
import { toPublicTask } from "@/lib/services/taskState";
import { isTerminal, submitVerdict } from "@/lib/services/verdict";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const task = tasksDao.get(id);
  if (!task) return errorJson("not_found", "任务不存在", 404);
  const viewer = await getOrCreateParticipant();
  if (task.creator_id !== viewer.id) return errorJson("forbidden", "仅创建者可裁决", 403);
  if (!isTerminal(task.status)) return errorJson("invalid_state", "任务未到终态，不可裁决", 409);
  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    raw = null;
  }
  const parsed = verdictBody.safeParse(raw);
  if (!parsed.success) return errorJson("invalid_body", "裁决结果不合法", 422);

  submitVerdict(task, parsed.data.verdict);
  const updated = tasksDao.get(id);
  return json({ task: toPublicTask(updated ?? task, viewer.id) });
}
