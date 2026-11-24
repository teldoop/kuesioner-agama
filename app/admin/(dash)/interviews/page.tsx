'use client';
import { useEffect, useMemo, useState } from 'react';
import { Mic, Play, Plus, Save, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { emptyFor } from '@/lib/qutil';
import { TYPE_LABEL, type Question } from '@/lib/types';
import { applyLive, useTableLive } from '@/lib/useResponsesLive';
import { Field, inp } from '@/components/admin/QuestionForm';
import QuestionEditor from '@/components/admin/QuestionEditor';
import InterviewRunner from '@/components/admin/InterviewRunner';
import InterviewResults, { type InterviewRow } from '@/components/admin/InterviewResults';
import LiveBadge from '@/components/admin/LiveBadge';
import { useConfirm } from '@/components/shared/ConfirmDialog';

type Cat = { id: string; name: string; description: string; order_index: number };
type IQ = Question & { category_id: string };

export default function Interviews() {
  const sb = createClient();
  const { confirm: ask, dialog } = useConfirm();
  const [cats, setCats] = useState<Cat[]>([]); const [qs, setQs] = useState<IQ[]>([]); const [rows, setRows] = useState<InterviewRow[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [tab, setTab] = useState<'questions' | 'results'>('questions');
  const [running, setRunning] = useState(false); const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(''); const [loadErr, setLoadErr] = useState('');
  const [newName, setNewName] = useState(''); const [draft, setDraft] = useState({ name: '', description: '' });
  const [fresh, setFresh] = useState<string[]>([]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };
  const load = async () => {
    const [c, q, r] = await Promise.all([
      sb.from('interview_categories').select('*').order('order_index'),
      sb.from('interview_questions').select('*').order('order_index'),
      sb.from('interview_responses').select('*').order('created_at', { ascending: false }).limit(5000),
    ]);
    const err = c.error || q.error || r.error;
    setLoadErr(err ? `${err.message}. Pastikan supabase/006_interviews.sql sudah dijalankan.` : '');
    const list = ((c.data as any) ?? []) as Cat[];
    setCats(list); setQs(((q.data as any) ?? []) as IQ[]); setRows(((r.data as any) ?? []) as InterviewRow[]);
    setSel((cur) => (cur && list.some((x) => x.id === cur) ? cur : list[0]?.id ?? null));
    setLoading(false);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  // Hasil wawancara diperbarui langsung saat ada yang masuk, berubah, atau dihapus
  const status = useTableLive<InterviewRow>('interview_responses', (e) => {
    setRows((r) => applyLive(r, e));
    if (e.type === 'INSERT') { setFresh((f) => [...f, e.row.id]); setTimeout(() => setFresh((f) => f.filter((x) => x !== e.row.id)), 5000); }
  });

  const cat = cats.find((c) => c.id === sel) ?? null;
  useEffect(() => { setDraft({ name: cat?.name ?? '', description: cat?.description ?? '' }); }, [cat?.id, cat?.name, cat?.description]); // eslint-disable-line
  const catQs = useMemo(() => qs.filter((q) => q.category_id === sel), [qs, sel]);
  const activeQs = catQs.filter((q) => q.is_active && TYPE_LABEL[q.question_type]);
  const catRows = useMemo(() => rows.filter((r) => r.category_id === sel), [rows, sel]);
  const knownQs = catQs.filter((q) => TYPE_LABEL[q.question_type]);

  // ---- jenis wawancara
  const addCat = async () => {
    const name = newName.trim(); if (!name) return flash('Isi nama jenis wawancara terlebih dahulu');
    const { data, error } = await sb.from('interview_categories').insert({ name, description: '', order_index: Math.max(0, ...cats.map((c) => c.order_index)) + 1 }).select().single();
    if (error) return flash(error.message);
    setNewName(''); setSel((data as any).id); await load();
  };
  const saveCat = async () => {
    if (!cat) return; if (!draft.name.trim()) return flash('Nama jenis wawancara tidak boleh kosong');
    const { error } = await sb.from('interview_categories').update({ name: draft.name.trim(), description: draft.description.trim() }).eq('id', cat.id);
    flash(error ? error.message : 'Jenis wawancara tersimpan'); load();
  };
  const removeCat = async () => {
    if (!cat) return;
    const ok = await ask({
      title: 'Hapus jenis wawancara ini?',
      message: <>Jenis <b>&ldquo;{cat.name}&rdquo;</b> akan dihapus permanen beserta {catQs.length} pertanyaan dan {catRows.length} hasil wawancaranya.</>,
      confirmLabel: 'Hapus', danger: true,
    });
    if (!ok) return;
    const { error } = await sb.from('interview_categories').delete().eq('id', cat.id);
    if (error) flash(error.message);
    load();
  };

  // ---- pertanyaan wawancara (sama seperti pertanyaan kuesioner)
  const addQ = async () => {
    if (!cat) return;
    const t = emptyFor('multiple_choice');
    const { error } = await sb.from('interview_questions').insert({
      category_id: cat.id, order_index: Math.max(0, ...catQs.map((q) => q.order_index)) + 1, question_type: 'multiple_choice',
      title: 'Pertanyaan baru', subtitle: '', options: t.options, config: { ...t.config, required: false }, is_active: false,
    });
    if (error) flash(error.message);
    load();
  };
  const moveQ = async (i: number, d: -1 | 1) => {
    const a = catQs[i], b = catQs[i + d]; if (!b) return;
    await Promise.all([sb.from('interview_questions').update({ order_index: i + d + 1 }).eq('id', a.id), sb.from('interview_questions').update({ order_index: i + 1 }).eq('id', b.id)]);
    load();
  };
  const toggleQ = async (q: IQ) => { await sb.from('interview_questions').update({ is_active: !q.is_active }).eq('id', q.id); load(); };
  const removeQ = async (q: IQ) => {
    const ok = await ask({
      title: 'Hapus pertanyaan ini?',
      message: <>Pertanyaan <b>&ldquo;{q.title}&rdquo;</b> akan dihapus permanen. Jawaban wawancara yang sudah tersimpan untuk pertanyaan ini tidak akan tampil lagi.</>,
      confirmLabel: 'Hapus', danger: true,
    });
    if (!ok) return;
    const { error } = await sb.from('interview_questions').delete().eq('id', q.id);
    if (error) flash(error.message);
    load();
  };

  // ---- hasil wawancara
  const saveInterview = async (p: { interviewee: string; notes: string; answers: Record<string, any>; duration_seconds: number }): Promise<string | null> => {
    if (!cat) return 'Pilih jenis wawancara terlebih dahulu';
    const { error } = await sb.from('interview_responses').insert({ category_id: cat.id, ...p });
    if (error) return error.message;
    setRunning(false); setTab('results'); flash('Wawancara tersimpan'); return null;
  };
  const delRow = async (id: string) => {
    const ok = await ask({ title: 'Hapus hasil wawancara ini?', message: 'Hasil wawancara ini akan dihapus permanen dan tidak bisa dikembalikan.', confirmLabel: 'Hapus', danger: true });
    if (!ok) return;
    const { error } = await sb.from('interview_responses').delete().eq('id', id);
    if (error) return flash(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
  };

  if (loading) return <p className="font-bold">Memuat...</p>;
  if (running && cat)
    return (
      <>
        <InterviewRunner categoryName={cat.name} questions={activeQs} onSave={saveInterview} onCancel={() => setRunning(false)} />
        {dialog}
      </>
    );

  return (
    <div className="space-y-6">
      {msg && <div role="status" className="fixed top-20 right-3 left-3 sm:left-auto bg-black text-white font-bold border-[3px] border-black shadow-[4px_4px_0_0_#a3e635] px-4 py-2 z-30">{msg}</div>}
      <div className="flex items-center gap-3"><h1 className="text-2xl font-extrabold uppercase mr-auto flex items-center gap-2"><Mic size={24} strokeWidth={3} /> Wawancara</h1><LiveBadge status={status} /></div>
      {loadErr && <p role="alert" className="nb-card p-4 font-bold bg-red-300">{loadErr}</p>}

      <section className="nb-card p-4 space-y-4 bg-yellow-100">
        <h2 className="font-extrabold uppercase">Jenis Wawancara</h2>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button key={c.id} onClick={() => { setSel(c.id); }} className={`nb-btn nb-btn-sm ${c.id === sel ? '!bg-black !text-white' : '!bg-white'}`}>
              {c.name} <span className="opacity-70">({rows.filter((r) => r.category_id === c.id).length})</span>
            </button>
          ))}
          {!cats.length && <p className="text-sm font-bold">Belum ada jenis wawancara. Tambahkan yang pertama di bawah.</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <input className={`${inp} flex-1 min-w-[10rem]`} placeholder="Nama jenis baru, mis. Mahasiswa, Pedagang UMKM, Tokoh Agama" value={newName}
            onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCat()} />
          <button onClick={addCat} className="nb-btn nb-btn-sm"><Plus size={16} strokeWidth={3} /> Tambah Jenis</button>
        </div>
      </section>

      {cat && (
        <>
          <section className="nb-card p-4 space-y-3">
            <Field label="Nama jenis wawancara"><input className={inp} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
            <Field label="Keterangan (opsional)" hint="Catatan untuk pewawancara, mis. sasaran narasumber."><input className={inp} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
            <div className="flex flex-wrap gap-2">
              <button onClick={saveCat} className="nb-btn nb-btn-sm !bg-lime-300"><Save size={16} strokeWidth={3} /> Simpan</button>
              <button onClick={removeCat} className="nb-btn nb-btn-sm !bg-red-300 ml-auto"><Trash2 size={16} strokeWidth={3} /> Hapus Jenis</button>
            </div>
          </section>

          <section className="nb-card p-4 flex flex-wrap items-center gap-3 bg-lime-200">
            <div className="mr-auto">
              <p className="font-extrabold uppercase">Siap mewawancarai?</p>
              <p className="text-sm font-semibold">{activeQs.length} pertanyaan aktif untuk jenis &ldquo;{cat.name}&rdquo;{cat.description ? ` · ${cat.description}` : ''}</p>
            </div>
            <button onClick={() => setRunning(true)} disabled={!activeQs.length} title={activeQs.length ? undefined : 'Aktifkan minimal satu pertanyaan terlebih dahulu'} className="nb-btn !bg-yellow-300"><Play size={18} strokeWidth={3} /> Mulai Wawancara</button>
          </section>

          <div className="flex gap-2">
            <button onClick={() => setTab('questions')} className={`nb-btn nb-btn-sm ${tab === 'questions' ? '!bg-black !text-white' : '!bg-white'}`}>Pertanyaan ({catQs.length})</button>
            <button onClick={() => setTab('results')} className={`nb-btn nb-btn-sm ${tab === 'results' ? '!bg-black !text-white' : '!bg-white'}`}>Hasil Wawancara ({catRows.length})</button>
          </div>

          {tab === 'questions' ? (
            <div className="space-y-4">
              <div className="flex items-center"><h2 className="font-extrabold uppercase mr-auto">Pertanyaan {cat.name}</h2>
                <button onClick={addQ} className="nb-btn nb-btn-sm"><Plus size={16} strokeWidth={3} /> Tambah Pertanyaan</button></div>
              {catQs.length === 0 && <p className="nb-card p-6 text-center font-bold">Belum ada pertanyaan untuk jenis wawancara ini</p>}
              {catQs.map((q, i) => (
                <QuestionEditor key={q.id + q.title} table="interview_questions" q={q} i={i} last={i === catQs.length - 1}
                  move={moveQ} toggle={toggleQ} remove={removeQ} reload={load} flash={flash} />
              ))}
            </div>
          ) : (
            <InterviewResults categoryName={cat.name} questions={knownQs} rows={catRows} fresh={fresh} status={status} onDelete={delRow} />
          )}
        </>
      )}
      {dialog}
    </div>
  );
}
