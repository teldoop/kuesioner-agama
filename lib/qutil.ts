import type { QType, Question } from './types';

export const uid = () => Math.random().toString(36).slice(2, 8);
export const KNOWN_TYPES: QType[] = ['multiple_choice', 'slider', 'rating', 'card_swipe', 'branching_choice', 'open_text'];

export type Opt = { label: string; score?: number | null; followup?: { title: string; options: string[] } | null };
export type SliderItem = { id: string; label: string; min: number; max: number; left?: string; right?: string; scored?: boolean };
export type Card = { id?: string; label: string; icon?: string };

export const cardKey = (c: Card) => c.id ?? c.label;
export const normOpts = (o: any): Opt[] => (Array.isArray(o) ? o : []).map((x) => (typeof x === 'string' ? { label: x } : x));
export const sliderItems = (q: Question): SliderItem[] => (Array.isArray(q.options) ? q.options : []);
export const cards = (q: Question): Card[] => (Array.isArray(q.options) ? q.options : []);
export const points = (q: Question): number => q.config?.points ?? 5;

/** Struktur kosong untuk jenis pertanyaan baru (tanpa isi bawaan). */
export function emptyFor(t: QType): { options: any; config: any } {
  switch (t) {
    case 'multiple_choice': return { options: [{ label: '' }, { label: '' }], config: { multiple: false, allow_other: false } };
    case 'branching_choice': return { options: [{ label: '' }, { label: '' }], config: {} };
    case 'slider': return { options: [{ id: uid(), label: '', min: 0, max: 100 }], config: {} };
    case 'rating': return { options: null, config: { points: 5, low_label: '', high_label: '', scored: false } };
    case 'card_swipe': return { options: [{ id: uid(), label: '', icon: 'bag' }], config: { left_label: '', right_label: '', scored: false } };
    default: return { options: null, config: { multiline: true, placeholder: '' } };
  }
}

export function isAnswered(q: Question, a: any): boolean {
  if (q.config?.required === false) return true;
  if (a == null) return false;
  switch (q.question_type) {
    case 'multiple_choice': return (a.choices?.length ?? 0) > 0 || a.other !== undefined;
    case 'slider': return sliderItems(q).every((s) => typeof a[s.id] === 'number');
    case 'rating': return typeof a === 'number';
    case 'card_swipe': return cards(q).filter((c) => c.label?.trim()).every((c) => a[cardKey(c)]);
    case 'branching_choice': {
      const o = normOpts(q.options).find((x) => x.label === a.choice);
      return !!o && (!o.followup?.title || !!a.followup);
    }
    case 'open_text': return typeof a === 'string' && a.trim().length > 0;
  }
  return true;
}
