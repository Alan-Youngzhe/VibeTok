import { z } from "zod";

export const createTaskBody = z.object({
  prompt: z.string().trim().min(1).max(2000),
});

export const heartbeatBody = z.object({
  visible: z.boolean(),
  playing: z.boolean(),
  cardId: z.string().min(1),
});

export const verdictBody = z.object({
  verdict: z.enum(["worth", "not_worth"]),
});

export type CreateTaskBody = z.infer<typeof createTaskBody>;
export type HeartbeatBody = z.infer<typeof heartbeatBody>;
export type VerdictBody = z.infer<typeof verdictBody>;
