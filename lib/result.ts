import type { Question, ResultType } from './types';
import { cardKey, cards, normOpts, points, sliderItems } from './qutil';

const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

/** Skor 0-100 dari elemen yang ditandai "ikut dihitung" di admin. Null jika tidak ada yang dihitung. */
export function computeScore(qs: Question[], answers: Record<string, any>): number | null {
  const parts: number[] = [];
  for (const q of qs) {
    const a = answers[q.id];
    if (a == null) continue;
    switch (q.question_type) {
      case 'multiple_choice':
      case 'branching_choice': {
        const opts = normOpts(q.options);
        if (!opts.some((o) => typeof o.score === 'number')) break;
        const labels: string[] = q.question_type === 'multiple_choice' ? a.choices ?? [] : a.choice ? [a.choice] : [];
        const vals = labels.map((l) => opts.find((o) => o.label === l)?.score).filter((n): n is number => typeof n === 'number');
        if (vals.length) parts.push(avg(vals));
        break;
      }
      case 'slider':
        sliderItems(q).forEach((s) => {
          if (s.scored && typeof a[s.id] === 'number') parts.push((100 * (a[s.id] - s.min)) / Math.max(1, s.max - s.min));
        });
        break;
      case 'rating':
        if (q.config?.scored && typeof a === 'number') parts.push((100 * (a - 1)) / Math.max(1, points(q) - 1));
        break;
      case 'card_swipe': {
        if (!q.config?.scored) break;
        const v = cards(q).map((c) => a[cardKey(c)]).filter(Boolean);
        if (v.length) parts.push((100 * v.filter((x) => x === 'right').length) / v.length);
        break;
      }
    }
  }
  return parts.length ? avg(parts) : null;
}

/** Tipe dengan skor minimal tertinggi yang masih terpenuhi. */
export function pickResult(types: ResultType[] | undefined, score: number | null): ResultType | null {
  if (!types?.length || score == null) return null;
  let pick: ResultType | null = null;
  [...types].sort((a, b) => a.min_score - b.min_score).forEach((t) => { if (score >= t.min_score) pick = t; });
  return pick;
}
