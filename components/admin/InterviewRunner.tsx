'use client';
import { useEffect, useRef, useState } from 'react';
import { Save, Timer, X } from 'lucide-react';
import type { Question } from '@/lib/types';
import { isAnswered } from '@/lib/qutil';
import { QuestionRenderer } from '@/components/survey/QuestionRenderer';
import { useConfirm } from '@/components/shared/ConfirmDialog';
import { inp } from './QuestionForm';

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function InterviewRunner({ categoryName, questions, onSave, onCancel }: {
  categoryName: string; questions: Question[];
  onSave: (p: { interviewee: string; notes: string; answers: Record<string, any>; duration_seconds: number }) => Promise<string | null>;
  onCancel: () => void;
}) {
  const { confirm: ask, dialog } = useConfirm();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [who, setWho] = useState(''); const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const startedAt = useRef(Date.now()); const [elapsed, setElapsed] = useState(0);

  useEffect(() => { const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { // jangan sampai catatan hilang karena tab tertutup tanpa sengaja
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h);
  }, []);

  const save = async () => {
    const missing = questions.filter((q) => !isAnswered(q, answers[q.id]));
    if (missing.length) {
      setErr(`Lengkapi dulu pertanyaan: ${missing.map((q) => `#${questions.indexOf(q) + 1}`).join(', ')}`);
      document.getElementById(`iq-${missing[0].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setBusy(true); setErr('');
    const e = await onSave({ interviewee: who.trim(), notes: notes.trim(), answers, duration_seconds: Math.round((Date.now() - startedAt.current) / 1000) });
    setBusy(false);
    if (e) setErr(e);
  };
  const cancel = async () => {
    const dirty = Object.keys(answers).length > 0 || who.trim() || notes.trim();
    if (dirty && !(await ask({ title: 'Batalkan wawancara?', message: 'Jawaban yang sudah dicatat belum disimpan dan akan hilang.', confirmLabel: 'Batalkan', cancelLabel: 'Lanjutkan wawancara', danger: true }))) return;
    onCancel();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="nb-card p-4 space-y-3 bg-lime-200">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-extrabold uppercase mr-auto">Wawancara: {categoryName}</h1>
          <span className="nb-tag !bg-yellow-300"><Timer size={14} strokeWidth={3} /> {mmss(elapsed)}</span>
        </div>
        <label className="block text-xs font-extrabold uppercase">Narasumber (opsional)
          <input className={`${inp} mt-1.5 font-semibold normal-case`} placeholder="Nama, inisial, atau kode narasumber" value={who} onChange={(e) => setWho(e.target.value)} />
        </label>
      </div>

      {questions.length === 0 && <p className="nb-card p-6 text-center font-bold">Belum ada pertanyaan aktif untuk jenis wawancara ini</p>}
      {questions.map((q, i) => (
        <section key={q.id} id={`iq-${q.id}`} className="nb-card p-4 space-y-4 scroll-mt-24">
          <div className="flex flex-wrap items-center gap-2">
            <span className="nb-tag">Pertanyaan {i + 1} / {questions.length}</span>
            {q.config?.required === false && <span className="nb-tag !bg-white">Opsional</span>}
          </div>
          <h2 className="text-xl font-extrabold leading-snug">{q.title}</h2>
          {q.subtitle && <p className="text-sm font-semibold -mt-2 bg-yellow-200 border-2 border-black inline-block px-2 py-0.5">{q.subtitle}</p>}
          <QuestionRenderer q={q} value={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
        </section>
      ))}

      <div className="nb-card p-4 space-y-2">
        <label className="block text-xs font-extrabold uppercase">Catatan tambahan (opsional)
          <textarea className={`${inp} mt-1.5 font-semibold normal-case`} rows={3} placeholder="Hal menarik, suasana, kutipan, dsb." value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>

      <div className="sticky bottom-3 z-10 nb-card p-3 space-y-2 bg-yellow-100">
        {err && <p role="alert" className="text-sm font-bold text-red-700">{err}</p>}
        <div className="flex items-center gap-3">
          <button onClick={cancel} className="nb-btn nb-btn-sm !bg-white"><X size={16} strokeWidth={3} /> Batal</button>
          <button onClick={save} disabled={busy} className="nb-btn !bg-lime-300 ml-auto"><Save size={18} strokeWidth={3} /> {busy ? 'Menyimpan...' : 'Simpan Wawancara'}</button>
        </div>
      </div>
      {dialog}
    </div>
  );
}
