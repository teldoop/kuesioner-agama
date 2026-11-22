'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ThemeToggle from '@/components/shared/ThemeToggle';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true); setErr('');
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) { setErr('Email atau kata sandi salah.'); setBusy(false); return; }
    router.replace('/admin'); router.refresh();
  };
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="nb-card w-full max-w-sm p-6 space-y-4">
        <div className="inline-flex border-[3px] border-black bg-yellow-300 p-3 shadow-[3px_3px_0_0_var(--ink-c)]"><ShieldCheck size={32} strokeWidth={2.5} /></div>
        <h1 className="text-2xl font-extrabold uppercase leading-none">Masuk Admin Peneliti</h1>
        <input className="nb-input w-full" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="nb-input w-full" placeholder="Kata sandi" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} />
        {err && <p className="text-sm font-bold text-red-700">{err}</p>}
        <button onClick={go} disabled={busy} className="nb-btn w-full">{busy ? 'Memproses...' : 'Masuk'} <LogIn size={18} strokeWidth={3} /></button>
      </div>
    </main>
  );
}
