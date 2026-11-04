import React, { useState, useEffect, useCallback } from 'react';
import { Star, Plus, X, TrendingUp, TrendingDown, Loader2, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import StockSearch from '../components/StockSearch';
import { getStockQuote, getStockHistory } from '../services/api';

const STORAGE_KEY = 'stockai_watchlist';

const DEFAULT_WATCHLIST = ['RELIANCE.NS', 'TCS.NS', 'AAPL', 'NVDA'];

const loadWatchlist = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? JSON.parse(saved) : DEFAULT_WATCHLIST;
  } catch {
    return DEFAULT_WATCHLIST;
  }
};

const saveWatchlist = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

function MiniSparkline({ data, isPositive }) {
  if (!data || data.length === 0) return <div className="h-10 w-full" />;
  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={isPositive ? 'sparkGreen' : 'sparkRed'} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
            <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="close"
          stroke={isPositive ? '#10b981' : '#ef4444'}
          fill={`url(#${isPositive ? 'sparkGreen' : 'sparkRed'})`}
          strokeWidth={1.5}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function WatchlistCard({ symbol, data, sparkData, onRemove }) {
  const isPositive = data && data.percentChange >= 0;
  const isIndian = symbol.endsWith('.NS') || symbol.endsWith('.BO');
  const currencySymbol = isIndian ? '₹' : '$';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 relative group hover:border-slate-600 transition-colors">
      <button
        onClick={() => onRemove(symbol)}
        className="absolute top-3 right-3 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-white font-bold text-lg">{symbol.replace('.NS', '').replace('.BO', '')}</h3>
          <p className="text-slate-500 text-xs">{data?.name || symbol}</p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {data?.percentChange != null ? `${data.percentChange.toFixed(2)}%` : '—'}
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-3">
        {data?.currentPrice != null ? `${currencySymbol}${data.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'}
      </p>
      <MiniSparkline data={sparkData} isPositive={isPositive} />
      {data?.dayHigh != null && (
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>L: {currencySymbol}{data.dayLow?.toLocaleString()}</span>
          <span>H: {currencySymbol}{data.dayHigh?.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState(loadWatchlist);
  const [stockData, setStockData] = useState({});
  const [sparklines, setSparklines] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchAllData = useCallback(async () => {
    if (watchlist.length === 0) return;
    setLoading(true);
    const newData = {};
    const newSparks = {};
    await Promise.allSettled(
      watchlist.map(async (symbol) => {
        try {
          const quote = await getStockQuote(symbol);
          newData[symbol] = quote;
        } catch { /* skip */ }
        try {
          const hist = await getStockHistory(symbol, '5d');
          newSparks[symbol] = hist.data || hist.history || hist;
        } catch { /* skip */ }
      })
    );
    setStockData(prev => ({ ...prev, ...newData }));
    setSparklines(prev => ({ ...prev, ...newSparks }));
    setLoading(false);
  }, [watchlist]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (watchlist.length === 0) return;
    const interval = setInterval(fetchAllData, 60000);
    return () => clearInterval(interval);
  }, [watchlist, fetchAllData]);

  const addStock = (stock) => {
    const sym = typeof stock === 'string' ? stock : stock?.symbol;
    if (!sym || watchlist.includes(sym)) return;
    const updated = [...watchlist, sym];
    setWatchlist(updated);
    saveWatchlist(updated);
    setShowAddModal(false);
  };

  const removeStock = (symbol) => {
    const updated = watchlist.filter(s => s !== symbol);
    setWatchlist(updated);
    saveWatchlist(updated);
    const newData = { ...stockData };
    delete newData[symbol];
    setStockData(newData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Star className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">My Watchlist</h1>
            <p className="text-slate-400 text-sm">{watchlist.length} stock{watchlist.length !== 1 ? 's' : ''} tracked</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAllData} disabled={loading || watchlist.length === 0} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" />
            Add Stock
          </button>
        </div>
      </div>

      {loading && watchlist.length > 0 && Object.keys(stockData).length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="ml-3 text-slate-400">Loading watchlist data...</span>
        </div>
      )}

      {watchlist.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {watchlist.map(symbol => (
            <WatchlistCard
              key={symbol}
              symbol={symbol}
              data={stockData[symbol]}
              sparkData={sparklines[symbol]}
              onRemove={removeStock}
            />
          ))}
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-16 text-center">
          <Star className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-300 mb-2">Your watchlist is empty</h3>
          <p className="text-slate-500 mb-6">Add stocks to track their performance and price changes</p>
          <button onClick={() => setShowAddModal(true)} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Your First Stock
          </button>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Add Stock to Watchlist</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <StockSearch onSelect={addStock} placeholder="Search for a stock..." />
            <p className="text-slate-500 text-xs mt-3">Select a stock from the search results to add it to your watchlist.</p>
          </div>
        </div>
      )}
    </div>
  );
}

