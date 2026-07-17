import { cookies } from "next/headers";
import { participantsDao } from "./dao/participants";
import { newId, newCodename } from "./ids";
import type { Participant } from "./schemas";

const COOKIE = "participant_id";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getOrCreateParticipant(): Promise<Participant> {
  const store = await cookies();
  const existing = store.get(COOKIE)?.value;
  if (existing) {
    const found = participantsDao.get(existing);
    if (found) return found;
  }
  const participant = participantsDao.create({
    id: newId(),
    codename: newCodename(),
    created_at: new Date().toISOString(),
  });
  store.set(COOKIE, participant.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
  return participant;
}

export async function getParticipantId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}
