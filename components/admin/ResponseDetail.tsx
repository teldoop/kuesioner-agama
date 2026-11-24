'use client';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Trash2, X } from 'lucide-react';
import type { Question } from '@/lib/types';

export type DetailRow = { id: string; created_at: string; duration_seconds: number; answers: Record<string, any> };
import { cardKey, cards as getCards, normOpts, points, sliderItems } from '@/lib/qutil';

const fmtDur = (s: number) => (s < 60 ? `${s} detik` : `${Math.floor(s / 60)} mnt ${s % 60} dtk`);
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const Chip = ({ children, color = 'bg-lime-300' }: { children: React.ReactNode; color?: string }) => (
  <span className={`inline-flex items-center gap-1 border-[3px] border-black px-2 py-1 text-sm font-bold ${color}`}>{children}</span>
);

function Answer({ q, a }: { q: Question; a: any }) {
  if (a == null || (typeof a === 'string' && !a.trim()))
    return <p className="text-sm font-semibold italic opacity-60">Tidak dijawab</p>;

  switch (q.question_type) {
    case 'multiple_choice': {
      const chips = [...(a.choices ?? [])];
      const hasOther = a.other !== undefined;
      if (!chips.length && !hasOther) return <p className="text-sm font-semibold italic opacity-60">Tidak dijawab</p>;
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {chips.map((c: string) => <Chip key={c}>{c}</Chip>)}
            {hasOther && <Chip color="bg-yellow-300">{q.config?.other_label || 'Lainnya'}</Chip>}
          </div>
          {hasOther && <p className="text-sm font-semibold">{a.other?.trim() ? <>Isian: <span className="font-extrabold break-words">{a.other}</span></> : <span className="italic opacity-60">Isian Lainnya dikosongkan</span>}</p>}
        </div>
      );
    }
    case 'slider':
      return (
        <div className="space-y-3">
          {sliderItems(q).map((s) => {
            const v = a[s.id];
            const pct = typeof v === 'number' ? Math.max(0, Math.min(100, (100 * (v - s.min)) / Math.max(1, s.max - s.min))) : 0;
            return (
              <div key={s.id} className="space-y-1">
                <div className="flex justify-between gap-3 text-sm font-bold"><span>{s.label}</span><span className="bg-black text-white px-2">{v ?? '-'}</span></div>
                <div className="h-4 border-[3px] border-black bg-white"><div className="h-full bg-yellow-300 border-r-[3px] border-black" style={{ width: `${pct}%` }} /></div>
                <div className="flex justify-between gap-3 text-xs font-semibold opacity-80"><span>{s.left || s.min}</span><span className="text-right">{s.right || s.max}</span></div>
              </div>
            );
          })}
        </div>
      );
    case 'rating': {
      const N = points(q);
      return (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {Array.from({ length: N }, (_, i) => (
              <span key={i} className={`flex-1 h-8 border-[3px] border-black flex items-center justify-center text-xs font-extrabold ${i + 1 <= a ? 'bg-yellow-300' : 'bg-white'}`}>{i + 1}</span>
            ))}
          </div>
          <p className="text-sm font-bold">{a} dari {N}{(q.config?.low_label || q.config?.high_label) && <span className="font-semibold opacity-80"> (1 = {q.config?.low_label || '-'}, {N} = {q.config?.high_label || '-'})</span>}</p>
        </div>
      );
    }
    case 'card_swipe':
      return (
        <ul className="space-y-1.5">
          {getCards(q).map((c) => {
            const v = a[cardKey(c)];
            return (
              <li key={cardKey(c)} className="flex items-center justify-between gap-3 border-t-2 border-black pt-1.5 first:border-t-0 first:pt-0">
                <span className="text-sm font-semibold">{c.label}</span>
                {v === 'right' ? <Chip>{q.config?.right_label || 'Kanan'} <ArrowRight size={14} strokeWidth={3} /></Chip>
                  : v === 'left' ? <Chip color="bg-pink-300"><ArrowLeft size={14} strokeWidth={3} /> {q.config?.left_label || 'Kiri'}</Chip>
                  : <span className="text-xs italic opacity-60">Tidak dijawab</span>}
              </li>
            );
          })}
        </ul>
      );
    case 'branching_choice': {
      const opt = normOpts(q.options).find((o) => o.label === a.choice);
      return (
        <div className="space-y-2">
          <Chip>{a.choice}</Chip>
          {a.followup && (
            <div className="border-l-[6px] border-black pl-3 space-y-1">
              {opt?.followup?.title && <p className="text-xs font-bold opacity-80">{opt.followup.title}</p>}
              <Chip color="bg-sky-300">{a.followup}</Chip>
            </div>
          )}
        </div>
      );
    }
    default:
      return <blockquote className="border-l-[6px] border-black pl-3 whitespace-pre-wrap break-words font-semibold">{String(a)}</blockquote>;
  }
}

