'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BellRing, LayoutDashboard, ListChecks, Menu, Mic, Users, X } from 'lucide-react';
import { useResponsesLive } from '@/lib/useResponsesLive';
import ThemeToggle from '@/components/shared/ThemeToggle';
import PushToggle from '@/components/admin/PushToggle';
import UserMenu from '@/components/admin/UserMenu';

const TABS = [['/admin', 'Dasbor', LayoutDashboard], ['/admin/responses', 'Jawaban', Users], ['/admin/questions', 'Pertanyaan', ListChecks], ['/admin/interviews', 'Wawancara', Mic]] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState(false);
  useResponsesLive((e) => { if (e.type === 'INSERT') setToast(true); });
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(false), 5000); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { setMenu(false); }, [path]);

  const tab = (href: string, label: string, Icon: any, block = false) => (
    <Link key={href} href={href} className={`nb-btn nb-btn-sm whitespace-nowrap ${block ? 'w-full !justify-start' : ''} ${path === href ? '!bg-black !text-white' : '!bg-white'}`}>
      <Icon size={16} strokeWidth={3} /> {label}
    </Link>
  );
  return (
    <div className="min-h-screen">
      <header className="bg-yellow-300 border-b-[3px] border-black sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <b className="uppercase font-extrabold whitespace-nowrap mr-2">Admin Kuesioner</b>
          <nav className="hidden md:flex items-center gap-3">{TABS.map(([h, l, I]) => tab(h, l, I))}</nav>
          {/* Mobile: hamburger, user, notifikasi. Desktop: tema, user, notifikasi */}
          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => setMenu(!menu)} aria-label="Menu" aria-expanded={menu} className="md:hidden nb-btn nb-btn-sm !bg-white">
              {menu ? <X size={16} strokeWidth={3} /> : <Menu size={16} strokeWidth={3} />}
            </button>
            <div className="hidden md:block"><ThemeToggle /></div>
            <UserMenu />
            <PushToggle />
          </div>
        </div>
        {menu && (
          <div className="md:hidden border-t-[3px] border-black px-4 py-3 space-y-2">
            {TABS.map(([h, l, I]) => tab(h, l, I, true))}
            <div className="flex items-center justify-between pt-3 border-t-[3px] border-black border-dashed">
              <span className="text-sm font-extrabold uppercase">Tema</span>
              <ThemeToggle />
            </div>
          </div>
        )}
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      {toast && (
        <div role="status" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:w-80 z-30 border-[3px] border-black bg-lime-300 p-3 shadow-[5px_5px_0_0_var(--ink-c)] flex items-start gap-3">
          <BellRing size={22} strokeWidth={3} className="shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-extrabold uppercase">Jawaban baru masuk</p>
            <p className="font-semibold">Responden baru baru saja mengirim jawaban.</p>
            <Link href="/admin/responses" className="font-extrabold underline">Lihat jawaban</Link>
          </div>
          <button onClick={() => setToast(false)} aria-label="Tutup"><X size={18} strokeWidth={3} /></button>
        </div>
      )}
    </div>
  );
}
