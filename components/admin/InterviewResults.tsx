'use client';
import { useEffect, useState } from 'react';
import { Download, Eye, Trash2 } from 'lucide-react';
import type { Question, ResponseRow } from '@/lib/types';
import { buildCsv, downloadCsv, type CsvDelimiter } from '@/lib/export';
import LiveBadge from './LiveBadge';
import ResponseDetail from './ResponseDetail';

export type InterviewRow = { id: string; category_id: string; interviewee: string; notes: string; answers: Record<string, any>; duration_seconds: number; created_at: string };

export default function InterviewResults({ categoryName, questions, rows, fresh, status, onDelete }: {
  categoryName: string; questions: Question[]; rows: InterviewRow[]; fresh: string[]; status: string; onDelete: (id: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [sep, setSep] = useState<CsvDelimiter>(';'); const [note, setNote] = useState('');
  const idx = openId ? rows.findIndex((r) => r.id === openId) : -1;
  useEffect(() => { if (openId && idx === -1) setOpenId(null); }, [openId, idx]); // data yang dibuka sudah terhapus

  const exportCsv = () => {
    const mapped = rows.map((r) => ({ ...r, session_id: r.id })) as unknown as ResponseRow[];
    const res = buildCsv(mapped, questions, sep, {
      idLabel: null,
      extra: [
        { h: 'Jenis wawancara', get: () => categoryName },
        { h: 'Narasumber', get: (r) => (r as any).interviewee ?? '' },
        { h: 'Catatan', get: (r) => (r as any).notes ?? '' },
      ],
    });
    const d = new Date(), p = (n: number) => String(n).padStart(2, '0');
    const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'wawancara';
    downloadCsv(res.csv, `wawancara-${slug}-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.csv`);
    setNote(`Diekspor: ${res.responses} wawancara, ${res.questions} pertanyaan, ${res.columns} kolom`);
    setTimeout(() => setNote(''), 6000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto flex items-center gap-3"><h2 className="font-extrabold uppercase">{rows.length} hasil wawancara</h2><LiveBadge status={status} /></div>
        <select value={sep} onChange={(e) => setSep(e.target.value as CsvDelimiter)} aria-label="Pemisah kolom CSV" className="nb-input !py-1.5 text-xs">
          <option value=";">Pemisah titik koma (Excel Indonesia)</option>
          <option value=",">Pemisah koma (Google Sheets)</option>
        </select>
        <button onClick={exportCsv} disabled={!rows.length} className="nb-btn nb-btn-sm !bg-lime-300"><Download size={16} strokeWidth={3} /> Export CSV / Excel</button>
        {note && <span role="status" className="nb-tag !bg-lime-300 w-full sm:w-auto">{note}</span>}
      </div>
      <div className="nb-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black text-white text-left uppercase"><tr>{['Tanggal', 'Waktu', 'Narasumber', 'Durasi', ''].map((h) => <th key={h} className="px-3 py-2 font-extrabold">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => {
              const dt = new Date(r.created_at);
              const tanggal = dt.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
              const waktu = dt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
              return (
                <tr key={r.id} className={`border-t-[3px] border-black transition-colors ${fresh.includes(r.id) ? 'bg-lime-200' : ''}`}>
                  <td className="px-3 py-2 whitespace-nowrap font-semibold">{tanggal}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-semibold">{waktu}</td>
                  <td className="px-3 py-2 font-semibold">{r.interviewee || <span className="opacity-60 italic">Tanpa nama</span>}</td>
                  <td className="px-3 py-2 whitespace-nowrap font-bold">{r.duration_seconds < 60 ? `${r.duration_seconds} dtk` : `${Math.floor(r.duration_seconds / 60)} mnt ${r.duration_seconds % 60} dtk`}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-right space-x-2">
                    <button onClick={() => setOpenId(r.id)} className="nb-btn nb-btn-sm !bg-yellow-300"><Eye size={14} strokeWidth={3} /> Detail</button>
                    <button onClick={() => onDelete(r.id)} className="nb-btn nb-btn-sm !bg-red-300" aria-label="Hapus"><Trash2 size={14} strokeWidth={3} /></button>
                  </td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={5} className="px-3 py-8 text-center font-bold">Belum ada hasil wawancara untuk jenis ini</td></tr>}
          </tbody>
        </table>
      </div>
      {idx >= 0 && (
        <ResponseDetail rows={rows} index={idx} questions={questions} title="Detail Wawancara" onClose={() => setOpenId(null)}
          onNavigate={(i) => setOpenId(rows[i]?.id ?? null)} onDelete={onDelete}
          renderExtra={(r) => {
            const x = r as unknown as InterviewRow;
            return (
              <div className="space-y-2">
                <span className="nb-tag !bg-pink-300">Narasumber: {x.interviewee || 'Tanpa nama'}</span>
                {x.notes && <blockquote className="border-l-[6px] border-black pl-3 whitespace-pre-wrap break-words text-sm font-semibold">{x.notes}</blockquote>}
              </div>
            );
          }} />
      )}
    </div>
  );
}
