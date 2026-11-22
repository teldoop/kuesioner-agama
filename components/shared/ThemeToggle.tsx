'use client';
import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

type Mode = 'light' | 'dark' | 'system';
const OPTS = [['light', 'Terang', Sun], ['dark', 'Gelap', Moon], ['system', 'Ikuti sistem', Monitor]] as const;
const apply = (m: Mode) => {
  const dark = m === 'dark' || (m === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
};

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [mode, setMode] = useState<Mode>('system');
  useEffect(() => { setMode((localStorage.getItem('theme') as Mode) || 'system'); }, []);
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const f = () => apply('system');
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, [mode]);
  const pick = (m: Mode) => { setMode(m); localStorage.setItem('theme', m); apply(m); };
  return (
    <div role="radiogroup" aria-label="Tema tampilan"
      className={`inline-flex border-[3px] border-black bg-white shadow-[3px_3px_0_0_var(--ink-c)] ${className}`}>
      {OPTS.map(([k, label, Icon]) => (
        <button key={k} role="radio" aria-checked={mode === k} aria-label={label} title={label} onClick={() => pick(k)}
          className={`p-2 transition-opacity dark:text-black ${mode === k ? 'bg-yellow-300' : 'hover:opacity-60'}`}>
          <Icon size={16} strokeWidth={3} />
        </button>
      ))}
    </div>
  );
}
