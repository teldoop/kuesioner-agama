'use client';
import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';

const COLORS = ['bg-lime-400', 'bg-yellow-300', 'bg-pink-300', 'bg-sky-300'];
export default function Pulse() {
  const [s, setS] = useState<any>(null);
  useEffect(() => {
    const load = () => fetch('/api/pulse').then((r) => r.json()).then(setS).catch(() => {});
    load(); const t = setInterval(load, 10000); return () => clearInterval(t);
  }, []);
  if (!s || s.error || !s.questions?.length) return null; // hanya tampil jika admin mengaktifkannya pada pertanyaan
  return (
    <div className="nb-card p-5 space-y-5 text-left">
      <p className="font-extrabold uppercase flex items-center gap-2"><Radio size={20} strokeWidth={3} /> Hasil Responden Lain
        <span className="nb-tag !bg-lime-300 ml-auto">{s.total} responden</span></p>
      {s.questions.map((q: any, qi: number) => {
        const entries = Object.entries(q.counts as Record<string, number>);
        entries.sort((a, b) => (q.type === 'rating' ? Number(a[0]) - Number(b[0]) : b[1] - a[1]));
        const sum = entries.reduce((x, [, n]) => x + Number(n), 0) || 1;
        return (
          <div key={q.id} className="space-y-2">
            <p className="text-sm font-extrabold">{q.title}</p>
            {entries.map(([label, n]) => {
              const p = Math.round((100 * Number(n)) / sum);
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs font-bold mb-1"><span>{label}</span><span>{p}%</span></div>
                  <div className="h-4 border-[3px] border-black bg-white"><div className={`h-full border-r-[3px] border-black transition-all duration-700 ${COLORS[qi % COLORS.length]}`} style={{ width: `${p}%` }} /></div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
