'use client';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const tick = (size = 11) => ({ fontSize: size, fontWeight: 700, fill: 'currentColor' });
export default function BarBox({ title, data, unit = '', horizontal = true, color = '#a3e635' }: { title: string; data: { name: string; value: number }[]; unit?: string; horizontal?: boolean; color?: string }) {
  const h = horizontal ? Math.max(160, data.length * 44 + 30) : 240;
  return (
    <div className="nb-card p-4">
      <h3 className="font-extrabold uppercase text-sm mb-3 leading-tight">{title}</h3>
      {data.length === 0 || data.every((d) => !d.value) ? <p className="text-sm font-bold py-8 text-center">Belum ada data</p> : (
        <div style={{ height: h }} className="text-black">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="0" stroke="currentColor" strokeOpacity={0.15} />
              {horizontal ? (<><XAxis type="number" allowDecimals={false} stroke="currentColor" tick={tick()} /><YAxis type="category" dataKey="name" width={120} tick={tick()} stroke="currentColor" /></>)
                : (<><XAxis dataKey="name" tick={tick()} stroke="currentColor" /><YAxis allowDecimals={false} stroke="currentColor" tick={tick()} /></>)}
              <Tooltip formatter={(v: any) => `${v}${unit}`} cursor={{ fill: 'currentColor', fillOpacity: 0.08 }}
                contentStyle={{ border: '3px solid rgb(var(--ink))', borderRadius: 0, boxShadow: '3px 3px 0 var(--ink-c)', fontWeight: 700, background: 'rgb(var(--paper))', color: 'rgb(var(--ink))' }} />
              <Bar dataKey="value" fill={color} stroke="currentColor" strokeWidth={3} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
