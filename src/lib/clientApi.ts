// 前端统一 fetch：JSON 请求/响应，错误抛出 {code,message}
export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } })?.error;
    throw new ApiError(err?.code ?? "unknown", err?.message ?? "请求失败");
  }
  return data as T;
}

export function apiGet<T>(url: string): Promise<T> {
  return request<T>(url, { method: "GET", cache: "no-store" });
}

export function apiPost<T>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
}
