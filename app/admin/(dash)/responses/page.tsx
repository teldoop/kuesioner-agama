'use client';
import { useEffect, useState } from 'react';
import { Download, Eye, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { downloadCsv, toCsv } from '@/lib/export';
import { TYPE_LABEL, type Question, type ResponseRow } from '@/lib/types';
import LiveBadge from '@/components/admin/LiveBadge';
import ResponseDetail from '@/components/admin/ResponseDetail';
import { applyLive, useResponsesLive } from '@/lib/useResponsesLive';

export default function Responses() {
  const sb = createClient();
  const [rows, setRows] = useState<ResponseRow[]>([]); const [qs, setQs] = useState<Question[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
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

  const idx = openId ? rows.findIndex((r) => r.id === openId) : -1;
  useEffect(() => { if (openId && idx === -1 && rows.length) setOpenId(null); }, [openId, idx, rows.length]); // data yang dibuka sudah terhapus

  const del = async (id: string) => {
    if (!confirm('Hapus jawaban ini? Tindakan ini tidak bisa dibatalkan.')) return;
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
        <button onClick={() => downloadCsv(toCsv(rows, qs), `kuesioner-${new Date().toISOString().slice(0, 10)}.csv`)} className="nb-btn nb-btn-sm !bg-lime-300"><Download size={16} strokeWidth={3} /> Export CSV / Excel</button>
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
    </div>
  );
}