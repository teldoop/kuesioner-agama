'use client';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const PIE_COLORS = ['#a3e635', '#facc15', '#f9a8d4', '#7dd3fc', '#c084fc', '#fb923c', '#34d399', '#f87171'];

export default function PieBox({
  title,
  data,
  unit = '',
}: {
  title: string;
  data: { name: string; value: number }[];
  unit?: string;
}) {
  const sum = data.reduce((acc, d) => acc + d.value, 0);
  const formatPct = (v: number) => (sum > 0 ? `${Math.round((v / sum) * 100)}%` : '0%');

  return (
    <div className="nb-card p-4 flex flex-col">
      <h3 className="font-extrabold uppercase text-sm mb-3 leading-tight">{title}</h3>
      {data.length === 0 || sum === 0 ? (
        <p className="text-sm font-bold py-8 text-center">Belum ada data</p>
      ) : (
        <>
          <div className="h-[220px] text-black">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  stroke="currentColor"
                  strokeWidth={3}
                  label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
                  labelLine={false}
                >
                  {data.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any) => `${v}${unit} (${formatPct(Number(v))})`}
                  contentStyle={{
                    border: '3px solid rgb(var(--ink))',
                    borderRadius: 0,
                    boxShadow: '3px 3px 0 var(--ink-c)',
                    fontWeight: 700,
                    background: 'rgb(var(--paper))',
                    color: 'rgb(var(--ink))',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda warna + persentase */}
          <ul className="mt-2 pt-2 border-t-2 border-black grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            {data.map((d, idx) => (
              <li key={idx} className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-3 h-3 shrink-0 border-2 border-black"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="font-bold truncate">{d.name}</span>
                </div>
                <span className="font-extrabold shrink-0">{formatPct(d.value)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}