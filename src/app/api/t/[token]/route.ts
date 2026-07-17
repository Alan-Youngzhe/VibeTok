import { tasksDao } from "@/lib/dao/tasks";
import { errorJson, json } from "@/lib/http";
import { getParticipantId } from "@/lib/participant";
import { buildTaskState } from "@/lib/services/taskState";

export const dynamic = "force-dynamic";

// 分享/助力/恢复统一入口：由 share_token 解析任务，返回观看页同款状态载荷
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await params;
  const task = tasksDao.getByShareToken(token);
  if (!task) return errorJson("not_found", "任务不存在", 404);
  const viewerId = await getParticipantId();
  return json(buildTaskState(task, viewerId));
}
