'use client';

import { ReactNode, useEffect, useId, useState } from 'react';

type Position = 'top' | 'bottom' | 'left' | 'right';

interface TooltipGProps {
  /** Teks atau elemen yang ditampilkan di dalam tooltip */
  content: ReactNode;
  /** Elemen pemicu (tombol, ikon, teks, dll) */
  children: ReactNode;
  /** Posisi munculnya tooltip relatif terhadap elemen pemicu */
  position?: Position;
  /** Tambahan class pada wrapper luar */
  className?: string;
  /** Nonaktifkan tooltip jika true */
  disabled?: boolean;
}

const POSITION_CLASSES: Record<Position, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export default function TooltipG({
  content,
  children,
  position = 'top',
  className = '',
  disabled = false,
}: TooltipGProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  // Reset state saat tooltip dinonaktifkan (misal saat dropdown menu dibuka)
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  if (disabled || !content) {
    return <>{children}</>;
  }

  return (
    <span
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={(e) => {
        // Hanya tampilkan saat fokus dari keyboard (Tab), bukan hasil klik/tap
        if (e.target.matches(':focus-visible')) {
          setOpen(true);
        }
      }}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? tooltipId : undefined} className="inline-flex">
        {children}
      </span>

      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`pointer-events-none absolute z-50 w-max max-w-[240px] sm:max-w-xs px-2.5 py-1.5 text-xs font-bold leading-snug border-[3px] border-black bg-white text-black dark:bg-white dark:text-black shadow-[3px_3px_0_0_#000] transition-opacity duration-150 ${POSITION_CLASSES[position]}`}
        >
          {content}
        </span>
      )}
    </span>
  );
}