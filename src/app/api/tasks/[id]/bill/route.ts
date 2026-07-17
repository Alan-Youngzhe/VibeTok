import { tasksDao } from "@/lib/dao/tasks";
import { errorJson, json } from "@/lib/http";
import { buildBill } from "@/lib/services/ledger";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const task = tasksDao.get(id);
  if (!task) return errorJson("not_found", "任务不存在", 404);
  return json({ bill: buildBill(task) });
}
