import { tasksDao } from "@/lib/dao/tasks";
import { errorJson, json } from "@/lib/http";
import { getParticipantId } from "@/lib/participant";
import { buildTaskState } from "@/lib/services/taskState";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const task = tasksDao.get(id);
  if (!task) return errorJson("not_found", "任务不存在", 404);
  const viewerId = await getParticipantId();
  return json(buildTaskState(task, viewerId));
}
