'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { analyze } from '@/lib/analytics';
import { applyLive, useResponsesLive } from '@/lib/useResponsesLive';
import { TYPE_LABEL, type Question, type ResponseRow, type Settings } from '@/lib/types';
import BarBox from '@/components/admin/BarBox';
import PieBox from '@/components/admin/PieBox';
import LiveBadge from '@/components/admin/LiveBadge';
import SharePanel from '@/components/admin/SharePanel';

const COLORS = ['#a3e635', '#facc15', '#f9a8d4', '#7dd3fc'];
const Kpi = ({ label, value, bg }: { label: string; value: string | number; bg: string }) => (
  <div className={`nb-card p-4 ${bg}`}><p className="text-xs font-extrabold uppercase">{label}</p><p className="text-3xl font-extrabold mt-1">{value}</p></div>
);

export default function Dashboard() {
  const [rows, setRows] = useState<ResponseRow[]>([]); const [qs, setQs] = useState<Question[]>([]);
  const [st, setSt] = useState<Settings | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => {
    const sb = createClient();
    Promise.all([
      sb.from('survey_responses').select('*').order('created_at', { ascending: false }).limit(5000),
      sb.from('survey_questions').select('*').order('order_index'),
      sb.from('survey_settings').select('*').eq('id', 1).maybeSingle(),
    ]).then(([r, q, s]) => { setRows((r.data as any) ?? []); setQs((q.data as any) ?? []); setSt((s.data as any) ?? null); setLoading(false); });
  }, []);
  const status = useResponsesLive((e) => setRows((r) => applyLive(r, e))); // KPI dan grafik ikut berubah saat jawaban masuk
  const a = useMemo(() => analyze(rows, qs.filter((q) => TYPE_LABEL[q.question_type])), [rows, qs]);
  if (loading) return <p className="font-bold">Memuat data...</p>;
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><h1 className="text-2xl font-extrabold uppercase mr-auto">Dasbor</h1><LiveBadge status={status} /></div>
      <SharePanel title={st?.title ?? ''} description={st?.description ?? ''} />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Kpi bg="bg-lime-300" label="Total responden" value={a.total} />
        <Kpi bg="bg-yellow-300" label="Rata-rata durasi" value={`${a.avgDur} dtk`} />
        <Kpi bg="bg-pink-300" label="Responden hari ini" value={a.today} />
      </div>
      {a.stats.length === 0 && (
        <div className="nb-card p-6 text-center space-y-3">
          <p className="font-extrabold uppercase">Belum ada pertanyaan untuk kuesioner ini</p>
          <Link href="/admin/questions" className="nb-btn nb-btn-sm">Buat pertanyaan</Link>
        </div>
      )}
      {a.stats.map((s, i) => (
        <section key={s.q.id} className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="nb-tag !bg-yellow-300">Q{i + 1}</span>
            <h3 className="font-extrabold">{s.q.title}</h3>
            <span className="nb-tag !bg-white dark:text-black">{TYPE_LABEL[s.q.question_type]}</span>
            {!s.q.is_active && <span className="nb-tag !bg-red-300">Nonaktif</span>}
            <span className="text-xs font-bold ml-auto">{s.n} jawaban</span>
          </div>
          {s.note && <p className="text-xs font-semibold">{s.note}</p>}
          {s.charts.length > 0 && (
            <div className="grid gap-4">
              {s.charts.map((c, k) => (
                <div key={k} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <BarBox title={c.title} data={c.data} unit={c.unit ?? ''} color={COLORS[i % COLORS.length]} />
                  <PieBox title={`Persentase`} data={c.data} unit={c.unit ?? ''} />
                </div>
              ))}
            </div>
          )}
          {s.texts.length > 0 && (
            <div className="nb-card p-4 space-y-2">
              <p className="text-xs font-extrabold uppercase">{s.textsTitle}</p>
              <ul className="space-y-1 max-h-64 overflow-y-auto">{s.texts.map((t, k) => <li key={k} className="border-t-2 border-black pt-1 text-sm font-semibold break-words">{t}</li>)}</ul>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
