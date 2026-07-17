import { tasksDao } from "@/lib/dao/tasks";
import { errorJson, json } from "@/lib/http";
import { getOrCreateParticipant } from "@/lib/participant";
import { toPublicTask } from "@/lib/services/taskState";
import { runTask } from "@/worker/agentWorker";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const task = tasksDao.get(id);
  if (!task) return errorJson("not_found", "任务不存在", 404);
  const viewer = await getOrCreateParticipant();
  if (task.creator_id !== viewer.id) return errorJson("forbidden", "仅创建者可接受报价", 403);
  if (task.status !== "quoted") return errorJson("invalid_state", "当前状态不可接受报价", 409);

  tasksDao.markAccepted(id, new Date().toISOString());
  void runTask(id).catch((err) => {
    tasksDao.markFinished(id, "failed", new Date().toISOString(), `worker 异常：${String(err)}`);
  });

  const updated = tasksDao.get(id);
  return json({ task: toPublicTask(updated ?? task, viewer.id) });
}
