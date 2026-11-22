'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { createClient().auth.getUser().then(({ data }) => setEmail(data.user?.email ?? '')); }, []);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', down); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [open]);

  const out = async () => { await createClient().auth.signOut(); router.replace('/admin/login'); router.refresh(); };
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-label="Akun" title="Akun"
        className="nb-btn nb-btn-sm !bg-white"><User size={16} strokeWidth={3} /></button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-64 z-30 nb-card p-3 space-y-3">
          <div>
            <p className="text-xs font-extrabold uppercase">Masuk sebagai</p>
            <p className="font-bold break-all text-sm">{email || '...'}</p>
          </div>
          <Link href="/admin/account" onClick={() => setOpen(false)} className="nb-btn nb-btn-sm w-full !bg-white"><Settings size={14} strokeWidth={3} /> Pengaturan Akun</Link>
          <button onClick={out} className="nb-btn nb-btn-sm w-full !bg-pink-300"><LogOut size={14} strokeWidth={3} /> Keluar</button>
        </div>
      )}
    </div>
  );
}
