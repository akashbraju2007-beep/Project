import React from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label, symbol }) => {
  if (!active || !payload || payload.length === 0) return null;
  const isIndian = !symbol || symbol.endsWith('.NS') || symbol.endsWith('.BO');
  const currSign = isIndian ? '₹' : '$';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 shadow-xl shadow-black/40">
      <p className="text-slate-400 text-xs font-medium mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color || entry.stroke }}
          ></span>
          <span className="text-slate-300 capitalize">
            {entry.name === 'close'
              ? 'Price'
              : entry.name === 'sma20'
              ? 'SMA 20'
              : entry.name === 'sma50'
              ? 'SMA 50'
              : entry.name}
            :
          </span>
          <span className="text-white font-semibold">
            {currSign}{typeof entry.value === 'number' ? entry.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const PriceChart = ({ data = [], showSMA20 = false, showSMA50 = false, height = 400, symbol = '' }) => {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-slate-800/50 rounded-xl border border-slate-700"
        style={{ height }}
      >
        <p className="text-slate-500 text-sm">No price data available</p>
      </div>
    );
  }

  // Compute domain with padding
  const closePrices = data
    .map((d) => d.close)
    .filter((v) => v !== null && v !== undefined && !isNaN(v));
  const allValues = [...closePrices];

  if (showSMA20) {
    const sma20Values = data
      .map((d) => d.sma20)
      .filter((v) => v !== null && v !== undefined && !isNaN(v));
    allValues.push(...sma20Values);
  }
  if (showSMA50) {
    const sma50Values = data
      .map((d) => d.sma50)
      .filter((v) => v !== null && v !== undefined && !isNaN(v));
    allValues.push(...sma50Values);
  }

  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const padding = (maxVal - minVal) * 0.05 || maxVal * 0.02;
  const domainMin = Math.floor(minVal - padding);
  const domainMax = Math.ceil(maxVal + padding);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="50%" stopColor="#10b981" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#334155"
          vertical={false}
        />

        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          dy={8}
          interval="preserveStartEnd"
          minTickGap={40}
        />

        <YAxis
          domain={[domainMin, domainMax]}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          dx={-4}
          tickFormatter={(val) =>
            val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)
          }
          width={55}
        />

        <Tooltip
          content={<CustomTooltip symbol={symbol} />}
          cursor={{
            stroke: '#475569',
            strokeWidth: 1,
            strokeDasharray: '4 4',
          }}
        />

        <Area
          type="monotone"
          dataKey="close"
          name="close"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#emeraldGradient)"
          dot={false}
          activeDot={{
            r: 5,
            fill: '#10b981',
            stroke: '#064e3b',
            strokeWidth: 2,
          }}
        />

        {showSMA20 && (
          <Line
            type="monotone"
            dataKey="sma20"
            name="sma20"
            stroke="#3b82f6"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            dot={false}
            activeDot={{
              r: 4,
              fill: '#3b82f6',
              stroke: '#1e3a8a',
              strokeWidth: 2,
            }}
            connectNulls
          />
        )}

        {showSMA50 && (
          <Line
            type="monotone"
            dataKey="sma50"
            name="sma50"
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            dot={false}
            activeDot={{
              r: 4,
              fill: '#f59e0b',
              stroke: '#78350f',
              strokeWidth: 2,
            }}
            connectNulls
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default PriceChart;
