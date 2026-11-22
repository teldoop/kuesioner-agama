import { ImageResponse } from 'next/og';
import { getSettings } from '@/lib/survey-data';
import { SITE_NAME, SITE_URL } from '@/lib/site';
export const dynamic = 'force-dynamic';

const cut = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t);

export async function GET() {
  const s = await getSettings();
  const title = cut(s.title || SITE_NAME, 70);
  const desc = cut(s.description || '', 150);
  const host = new URL(SITE_URL).host;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#FFF4D6', padding: 48 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#FFFFFF', border: '8px solid #000', boxShadow: '16px 16px 0 #000', padding: 48 }}>
          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', background: '#F9A8D4', border: '5px solid #000', padding: '6px 20px', fontSize: 30, fontWeight: 700, color: '#000' }}>{SITE_NAME.toUpperCase()}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', fontSize: 78, lineHeight: 1.05, fontWeight: 700, color: '#000' }}>{title}</div>
            {desc ? <div style={{ display: 'flex', fontSize: 32, lineHeight: 1.3, color: '#222' }}>{desc}</div> : null}
          </div>
          <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: '#000' }}>{host}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' } }
  );
}
