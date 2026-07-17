import { TOKENS_PER_ATTENTION_SECOND, QUOTE_ROUND_SECONDS, WORKER_MAX_WALL_MS } from "../config";

export interface Quote {
  summary: string;
  laborSecondsEst: number;
  attentionSeconds: number;
  estTokens: number;
}

const TYPE_FACTORS = { code: 1.6, writing: 1.0, research: 1.3, general: 1.1 } as const;
const MODEL_TOKENS_PER_SECOND = 40;

function classify(prompt: string): keyof typeof TYPE_FACTORS {
  const p = prompt.toLowerCase();
  if (/代码|程序|函数|脚本|bug|code|script|function/.test(p)) return "code";
  if (/研究|调研|分析|查找|查询|research|analyz|investigat/.test(p)) return "research";
  if (/写|文案|文章|翻译|润色|write|essay|translat/.test(p)) return "writing";
  return "general";
}

function roundUpTo(value: number, step: number): number {
  return Math.max(step, Math.ceil(value / step) * step);
}

// 报价阶段不调模型，纯规则估算（TECH_SPEC §7 模块三）
export function buildQuote(prompt: string): Quote {
  const len = prompt.length;
  const baseTokens = len < 80 ? 3000 : len < 300 ? 9000 : 20000;
  const estTokens = Math.round(baseTokens * TYPE_FACTORS[classify(prompt)]);
  const maxSeconds = Math.floor(WORKER_MAX_WALL_MS / 1000);
  const laborSecondsEst = Math.min(
    maxSeconds,
    Math.max(20, Math.round(estTokens / MODEL_TOKENS_PER_SECOND)),
  );
  const attentionSeconds = roundUpTo(
    Math.ceil(estTokens / TOKENS_PER_ATTENTION_SECOND),
    QUOTE_ROUND_SECONDS,
  );
  const summary =
    `估算值：本次机器劳动约需 ${laborSecondsEst} 秒、消耗约 ${estTokens} tokens。` +
    `兑换需你贡献约 ${attentionSeconds} 秒有效注意力（1 秒注意力 = ${TOKENS_PER_ATTENTION_SECOND} tokens 预算，由实验预算补贴）。` +
    `实际用量以账本为准。`;
  return { summary, laborSecondsEst, attentionSeconds, estTokens };
}
