import { json } from "@/lib/http";
import { listArchive } from "@/lib/services/archive";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const cursor = new URL(req.url).searchParams.get("cursor");
  return json(listArchive(cursor));
}
