export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export function errorJson(code: string, message: string, status = 400): Response {
  return Response.json({ error: { code, message } }, { status });
}