export default function ResponseDetail({ rows, index, questions, onClose, onNavigate, onDelete, title = 'Detail Jawaban', renderExtra }: {
  rows: DetailRow[]; index: number; questions: Question[];
  onClose: () => void; onNavigate: (i: number) => void; onDelete: (id: string) => void;
  title?: string; renderExtra?: (r: DetailRow) => React.ReactNode;
}) {
  const r = rows[index];
  const closeRef = useRef<HTMLButtonElement>(null);

  // Esc menutup, panah kiri/kanan berpindah responden, halaman di belakang tidak ikut bergulir
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1);
      if (e.key === 'ArrowRight' && index < rows.length - 1) onNavigate(index + 1);
    };
    document.addEventListener('keydown', key);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = prev; };
  }, [index, rows.length]); // eslint-disable-line

  if (!r || typeof document === 'undefined') return null;
  const answered = questions.filter((q) => r.answers?.[q.id] != null).length;
  return createPortal(
    <div className="fixed inset-0 !m-0 bg-neutral-950/60 flex items-end md:items-center justify-center p-0 md:p-4 z-40" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="detail-title"
        className="nb-card w-full max-w-xl max-h-[92vh] md:max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Kepala */}
        <div className="p-4 border-b-[3px] border-black space-y-3 shrink-0">
          <div className="flex items-center gap-2">
            <h2 id="detail-title" className="font-extrabold uppercase mr-auto">{title}</h2>
            <button onClick={() => onNavigate(index - 1)} disabled={index === 0} className="nb-btn nb-btn-sm !bg-white !px-2" aria-label="Jawaban lebih baru" title="Lebih baru"><ArrowLeft size={16} strokeWidth={3} /></button>
            <span className="text-sm font-extrabold tabular-nums">{index + 1} / {rows.length}</span>
            <button onClick={() => onNavigate(index + 1)} disabled={index === rows.length - 1} className="nb-btn nb-btn-sm !bg-white !px-2" aria-label="Jawaban lebih lama" title="Lebih lama"><ArrowRight size={16} strokeWidth={3} /></button>
            <button ref={closeRef} onClick={onClose} className="nb-btn nb-btn-sm !bg-red-300 !px-2" aria-label="Tutup"><X size={16} strokeWidth={3} /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="nb-tag !bg-yellow-300"><CalendarDays size={14} strokeWidth={3} /> {fmtDate(r.created_at)}</span>
            <span className="nb-tag !bg-sky-300"><Clock size={14} strokeWidth={3} /> Mengisi selama {fmtDur(r.duration_seconds)}</span>
            <span className="nb-tag !bg-lime-300">{answered} dari {questions.length} pertanyaan terjawab</span>
          </div>
          {renderExtra?.(r)}
        </div>

        {/* Isi */}
        <div className="p-4 space-y-3 overflow-y-auto">
          {questions.length === 0 && <p className="text-sm font-bold text-center py-6">Belum ada pertanyaan untuk kuesioner ini</p>}
          {questions.map((q, i) => (
            <section key={q.id} className="border-[3px] border-black p-3 space-y-2">
              <div className="flex items-start gap-2">
                <span className="nb-tag !bg-yellow-300 shrink-0">Q{i + 1}</span>
                <p className="font-bold leading-snug">{q.title}</p>
              </div>
              <Answer q={q} a={r.answers?.[q.id]} />
            </section>
          ))}
        </div>

        {/* Kaki */}
        <div className="p-4 border-t-[3px] border-black flex items-center gap-3 shrink-0">
          <button onClick={() => onDelete(r.id)} className="nb-btn nb-btn-sm !bg-red-300"><Trash2 size={14} strokeWidth={3} /> Hapus jawaban ini</button>
          <button onClick={onClose} className="nb-btn nb-btn-sm !bg-white ml-auto">Tutup</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
