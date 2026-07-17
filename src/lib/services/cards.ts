import { contentCardsDao } from "../dao/contentCards";
import type { ContentCard } from "../schemas";

export function buildCardSequence(rounds = 3): ContentCard[] {
  const cards = contentCardsDao.all();
  if (cards.length === 0) return [];
  const seq: ContentCard[] = [];
  for (let i = 0; i < rounds; i += 1) seq.push(...cards);
  return seq;
}
