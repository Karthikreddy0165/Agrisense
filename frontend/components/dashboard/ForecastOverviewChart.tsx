'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import { formatDateShort, formatPrice } from '@/lib/utils/formatters';

interface ChartPoint {
  date: string;
  historical?: number;
  forecast?: number;
  lower?: number;
  upper?: number;
}

interface ForecastOverviewChartProps {
  data: ChartPoint[];
  transitionDate?: string;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-medium text-slate-700 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        p.value != null && (
          <div key={p.name} className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
            <span className="text-slate-500 capitalize">{p.name === 'upper' || p.name === 'lower' ? 'Confidence' : p.name}:</span>
            <span className="font-semibold text-slate-800">{formatPrice(p.value)}/qtl</span>
          </div>
        )
      ))}
    </div>
  );
}

export function ForecastOverviewChart({ data, transitionDate }: ForecastOverviewChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    dateLabel: formatDateShort(d.date),
    band: d.lower != null && d.upper != null ? [d.lower, d.upper] as [number, number] : undefined,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={formatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        {transitionDate && (
          <ReferenceLine
            x={formatDateShort(transitionDate)}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{ value: 'Forecast →', position: 'insideTopRight', fontSize: 10, fill: '#94a3b8' }}
          />
        )}
        {/* Confidence band */}
        <Area
          type="monotone"
          dataKey="upper"
          stroke="none"
          fill="#ede9fe"
          fillOpacity={0.6}
          legendType="none"
        />
        <Area
          type="monotone"
          dataKey="lower"
          stroke="none"
          fill="#ffffff"
          fillOpacity={1}
          legendType="none"
        />
        <Line
          type="monotone"
          dataKey="historical"
          stroke="#2563eb"
          strokeWidth={2}
          dot={false}
          name="Historical"
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="forecast"
          stroke="#7c3aed"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={false}
          name="Forecast"
          connectNulls
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => <span style={{ color: '#64748b' }}>{value}</span>}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
