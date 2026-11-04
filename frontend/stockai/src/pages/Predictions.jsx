import React, { useState, useEffect } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  Activity,
  Target,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { getStockPrediction, getStockQuote } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import StockSearch from '../components/StockSearch';

const formatCurrency = (value, symbol) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const isIndian = symbol && symbol.endsWith('.NS');
  const prefix = isIndian ? '₹' : '$';
  return `${prefix}${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {Number(entry.value).toFixed(2)}
        </p>
      ))}
    </div>
  );
};

const Predictions = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE.NS');
  const [prediction, setPrediction] = useState(null);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        setError(null);

        const [predRes, quoteRes] = await Promise.allSettled([
          getStockPrediction(selectedSymbol),
          getStockQuote(selectedSymbol),
        ]);

        if (predRes.status === 'fulfilled') {
          const data = predRes.value?.data ?? predRes.value;
          setPrediction(data);
        } else {
          setPrediction(null);
        }

        if (quoteRes.status === 'fulfilled') {
          const data = quoteRes.value?.data ?? quoteRes.value;
          setQuote(data);
        }

        if (predRes.status === 'rejected' && quoteRes.status === 'rejected') {
          setError('Unable to connect to StockAI backend. Please ensure the server is running.');
        }
      } catch (err) {
        setError('Unable to connect to StockAI backend. Please ensure the server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [selectedSymbol]);

  const handleStockSelect = (stockOrSymbol) => {
    const sym = typeof stockOrSymbol === 'string' ? stockOrSymbol : stockOrSymbol?.symbol;
    if (sym && sym !== selectedSymbol) {
      setSelectedSymbol(sym);
    }
  };

  const currentPrice = quote?.currentPrice ?? prediction?.currentPrice ?? quote?.regularMarketPrice ?? quote?.price ?? prediction?.current_price ?? 0;
  const predictedPrice = prediction?.predictedPrice ?? prediction?.predicted_price ?? prediction?.price ?? null;
  const changePercent = prediction?.predictedChange ?? prediction?.predicted_change_percent ?? prediction?.changePercent ?? prediction?.change_percent ?? null;
  const trend = prediction?.trend ?? prediction?.signal ?? 'Neutral';
  const r2Score = prediction?.modelAccuracy ?? prediction?.model_accuracy ?? prediction?.accuracy ?? prediction?.r2_score ?? null;
  const forecast = prediction?.predictions ?? prediction?.forecast ?? prediction?.five_day_forecast ?? [];
  const actualVsPredicted = prediction?.actualVsPredicted ?? prediction?.actual_vs_predicted ?? prediction?.comparison ?? prediction?.history ?? [];
  const featureImportance = prediction?.featureImportance ?? prediction?.feature_importance ?? prediction?.features ?? [];

  const trendLabel = trend?.toLowerCase?.() === 'bullish' || trend?.toLowerCase?.() === 'up'
    ? 'Bullish'
    : trend?.toLowerCase?.() === 'bearish' || trend?.toLowerCase?.() === 'down'
      ? 'Bearish'
      : 'Neutral';

  // Generate 5-day forecast if not provided
  const fiveDayForecast = forecast.length > 0
    ? forecast.slice(0, 5)
    : predictedPrice
      ? Array.from({ length: 5 }, (_, i) => {
          const dailyChange = changePercent ? changePercent / 5 : 0;
          const price = currentPrice * (1 + (dailyChange * (i + 1)) / 100);
          return {
            day: i + 1,
            price: Number(price.toFixed(2)),
            change: Number(((price - currentPrice) / currentPrice * 100).toFixed(2)),
          };
        })
      : [];

  // Generate actual vs predicted chart data if not provided
  const chartData = actualVsPredicted.length > 0
    ? actualVsPredicted.map((item, idx) => ({
        name: item.date ?? item.Date ?? `Day ${idx + 1}`,
        actual: item.actual ?? item.Actual ?? item.actual_price ?? 0,
        predicted: item.predicted ?? item.Predicted ?? item.predicted_price ?? 0,
      }))
    : [];

  // Feature importance data
  const featureData = Array.isArray(featureImportance)
    ? featureImportance
        .slice(0, 10)
        .map((f) => ({
          name: f.feature ?? f.name ?? f.label ?? 'Unknown',
          importance: Number(f.importance ?? f.value ?? f.score ?? 0),
        }))
        .sort((a, b) => b.importance - a.importance)
    : Object.entries(featureImportance || {})
        .slice(0, 10)
        .map(([name, importance]) => ({ name, importance: Number(importance) }))
        .sort((a, b) => b.importance - a.importance);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Brain className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">AI Predictions</h1>
          <p className="text-slate-400 text-sm">Machine learning powered stock price predictions</p>
        </div>
      </div>

      {/* Stock Search */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <StockSearch onSelect={handleStockSelect} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          {/* Main Prediction Card */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              {/* Current Price */}
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-2">Current Price</p>
                <p className="text-4xl font-bold text-white">
                  {formatCurrency(currentPrice, selectedSymbol)}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-slate-700/50 rounded-full animate-pulse">
                  <ArrowRight className="w-8 h-8 text-emerald-400" />
                </div>
                <span className="text-slate-500 text-xs">AI Forecast</span>
              </div>

              {/* Predicted Price */}
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-2">Predicted Price</p>
                <p className="text-4xl font-bold text-white">
                  {predictedPrice !== null ? formatCurrency(predictedPrice, selectedSymbol) : '—'}
                </p>
              </div>
            </div>

            {/* Change & Trend */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8 pt-6 border-t border-slate-700">
              {/* Percentage Change */}
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  changePercent !== null && changePercent >= 0
                    ? 'bg-emerald-500/10'
                    : 'bg-red-500/10'
                }`}
              >
                {changePercent !== null && changePercent >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
                <span
                  className={`text-xl font-bold ${
                    changePercent !== null && changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {changePercent !== null
                    ? `${changePercent >= 0 ? '+' : ''}${Number(changePercent).toFixed(2)}%`
                    : '—'}
                </span>
              </div>

              {/* Trend Badge */}
              <span
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold ${
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
          </div>

          {/* Model Performance */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Model Performance</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">R² Score (Accuracy)</span>
                  <span className="text-white font-bold text-lg">
                    {r2Score !== null
                      ? `${(r2Score <= 1 ? r2Score * 100 : r2Score).toFixed(1)}%`
                      : '—'}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-4">
                  <div
                    className="bg-emerald-500 h-4 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${r2Score !== null ? Math.min(100, Math.max(0, r2Score * (r2Score <= 1 ? 100 : 1))) : 0}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500 text-xs">0%</span>
                  <span className="text-slate-500 text-xs">50%</span>
                  <span className="text-slate-500 text-xs">100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5-Day Forecast */}
          {fiveDayForecast.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-white">5-Day Forecast</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {fiveDayForecast.map((item, idx) => {
                  const dayNum = item.day ?? idx + 1;
                  const price = item.predictedPrice ?? item.price ?? item.predicted_price ?? item.predicted ?? 0;
                  const change = item.predictedChange ?? item.change ?? item.change_percent ?? ((price - currentPrice) / currentPrice * 100);

                  return (
                    <div
                      key={idx}
                      className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 text-center hover:border-slate-600 transition-colors"
                    >
                      <p className="text-slate-500 text-xs font-medium mb-2">Day {dayNum}</p>
                      <p className="text-white font-bold text-lg mb-1">
                        {formatCurrency(price, selectedSymbol)}
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          change >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {change >= 0 ? '+' : ''}
                        {Number(change).toFixed(2)}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actual vs Predicted Chart */}
          {chartData.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Actual vs Predicted</h3>
              </div>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={{ stroke: '#475569' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={{ stroke: '#475569' }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ color: '#94a3b8', fontSize: 12, paddingTop: 10 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#10b981' }}
                      activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2 }}
                      name="Actual"
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3, fill: '#3b82f6' }}
                      activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
                      name="Predicted"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Feature Importance */}
          {featureData.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Brain className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Feature Importance</h3>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={featureData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={{ stroke: '#475569' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      axisLine={{ stroke: '#475569' }}
                      width={90}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="importance" radius={[0, 4, 4, 0]} name="Importance">
                      {featureData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-amber-400 font-semibold mb-1">Disclaimer</h4>
                <p className="text-amber-200/70 text-sm leading-relaxed">
                  These predictions are generated by machine learning models and are intended for
                  educational and informational purposes only. They should not be considered as
                  financial advice. Stock prices are influenced by numerous factors that models
                  cannot fully capture. Past performance does not guarantee future results. Always
                  conduct your own research and consult with a qualified financial advisor before
                  making investment decisions.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const BarChart3 = (props) => <BarChart3Icon {...props} />;
import { BarChart3 as BarChart3Icon } from 'lucide-react';

export default Predictions;
