import { tasksDao } from "@/lib/dao/tasks";
import { errorJson, json } from "@/lib/http";
import { newId, newShareToken } from "@/lib/ids";
import { getOrCreateParticipant } from "@/lib/participant";
import { createTaskBody } from "@/lib/schemas";
import { buildQuote } from "@/lib/services/quote";

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    raw = null;
  }
  const parsed = createTaskBody.safeParse(raw);
  if (!parsed.success) return errorJson("invalid_body", "劳动申请内容不合法", 422);

  const participant = await getOrCreateParticipant();
  const quote = buildQuote(parsed.data.prompt);
  const now = new Date().toISOString();
  const task = tasksDao.create({
    id: newId(),
    creator_id: participant.id,
    prompt: parsed.data.prompt,
    status: "quoted",
    quote_summary: quote.summary,
    quote_labor_seconds_est: quote.laborSecondsEst,
    quote_attention_seconds: quote.attentionSeconds,
    attention_pool_seconds: 0,
    verdict: null,
    verdict_at: null,
    share_token: newShareToken(),
    is_public: 1,
    reveal_content: 0,
    error_message: null,
    created_at: now,
    accepted_at: null,
    finished_at: null,
  });

  return json(
    {
      task: {
        id: task.id,
        shareToken: task.share_token,
        status: task.status,
        quoteSummary: quote.summary,
        quoteLaborSecondsEst: quote.laborSecondsEst,
        quoteAttentionSeconds: quote.attentionSeconds,
      },
    },
    { status: 201 },
  );
}
