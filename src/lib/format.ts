// 纯展示格式化：秒→「X 分 Y 秒」，大数字千分位
export function formatSeconds(total: number | null | undefined): string {
  const s = Math.max(0, Math.round(total ?? 0));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m === 0) return `${rest} 秒`;
  return `${m} 分 ${rest} 秒`;
}

export function formatNumber(n: number | null | undefined): string {
  return Math.round(n ?? 0).toLocaleString("en-US");
}

const STATUS_LABEL: Record<string, string> = {
  quoted: "待接受报价",
  accepted: "征召中",
  running: "机器劳动进行中",
  succeeded: "已交付",
  failed: "执行失败",
  timeout: "超时终止",
  token_limit: "token 超限终止",
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}
