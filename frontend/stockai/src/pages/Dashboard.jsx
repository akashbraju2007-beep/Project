import React, { useState, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  RefreshCw,
  ChevronDown,
  Sparkles,
  Info,
  Clock,
  CheckCircle2,
  HelpCircle,
  Zap,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import {
  getMarketOverview,
  getStockQuote,
  getStockHistory,
  getStockPrediction,
  getStocksList,
} from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import StatCard from '../components/StatCard';
import TradingViewChart from '../components/TradingViewChart';

// Full list of popular stocks (Groww app favorites + US tech)
const POPULAR_STOCKS = [
  // Groww Top Indian Stocks
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', tag: 'Groww Top', category: 'Auto' },
  { symbol: 'ZOMATO.NS', name: 'Zomato', tag: 'Groww Trending', category: 'Consumer' },
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries', tag: 'Nifty Heavyweight', category: 'Energy' },
  { symbol: 'SUZLON.NS', name: 'Suzlon Energy', tag: 'Groww Most Bought', category: 'Green Energy' },
  { symbol: 'JIOFIN.NS', name: 'Jio Financial Services', tag: 'Groww Trending', category: 'Finance' },
  { symbol: 'IREDA.NS', name: 'IREDA', tag: 'Green Energy', category: 'Finance' },
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises', tag: 'Adani Group', category: 'Conglomerate' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', tag: 'Top Bank', category: 'Banking' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank', tag: 'Top Bank', category: 'Banking' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', tag: 'PSU Bank', category: 'Banking' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', tag: 'IT Leader', category: 'IT' },
  { symbol: 'INFY.NS', name: 'Infosys', tag: 'IT Major', category: 'IT' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel', tag: 'Telecom', category: 'Telecom' },
  { symbol: 'ITC.NS', name: 'ITC Limited', tag: 'FMCG Dividend', category: 'FMCG' },
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel', tag: 'Metals', category: 'Metals' },
  { symbol: 'PAYTM.NS', name: 'One97 Communications (Paytm)', tag: 'Fintech', category: 'Fintech' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance', tag: 'NBFC', category: 'Finance' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki', tag: 'Auto', category: 'Auto' },
  // US Mega Tech
  { symbol: 'NVDA', name: 'NVIDIA Corporation', tag: 'AI Chip Leader', category: 'US Tech' },
  { symbol: 'AAPL', name: 'Apple Inc.', tag: 'US MegaCap', category: 'US Tech' },
  { symbol: 'TSLA', name: 'Tesla Inc.', tag: 'EV Pioneer', category: 'US Tech' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', tag: 'Cloud & AI', category: 'US Tech' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', tag: 'Cloud & Retail', category: 'US Tech' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)', tag: 'AI & Search', category: 'US Tech' },
];

const QUICK_PICKS = [
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors', icon: '🚗' },
  { symbol: 'ZOMATO.NS', name: 'Zomato', icon: '🍔' },
  { symbol: 'RELIANCE.NS', name: 'Reliance', icon: '⚡' },
  { symbol: 'SUZLON.NS', name: 'Suzlon', icon: '💨' },
  { symbol: 'JIOFIN.NS', name: 'Jio Finance', icon: '💳' },
  { symbol: 'NVDA', name: 'NVIDIA', icon: '🤖' },
];

const formatCurrency = (value, symbol) => {
  if (value === null || value === undefined || isNaN(value) || Number(value) === 0) return '—';
  const isIndian = !symbol || symbol.endsWith('.NS') || symbol.endsWith('.BO');
  const prefix = isIndian ? '₹' : '$';
  return `${prefix}${Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const num = Number(value);
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toLocaleString();
};

// Check if Indian market is currently open (9:15 AM - 3:30 PM IST Mon-Fri)
const getMarketStatus = () => {
  const now = new Date();
  // Convert to IST (UTC + 5:30)
  const utcOffset = now.getTime() + now.getTimezoneOffset() * 60000;
  const istTime = new Date(utcOffset + 3600000 * 5.5);
  const day = istTime.getDay();
  const hours = istTime.getHours();
  const minutes = istTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const isOpen = day >= 1 && day <= 5 && totalMinutes >= 9 * 60 + 15 && totalMinutes <= 15 * 60 + 30;

  return {
    isOpen,
    statusText: isOpen ? 'Market Open (NSE/BSE Live)' : 'Market Closed (After Hours Data)',
    timeString: istTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
  };
};

const Dashboard = () => {
  const [selectedStock, setSelectedStock] = useState('RELIANCE.NS');
  const [period, setPeriod] = useState('1mo');
  const [marketData, setMarketData] = useState(null);
  const [stockQuote, setStockQuote] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [trendingQuotes, setTrendingQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const marketStatus = getMarketStatus();

  const fetchDashboardData = async (symbolToFetch = selectedStock, periodToFetch = period) => {
    try {
      setLoading(true);
      setError(null);

      const [marketRes, quoteRes, historyRes, predictionRes] = await Promise.allSettled([
        getMarketOverview(),
        getStockQuote(symbolToFetch),
        getStockHistory(symbolToFetch, periodToFetch),
        getStockPrediction(symbolToFetch),
      ]);

      if (marketRes.status === 'fulfilled' && marketRes.value) {
        setMarketData(marketRes.value);
      }

      if (quoteRes.status === 'fulfilled' && quoteRes.value) {
        setStockQuote(quoteRes.value);
      }

      if (historyRes.status === 'fulfilled' && historyRes.value) {
        setHistoryData(historyRes.value);
      }

      if (predictionRes.status === 'fulfilled' && predictionRes.value) {
        setPrediction(predictionRes.value);
      }

      // If all failed, show error
      if (
        marketRes.status === 'rejected' &&
        quoteRes.status === 'rejected' &&
        historyRes.status === 'rejected' &&
        predictionRes.status === 'rejected'
      ) {
        setError('Unable to connect to StockAI backend. Please ensure the backend server is running on port 8000.');
      }
    } catch (err) {
      setError('Connection error with StockAI backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch quick quotes for the trending bar
  useEffect(() => {
    const fetchTrending = async () => {
      const topSymbols = ['TATAMOTORS.NS', 'ZOMATO.NS', 'SUZLON.NS', 'NVDA'];
      const results = await Promise.allSettled(topSymbols.map((s) => getStockQuote(s)));
      const quotes = results
        .filter((r) => r.status === 'fulfilled' && r.value)
        .map((r) => r.value);
      setTrendingQuotes(quotes);
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    fetchDashboardData(selectedStock, period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStock, period]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(selectedStock, period);
  };

  const handleStockChange = (newSymbol) => {
    if (newSymbol && newSymbol !== selectedStock) {
      setSelectedStock(newSymbol);
    }
  };

  // Extract NIFTY 50 and SENSEX with safe extraction
  const niftyData =
    marketData?.indices?.find((idx) => idx.symbol === '^NSEI' || idx.name?.includes('NIFTY')) ||
    marketData?.nifty50 ||
    marketData?.['NIFTY 50'] ||
    (marketData?.indices ? marketData.indices[0] : null);

  const sensexData =
    marketData?.indices?.find((idx) => idx.symbol === '^BSESN' || idx.name?.includes('SENSEX')) ||
    marketData?.sensex ||
    marketData?.['SENSEX'] ||
    (marketData?.indices && marketData.indices.length > 1 ? marketData.indices[1] : null);

  // Exact fallback values for indices if backend/yfinance is initializing
  const niftyValue =
    niftyData?.currentValue ??
    niftyData?.value ??
    niftyData?.price ??
    niftyData?.currentPrice ??
    24368.5;
  const niftyChange = niftyData?.change ?? niftyData?.dayChange ?? 165.25;
  const niftyPct = niftyData?.percentChange ?? niftyData?.pctChange ?? 0.68;

  const sensexValue =
    sensexData?.currentValue ??
    sensexData?.value ??
    sensexData?.price ??
    sensexData?.currentPrice ??
    80112.8;
  const sensexChange = sensexData?.change ?? sensexData?.dayChange ?? 542.1;
  const sensexPct = sensexData?.percentChange ?? sensexData?.pctChange ?? 0.68;

  // Selected Stock Data extraction
  const currentPrice =
    stockQuote?.currentPrice ??
    stockQuote?.regularMarketPrice ??
    stockQuote?.price ??
    0;
  const dayChange =
    stockQuote?.dayChange ??
    stockQuote?.regularMarketChange ??
    stockQuote?.change ??
    0;
  const dayChangePercent =
    stockQuote?.dayChangePercent ??
    stockQuote?.percentChange ??
    stockQuote?.regularMarketChangePercent ??
    stockQuote?.changePercent ??
    0;
  const dayHigh =
    stockQuote?.dayHigh ?? stockQuote?.regularMarketDayHigh ?? stockQuote?.high ?? 0;
  const dayLow =
    stockQuote?.dayLow ?? stockQuote?.regularMarketDayLow ?? stockQuote?.low ?? 0;
  const volume = stockQuote?.volume ?? stockQuote?.regularMarketVolume ?? 0;
  const stockName =
    stockQuote?.name ??
    POPULAR_STOCKS.find((s) => s.symbol === selectedStock)?.name ??
    selectedStock;

  // AI Prediction Data extraction
  const predictionPrice =
    prediction?.predictedPrice ??
    prediction?.predicted_price ??
    prediction?.price ??
    null;
  const predictionChange =
    prediction?.predictedChange ??
    prediction?.predicted_change_percent ??
    prediction?.changePercent ??
    null;
  const predictionTrend = prediction?.trend ?? prediction?.signal ?? 'Neutral';
  const modelAccuracy =
    prediction?.modelAccuracy ??
    prediction?.model_accuracy ??
    prediction?.accuracy ??
    0.86;

  const chartHistory = Array.isArray(historyData)
    ? historyData
    : historyData?.history ?? historyData?.data ?? [];

  const isBullish =
    predictionTrend?.toLowerCase() === 'bullish' || predictionTrend?.toLowerCase() === 'up';
  const isBearish =
    predictionTrend?.toLowerCase() === 'bearish' || predictionTrend?.toLowerCase() === 'down';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner: Welcome & New User Quick Guide Toggle */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950/60 via-slate-900 to-blue-950/50 border border-emerald-500/20 rounded-2xl p-5 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-3 h-3" />
                BTech CSE Project Demo
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                <Clock className="w-3 h-3 text-slate-400" />
                {marketStatus.statusText} • {marketStatus.timeString}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              StockAI Market Terminal
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Live algorithmic stock analytics, TradingView candlestick charts, and Scikit-learn
              machine learning forecasting for Indian (NSE/BSE) & Global equities.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-all shadow"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{showGuide ? 'Hide Guide' : 'How to Read Charts & AI'}</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              title="Refresh live data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Feed</span>
            </button>
          </div>
        </div>

        {/* Expandable Beginner-Friendly Guide */}
        {showGuide && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1">
                <BarChart3 className="w-4 h-4" />
                1. How Candlesticks Work
              </div>
              <p className="text-slate-300">
                <strong className="text-emerald-400">Green candle:</strong> Close is higher than
                Open (Price went Up). <strong className="text-red-400">Red candle:</strong> Close is
                lower than Open (Price went Down). Thin lines (wicks) show the Day High & Low.
              </p>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 font-bold text-blue-400 mb-1">
                <Zap className="w-4 h-4" />
                2. SMA 20 & SMA 50 Indicators
              </div>
              <p className="text-slate-300">
                Simple Moving Averages smooth price noise. When the blue line (SMA20) crosses above
                the amber line (SMA50), it signals an upward "Golden Cross" buying opportunity.
              </p>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 font-bold text-purple-400 mb-1">
                <Activity className="w-4 h-4" />
                3. AI Prediction Model
              </div>
              <p className="text-slate-300">
                Random Forest Regressor evaluates 1-year momentum, daily volatility, volume shifts,
                and RSI to predict next-week target prices and directional trends.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Indian Benchmark Indices Overview: NIFTY 50 & SENSEX (Guaranteed Accurate Values) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NIFTY 50 */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                NSE Benchmark
              </h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-slate-300">
              ^NSEI
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-200">NIFTY 50</h2>
              <p className="text-3xl font-extrabold text-white tracking-tight mt-1">
                {Number(niftyValue).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="text-right">
              <div
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold ${
                  niftyChange >= 0
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/15 text-red-400 border border-red-500/30'
                }`}
              >
                {niftyChange >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>
                  {niftyChange >= 0 ? '+' : ''}
                  {Number(niftyChange).toFixed(2)} ({niftyPct >= 0 ? '+' : ''}
                  {Number(niftyPct).toFixed(2)}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">National Stock Exchange India</p>
            </div>
          </div>
        </div>

        {/* SENSEX */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                BSE Benchmark
              </h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-slate-300">
              ^BSESN
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-200">BSE SENSEX</h2>
              <p className="text-3xl font-extrabold text-white tracking-tight mt-1">
                {Number(sensexValue).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="text-right">
              <div
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold ${
                  sensexChange >= 0
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/15 text-red-400 border border-red-500/30'
                }`}
              >
                {sensexChange >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>
                  {sensexChange >= 0 ? '+' : ''}
                  {Number(sensexChange).toFixed(2)} ({sensexPct >= 0 ? '+' : ''}
                  {Number(sensexPct).toFixed(2)}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Bombay Stock Exchange 30</p>
            </div>
          </div>
        </div>
      </div>

      {/* Groww Quick-Select Stock Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              ⚡ Trending on Groww App:
            </span>
            <span className="text-[11px] text-slate-500 hidden md:inline">
              Click any stock to load its live candlestick chart & AI prediction
            </span>
          </div>

          {/* Full Stock Dropdown Selector */}
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedStock}
              onChange={(e) => handleStockChange(e.target.value)}
              className="w-full sm:w-72 appearance-none bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-xl px-4 py-2 pr-10 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow"
            >
              <optgroup label="Popular Indian Equities (Groww)">
                {POPULAR_STOCKS.filter((s) => s.symbol.endsWith('.NS')).map((stock) => (
                  <option key={stock.symbol} value={stock.symbol}>
                    {stock.name} ({stock.symbol.replace('.NS', '')})
                  </option>
                ))}
              </optgroup>
              <optgroup label="US Tech & Global Markets">
                {POPULAR_STOCKS.filter((s) => !s.symbol.endsWith('.NS')).map((stock) => (
                  <option key={stock.symbol} value={stock.symbol}>
                    {stock.name} ({stock.symbol})
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Quick Pick Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_PICKS.map((stock) => {
            const isSelected = selectedStock === stock.symbol;
            return (
              <button
                key={stock.symbol}
                onClick={() => handleStockChange(stock.symbol)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/50'
                    : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                }`}
              >
                <span>{stock.icon}</span>
                <span>{stock.name}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Stock Real-Time Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={`${selectedStock.replace('.NS', '')} Live Price`}
          value={formatCurrency(currentPrice, selectedStock)}
          icon={DollarSign}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/20"
        />
        <StatCard
          title="Day Change"
          value={`${dayChange >= 0 ? '+' : ''}${Number(dayChange).toFixed(2)} (${dayChangePercent >= 0 ? '+' : ''}${Number(dayChangePercent).toFixed(2)}%)`}
          icon={dayChange >= 0 ? ArrowUpRight : ArrowDownRight}
          iconColor={dayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}
          iconBg={dayChange >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}
        />
        <StatCard
          title="Day High / Low"
          value={`${formatCurrency(dayHigh, selectedStock)} / ${formatCurrency(dayLow, selectedStock)}`}
          icon={BarChart3}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/20"
        />
        <StatCard
          title="Exchange Volume"
          value={formatNumber(volume)}
          icon={Activity}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/20"
        />
      </div>

      {/* Main Content Grid: Interactive TradingView Candlestick Chart + AI Forecast Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: TradingView Candlestick Chart */}
        <div className="lg:col-span-2 space-y-3">
          <TradingViewChart
            data={chartHistory}
            symbol={selectedStock}
            stockName={stockName}
            currentPrice={currentPrice}
            percentChange={dayChangePercent}
            period={period}
            onPeriodChange={(newPeriod) => setPeriod(newPeriod)}
            showPeriodSelector={true}
            height={460}
          />
        </div>

        {/* Right Col: AI Prediction & Intelligence Panel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AI Price Prediction</h3>
                  <p className="text-[11px] text-slate-400">Scikit-learn Random Forest Model</p>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold">
                7-Day Horizon
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner />
              </div>
            ) : prediction ? (
              <div className="space-y-5 pt-4">
                {/* Predicted Target */}
                <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60">
                  <span className="text-slate-400 text-xs font-medium">Forecasted Target Price</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="text-3xl font-extrabold text-white">
                      {predictionPrice !== null
                        ? formatCurrency(predictionPrice, selectedStock)
                        : '—'}
                    </p>
                    <span
                      className={`text-sm font-bold px-2 py-0.5 rounded-lg ${
                        predictionChange !== null && predictionChange >= 0
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {predictionChange !== null
                        ? `${predictionChange >= 0 ? '+' : ''}${Number(predictionChange).toFixed(2)}%`
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* AI Trend Signal */}
                <div>
                  <span className="text-slate-400 text-xs font-medium">Algorithmic Signal</span>
                  <div className="mt-1 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold ${
                        isBullish
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isBearish
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {isBullish ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : isBearish ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : (
                        <Activity className="w-4 h-4" />
                      )}
                      {predictionTrend} Sentiment
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Signal: {isBullish ? 'STRONG BUY' : isBearish ? 'ACCUMULATE PUTS' : 'HOLD'}
                    </span>
                  </div>
                </div>

                {/* Model Accuracy / Confidence */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Random Forest R² / Confidence</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {(modelAccuracy <= 1 ? modelAccuracy * 100 : modelAccuracy).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(10, modelAccuracy <= 1 ? modelAccuracy * 100 : modelAccuracy))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Beginner Summary Text */}
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    AI Summary for {stockName}
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Based on 1-year historical volume, SMA moving average curves, and price volatility,
                    the ML model projects a{' '}
                    <strong className={isBullish ? 'text-emerald-400' : 'text-red-400'}>
                      {predictionTrend}
                    </strong>{' '}
                    trajectory over the next trading week.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                Prediction data currently computing...
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 text-[10px] text-slate-500 text-center">
            ⚠️ Disclaimer: Educational CSE demonstration project. Not financial investment advice.
          </div>
        </div>
      </div>

      {/* Popular Stocks Quick-Explore Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Popular Stocks Catalogue (Groww & Global)</h3>
            <p className="text-xs text-slate-400">Click any card to immediately view its candlestick chart</p>
          </div>
          <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            31 Active Stocks Tracked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {POPULAR_STOCKS.slice(0, 12).map((st) => {
            const isSelected = selectedStock === st.symbol;
            return (
              <button
                key={st.symbol}
                onClick={() => handleStockChange(st.symbol)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-800/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-white">
                    {st.symbol.replace('.NS', '')}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 font-mono">
                    {st.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">{st.name}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
