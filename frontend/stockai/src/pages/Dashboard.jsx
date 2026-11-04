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
} from 'lucide-react';
import { getMarketOverview, getStockQuote, getStockHistory, getStockPrediction } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import StatCard from '../components/StatCard';
import PriceChart from '../components/PriceChart';

const POPULAR_STOCKS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever' },
  { symbol: 'ITC.NS', name: 'ITC Limited' },
  { symbol: 'SBIN.NS', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
  { symbol: 'WIPRO.NS', name: 'Wipro' },
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
];

const formatCurrency = (value, symbol) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const isIndian = symbol && symbol.endsWith('.NS');
  const prefix = isIndian ? '₹' : '$';
  return `${prefix}${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return Number(value).toLocaleString();
};

const Dashboard = () => {
  const [marketData, setMarketData] = useState(null);
  const [selectedStock, setSelectedStock] = useState('RELIANCE.NS');
  const [stockQuote, setStockQuote] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSMA20, setShowSMA20] = useState(false);
  const [showSMA50, setShowSMA50] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [marketRes, quoteRes, historyRes, predictionRes] = await Promise.allSettled([
        getMarketOverview(),
        getStockQuote(selectedStock),
        getStockHistory(selectedStock, '1mo'),
        getStockPrediction(selectedStock),
      ]);

      if (marketRes.status === 'fulfilled' && marketRes.value && marketRes.value.data) {
        setMarketData(marketRes.value.data);
      } else if (marketRes.status === 'fulfilled' && marketRes.value) {
        setMarketData(marketRes.value);
      }

      if (quoteRes.status === 'fulfilled' && quoteRes.value && quoteRes.value.data) {
        setStockQuote(quoteRes.value.data);
      } else if (quoteRes.status === 'fulfilled' && quoteRes.value) {
        setStockQuote(quoteRes.value);
      }

      if (historyRes.status === 'fulfilled' && historyRes.value && historyRes.value.data) {
        setHistoryData(historyRes.value.data);
      } else if (historyRes.status === 'fulfilled' && historyRes.value) {
        setHistoryData(historyRes.value);
      }

      if (predictionRes.status === 'fulfilled' && predictionRes.value && predictionRes.value.data) {
        setPrediction(predictionRes.value.data);
      } else if (predictionRes.status === 'fulfilled' && predictionRes.value) {
        setPrediction(predictionRes.value);
      }

      const allFailed =
        marketRes.status === 'rejected' &&
        quoteRes.status === 'rejected' &&
        historyRes.status === 'rejected' &&
        predictionRes.status === 'rejected';

      if (allFailed) {
        setError('Unable to connect to StockAI backend. Please ensure the server is running.');
      }
    } catch (err) {
      setError('Unable to connect to StockAI backend. Please ensure the server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStock]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const niftyData = marketData?.indices?.find((idx) => idx.symbol === '^NSEI') ||
    marketData?.nifty50 ||
    marketData?.['NIFTY 50'] ||
    (marketData?.indices ? marketData.indices[0] : null);

  const sensexData = marketData?.indices?.find((idx) => idx.symbol === '^BSESN') ||
    marketData?.sensex ||
    marketData?.['SENSEX'] ||
    (marketData?.indices && marketData.indices.length > 1 ? marketData.indices[1] : null);

  const currentPrice = stockQuote?.currentPrice ?? stockQuote?.regularMarketPrice ?? stockQuote?.price ?? 0;
  const dayChange = stockQuote?.dayChange ?? stockQuote?.regularMarketChange ?? stockQuote?.change ?? 0;
  const dayChangePercent = stockQuote?.dayChangePercent ?? stockQuote?.regularMarketChangePercent ?? stockQuote?.changePercent ?? 0;
  const dayHigh = stockQuote?.dayHigh ?? stockQuote?.regularMarketDayHigh ?? stockQuote?.high ?? 0;
  const dayLow = stockQuote?.dayLow ?? stockQuote?.regularMarketDayLow ?? stockQuote?.low ?? 0;
  const volume = stockQuote?.volume ?? stockQuote?.regularMarketVolume ?? 0;

  const predictionPrice = prediction?.predictedPrice ?? prediction?.predicted_price ?? prediction?.price ?? null;
  const predictionChange = prediction?.predictedChange ?? prediction?.predicted_change_percent ?? prediction?.changePercent ?? prediction?.change_percent ?? null;
  const predictionTrend = prediction?.trend ?? prediction?.signal ?? 'Neutral';
  const modelAccuracy = prediction?.modelAccuracy ?? prediction?.model_accuracy ?? prediction?.accuracy ?? prediction?.r2_score ?? null;
  const chartHistory = Array.isArray(historyData) ? historyData : historyData?.history ?? historyData?.data ?? [];

  const trendLabel = predictionTrend?.toLowerCase?.() === 'bullish' || predictionTrend?.toLowerCase?.() === 'up'
    ? 'Bullish'
    : predictionTrend?.toLowerCase?.() === 'bearish' || predictionTrend?.toLowerCase?.() === 'down'
      ? 'Bearish'
      : 'Neutral';

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !marketData && !stockQuote) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 text-sm">Real-time market overview & AI insights</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer"
            >
              {POPULAR_STOCKS.map((stock) => (
                <option key={stock.symbol} value={stock.symbol}>
                  {stock.symbol} — {stock.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NIFTY 50 Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-400 text-sm font-medium">NIFTY 50</h3>
            {niftyData && (niftyData.change ?? niftyData.dayChange ?? 0) >= 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
          </div>
          <p className="text-2xl font-bold text-white">
            {niftyData
              ? Number(niftyData.value ?? niftyData.currentPrice ?? niftyData.price ?? 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : '—'}
          </p>
          {niftyData && (
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-sm font-medium ${
                  (niftyData.change ?? niftyData.dayChange ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {(niftyData.change ?? niftyData.dayChange ?? 0) >= 0 ? '+' : ''}
                {Number(niftyData.change ?? niftyData.dayChange ?? 0).toFixed(2)}
              </span>
              <span
                className={`text-sm ${
                  (niftyData.changePercent ?? niftyData.percentChange ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                ({(niftyData.changePercent ?? niftyData.percentChange ?? 0) >= 0 ? '+' : ''}
                {Number(niftyData.changePercent ?? niftyData.percentChange ?? 0).toFixed(2)}%)
              </span>
            </div>
          )}
        </div>

        {/* SENSEX Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-400 text-sm font-medium">SENSEX</h3>
            {sensexData && (sensexData.change ?? sensexData.dayChange ?? 0) >= 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
          </div>
          <p className="text-2xl font-bold text-white">
            {sensexData
              ? Number(sensexData.value ?? sensexData.currentPrice ?? sensexData.price ?? 0).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : '—'}
          </p>
          {sensexData && (
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-sm font-medium ${
                  (sensexData.change ?? sensexData.dayChange ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {(sensexData.change ?? sensexData.dayChange ?? 0) >= 0 ? '+' : ''}
                {Number(sensexData.change ?? sensexData.dayChange ?? 0).toFixed(2)}
              </span>
              <span
                className={`text-sm ${
                  (sensexData.changePercent ?? sensexData.percentChange ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                ({(sensexData.changePercent ?? sensexData.percentChange ?? 0) >= 0 ? '+' : ''}
                {Number(sensexData.changePercent ?? sensexData.percentChange ?? 0).toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stock Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Current Price"
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
          title="Volume"
          value={formatNumber(volume)}
          icon={Activity}
          iconColor="text-purple-400"
          iconBg="bg-purple-500/20"
        />
      </div>

      {/* Main Content: Chart + Prediction */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Price Chart */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Price Chart</h3>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setShowSMA20(!showSMA20)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    showSMA20 ? 'bg-emerald-500' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      showSMA20 ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="text-sm text-slate-400">SMA20</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setShowSMA50(!showSMA50)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    showSMA50 ? 'bg-blue-500' : 'bg-slate-600'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      showSMA50 ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
                <span className="text-sm text-slate-400">SMA50</span>
              </label>
            </div>
          </div>
          {chartHistory && chartHistory.length > 0 ? (
            <PriceChart data={chartHistory} showSMA20={showSMA20} showSMA50={showSMA50} symbol={selectedStock} />
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500">
              No chart data available
            </div>
          )}
        </div>

        {/* Right: AI Prediction Summary */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">AI Prediction</h3>
          </div>

          {prediction ? (
            <div className="space-y-5">
              <div>
                <p className="text-slate-400 text-sm mb-1">Predicted Price</p>
                <p className="text-3xl font-bold text-white">
                  {predictionPrice !== null ? formatCurrency(predictionPrice, selectedStock) : '—'}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-1">Expected Change</p>
                <p
                  className={`text-xl font-semibold ${
                    predictionChange !== null && predictionChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {predictionChange !== null
                    ? `${predictionChange >= 0 ? '+' : ''}${Number(predictionChange).toFixed(2)}%`
                    : '—'}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-2">Trend</p>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                    trendLabel === 'Bullish'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : trendLabel === 'Bearish'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {trendLabel === 'Bullish' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : trendLabel === 'Bearish' ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : (
                    <Activity className="w-4 h-4" />
                  )}
                  {trendLabel}
                </span>
              </div>

              <div>
                <p className="text-slate-400 text-sm mb-1">Model Accuracy</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${modelAccuracy !== null ? Math.min(100, Math.max(0, modelAccuracy * (modelAccuracy <= 1 ? 100 : 1))) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-white text-sm font-medium">
                    {modelAccuracy !== null
                      ? `${(modelAccuracy <= 1 ? modelAccuracy * 100 : modelAccuracy).toFixed(1)}%`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
              No prediction data available
            </div>
          )}
        </div>
      </div>

      {/* Market Trend */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Market Trend</h3>
            <p className="text-slate-400 text-sm">
              Overall market sentiment based on AI analysis for {selectedStock}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                trendLabel === 'Bullish'
                  ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50'
                  : trendLabel === 'Bearish'
                    ? 'bg-red-400 shadow-lg shadow-red-400/50'
                    : 'bg-yellow-400 shadow-lg shadow-yellow-400/50'
              }`}
            />
            <span
              className={`text-lg font-semibold ${
                trendLabel === 'Bullish'
                  ? 'text-emerald-400'
                  : trendLabel === 'Bearish'
                    ? 'text-red-400'
                    : 'text-yellow-400'
              }`}
            >
              {trendLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
