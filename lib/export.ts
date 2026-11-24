import type { Question, ResponseRow } from './types';
import { cardKey, cards, normOpts, points, sliderItems } from './qutil';

export type CsvDelimiter = ';' | ',';
export type Col = { h: string; get: (r: ResponseRow) => string | number };
export type ExportOpts = { extra?: Col[]; idLabel?: string | null };

const one = (s: string) => String(s ?? '').replace(/\s+/g, ' ').trim();
const pad = (n: number) => String(n).padStart(2, '0');
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** Angka ditulis apa adanya; teks selalu diberi tanda kutip. Teks yang diawali = + - @ diberi awalan ' agar tidak dieksekusi sebagai rumus di Excel/Sheets. */
function cell(v: string | number): string {
  if (typeof v === 'number') return String(v);
  const t = /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
  return `"${t.replace(/"/g, '""')}"`;
}

/**
 * Kolom disusun dari kondisi kuesioner SAAT INI:
 * - pertanyaan aktif, ditambah pertanyaan nonaktif yang masih punya jawaban (diberi tanda [nonaktif]);
 * - pilihan yang sudah diubah/dihapus tetapi pernah dijawab tetap punya kolom "(opsi lama)";
 * - kolom "Lainnya" muncul jika opsinya aktif sekarang atau pernah dipakai;
 * - pertanyaan yang sudah dihapus tidak ikut.
 */
export function exportColumns(rows: ResponseRow[], qs: Question[], opts: ExportOpts = {}) {
  const ans = (q: Question) => rows.map((r) => r.answers?.[q.id]).filter((a) => a != null);
  const used = qs.filter((q) => q.is_active || ans(q).length > 0);
  const cols: Col[] = [
    { h: 'Waktu', get: (r) => fmtTime(r.created_at) },
    ...(opts.idLabel === null ? [] : [{ h: opts.idLabel ?? 'ID Responden', get: (r: ResponseRow) => r.session_id }]),
    { h: 'Durasi (detik)', get: (r) => r.duration_seconds },
    ...(opts.extra ?? []),
  ];
  used.forEach((q, i) => {
    const base = `Q${i + 1}${q.is_active ? '' : ' [nonaktif]'}: ${one(q.title)}`;
    const a = (r: ResponseRow) => r.answers?.[q.id];
    switch (q.question_type) {
      case 'multiple_choice': {
        const current = normOpts(q.options).map((o) => o.label).filter((l) => l?.trim());
        const legacy = Array.from(new Set(ans(q).flatMap((x: any) => x.choices ?? []))).filter((l: any) => !current.includes(l));
        [...current.map((l) => [l, false]), ...legacy.map((l) => [l, true])].forEach(([l, old]: any) =>
          cols.push({ h: `${base} | ${one(l)}${old ? ' (opsi lama)' : ''}`, get: (r) => { const x = a(r); return x ? (x.choices?.includes(l) ? 1 : 0) : ''; } }));
        if (q.config?.allow_other || ans(q).some((x: any) => x.other !== undefined)) {
          const ol = one(q.config?.other_label || 'Lainnya');
          cols.push(
            { h: `${base} | ${ol}`, get: (r) => { const x = a(r); return x ? (x.other !== undefined ? 1 : 0) : ''; } },
            { h: `${base} | ${ol} (isian)`, get: (r) => a(r)?.other ?? '' },
          );
        }
        break;
      }
      case 'branching_choice':
        cols.push({ h: `${base} | pilihan`, get: (r) => a(r)?.choice ?? '' });
        if (normOpts(q.options).some((o) => o.followup?.title) || ans(q).some((x: any) => x.followup))
          cols.push({ h: `${base} | jawaban lanjutan`, get: (r) => a(r)?.followup ?? '' });
        break;
      case 'slider':
        sliderItems(q).forEach((s, k) => cols.push({ h: `${base} | ${one(s.label) || `slider ${k + 1}`}`, get: (r) => a(r)?.[s.id] ?? '' }));
        break;
      case 'rating': cols.push({ h: `${base} | skor (1-${points(q)})`, get: (r) => a(r) ?? '' }); break;
      case 'card_swipe':
        cards(q).filter((c) => c.label?.trim()).forEach((c) => cols.push({
          h: `${base} | ${one(c.label)}`,
          get: (r) => { const v = a(r)?.[cardKey(c)]; return v === 'right' ? one(q.config?.right_label || 'kanan') : v === 'left' ? one(q.config?.left_label || 'kiri') : ''; },
        }));
        break;
      case 'open_text': cols.push({ h: `${base} | jawaban`, get: (r) => a(r) ?? '' }); break;
    }
  });
  // Nama kolom harus unik (judul/opsi yang sama diberi nomor)
  const seen = new Map<string, number>();
  cols.forEach((c) => { const n = (seen.get(c.h) ?? 0) + 1; seen.set(c.h, n); if (n > 1) c.h = `${c.h} (${n})`; });
  return { cols, used };
}

export function buildCsv(rows: ResponseRow[], qs: Question[], delimiter: CsvDelimiter = ';', opts: ExportOpts = {}) {
  const { cols, used } = exportColumns(rows, qs, opts);
  const sorted = [...rows].sort((x, y) => +new Date(x.created_at) - +new Date(y.created_at)); // urut dari yang paling awal
  const lines = [cols.map((c) => cell(c.h)).join(delimiter), ...sorted.map((r) => cols.map((c) => cell(c.get(r))).join(delimiter))];
  return { csv: '\uFEFF' + lines.join('\r\n'), responses: rows.length, questions: used.length, columns: cols.length }; // BOM agar Excel membaca UTF-8
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
