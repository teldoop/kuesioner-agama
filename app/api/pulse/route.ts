import { NextResponse } from 'next/server';
import { publicClient } from '@/lib/supabase/public';
export const dynamic = 'force-dynamic';
export async function GET() {
  const { data, error } = await publicClient().rpc('public_pulse');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30' } });
}
