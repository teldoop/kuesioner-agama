'use client';
import { Plus, Trash2 } from 'lucide-react';
import { RESULT_ICONS } from '@/lib/cardIcons';
import { uid } from '@/lib/qutil';
import type { ResultType } from '@/lib/types';
import { Field, inp } from './QuestionForm';

export default function ResultTypesEditor({ types, onChange }: { types: ResultType[]; onChange: (t: ResultType[]) => void }) {
  const set = (i: number, patch: Partial<ResultType>) => onChange(types.map((t, k) => (k === i ? { ...t, ...patch } : t)));
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold">
        Opsional. Jika diisi, responden melihat tipe hasil di akhir kuesioner. Skor responden (0-100) adalah rata-rata dari poin pilihan, slider, skala, atau kartu
        yang ditandai "ikut dihitung" pada pertanyaan. Responden mendapat tipe dengan skor minimal tertinggi yang terpenuhi, jadi sebaiknya ada satu tipe dengan skor minimal 0.
        Jika tidak ada tipe atau tidak ada pertanyaan yang dihitung, bagian ini tidak tampil.
      </p>
      {types.map((t, i) => {
        const Icon = (RESULT_ICONS[t.icon] ?? RESULT_ICONS.sprout).Icon;
        return (
          <div key={t.id} className="border-[3px] border-black bg-white p-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="nb-tag !bg-lime-300 shrink-0"><Icon size={16} strokeWidth={3} /></span>
              <input className={`${inp} flex-1 min-w-[8rem]`} placeholder="Nama tipe..." value={t.name} onChange={(e) => set(i, { name: e.target.value })} />
              <button type="button" onClick={() => onChange(types.filter((_, k) => k !== i))} className="nb-btn nb-btn-sm !bg-red-300 !px-2" aria-label="Hapus tipe"><Trash2 size={14} strokeWidth={3} /></button>
            </div>
            <textarea className={inp} rows={2} placeholder="Deskripsi singkat..." value={t.description} onChange={(e) => set(i, { description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ikon">
                <select className={inp} value={t.icon} onChange={(e) => set(i, { icon: e.target.value })}>
                  {Object.entries(RESULT_ICONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </Field>
              <Field label="Skor minimal (0-100)">
                <input type="number" min={0} max={100} className={inp} value={t.min_score} onChange={(e) => set(i, { min_score: Math.max(0, Math.min(100, +e.target.value || 0)) })} />
              </Field>
            </div>
          </div>
        );
      })}
      <button type="button" onClick={() => onChange([...types, { id: uid(), name: '', description: '', icon: 'star', min_score: 0 }])} className="nb-btn nb-btn-sm !bg-white"><Plus size={14} strokeWidth={3} /> Tambah tipe hasil</button>
    </div>
  );
}
