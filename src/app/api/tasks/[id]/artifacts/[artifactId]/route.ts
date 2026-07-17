import fs from "node:fs";
import { artifactsDao } from "@/lib/dao/artifacts";
import { tasksDao } from "@/lib/dao/tasks";
import { errorJson } from "@/lib/http";
import { getParticipantId } from "@/lib/participant";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; artifactId: string }> },
): Promise<Response> {
  const { id, artifactId } = await params;
  const task = tasksDao.get(id);
  if (!task) return errorJson("not_found", "任务不存在", 404);
  const artifact = artifactsDao.get(artifactId);
  if (!artifact || artifact.task_id !== id) return errorJson("not_found", "产物不存在", 404);
  if (task.reveal_content !== 1) {
    const viewerId = await getParticipantId();
    if (viewerId !== task.creator_id) return errorJson("forbidden", "产物未公开", 403);
  }
  if (!fs.existsSync(artifact.path)) return errorJson("not_found", "产物文件缺失", 404);
  const data = fs.readFileSync(artifact.path);
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": artifact.mime ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(artifact.filename)}"`,
    },
  });
}
