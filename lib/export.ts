import type { Question, ResponseRow } from './types';
import { cardKey, cards, normOpts, points, sliderItems } from './qutil';

const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
type Col = { h: string; get: (r: ResponseRow) => any };

export function toCsv(rows: ResponseRow[], qs: Question[]) {
  const cols: Col[] = [
    { h: 'Waktu', get: (r) => new Date(r.created_at).toLocaleString('id-ID') },
    { h: 'Session ID', get: (r) => r.session_id },
    { h: 'Durasi (detik)', get: (r) => r.duration_seconds },
  ];
  qs.forEach((q, i) => {
    const n = `Q${i + 1} (${q.title.slice(0, 30)})`;
    const a = (r: ResponseRow) => r.answers?.[q.id];
    switch (q.question_type) {
      case 'multiple_choice': {
        normOpts(q.options).forEach((o) => cols.push({ h: `${n} - ${o.label}`, get: (r) => { const x = a(r); return x ? (x.choices?.includes(o.label) ? 1 : 0) : ''; } }));
        if (q.config?.allow_other) {
          const ol = q.config.other_label || 'Lainnya';
          cols.push({ h: `${n} - ${ol}`, get: (r) => { const x = a(r); return x ? (x.other !== undefined ? 1 : 0) : ''; } });
          cols.push({ h: `${n} - ${ol} (teks)`, get: (r) => a(r)?.other ?? '' });
        }
        break;
      }
      case 'slider': sliderItems(q).forEach((s) => cols.push({ h: `${n} - ${s.label}`, get: (r) => a(r)?.[s.id] ?? '' })); break;
      case 'rating': cols.push({ h: `${n} - skor (1-${points(q)})`, get: (r) => a(r) ?? '' }); break;
      case 'card_swipe':
        cards(q).forEach((c) => cols.push({ h: `${n} - ${c.label}`, get: (r) => { const v = a(r)?.[cardKey(c)]; return v === 'right' ? q.config?.right_label || 'kanan' : v === 'left' ? q.config?.left_label || 'kiri' : ''; } }));
        break;
      case 'branching_choice':
        cols.push({ h: `${n} - pilihan`, get: (r) => a(r)?.choice ?? '' }, { h: `${n} - lanjutan`, get: (r) => a(r)?.followup ?? '' });
        break;
      case 'open_text': cols.push({ h: `${n} - jawaban`, get: (r) => a(r) ?? '' }); break;
    }
  });
  return '\uFEFF' + [cols.map((c) => esc(c.h)).join(','), ...rows.map((r) => cols.map((c) => esc(c.get(r))).join(','))].join('\n'); // BOM agar Excel membaca UTF-8
}
export function downloadCsv(csv: string, name = 'hasil-kuesioner.csv') {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
export function renderAnswer(q: Question, a: any): string {
  if (a == null) return '-';
  switch (q.question_type) {
    case 'multiple_choice': {
      const parts = [...(a.choices ?? [])];
      if (a.other !== undefined) parts.push(`${q.config?.other_label || 'Lainnya'}: ${a.other || '-'}`);
      return parts.join(', ') || '-';
    }
    case 'slider': return sliderItems(q).map((s) => `${s.label}: ${a[s.id] ?? '-'}`).join(' | ');
    case 'rating': return `${a} / ${points(q)}`;
    case 'card_swipe': return cards(q).map((c) => `${c.label}: ${a[cardKey(c)] === 'right' ? q.config?.right_label || 'kanan' : a[cardKey(c)] === 'left' ? q.config?.left_label || 'kiri' : '-'}`).join(' | ');
    case 'branching_choice': return a.choice + (a.followup ? ` → ${a.followup}` : '');
    default: return String(a);
  }
}
