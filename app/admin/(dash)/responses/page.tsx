'use client';
import { useEffect, useState } from 'react';
import { Download, Eye, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { buildCsv, downloadCsv, type CsvDelimiter } from '@/lib/export';
import { TYPE_LABEL, type Question, type ResponseRow } from '@/lib/types';
import LiveBadge from '@/components/admin/LiveBadge';
import ResponseDetail from '@/components/admin/ResponseDetail';
import { useConfirm } from '@/components/shared/ConfirmDialog';
import { applyLive, useResponsesLive } from '@/lib/useResponsesLive';

export default function Responses() {
  const sb = createClient();
  const { confirm: ask, dialog } = useConfirm();
  const [rows, setRows] = useState<ResponseRow[]>([]); const [qs, setQs] = useState<Question[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string[]>([]);
  const [sep, setSep] = useState<CsvDelimiter>(';');
  const [note, setNote] = useState('');
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

  const idx = openId ? rows.findIndex((r) => r.id === openId) : -1;
  useEffect(() => { if (openId && idx === -1 && rows.length) setOpenId(null); }, [openId, idx, rows.length]); // data yang dibuka sudah terhapus

  const exportCsv = () => {
    const r = buildCsv(rows, qs, sep);
    const d = new Date(), p = (n: number) => String(n).padStart(2, '0');
    downloadCsv(r.csv, `kuesioner-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.csv`);
    setNote(`Diekspor: ${r.responses} responden, ${r.questions} pertanyaan, ${r.columns} kolom`);
    setTimeout(() => setNote(''), 6000);
  };

  const del = async (id: string) => {
    const ok = await ask({
      title: 'Hapus jawaban ini?',
      message: 'Jawaban responden ini akan dihapus permanen dan tidak bisa dikembalikan.',
      confirmLabel: 'Hapus', danger: true,
    });
    if (!ok) return;
    const i = rows.findIndex((r) => r.id === id);
    const next = rows[i + 1]?.id ?? rows[i - 1]?.id ?? null; // setelah dihapus, lanjut ke jawaban di sebelahnya
    const { error } = await sb.from('survey_responses').delete().eq('id', id);
    if (error) return alert(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
    if (openId === id) setOpenId(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto flex items-center gap-3"><h1 className="font-extrabold uppercase text-xl">{rows.length} responden</h1><LiveBadge status={status} /></div>
        <select value={sep} onChange={(e) => setSep(e.target.value as CsvDelimiter)} aria-label="Pemisah kolom CSV" className="nb-input !py-1.5 text-xs">
          <option value=";">Pemisah titik koma (Excel Indonesia)</option>
          <option value=",">Pemisah koma (Google Sheets)</option>
        </select>
        <button onClick={exportCsv} disabled={!rows.length} title={rows.length ? undefined : 'Belum ada jawaban'} className="nb-btn nb-btn-sm !bg-lime-300"><Download size={16} strokeWidth={3} /> Export CSV / Excel</button>
        {note && <span role="status" className="nb-tag !bg-lime-300 w-full sm:w-auto">{note}</span>}
      </div>
      <div className="nb-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black text-white text-left uppercase">
            <tr>
              {['Tanggal', 'Waktu', 'Durasi', ''].map((h) => (
                <th key={h} className="px-3 py-2 font-extrabold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const dt = new Date(r.created_at);
              const tanggal = dt.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });
              const waktu = dt.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }).replace('.', ':');

              return (
                <tr key={r.id} className={`border-t-[3px] border-black transition-colors ${fresh.includes(r.id) ? 'bg-lime-200' : ''}`}>
                  <td className="px-3 py-2 whitespace-nowrap font-semibold">{tanggal}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-semibold">{waktu}</td>
                  <td className="px-3 py-2 font-bold">{r.duration_seconds} dtk</td>
                  <td className="px-3 py-2 whitespace-nowrap text-right space-x-2">
                    <button onClick={() => setOpenId(r.id)} className="nb-btn nb-btn-sm !bg-yellow-300"><Eye size={14} strokeWidth={3} /> Detail</button>
                    <button onClick={() => del(r.id)} className="nb-btn nb-btn-sm !bg-red-300" aria-label="Hapus"><Trash2 size={14} strokeWidth={3} /></button>
                  </td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={4} className="px-3 py-8 text-center font-bold">Belum ada jawaban</td></tr>}
          </tbody>
        </table>
      </div>
      {idx >= 0 && <ResponseDetail rows={rows} index={idx} questions={qs} onClose={() => setOpenId(null)} onNavigate={(i) => setOpenId(rows[i]?.id ?? null)} onDelete={del} />}
      {dialog}
    </div>
  );
}