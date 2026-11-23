import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';
import ThemeToggle from '@/components/shared/ThemeToggle';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="nb-card w-full max-w-sm p-6 space-y-4">
        <div className="inline-flex border-[3px] border-black bg-red-300 p-3 shadow-[3px_3px_0_0_var(--ink-c)]">
          <FileQuestion size={32} strokeWidth={2.5} />
        </div>

        <div className="space-y-1">
          <p className="text-4xl font-black leading-none">404</p>
          <h1 className="text-2xl font-extrabold uppercase leading-tight">
            Halaman Tidak Ditemukan
          </h1>
        </div>

        <p className="text-sm font-medium opacity-80">
          Hmmm... Mungkin Anda salah ketik. Tolong diulangi yaa:)
        </p>

        <Link href="/" className="nb-btn w-full inline-flex items-center justify-center gap-2">
          Kembali ke Beranda <Home size={18} strokeWidth={3} />
        </Link>
      </div>
    </main>
  );
}