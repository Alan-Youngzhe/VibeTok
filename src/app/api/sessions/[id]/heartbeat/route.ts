import { errorJson, json } from "@/lib/http";
import { heartbeatBody } from "@/lib/schemas";
import { processHeartbeat } from "@/lib/services/attention";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    raw = null;
  }
  const parsed = heartbeatBody.safeParse(raw);
  if (!parsed.success) return errorJson("invalid_body", "心跳数据不合法", 422);
  try {
    return json(processHeartbeat(id, parsed.data));
  } catch {
    return errorJson("not_found", "观看会话不存在", 404);
  }
}
