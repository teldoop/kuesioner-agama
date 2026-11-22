'use client';
import { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const toU8 = (b64: string) => {
  const raw = atob((b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};
type State = 'loading' | 'unsupported' | 'denied' | 'off' | 'on';

export default function PushToggle() {
  const [state, setState] = useState<State>('loading');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      if (!KEY || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return setState('unsupported');
      if (Notification.permission === 'denied') return setState('denied');
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      setState((await reg?.pushManager.getSubscription()) ? 'on' : 'off');
    })().catch(() => setState('unsupported'));
  }, []);

  const enable = async () => {
    setBusy(true); setMsg('');
    try {
      if ((await Notification.requestPermission()) !== 'granted') { setState('denied'); return; }
      await navigator.serviceWorker.register('/sw.js');
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toU8(KEY) });
      const j: any = sub.toJSON();
      const { error } = await createClient().from('push_subscriptions')
        .upsert({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: navigator.userAgent }, { onConflict: 'endpoint' });
      if (error) throw error;
      setState('on'); setMsg('Notifikasi aktif di perangkat ini');
    } catch (e: any) { setMsg(e?.message || 'Gagal mengaktifkan notifikasi'); }
    setBusy(false);
  };
  const disable = async () => {
    setBusy(true); setMsg('');
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) { await createClient().from('push_subscriptions').delete().eq('endpoint', sub.endpoint); await sub.unsubscribe(); }
      setState('off'); setMsg('Notifikasi dimatikan');
    } catch (e: any) { setMsg(e?.message || 'Gagal mematikan notifikasi'); }
    setBusy(false);
  };

  const title = { loading: 'Memeriksa...', unsupported: 'Notifikasi push tidak didukung/belum dikonfigurasi di perangkat ini',
    denied: 'Notifikasi diblokir di pengaturan browser', off: 'Aktifkan notifikasi jawaban baru', on: 'Matikan notifikasi jawaban baru' }[state];
  const Icon = state === 'on' ? BellRing : state === 'off' || state === 'loading' ? Bell : BellOff;
  return (
    <span className="relative inline-flex">
      <button onClick={state === 'on' ? disable : enable} disabled={busy || state === 'loading' || state === 'unsupported' || state === 'denied'}
        title={title} aria-label={title} className={`nb-btn nb-btn-sm ${state === 'on' ? '!bg-lime-300' : '!bg-white'}`}>
        <Icon size={16} strokeWidth={3} />
      </button>
      {msg && <span role="status" className="absolute right-0 top-full mt-2 z-20 w-56 border-[3px] border-black bg-white p-2 text-xs font-bold shadow-[3px_3px_0_0_var(--ink-c)]">{msg}</span>}
    </span>
  );
}
