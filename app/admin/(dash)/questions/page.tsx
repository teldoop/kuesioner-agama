'use client';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Save, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cards as getCards, emptyFor, normOpts, sliderItems } from '@/lib/qutil';
import { TYPE_LABEL, type QType, type Question, type Settings } from '@/lib/types';
import QuestionForm, { Field, Toggle, inp } from '@/components/admin/QuestionForm';
import ResultTypesEditor from '@/components/admin/ResultTypesEditor';

const BLANK: Settings = { id: 1, title: '', description: '', estimated_minutes: 2, is_open: true, result_types: [] };
const clone = (x: any) => JSON.parse(JSON.stringify(x ?? null));

export default function Questions() {
  const sb = createClient();
  const [qs, setQs] = useState<Question[]>([]); const [st, setSt] = useState<Settings | null>(null); const [msg, setMsg] = useState('');
  const load = async () => {
    const [q, s] = await Promise.all([sb.from('survey_questions').select('*').order('order_index'), sb.from('survey_settings').select('*').eq('id', 1).maybeSingle()]);
    setQs((q.data as any) ?? []);
    setSt(s.data ? { ...BLANK, ...(s.data as any), result_types: Array.isArray((s.data as any).result_types) ? (s.data as any).result_types : [] } : BLANK);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const saveSettings = async () => {
    if (!st!.title.trim()) return flash('Isi judul kuesioner terlebih dahulu');
    const { error } = await sb.from('survey_settings').upsert({
      id: 1, title: st!.title.trim(), description: st!.description.trim(), estimated_minutes: st!.estimated_minutes, is_open: st!.is_open,
      result_types: (st!.result_types ?? []).filter((t) => t.name.trim()),
    });
    flash(error ? error.message : 'Pengaturan tersimpan');
  };
  const move = async (i: number, d: -1 | 1) => {
    const a = qs[i], b = qs[i + d]; if (!b) return;
    // order_index bisa sama jika data lama; pakai posisi daftar agar urutan pasti
    await Promise.all([sb.from('survey_questions').update({ order_index: i + d + 1 }).eq('id', a.id), sb.from('survey_questions').update({ order_index: i + 1 }).eq('id', b.id)]);
    load();
  };
  const toggle = async (q: Question) => { await sb.from('survey_questions').update({ is_active: !q.is_active }).eq('id', q.id); load(); };
  const remove = async (q: Question) => { if (confirm('Hapus pertanyaan ini? Jawaban yang sudah masuk untuk pertanyaan ini tidak akan tampil lagi.')) { await sb.from('survey_questions').delete().eq('id', q.id); load(); } };
  const add = async () => {
    const t = emptyFor('multiple_choice');
    const { error } = await sb.from('survey_questions').insert({ order_index: Math.max(0, ...qs.map((q) => q.order_index)) + 1, question_type: 'multiple_choice', title: 'Pertanyaan baru', subtitle: '', options: t.options, config: t.config, is_active: false });
    if (error) flash(error.message);
    load();
  };
  if (!st) return <p className="font-bold">Memuat...</p>;
  return (
    <div className="space-y-6">
      {msg && <div role="status" className="fixed top-20 right-3 left-3 sm:left-auto bg-black text-white font-bold border-[3px] border-black shadow-[4px_4px_0_0_#a3e635] px-4 py-2 z-30">{msg}</div>}
      <section className="nb-card p-4 space-y-3 bg-yellow-100">
        <h2 className="font-extrabold uppercase">Pengaturan Umum</h2>
        <Field label="Judul kuesioner" hint="Tampil di halaman pembuka, judul tab, dan kartu saat tautan dibagikan."><input className={inp} value={st.title} onChange={(e) => setSt({ ...st, title: e.target.value })} /></Field>
        <Field label="Deskripsi halaman pembuka" hint="Dipakai juga sebagai deskripsi kartu saat tautan dibagikan (disarankan maksimal 160 karakter)."><textarea className={inp} rows={3} value={st.description} onChange={(e) => setSt({ ...st, description: e.target.value })} /></Field>
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-bold">Estimasi (menit) <input type="number" min={1} className="nb-input !py-1 w-20 ml-1" value={st.estimated_minutes} onChange={(e) => setSt({ ...st, estimated_minutes: +e.target.value || 1 })} /></label>
          <label className="text-sm font-bold flex items-center gap-2"><input type="checkbox" className="w-5 h-5 accent-black" checked={st.is_open} onChange={(e) => setSt({ ...st, is_open: e.target.checked })} /> Kuesioner {st.is_open ? 'Buka' : 'Tutup'}</label>
          <button onClick={saveSettings} className="nb-btn nb-btn-sm !bg-lime-300 ml-auto"><Save size={16} strokeWidth={3} /> Simpan</button>
        </div>
      </section>

      <details className="nb-card">
        <summary className="p-4 cursor-pointer font-extrabold uppercase">Tipe Hasil Akhir ({(st.result_types ?? []).length})</summary>
        <div className="p-4 pt-0 space-y-4 border-t-[3px] border-black">
          <div className="pt-4"><ResultTypesEditor types={st.result_types ?? []} onChange={(t) => setSt({ ...st, result_types: t })} /></div>
          <button onClick={saveSettings} className="nb-btn nb-btn-sm !bg-lime-300"><Save size={16} strokeWidth={3} /> Simpan Tipe Hasil</button>
        </div>
      </details>

      <div className="flex items-center"><h2 className="font-extrabold uppercase mr-auto">Pertanyaan ({qs.length})</h2>
        <button onClick={add} className="nb-btn nb-btn-sm"><Plus size={16} strokeWidth={3} /> Tambah Pertanyaan</button></div>
      {qs.length === 0 && <p className="nb-card p-6 text-center font-bold">Belum ada pertanyaan untuk kuesioner ini</p>}
      <div className="space-y-4">
        {qs.map((q, i) => <Editor key={q.id + q.title} q={q} i={i} last={i === qs.length - 1} move={move} toggle={toggle} remove={remove} reload={load} flash={flash} />)}
      </div>
    </div>
  );
}

function Editor(props: any) {
  const { q, i, remove } = props;
  if (!TYPE_LABEL[q.question_type as QType])
    return (
      <div className="nb-card p-4 flex items-center gap-3">
        <span className="nb-tag !bg-red-300">#{i + 1}</span>
        <p className="flex-1 text-sm font-bold">{q.title} (jenis pertanyaan lama, tidak didukung lagi dan tidak tampil ke responden)</p>
        <button onClick={() => remove(q)} className="nb-btn nb-btn-sm !bg-red-300"><Trash2 size={14} strokeWidth={3} /> Hapus</button>
      </div>
    );
  return <KnownEditor {...props} />;
}

const PULSE_TYPES: QType[] = ['multiple_choice', 'branching_choice', 'rating'];

function KnownEditor({ q, i, last, move, toggle, remove, reload, flash }: any) {
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
    const { error } = await sb.from('survey_questions').update({ title, subtitle: d.subtitle.trim(), question_type: d.type, options, config }).eq('id', q.id);
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
          <Toggle checked={d.config.required !== false} onChange={(v) => setD({ ...d, config: { ...d.config, required: v } })} label="Wajib dijawab" hint="Jika dimatikan, responden boleh melewati pertanyaan ini." />
          {PULSE_TYPES.includes(d.type) && (
            <Toggle checked={!!d.config.show_pulse} onChange={(v) => setD({ ...d, config: { ...d.config, show_pulse: v } })} label="Tampilkan hasil komunitas di akhir kuesioner" hint="Responden melihat persentase jawaban semua orang untuk pertanyaan ini." />
          )}
        </div>
        <button onClick={save} className="nb-btn nb-btn-sm !bg-lime-300"><Save size={16} strokeWidth={3} /> Simpan Pertanyaan</button>
      </div>
    </details>
  );
}
