import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  DollarSign,
  Activity,
} from 'lucide-react';
import { getStockHistory, getStockQuote } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import StockSearch from '../components/StockSearch';
import PriceChart from '../components/PriceChart';

const PERIODS = [
  { value: '1d', label: '1D' },
  { value: '5d', label: '5D' },
  { value: '1mo', label: '1M' },
  { value: '3mo', label: '3M' },
  { value: '6mo', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: '5y', label: '5Y' },
];

const formatCurrency = (value, symbol) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const isIndian = symbol && symbol.endsWith('.NS');
  const prefix = isIndian ? '₹' : '$';
  return `${prefix}${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatVolume = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const num = Number(value);
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toLocaleString();
};

const StockAnalysis = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE.NS');
  const [period, setPeriod] = useState('1mo');
  const [historyData, setHistoryData] = useState(null);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [historyRes, quoteRes] = await Promise.allSettled([
          getStockHistory(selectedSymbol, period),
          getStockQuote(selectedSymbol),
        ]);

        if (historyRes.status === 'fulfilled') {
          const data = historyRes.value?.data ?? historyRes.value;
          setHistoryData(data);
        } else {
          setHistoryData(null);
        }

        if (quoteRes.status === 'fulfilled') {
          const data = quoteRes.value?.data ?? quoteRes.value;
          setQuote(data);
        } else {
          setQuote(null);
        }

        if (historyRes.status === 'rejected' && quoteRes.status === 'rejected') {
          setError('Unable to connect to StockAI backend. Please ensure the server is running.');
        }
      } catch (err) {
        setError('Unable to connect to StockAI backend. Please ensure the server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSymbol, period]);

  const handleStockSelect = (stockOrSymbol) => {
    const sym = typeof stockOrSymbol === 'string' ? stockOrSymbol : stockOrSymbol?.symbol;
    if (sym && sym !== selectedSymbol) {
      setSelectedSymbol(sym);
    }
  };

  const currentPrice = quote?.currentPrice ?? quote?.regularMarketPrice ?? quote?.price ?? 0;
  const dayChange = quote?.dayChange ?? quote?.regularMarketChange ?? quote?.change ?? 0;
  const dayChangePercent = quote?.dayChangePercent ?? quote?.regularMarketChangePercent ?? quote?.changePercent ?? 0;
  const openPrice = quote?.open ?? quote?.regularMarketOpen ?? 0;
  const dayHigh = quote?.dayHigh ?? quote?.regularMarketDayHigh ?? quote?.high ?? 0;
  const dayLow = quote?.dayLow ?? quote?.regularMarketDayLow ?? quote?.low ?? 0;
  const closePrice = quote?.previousClose ?? quote?.regularMarketPreviousClose ?? quote?.close ?? 0;
  const volume = quote?.volume ?? quote?.regularMarketVolume ?? 0;
  const weekHigh52 = quote?.fiftyTwoWeekHigh ?? quote?.['52WeekHigh'] ?? quote?.yearHigh ?? 0;
  const weekLow52 = quote?.fiftyTwoWeekLow ?? quote?.['52WeekLow'] ?? quote?.yearLow ?? 0;
  const stockName = quote?.shortName ?? quote?.longName ?? quote?.name ?? selectedSymbol;

  const historyArray = Array.isArray(historyData)
    ? historyData
    : historyData?.history ?? historyData?.data ?? historyData?.prices ?? [];

  const last20 = historyArray.slice(-20).reverse();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <BarChart3 className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Stock Analysis</h1>
          <p className="text-slate-400 text-sm">Detailed technical analysis & historical data</p>
        </div>
      </div>

      {/* Stock Search */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <StockSearch onSelect={handleStockSelect} />
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p.value
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          {/* Stock Info Banner */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">{stockName}</h2>
                <p className="text-slate-400 text-sm">{selectedSymbol}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{formatCurrency(currentPrice, selectedSymbol)}</p>
                <div className="flex items-center justify-end gap-2 mt-1">
                  {dayChange >= 0 ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${dayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {dayChange >= 0 ? '+' : ''}
                    {Number(dayChange).toFixed(2)} ({dayChangePercent >= 0 ? '+' : ''}
                    {Number(dayChangePercent).toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Price Chart */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {selectedSymbol} — {PERIODS.find((p) => p.value === period)?.label ?? period}
              </h3>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSMA20}
                    onChange={(e) => setShowSMA20(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-emerald-400">SMA 20</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSMA50}
                    onChange={(e) => setShowSMA50(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-blue-400">SMA 50</span>
                </label>
              </div>
            </div>
            {historyArray && historyArray.length > 0 ? (
              <div className="h-[400px]">
                <PriceChart data={historyArray} showSMA20={showSMA20} showSMA50={showSMA50} symbol={selectedSymbol} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-500">
                No chart data available
              </div>
            )}
          </div>

          {/* OHLCV Data Table */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-semibold text-white">Historical Data (Last 20 Records)</h3>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 sticky top-0 z-10">
                  <tr>
                    <th className="text-left text-slate-400 font-medium px-4 py-3">Date</th>
                    <th className="text-right text-slate-400 font-medium px-4 py-3">Open</th>
                    <th className="text-right text-slate-400 font-medium px-4 py-3">High</th>
                    <th className="text-right text-slate-400 font-medium px-4 py-3">Low</th>
                    <th className="text-right text-slate-400 font-medium px-4 py-3">Close</th>
                    <th className="text-right text-slate-400 font-medium px-4 py-3">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {last20.length > 0 ? (
                    last20.map((row, idx) => {
                      const date = row.date ?? row.Date ?? row.timestamp ?? '';
                      const open = row.open ?? row.Open ?? 0;
                      const high = row.high ?? row.High ?? 0;
                      const low = row.low ?? row.Low ?? 0;
                      const close = row.close ?? row.Close ?? 0;
                      const vol = row.volume ?? row.Volume ?? 0;
                      const formattedDate = date
                        ? new Date(date).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—';

                      return (
                        <tr
                          key={idx}
                          className={`border-t border-slate-700/50 ${
                            idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/50'
                          } hover:bg-slate-700/50 transition-colors`}
                        >
                          <td className="px-4 py-3 text-slate-300">{formattedDate}</td>
                          <td className="px-4 py-3 text-right text-slate-300">
                            {formatCurrency(open, selectedSymbol)}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-400">
                            {formatCurrency(high, selectedSymbol)}
                          </td>
                          <td className="px-4 py-3 text-right text-red-400">
                            {formatCurrency(low, selectedSymbol)}
                          </td>
                          <td className="px-4 py-3 text-right text-white font-medium">
                            {formatCurrency(close, selectedSymbol)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-400">{formatVolume(vol)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No historical data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock Details Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {[
              { label: 'Open', value: formatCurrency(openPrice, selectedSymbol), icon: DollarSign, color: 'text-slate-300' },
              { label: 'High', value: formatCurrency(dayHigh, selectedSymbol), icon: TrendingUp, color: 'text-emerald-400' },
              { label: 'Low', value: formatCurrency(dayLow, selectedSymbol), icon: TrendingDown, color: 'text-red-400' },
              { label: 'Close', value: formatCurrency(closePrice, selectedSymbol), icon: DollarSign, color: 'text-white' },
              { label: 'Volume', value: formatVolume(volume), icon: Activity, color: 'text-purple-400' },
              { label: '52W High', value: formatCurrency(weekHigh52, selectedSymbol), icon: TrendingUp, color: 'text-emerald-400' },
              { label: '52W Low', value: formatCurrency(weekLow52, selectedSymbol), icon: TrendingDown, color: 'text-red-400' },
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <p className="text-slate-400 text-xs font-medium">{item.label}</p>
                </div>
                <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StockAnalysis;
