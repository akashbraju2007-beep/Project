import React, { useState } from 'react';
import { GitCompare, TrendingUp, TrendingDown, Loader2, BarChart3, X, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, Cell } from 'recharts';
import StockSearch from '../components/StockSearch';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { compareStocks } from '../services/api';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
        </p>
      ))}
    </div>
  );
};

export default function Comparison() {
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddStock = (stock) => {
    if (selectedStocks.length >= 3) return;
    const item = typeof stock === 'string' ? { symbol: stock, name: stock } : stock;
    if (!item?.symbol) return;
    if (selectedStocks.find(s => s.symbol === item.symbol)) return;
    setSelectedStocks(prev => [...prev, item]);
  };

  const handleRemoveStock = (symbol) => {
    setSelectedStocks(prev => prev.filter(s => s.symbol !== symbol));
    setComparisonData(null);
  };

  const handleCompare = async () => {
    if (selectedStocks.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const symbols = selectedStocks.map(s => s.symbol);
      const data = await compareStocks(symbols);
      const list = data?.comparison || data?.stocks || (Array.isArray(data) ? data : []);
      setComparisonData({ ...data, stocks: list });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to compare stocks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const buildNormalizedChartData = () => {
    if (!comparisonData || !comparisonData.stocks) return [];
    const allDates = new Set();
    comparisonData.stocks.forEach(s => {
      if (s.priceHistory) s.priceHistory.forEach(p => allDates.add(p.date));
    });
    const sortedDates = Array.from(allDates).sort();
    return sortedDates.map(date => {
      const point = { date };
      comparisonData.stocks.forEach(s => {
        const found = s.priceHistory?.find(p => p.date === date);
        if (found) point[s.symbol] = found.normalizedPrice;
      });
      return point;
    });
  };

  const buildReturnsData = () => {
    if (!comparisonData || !comparisonData.stocks) return [];
    const periods = [
      { key: '1mo', alt: 'returns_1m', label: '1M' },
      { key: '3mo', alt: 'returns_3m', label: '3M' },
      { key: '6mo', alt: 'returns_6m', label: '6M' },
      { key: '1y', alt: 'returns_1y', label: '1Y' },
    ];
    return periods.map(p => {
      const row = { period: p.label };
      comparisonData.stocks.forEach(s => {
        row[s.symbol] = s.returns?.[p.key] ?? s.returns?.[p.alt] ?? s[p.key] ?? s[p.alt] ?? 0;
      });
      return row;
    });
  };

  const buildVolatilityData = () => {
    if (!comparisonData || !comparisonData.stocks) return [];
    return comparisonData.stocks.map((s, i) => ({
      symbol: s.symbol,
      volatility: s.volatility != null ? (s.volatility > 1 ? s.volatility : s.volatility * 100) : 0,
      fill: COLORS[i],
    }));
  };

  const chartData = buildNormalizedChartData();
  const returnsData = buildReturnsData();
  const volatilityData = buildVolatilityData();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <GitCompare className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Stock Comparison</h1>
          <p className="text-slate-400 text-sm">Compare up to 3 stocks side by side</p>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <p className="text-sm text-slate-400 mb-3">Select stocks to compare (2-3)</p>
        {selectedStocks.length < 3 && (
          <StockSearch
            onSelect={handleAddStock}
            placeholder="Search and add a stock..."
          />
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          {selectedStocks.map((stock, i) => (
            <span key={stock.symbol} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white" style={{ backgroundColor: COLORS[i] + '33', borderColor: COLORS[i], borderWidth: 1 }}>
              {stock.symbol}
              <button onClick={() => handleRemoveStock(stock.symbol)} className="hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
        <button
          onClick={handleCompare}
          disabled={selectedStocks.length < 2 || loading}
          className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Compare Stocks
        </button>
      </div>

      {loading && <LoadingSpinner message="Comparing stocks..." />}
      {error && <ErrorMessage message={error} onRetry={handleCompare} />}

      {comparisonData && comparisonData.stocks && (
        <div className="space-y-6">
          {chartData.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Normalized Performance (Base 100)</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 12 }} tickFormatter={v => v?.slice(5)} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {comparisonData.stocks.map((s, i) => (
                    <Line key={s.symbol} type="monotone" dataKey={s.symbol} stroke={COLORS[i]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 overflow-x-auto">
            <h2 className="text-lg font-semibold text-white mb-4">Comparison Table</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Metric</th>
                  {comparisonData.stocks.map((s, i) => (
                    <th key={s.symbol} className="text-right py-3 px-4 font-medium" style={{ color: COLORS[i] }}>{s.symbol}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Current Price', key: 'currentPrice', fmt: (v, sym) => `${sym?.endsWith('.NS') ? '₹' : '$'}${Number(v)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
                  { label: 'Day Change %', key: 'percentChange', fmt: (v) => `${v?.toFixed(2)}%`, color: true },
                  { label: 'Volatility', key: 'volatility', fmt: (v) => `${(v > 1 ? v : v * 100)?.toFixed(2)}%` },
                ].map(row => (
                  <tr key={row.label} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-slate-300">{row.label}</td>
                    {comparisonData.stocks.map(s => {
                      const val = s[row.key];
                      return (
                        <td key={s.symbol} className={`text-right py-3 px-4 ${row.color ? (val >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-white'}`}>
                          {val != null ? row.fmt(val, s.symbol) : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {[
                  { key: '1mo', alt: 'returns_1m', label: '1M Return' },
                  { key: '3mo', alt: 'returns_3m', label: '3M Return' },
                  { key: '6mo', alt: 'returns_6m', label: '6M Return' },
                  { key: '1y', alt: 'returns_1y', label: '1Y Return' },
                ].map(item => (
                  <tr key={item.key} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-slate-300">{item.label}</td>
                    {comparisonData.stocks.map(s => {
                      const val = s.returns?.[item.key] ?? s.returns?.[item.alt] ?? s[item.key] ?? s[item.alt];
                      return (
                        <td key={s.symbol} className={`text-right py-3 px-4 ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {val != null ? `${val.toFixed(2)}%` : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {volatilityData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Volatility Comparison</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={volatilityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="symbol" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" tickFormatter={v => `${v}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="volatility" radius={[6, 6, 0, 0]}>
                      {volatilityData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {returnsData.length > 0 && (
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Returns Comparison</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={returnsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="period" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" tickFormatter={v => `${v}%`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {comparisonData.stocks.map((s, i) => (
                        <Bar key={s.symbol} dataKey={s.symbol} fill={COLORS[i]} radius={[4, 4, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!loading && !error && !comparisonData && selectedStocks.length === 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-300 mb-2">No Stocks Selected</h3>
          <p className="text-slate-500">Search and add 2-3 stocks above to compare their performance</p>
        </div>
      )}
    </div>
  );
}

