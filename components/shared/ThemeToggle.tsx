'use client';
import { useEffect, useState } from 'react';
import { Laptop, Monitor, Moon, Smartphone, Sun, Tablet, Tv, type LucideIcon } from 'lucide-react';
import TooltipG from '@/components/shared/TooltipG';

type Mode = 'light' | 'dark' | 'system';
type TooltipDirection = 'top' | 'bottom';

const apply = (m: Mode) => {
  const dark = m === 'dark' || (m === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
};

const getDeviceIcon = (ua: string): LucideIcon => {
  // 1. Smart TV / Konsol
  if (/smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast\.tv|playstation|xbox|nintendo/i.test(ua)) {
    return Tv;
  }
  // 2. Tablet (termasuk iPadOS 13+ yang menyamar sebagai Mac dengan layar sentuh)
  if (
    /ipad|tablet|playbook|silk/i.test(ua) ||
    (/android/i.test(ua) && !/mobile/i.test(ua)) ||
    (/macintosh/i.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1)
  ) {
    return Tablet;
  }
  // 3. Mobile / Smartphone
  if (/mobi|iphone|ipod|android.*mobile|windows phone|blackberry/i.test(ua)) {
    return Smartphone;
  }
  // 4. Laptop (macOS umumnya laptop; atau perangkat dengan baterai)
  if (/macintosh|mac os x/i.test(ua)) {
    return Laptop;
  }
  // 5. Default Desktop
  return Monitor;
};

export default function ThemeToggle({
  className = '',
  tooltipDirection = 'bottom',
}: {
  className?: string;
  tooltipDirection?: TooltipDirection;
}) {
  const [mode, setMode] = useState<Mode>('system');
  const [SystemIcon, setSystemIcon] = useState<LucideIcon>(() => Monitor);

  useEffect(() => {
    setMode((localStorage.getItem('theme') as Mode) || 'system');
    setSystemIcon(() => getDeviceIcon(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const f = () => apply('system');
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, [mode]);

  const pick = (m: Mode) => {
    setMode(m);
    localStorage.setItem('theme', m);
    apply(m);
  };

  const opts: [Mode, string, LucideIcon][] = [
    ['light', 'Terang', Sun],
    ['dark', 'Gelap', Moon],
    ['system', 'Sistem', SystemIcon],
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Tema tampilan"
      className={`inline-flex border-[3px] border-black bg-white shadow-[3px_3px_0_0_var(--ink-c)] ${className}`}
    >
      {opts.map(([k, label, Icon]) => (
        <TooltipG key={k} content={label} position={tooltipDirection}>
          <button
            type="button"
            role="radio"
            aria-checked={mode === k}
            aria-label={label}
            onClick={() => pick(k)}
            className={`p-2 transition-opacity dark:text-black ${
              mode === k ? 'bg-yellow-300' : 'hover:opacity-60'
            }`}
          >
            <Icon size={16} strokeWidth={3} />
          </button>
        </TooltipG>
      ))}
    </div>
  );
}