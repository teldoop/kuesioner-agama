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
    <div className="nb-card p-3.5 sm:p-4 flex flex-col">
      <h3 className="font-extrabold uppercase text-xs sm:text-sm mb-3 leading-tight">
        {title}
      </h3>
      {data.length === 0 || sum === 0 ? (
        <p className="text-sm font-bold py-8 text-center my-auto opacity-75">Belum ada data</p>
      ) : (
        <>
          <div className="h-[200px] sm:h-[220px] w-full text-[var(--ink-c)]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  stroke="var(--ink-c)"
                  strokeWidth={2.5}
                  label={({ percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
                    const p = percent ?? 0;
                    if (p < 0.06) return null;
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#000000"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={11}
                        fontWeight={800}
                      >
                        {`${Math.round(p * 100)}%`}
                      </text>
                    );
                  }}
                  labelLine={false}
                >
                  {data.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{ zIndex: 50 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0];
                    const val = Number(item.value ?? 0);
                    return (
                      <div className="border-[3px] border-black bg-white text-black dark:bg-white dark:text-black px-2.5 py-1.5 text-xs font-bold shadow-[3px_3px_0_0_#000]">
                        <p className="font-extrabold">{item.name}</p>
                        <p>
                          Jumlah : {val}
                          {unit} ({formatPct(val)})
                        </p>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul
            style={{ borderColor: 'var(--ink-c)' }}
            className="mt-2 pt-2.5 border-t-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs"
          >
            {data.map((d, idx) => (
              <li key={idx} className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-3 h-3 shrink-0 border-2"
                    style={{
                      backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                      borderColor: 'var(--ink-c)',
                    }}
                  />
                  <span className="font-bold truncate" title={d.name}>
                    {d.name}
                  </span>
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