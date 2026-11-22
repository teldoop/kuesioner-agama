'use client';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Mail, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function Account() {
  const sb = createClient();
  const [email, setEmail] = useState('');
  const [cur, setCur] = useState(''); const [pw, setPw] = useState(''); const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false); const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => { sb.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? '')); }, []); // eslint-disable-line

  const submit = async () => {
    setMsg(null);
    if (pw.length < 8) return setMsg({ ok: false, text: 'Password baru minimal 8 karakter.' });
    if (pw !== pw2) return setMsg({ ok: false, text: 'Konfirmasi password tidak cocok.' });
    if (pw === cur) return setMsg({ ok: false, text: 'Password baru harus berbeda dari password saat ini.' });
    setBusy(true);
    const { error: e1 } = await sb.auth.signInWithPassword({ email, password: cur }); // verifikasi password lama
    if (e1) { setBusy(false); return setMsg({ ok: false, text: 'Password saat ini salah.' }); }
    const { error: e2 } = await sb.auth.updateUser({ password: pw });
    setBusy(false);
    if (e2) return setMsg({ ok: false, text: e2.message });
    setCur(''); setPw(''); setPw2('');
    setMsg({ ok: true, text: 'Password berhasil diubah.' });
  };
  const type = show ? 'text' : 'password';
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-extrabold uppercase">Pengaturan Akun</h1>
      <section className="nb-card p-4 space-y-2 bg-sky-200">
        <p className="text-xs font-extrabold uppercase flex items-center gap-2"><Mail size={14} strokeWidth={3} /> Email akun</p>
        <p className="font-bold break-all">{email || '...'}</p>
      </section>
      <form className="nb-card p-4 space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <h2 className="font-extrabold uppercase flex items-center gap-2"><KeyRound size={18} strokeWidth={3} /> Ganti password</h2>
        <input type="text" autoComplete="username" value={email} readOnly hidden />
        <div className="space-y-1"><p className="text-xs font-extrabold uppercase">Password saat ini</p>
          <input className="nb-input w-full" type={type} autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
        <div className="space-y-1"><p className="text-xs font-extrabold uppercase">Password baru</p>
          <input className="nb-input w-full" type={type} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <p className="text-xs font-semibold">Minimal 8 karakter.</p></div>
        <div className="space-y-1"><p className="text-xs font-extrabold uppercase">Konfirmasi password baru</p>
          <input className="nb-input w-full" type={type} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
        <button type="button" onClick={() => setShow(!show)} className="nb-btn nb-btn-sm !bg-white">
          {show ? <EyeOff size={14} strokeWidth={3} /> : <Eye size={14} strokeWidth={3} />} {show ? 'Sembunyikan' : 'Tampilkan'} password
        </button>
        {msg && <p role="status" className={`border-[3px] border-black p-2 text-sm font-bold ${msg.ok ? 'bg-lime-300' : 'bg-red-300'}`}>{msg.text}</p>}
        <button type="submit" disabled={busy || !cur || !pw || !pw2} className="nb-btn !bg-lime-300"><Save size={18} strokeWidth={3} /> {busy ? 'Menyimpan...' : 'Simpan password'}</button>
      </form>
    </div>
  );
}
