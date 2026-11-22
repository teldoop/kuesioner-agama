'use client';
import { useEffect, useState } from 'react';
import { Download, Eye, Trash2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { downloadCsv, renderAnswer, toCsv } from '@/lib/export';
import { TYPE_LABEL, type Question, type ResponseRow } from '@/lib/types';
import LiveBadge from '@/components/admin/LiveBadge';
import { applyLive, useResponsesLive } from '@/lib/useResponsesLive';

export default function Responses() {
  const sb = createClient();
  const [rows, setRows] = useState<ResponseRow[]>([]); const [qs, setQs] = useState<Question[]>([]);
  const [open, setOpen] = useState<ResponseRow | null>(null);
  const [fresh, setFresh] = useState<string[]>([]);
  const load = async () => {
    const [r, q] = await Promise.all([
      sb.from('survey_responses').select('*').order('created_at', { ascending: false }).limit(5000),
      sb.from('survey_questions').select('*').order('order_index'),
    ]);
    setRows((r.data as any) ?? []); setQs(((q.data as any) ?? []).filter((x: Question) => TYPE_LABEL[x.question_type]));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line
  const status = useResponsesLive((e) => {
    setRows((r) => applyLive(r, e));
    if (e.type === 'INSERT') { setFresh((f) => [...f, e.row.id]); setTimeout(() => setFresh((f) => f.filter((x) => x !== e.row.id)), 5000); }
  });
  const del = async (id: string) => { if (confirm('Hapus data ini?')) { await sb.from('survey_responses').delete().eq('id', id); setOpen(null); load(); } };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto flex items-center gap-3"><h1 className="font-extrabold uppercase text-xl">{rows.length} responden</h1><LiveBadge status={status} /></div>
        <button onClick={() => downloadCsv(toCsv(rows, qs), `kuesioner-${new Date().toISOString().slice(0, 10)}.csv`)} className="nb-btn nb-btn-sm !bg-lime-300"><Download size={16} strokeWidth={3} /> Export CSV / Excel</button>
      </div>
      <div className="nb-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black text-white text-left uppercase"><tr>{['Waktu', 'Durasi', ''].map((h) => <th key={h} className="px-3 py-2 font-extrabold">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-t-[3px] border-black transition-colors ${fresh.includes(r.id) ? 'bg-lime-200' : ''}`}>
                <td className="px-3 py-2 whitespace-nowrap font-semibold">{new Date(r.created_at).toLocaleString('id-ID')}</td>
                <td className="px-3 py-2 font-bold">{r.duration_seconds} dtk</td>
                <td className="px-3 py-2 whitespace-nowrap text-right space-x-2">
                  <button onClick={() => setOpen(r)} className="nb-btn nb-btn-sm !bg-yellow-300"><Eye size={14} strokeWidth={3} /> Detail</button>
                  <button onClick={() => del(r.id)} className="nb-btn nb-btn-sm !bg-red-300" aria-label="Hapus"><Trash2 size={14} strokeWidth={3} /></button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={3} className="px-3 py-8 text-center font-bold">Belum ada jawaban</td></tr>}
          </tbody>
        </table>
      </div>
      {open && (
        <div className="fixed inset-0 bg-neutral-950/60 flex items-end md:items-center justify-center p-3 z-20" onClick={() => setOpen(null)}>
          <div className="nb-card p-5 w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center"><h2 className="font-extrabold uppercase">Detail jawaban</h2>
              <button onClick={() => setOpen(null)} className="nb-btn nb-btn-sm !bg-white" aria-label="Tutup"><X size={14} strokeWidth={3} /></button></div>
            <p className="nb-tag !bg-yellow-300">{open.duration_seconds} dtk</p>
            {qs.map((q, i) => (
              <div key={q.id} className="border-t-[3px] border-black pt-2"><p className="text-xs font-bold">Q{i + 1}. {q.title}</p><p className="font-extrabold break-words">{renderAnswer(q, open.answers?.[q.id])}</p></div>
            ))}
            <button onClick={() => del(open.id)} className="nb-btn nb-btn-sm !bg-red-300"><Trash2 size={14} strokeWidth={3} /> Hapus data ini</button>
          </div>
        </div>
      )}
    </div>
  );
}
