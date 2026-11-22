import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

/** Kirim push ke semua perangkat admin. Hanya dipanggil dari server (butuh service role key). */
export async function notifyAdmins(payload: { title: string; body: string; url?: string }) {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!pub || !priv || !url || !key) return; // fitur push belum dikonfigurasi
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', pub, priv);
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data } = await sb.from('push_subscriptions').select('*');
  await Promise.allSettled((data ?? []).map(async (s: any) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 3600 });
    } catch (e: any) {
      if (e.statusCode === 404 || e.statusCode === 410) await sb.from('push_subscriptions').delete().eq('id', s.id); // langganan kedaluwarsa
    }
  }));
}
