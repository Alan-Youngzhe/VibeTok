import { contentCardsDao } from "../src/lib/dao/contentCards";
import type { ContentCard } from "../src/lib/schemas";

const CARDS: ContentCard[] = [
  { id: "labor-01", kind: "generative", title: "流水线上的手", src: "labor-hands", duration_seconds: 15, theme: "labor" },
  { id: "labor-02", kind: "generative", title: "打卡钟", src: "labor-clock", duration_seconds: 15, theme: "labor" },
  { id: "labor-03", kind: "generative", title: "工位格子", src: "labor-cubicle", duration_seconds: 15, theme: "labor" },
  { id: "ai-01", kind: "generative", title: "权重矩阵", src: "ai-matrix", duration_seconds: 15, theme: "ai" },
  { id: "ai-02", kind: "generative", title: "推理链", src: "ai-chain", duration_seconds: 15, theme: "ai" },
  { id: "ai-03", kind: "generative", title: "token 洪流", src: "ai-tokens", duration_seconds: 15, theme: "ai" },
  { id: "consume-01", kind: "generative", title: "无限下滑", src: "consume-scroll", duration_seconds: 15, theme: "consumption" },
  { id: "consume-02", kind: "generative", title: "红点提醒", src: "consume-badge", duration_seconds: 15, theme: "consumption" },
  { id: "consume-03", kind: "generative", title: "自动播放", src: "consume-autoplay", duration_seconds: 15, theme: "consumption" },
];

for (const card of CARDS) contentCardsDao.insert(card);
console.log(`已灌入 ${CARDS.length} 张内容卡片，当前池 ${contentCardsDao.count()} 张。`);
