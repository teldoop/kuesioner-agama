'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowLeft, ArrowRight, ClipboardList, Clock, Heart, Lock, Send, ShieldCheck, ShoppingCart, Star } from 'lucide-react';
import type { Question, Settings } from '@/lib/types';
import { computeScore, pickResult } from '@/lib/result';
import { isAnswered } from '@/lib/qutil';
import { RESULT_ICONS } from '@/lib/cardIcons';
import { QuestionRenderer } from './QuestionRenderer';
import Pulse from './Pulse';
import ThemeToggle from '@/components/shared/ThemeToggle';

gsap.registerPlugin(useGSAP);

export default function Survey({ settings, questions }: { settings: Settings; questions: Question[] }) {
  const n = questions.length;
  const END = n + 1; // 0 pembuka, 1..n pertanyaan, n+1 penutup
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const sid = useRef(''); const startedAt = useRef(0); const hp = useRef<HTMLInputElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  // Lanjut / Kirim saat menekan tombol Enter (kecuali sedang di input multibaris / textarea)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) return;

      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;

      // Hanya blokir jika fokus di textarea (multibaris), select, atau elemen contentEditable
      if (tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return;

      // Hindari double-trigger jika fokus memang sedang di tombol navigasi utama (Kembali / Lanjut / Kirim)
      if (tag === 'BUTTON' && el?.closest('[data-nav-actions]')) return;

      if (step === 0) {
        e.preventDefault();
        start();
      } else if (step >= 1 && step < END) {
        const currentQ = questions[step - 1];
        if (!currentQ || !isAnswered(currentQ, answers[currentQ.id]) || busy) return;
        e.preventDefault();
        if (step === n) submit();
        else setStep((s) => s + 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step, answers, busy, n, END, questions]);

  // Sesi hanya hidup di memori halaman ini (tidak disimpan di browser)
  useEffect(() => { sid.current = crypto.randomUUID(); }, []);

  // Peringatkan sebelum menutup/memuat ulang halaman saat kuesioner sedang diisi
  const filling = step >= 1 && step < END;
  useEffect(() => {
    if (!filling) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [filling]);

  useGSAP(() => {
    gsap.fromTo(stage.current, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
  }, { dependencies: [step] });

  const start = () => { startedAt.current = Date.now(); setStep(1); };
  const submit = async () => {
    setBusy(true); setErr('');
    const duration = Math.round((Date.now() - startedAt.current) / 1000);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sid.current, answers, duration_seconds: duration, website: hp.current?.value || '' }),
      });
      if (!res.ok && res.status !== 409) throw new Error();
      setStep(END);
    } catch { setErr('Gagal mengirim. Periksa koneksi lalu coba lagi.'); }
    setBusy(false);
  };

  if (n === 0)
    return (
      <Shell>
        <div className="nb-card p-6 text-center space-y-3">
          <div className="inline-flex border-[3px] border-black bg-yellow-300 p-4"><ClipboardList size={40} strokeWidth={2.5} /></div>
          <h1 className="text-xl font-extrabold uppercase">Belum ada pertanyaan untuk kuesioner ini</h1>
        </div>
      </Shell>
    );
  if (!settings.is_open && step < END)
    return (
      <Shell>
        <div className="nb-card p-6 text-center space-y-3">
          <div className="inline-flex border-[3px] border-black bg-pink-300 p-4"><Lock size={40} strokeWidth={2.5} /></div>
          <h1 className="text-2xl font-extrabold uppercase">Kuesioner sedang ditutup</h1>
          <p>Terima kasih telah tertarik untuk mengisi kuesioner ini!</p>
        </div>
      </Shell>
    );

  const q = step >= 1 && step <= n ? questions[step - 1] : null;
  const result = step === END ? pickResult(settings.result_types, computeScore(questions, answers)) : null;
  const ResIcon = result ? (RESULT_ICONS[result.icon] ?? { Icon: Star }).Icon : null;

  return (
    <Shell progress={step === 0 ? 0 : Math.min(step / END, 1)}>
      <input ref={hp} name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hp" />
      <div ref={stage} className="w-full">
        {step === 0 && (
          <div className="nb-card p-6 space-y-5">
            <div className="inline-flex border-[3px] border-black bg-pink-300 p-4 shadow-[4px_4px_0_0_var(--ink-c)]"><ShoppingCart size={44} strokeWidth={2.5} /></div>
            <h1 className="text-4xl font-extrabold uppercase leading-none">{settings.title || 'Kuesioner'}</h1>
            {settings.description && <p>{settings.description}</p>}
            <div className="flex flex-wrap gap-2">
              <span className="nb-tag !bg-yellow-300"><Clock size={14} strokeWidth={3} /> ±{settings.estimated_minutes} menit</span>
              <span className="nb-tag !bg-lime-300"><ShieldCheck size={14} strokeWidth={3} /> Data Anda bersifat anonim</span>
            </div>
            <button onClick={start} className="nb-btn w-full text-lg">Mulai <ArrowRight size={20} strokeWidth={3} /></button>
          </div>
        )}
        {q && (
          <div className="nb-card p-5 space-y-5">
            <span className="nb-tag">Pertanyaan {step} / {n}</span>
            <h2 className="text-2xl font-extrabold leading-snug">{q.title}</h2>
            {q.subtitle && <p className="text-sm font-semibold -mt-3 bg-yellow-200 border-2 border-black inline-block px-2 py-0.5">{q.subtitle}</p>}
            <QuestionRenderer q={q} value={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
          </div>
        )}
        {step === END && (
          <div className="space-y-5">
            {result && ResIcon && (
              <div className="nb-card p-6 text-center space-y-4 bg-lime-200">
                <div className="inline-flex border-[3px] border-black bg-white dark:text-black p-4 shadow-[4px_4px_0_0_var(--ink-c)]"><ResIcon size={48} strokeWidth={2.5} /></div>
                <p className="text-xs font-extrabold uppercase">Hasil Anda</p>
                <h2 className="text-3xl font-extrabold uppercase leading-none">{result.name}</h2>
                {result.description && <p>{result.description}</p>}
              </div>
            )}
            <Pulse />
            <p className="text-sm font-bold text-center flex items-center justify-center gap-2">Makasih udh bantu ngisi kuesioner ini! <Heart size={16} strokeWidth={3} /></p>
          </div>
        )}
      </div>
      {step >= 1 && step < END && (
        <div className="mt-6 space-y-2">
          {err && <p className="text-sm font-bold text-red-700 text-center">{err}</p>}
          <div className="flex justify-between gap-3">
            <button onClick={() => setStep(step - 1)} className="nb-btn !bg-white"><ArrowLeft size={18} strokeWidth={3} /> Kembali</button>
            {step === n ? (
              <button disabled={busy || !isAnswered(q!, answers[q!.id])} onClick={submit} className="nb-btn !bg-lime-300">{busy ? 'Mengirim...' : 'Kirim'} <Send size={18} strokeWidth={3} /></button>
            ) : (
              <button disabled={!isAnswered(q!, answers[q!.id])} onClick={() => setStep(step + 1)} className="nb-btn">Lanjut <ArrowRight size={18} strokeWidth={3} /></button>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children, progress = 0 }: { children: React.ReactNode; progress?: number }) {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="h-5 bg-white border-b-[3px] border-black"><div className="h-full bg-yellow-400 border-r-[3px] border-black transition-all duration-500" style={{ width: `${progress * 100}%`, borderRightWidth: progress ? 3 : 0 }} /></div>
      <div className="flex-1 flex items-center justify-center px-4 py-8"><div className="w-full max-w-md">{children}</div></div>
      <ThemeToggle className="fixed bottom-4 right-4 z-40" />
    </main>
  );
}
