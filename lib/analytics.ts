import type { Question, ResponseRow } from './types';
import { cardKey, cards as getCards, normOpts, points, sliderItems } from './qutil';

export type Chart = { title: string; data: { name: string; value: number }[]; unit?: string };
export interface QStat { q: Question; n: number; charts: Chart[]; texts: string[]; textsTitle?: string; note?: string }

const pct = (a: number, b: number) => (b ? Math.round((100 * a) / b) : 0);
const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const r1 = (n: number) => Math.round(n * 10) / 10;

function countData(labels: string[], counts: Record<string, number>, extra: { name: string; value: number }[] = []) {
  const known = new Set(labels);
  const data = labels.map((l) => ({ name: l || '(kosong)', value: counts[l] ?? 0 }));
  Object.keys(counts).filter((k) => !known.has(k)).forEach((k) => data.push({ name: `${k} (opsi lama)`, value: counts[k] }));
  return [...data, ...extra];
}

/** Statistik dihasilkan otomatis dari struktur pertanyaan; tidak ada pertanyaan/opsi yang ditulis di kode. */
export function analyze(rows: ResponseRow[], qs: Question[]) {
  const total = rows.length;
  const avgDur = total ? Math.round(avg(rows.map((r) => r.duration_seconds))) : 0;
  const todayStr = new Date().toDateString();
  const today = rows.filter((r) => new Date(r.created_at).toDateString() === todayStr).length;

  const stats: QStat[] = qs.map((q) => {
    const answers: any[] = rows.map((r) => r.answers?.[q.id]).filter((a) => a != null);
    const s: QStat = { q, n: answers.length, charts: [], texts: [] };
    switch (q.question_type) {
      case 'multiple_choice': {
        const opts = normOpts(q.options); const counts: Record<string, number> = {}; let other = 0;
        const otherLabel = q.config?.other_label || 'Lainnya';
        answers.forEach((a) => {
          (a.choices ?? []).forEach((l: string) => (counts[l] = (counts[l] ?? 0) + 1));
          if (a.other !== undefined) { other++; if (String(a.other).trim()) s.texts.push(String(a.other).trim()); }
        });
        s.charts.push({ title: 'Jumlah pemilih', data: countData(opts.map((o) => o.label), counts, q.config?.allow_other ? [{ name: otherLabel, value: other }] : []) });
        s.textsTitle = `Isian "${otherLabel}"`;
        break;
      }
      case 'branching_choice': {
        const opts = normOpts(q.options); const counts: Record<string, number> = {};
        answers.forEach((a) => { if (a.choice) counts[a.choice] = (counts[a.choice] ?? 0) + 1; });
        s.charts.push({ title: 'Jumlah pemilih', data: countData(opts.map((o) => o.label), counts) });
        opts.filter((o) => o.followup?.title).forEach((o) => {
          const fc: Record<string, number> = {};
          answers.forEach((a) => { if (a.choice === o.label && a.followup) fc[a.followup] = (fc[a.followup] ?? 0) + 1; });
          s.charts.push({ title: `Lanjutan: ${o.followup!.title}`, data: countData(o.followup!.options ?? [], fc) });
        });
        break;
      }
      case 'slider': {
        const items = sliderItems(q);
        s.charts.push({ title: 'Rata-rata nilai', data: items.map((it) => ({ name: it.label || '(tanpa judul)', value: r1(avg(answers.map((a) => a[it.id]).filter((v) => typeof v === 'number'))) })) });
        s.note = items.map((it) => `${it.label}: skala ${it.min}-${it.max}`).join(' | ');
        break;
      }
      case 'rating': {
        const N = points(q); const vals = answers.filter((a) => typeof a === 'number');
        s.charts.push({ title: 'Sebaran skor', data: Array.from({ length: N }, (_, i) => ({ name: String(i + 1), value: vals.filter((v) => v === i + 1).length })) });
        s.note = `Rata-rata ${r1(avg(vals))} dari ${N}` + (q.config?.low_label || q.config?.high_label ? ` (1 = ${q.config?.low_label || '-'}, ${N} = ${q.config?.high_label || '-'})` : '');
        break;
      }
      case 'card_swipe': {
        const right = q.config?.right_label || 'kanan';
        s.charts.push({
          title: `Persentase yang memilih "${right}"`, unit: '%',
          data: getCards(q).map((c) => {
            const v = answers.map((a) => a[cardKey(c)]).filter(Boolean);
            return { name: c.label || '(tanpa nama)', value: pct(v.filter((x) => x === 'right').length, v.length) };
          }),
        });
        break;
      }
      case 'open_text':
        s.texts = answers.filter((a) => typeof a === 'string' && a.trim()).slice(0, 30);
        s.textsTitle = 'Jawaban terbaru';
        break;
    }
    return s;
  });
  return { total, avgDur, today, stats };
}
