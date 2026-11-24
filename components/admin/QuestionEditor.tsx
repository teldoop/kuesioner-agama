'use client';
import { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Save, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cards as getCards, emptyFor, normOpts, sliderItems } from '@/lib/qutil';
import { TYPE_LABEL, type QType } from '@/lib/types';
import QuestionForm, { Field, Toggle, inp } from './QuestionForm';

const clone = (x: any) => JSON.parse(JSON.stringify(x ?? null));
const PULSE_TYPES: QType[] = ['multiple_choice', 'branching_choice', 'rating'];

export type EditorProps = {
  q: any; i: number; last: boolean;
  /** Tabel tujuan penyimpanan: survey_questions atau interview_questions */
  table: 'survey_questions' | 'interview_questions';
  /** Opsi "tampilkan hasil komunitas" hanya relevan untuk kuesioner */
  showPulse?: boolean;
  move: (i: number, d: -1 | 1) => void; toggle: (q: any) => void; remove: (q: any) => void;
  reload: () => void; flash: (m: string) => void;
};

export default function QuestionEditor(props: EditorProps) {
  const { q, i, remove } = props;
  if (!TYPE_LABEL[q.question_type as QType])
    return (
      <div className="nb-card p-4 flex items-center gap-3">
        <span className="nb-tag !bg-red-300">#{i + 1}</span>
        <p className="flex-1 text-sm font-bold">{q.title} (jenis pertanyaan lama, tidak didukung lagi dan tidak tampil)</p>
        <button onClick={() => remove(q)} className="nb-btn nb-btn-sm !bg-red-300"><Trash2 size={14} strokeWidth={3} /> Hapus</button>
      </div>
    );
  return <KnownEditor {...props} />;
}

