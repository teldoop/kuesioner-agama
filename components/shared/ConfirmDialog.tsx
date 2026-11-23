'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, HelpCircle } from 'lucide-react';

export type ConfirmOptions = {
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Gaya merah untuk tindakan yang merusak (hapus, dll.) */
  danger?: boolean;
};

type Props = ConfirmOptions & { open: boolean; onConfirm: () => void; onCancel: () => void };

export function ConfirmDialog({ open, title, message, confirmLabel = 'Ya', cancelLabel = 'Batal', danger = false, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  const cancelFn = useRef(onCancel); cancelFn.current = onCancel;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    cancelRef.current?.focus(); // fokus awal ke "Batal" agar tidak terhapus tanpa sengaja
    const key = (e: KeyboardEvent) => {
      e.stopPropagation(); // jangan bocor ke modal lain di bawahnya (Esc, panah kiri/kanan, dst.)
      if (e.key === 'Escape') { e.preventDefault(); cancelFn.current(); }
      if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === cancelRef.current ? okRef : cancelRef).current?.focus(); }
    };
    document.addEventListener('keydown', key, true); // fase capture: dijalankan lebih dulu daripada modal lain
    return () => { document.removeEventListener('keydown', key, true); document.body.style.overflow = prevOverflow; opener?.focus?.(); };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 !m-0 z-50 bg-neutral-950/60 flex items-center justify-center p-4" onClick={onCancel}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby={message ? 'confirm-desc' : undefined}
        className="nb-card w-full max-w-sm p-5 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <span className={`shrink-0 border-[3px] border-black p-2 shadow-[3px_3px_0_0_var(--ink-c)] ${danger ? 'bg-red-300' : 'bg-yellow-300'}`}>
            {danger ? <AlertTriangle size={24} strokeWidth={3} /> : <HelpCircle size={24} strokeWidth={3} />}
          </span>
          <div className="space-y-1 min-w-0">
            <h2 id="confirm-title" className="font-extrabold uppercase leading-tight">{title}</h2>
            {message && <div id="confirm-desc" className="text-sm font-semibold break-words">{message}</div>}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button ref={cancelRef} type="button" onClick={onCancel} className="nb-btn nb-btn-sm !bg-white">{cancelLabel}</button>
          <button ref={okRef} type="button" onClick={onConfirm} className={`nb-btn nb-btn-sm ${danger ? '!bg-red-300' : '!bg-lime-300'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * Pengganti window.confirm berbasis Promise:
 *   const { confirm, dialog } = useConfirm();
 *   if (!(await confirm({ title: 'Hapus?', danger: true }))) return;
 *   ... return (<>...{dialog}</>)
 */
export function useConfirm() {
  const [req, setReq] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback(
    (o: ConfirmOptions) => new Promise<boolean>((resolve) => setReq((prev) => { prev?.resolve(false); return { ...o, resolve }; })), []);
  const close = (v: boolean) => { req?.resolve(v); setReq(null); };
  const dialog = (
    <ConfirmDialog open={!!req} title={req?.title ?? ''} message={req?.message} confirmLabel={req?.confirmLabel} cancelLabel={req?.cancelLabel}
      danger={req?.danger} onConfirm={() => close(true)} onCancel={() => close(false)} />
  );
  return { confirm, dialog };
}
