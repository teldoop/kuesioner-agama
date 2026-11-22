'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, ExternalLink, Pencil } from 'lucide-react';
import { SITE_NAME, SITE_URL } from '@/lib/site';

export default function SharePanel({ title, description }: { title: string; description: string }) {
  const [copied, setCopied] = useState(false);
  const host = new URL(SITE_URL).host;
  const copy = async () => {
    try { await navigator.clipboard.writeText(SITE_URL); }
    catch { const t = document.createElement('textarea'); t.value = SITE_URL; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  return (
    <section className="nb-card p-4 sm:p-5 space-y-5 bg-yellow-100">
      <h2 className="text-lg font-extrabold uppercase">Bagikan Kuesioner Ini</h2>
      <div className="grid md:grid-cols-2 gap-5 items-start">
        <div className="space-y-3">
          <div><p className="text-xs font-extrabold uppercase">Judul</p><p className="text-xl font-extrabold leading-snug">{title || <span className="opacity-60">Belum ada judul</span>}</p></div>
          <div><p className="text-xs font-extrabold uppercase">Deskripsi</p><p className="font-semibold">{description || <span className="opacity-60">Belum ada deskripsi</span>}</p></div>
          <Link href="/admin/questions" className="nb-btn nb-btn-sm !bg-white"><Pencil size={14} strokeWidth={3} /> Ubah di Pengaturan Umum</Link>
        </div>
        <div className="border-[3px] border-black bg-white overflow-hidden shadow-[4px_4px_0_0_var(--ink-c)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/og" alt="Pratinjau gambar kartu" className="w-full aspect-[1200/630] object-cover border-b-[3px] border-black bg-yellow-200" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
          <div className="p-3 space-y-1">
            <p className="text-xs font-bold uppercase opacity-70">{SITE_NAME} · {host}</p>
            <p className="font-extrabold leading-snug">{title || SITE_NAME}</p>
            {description && <p className="text-sm font-medium">{description}</p>}
          </div>
        </div>
      </div>
      <input disabled value={SITE_URL} aria-label="Tautan kuesioner" className="nb-input w-full opacity-80 cursor-not-allowed" />
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={copy} className="nb-btn !bg-lime-300">{copied ? <Check size={18} strokeWidth={3} /> : <Copy size={18} strokeWidth={3} />} {copied ? 'Tersalin' : 'Salin Link'}</button>
        <a href={SITE_URL} target="_blank" rel="noopener noreferrer" className="nb-btn !bg-white"><ExternalLink size={18} strokeWidth={3} /> Lihat Pratinjau</a>
      </div>
    </section>
  );
}
