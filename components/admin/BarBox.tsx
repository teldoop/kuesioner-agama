'use client';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const tick = (size = 11) => ({ fontSize: size, fontWeight: 700, fill: 'var(--ink-c)' });

const formatLabel = (val: string, max = 14) =>
  val.length > max ? `${val.slice(0, max)}…` : val;

export default function BarBox({
  title,
  data,
  unit = '',
  horizontal = true,
  color = '#a3e635',
}: {
  title: string;
  data: { name: string; value: number }[];
  unit?: string;
  horizontal?: boolean;
  color?: string;
}) {
  const h = horizontal ? Math.max(170, data.length * 42 + 24) : 240;
  const sum = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="nb-card p-3.5 sm:p-4 flex flex-col">
      <h3 className="font-extrabold uppercase text-xs sm:text-sm mb-3 leading-tight">
        {title}
      </h3>
      {data.length === 0 || data.every((d) => !d.value) ? (
        <p className="text-sm font-bold py-8 text-center my-auto opacity-75">Belum ada data</p>
      ) : (
        <div style={{ height: h }} className="w-full my-auto text-[var(--ink-c)]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout={horizontal ? 'vertical' : 'horizontal'}
              margin={{ top: 4, right: 12, left: horizontal ? 0 : -16, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="0" stroke="var(--ink-c)" strokeOpacity={0.15} />
              {horizontal ? (
                <>
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    stroke="var(--ink-c)"
                    tick={tick(11)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={96}
                    tick={tick(11)}
                    tickFormatter={(v) => formatLabel(String(v), 13)}
                    stroke="var(--ink-c)"
                  />
                </>
              ) : (
                <>
                  <XAxis
                    dataKey="name"
                    tick={tick(10)}
                    tickFormatter={(v) => formatLabel(String(v), 10)}
                    interval={0}
                    stroke="var(--ink-c)"
                  />
                  <YAxis allowDecimals={false} stroke="var(--ink-c)" tick={tick(11)} />
                </>
              )}
              <Tooltip
                wrapperStyle={{ zIndex: 50 }}
                formatter={(v: any) => {
                  const pct = sum > 0 ? Math.round((Number(v) / sum) * 100) : 0;
                  return [`${v}${unit} (${pct}%)`, 'Jumlah'];
                }}
                cursor={{ fill: 'var(--ink-c)', fillOpacity: 0.08 }}
                contentStyle={{
                  border: '3px solid var(--ink-c)',
                  borderRadius: 0,
                  boxShadow: '3px 3px 0 var(--ink-c)',
                  fontWeight: 700,
                  fontSize: '12px',
                  backgroundColor: 'rgb(var(--paper))',
                  color: 'var(--ink-c)',
                }}
                labelStyle={{ fontWeight: 800, marginBottom: '2px' }}
              />
              <Bar
                dataKey="value"
                fill={color}
                stroke="var(--ink-c)"
                strokeWidth={2.5}
                maxBarSize={36}
                isAnimationActive
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}