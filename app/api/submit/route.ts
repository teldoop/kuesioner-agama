import { NextResponse } from 'next/server';
import { publicClient } from '@/lib/supabase/public';
import { notifyAdmins } from '@/lib/push-server';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'bad' }, { status: 400 }); }
  if (b.website) return NextResponse.json({ ok: true }); // honeypot terisi: bot, diam-diam abaikan
  if (typeof b.session_id !== 'string' || b.session_id.length > 64 || typeof b.answers !== 'object' || b.answers === null)
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const duration = Math.max(0, Math.min(Number(b.duration_seconds) || 0, 86400));
  const { error } = await publicClient().from('survey_responses').insert({ session_id: b.session_id, answers: b.answers, duration_seconds: duration });
  if (error) return NextResponse.json({ error: error.message }, { status: error.code === '23505' ? 409 : 500 });
  try { await notifyAdmins({ title: 'Jawaban baru masuk', body: `Durasi pengisian ${duration} detik`, url: '/admin/responses' }); } catch {}
  return NextResponse.json({ ok: true });
}
