import { randomUUID, randomBytes } from "node:crypto";

export const newId = (): string => randomUUID();

export function newShareToken(): string {
  return randomBytes(8).toString("base64url");
}

export function newCodename(): string {
  const n = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `劳动者 No.${n}`;
}