function KnownEditor({ q, i, last, table, showPulse, move, toggle, remove, reload, flash }: EditorProps) {
  const sb = createClient();
  const [d, setD] = useState<{ title: string; subtitle: string; type: QType; options: any; config: any }>(() => {
    let options = clone(q.options), config = { ...clone(q.config ?? {}) };
    if (q.question_type === 'multiple_choice') { options = normOpts(options); if (config.multiple === undefined) config.multiple = (config.max ?? 1) > 1; }
    if (q.question_type === 'branching_choice') options = normOpts(options);
    if (q.question_type === 'slider') options = sliderItems(q);
    if (q.question_type === 'card_swipe') options = getCards(q);
    return { title: q.title, subtitle: q.subtitle ?? '', type: q.question_type, options, config };
  });
  const changeType = (t: QType) => {
    const e = emptyFor(t);
    setD({ ...d, type: t, options: e.options, config: { ...e.config, ...(d.config.required === false ? { required: false } : {}) } });
  };

  const save = async () => {
    const title = d.title.trim(); if (!title) return flash('Teks pertanyaan tidak boleh kosong');
    const clean = (l: string[]) => (l ?? []).map((s) => s.trim()).filter(Boolean);
    let options = d.options; const config = { ...d.config };
    if (d.type === 'multiple_choice' || d.type === 'branching_choice') {
      options = (options as any[]).map((o) => ({ ...o, label: o.label.trim() })).filter((o) => o.label);
      if (options.length < 2) return flash('Minimal 2 pilihan jawaban');
      if (d.type === 'branching_choice') {
        for (const o of options) {
          if (o.followup?.title?.trim()) {
            const f = { title: o.followup.title.trim(), options: clean(o.followup.options) };
            if (f.options.length < 2) return flash(`Pertanyaan lanjutan untuk "${o.label}" butuh minimal 2 jawaban`);
            o.followup = f;
          } else delete o.followup;
        }
      }
      options.forEach((o: any) => { if (typeof o.score !== 'number') delete o.score; });
      if (d.type === 'multiple_choice') config.other_label = (config.other_label ?? '').trim() || undefined;
    } else if (d.type === 'slider') {
      options = (options as any[]).map((s) => ({ ...s, label: s.label.trim() })).filter((s) => s.label);
      if (!options.length) return flash('Minimal 1 slider dengan judul');
      if (options.some((s: any) => !(s.min < s.max))) return flash('Nilai terendah slider harus lebih kecil dari nilai tertinggi');
    } else if (d.type === 'card_swipe') {
      options = (options as any[]).map((c) => ({ ...c, label: c.label.trim() })).filter((c) => c.label);
      if (!options.length) return flash('Minimal 1 kartu');
    } else options = null;
    const { error } = await sb.from(table).update({ title, subtitle: d.subtitle.trim(), question_type: d.type, options, config }).eq('id', q.id);
    flash(error ? error.message : 'Pertanyaan tersimpan'); reload();
  };

  return (
    <details className="nb-card">
      <summary className="p-4 cursor-pointer flex items-center gap-3">
        <span className="nb-tag !bg-yellow-300">#{i + 1}</span>
        <span className={`flex-1 text-sm font-bold ${q.is_active ? '' : 'opacity-50 line-through'}`}>{q.title}</span>
        <span className="text-xs font-bold hidden md:inline">{TYPE_LABEL[q.question_type as QType]}</span>
      </summary>
      <div className="p-4 pt-0 space-y-4 border-t-[3px] border-black">
        <div className="flex flex-wrap gap-2 pt-3">
          <button disabled={i === 0} onClick={() => move(i, -1)} className="nb-btn nb-btn-sm !bg-white"><ArrowUp size={14} strokeWidth={3} /> Naik</button>
          <button disabled={last} onClick={() => move(i, 1)} className="nb-btn nb-btn-sm !bg-white"><ArrowDown size={14} strokeWidth={3} /> Turun</button>
          <button onClick={() => toggle(q)} className="nb-btn nb-btn-sm !bg-sky-300">{q.is_active ? <><EyeOff size={14} strokeWidth={3} /> Nonaktifkan</> : <><Eye size={14} strokeWidth={3} /> Aktifkan</>}</button>
          <button onClick={() => remove(q)} className="nb-btn nb-btn-sm !bg-red-300 ml-auto"><Trash2 size={14} strokeWidth={3} /> Hapus</button>
        </div>
        <Field label="Teks pertanyaan"><input className={inp} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
        <Field label="Petunjuk singkat (opsional)" hint="Tampil di bawah pertanyaan."><input className={inp} value={d.subtitle} onChange={(e) => setD({ ...d, subtitle: e.target.value })} /></Field>
        <Field label="Jenis pertanyaan" hint="Mengganti jenis akan mengosongkan pilihan di bawah.">
          <select className={inp} value={d.type} onChange={(e) => changeType(e.target.value as QType)}>
            {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <div className="border-t-[3px] border-black border-dashed pt-4">
          <QuestionForm type={d.type} options={d.options} config={d.config} onChange={(options, config) => setD((x) => ({ ...x, options, config }))} />
        </div>
        <div className="border-t-[3px] border-black border-dashed pt-4 space-y-3">
          <Toggle checked={d.config.required !== false} onChange={(v) => setD({ ...d, config: { ...d.config, required: v } })} label="Wajib dijawab" hint={table === 'interview_questions' ? 'Jika dimatikan, wawancara boleh disimpan tanpa jawaban untuk pertanyaan ini.' : 'Jika dimatikan, responden boleh melewati pertanyaan ini.'} />
          {showPulse && PULSE_TYPES.includes(d.type) && (
            <Toggle checked={!!d.config.show_pulse} onChange={(v) => setD({ ...d, config: { ...d.config, show_pulse: v } })} label="Tampilkan hasil komunitas di akhir kuesioner" hint="Responden melihat persentase jawaban semua orang untuk pertanyaan ini." />
          )}
        </div>
        <button onClick={save} className="nb-btn nb-btn-sm !bg-lime-300"><Save size={16} strokeWidth={3} /> Simpan Pertanyaan</button>
      </div>
    </details>
  );
}
