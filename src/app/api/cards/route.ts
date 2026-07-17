import { json } from "@/lib/http";
import { buildCardSequence } from "@/lib/services/cards";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return json({ cards: buildCardSequence() });
}
