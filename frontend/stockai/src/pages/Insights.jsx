import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  Eye,
  AlertTriangle,
  Shield,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { getStockInsights, getStockIndicators } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import StockSearch from '../components/StockSearch';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-sm font-medium" style={{ color: entry.color ?? entry.fill }}>
          {entry.name}: {Number(entry.value).toFixed(4)}
        </p>
      ))}
    </div>
  );
};

const Insights = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE.NS');
  const [insights, setInsights] = useState(null);
  const [indicators, setIndicators] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [insightsRes, indicatorsRes] = await Promise.allSettled([
          getStockInsights(selectedSymbol),
          getStockIndicators(selectedSymbol),
        ]);

        if (insightsRes.status === 'fulfilled') {
          const data = insightsRes.value?.data ?? insightsRes.value;
          setInsights(data);
        } else {
          setInsights(null);
        }

        if (indicatorsRes.status === 'fulfilled') {
          const data = indicatorsRes.value?.data ?? indicatorsRes.value;
          setIndicators(data);
        } else {
          setIndicators(null);
        }

        if (insightsRes.status === 'rejected' && indicatorsRes.status === 'rejected') {
          setError('Unable to connect to StockAI backend. Please ensure the server is running.');
        }
      } catch (err) {
        setError('Unable to connect to StockAI backend. Please ensure the server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSymbol]);

  const handleStockSelect = (stockOrSymbol) => {
    const sym = typeof stockOrSymbol === 'string' ? stockOrSymbol : stockOrSymbol?.symbol;
    if (sym && sym !== selectedSymbol) {
      setSelectedSymbol(sym);
    }
  };

  // Extract insights data
  const rawSentiment = insights?.marketSentiment ?? insights?.sentiment ?? insights?.market_sentiment ?? 'Neutral';
  const sentiment = typeof rawSentiment === 'object' ? (rawSentiment?.label ?? 'Neutral') : rawSentiment;
  const sentimentExplanation = typeof rawSentiment === 'object' 
    ? (rawSentiment?.explanation ?? '') 
    : (insights?.sentiment_explanation ?? insights?.sentimentDescription ?? insights?.explanation ?? '');

  const trendDescription = insights?.trendAnalysis ?? insights?.trend ?? insights?.trend_analysis ?? insights?.trendDescription ?? '';

  const rawRisk = insights?.riskLevel ?? insights?.risk_level ?? insights?.risk ?? 'Medium';
  const riskLevel = typeof rawRisk === 'object' ? (rawRisk?.label ?? 'Medium') : rawRisk;
  const riskExplanation = typeof rawRisk === 'object'
    ? (rawRisk?.explanation ?? '')
    : (insights?.risk_explanation ?? insights?.riskDescription ?? insights?.risk_description ?? '');

  const opportunities = insights?.opportunities ?? insights?.signals ?? [];
  const observations = insights?.observations ?? insights?.key_observations ?? insights?.keyObservations ?? [];

  // Extract indicator data
  const indList = Array.isArray(indicators?.indicators)
    ? indicators.indicators
    : Array.isArray(indicators)
      ? indicators
      : [];

  const rsiObj = indList.find(i => i.name?.includes('RSI')) || indicators?.rsi || indicators?.RSI || null;
  const rsiValue = typeof rsiObj === 'object' ? (rsiObj?.currentValue ?? rsiObj?.value ?? rsiObj?.current ?? null) : rsiObj;
  const rsiInterpretation = typeof rsiObj === 'object' ? (rsiObj?.interpretation ?? rsiObj?.signal ?? '') : '';

  const macdObj = indList.find(i => i.name === 'MACD') || indicators?.macd || indicators?.MACD || null;
  const macdValue = typeof macdObj === 'object' ? (macdObj?.currentValue ?? macdObj?.value ?? macdObj?.macd ?? null) : macdObj;
  const macdSignal = typeof macdObj === 'object' ? (macdObj?.signal ?? macdObj?.signal_line ?? null) : null;
  const macdHistogram = typeof macdObj === 'object' ? (macdObj?.histogram ?? macdObj?.hist ?? macdObj?.currentValue ?? null) : null;
  const macdInterpretation = typeof macdObj === 'object' ? (macdObj?.interpretation ?? macdObj?.signal_text ?? '') : '';
  const macdHistory = typeof macdObj === 'object' ? (macdObj?.history ?? []) : [];

  const sma20Obj = indList.find(i => i.name === 'SMA 20');
  const sma50Obj = indList.find(i => i.name === 'SMA 50');
  const sma = indicators?.sma ?? indicators?.SMA ?? null;
  const sma20 = sma20Obj?.currentValue ?? (typeof sma === 'object' ? (sma?.sma20 ?? sma?.SMA20 ?? sma?.['20'] ?? null) : null);
  const sma50 = sma50Obj?.currentValue ?? (typeof sma === 'object' ? (sma?.sma50 ?? sma?.SMA50 ?? sma?.['50'] ?? null) : null);
  const smaCrossover = sma20 && sma50 ? (sma20 > sma50 ? 'Golden Cross' : 'Death Cross') : (typeof sma === 'object' ? (sma?.crossover ?? sma?.signal ?? 'None') : 'None');

  const ema12Obj = indList.find(i => i.name === 'EMA 12');
  const ema26Obj = indList.find(i => i.name === 'EMA 26');
  const ema = indicators?.ema ?? indicators?.EMA ?? null;
  const ema12 = ema12Obj?.currentValue ?? (typeof ema === 'object' ? (ema?.ema12 ?? ema?.EMA12 ?? ema?.['12'] ?? null) : null);
  const ema26 = ema26Obj?.currentValue ?? (typeof ema === 'object' ? (ema?.ema26 ?? ema?.EMA26 ?? ema?.['26'] ?? null) : null);
  const emaInterpretation = ema12Obj?.interpretation ?? ema12Obj?.signal ?? (typeof ema === 'object' ? (ema?.interpretation ?? ema?.signal ?? '') : '');

  // Sentiment display helpers
  const sentimentNormalized = sentiment?.toLowerCase?.() ?? 'neutral';
  const sentimentEmoji = sentimentNormalized.includes('bull') || sentimentNormalized.includes('positive') || sentimentNormalized.includes('up')
    ? '📈'
    : sentimentNormalized.includes('bear') || sentimentNormalized.includes('negative') || sentimentNormalized.includes('down')
      ? '📉'
      : '➡️';
  const sentimentLabel = sentimentNormalized.includes('bull') || sentimentNormalized.includes('positive') || sentimentNormalized.includes('up')
    ? 'Bullish'
    : sentimentNormalized.includes('bear') || sentimentNormalized.includes('negative') || sentimentNormalized.includes('down')
      ? 'Bearish'
      : 'Neutral';
  const sentimentBg = sentimentLabel === 'Bullish'
    ? 'bg-emerald-500/5 border-emerald-500/30'
    : sentimentLabel === 'Bearish'
      ? 'bg-red-500/5 border-red-500/30'
      : 'bg-yellow-500/5 border-yellow-500/30';
  const sentimentTextColor = sentimentLabel === 'Bullish'
    ? 'text-emerald-400'
    : sentimentLabel === 'Bearish'
      ? 'text-red-400'
      : 'text-yellow-400';

  // Risk level helpers
  const riskNormalized = riskLevel?.toLowerCase?.() ?? 'medium';
  const riskBadgeColor = riskNormalized === 'low'
    ? 'bg-emerald-500/20 text-emerald-400'
    : riskNormalized === 'high'
      ? 'bg-red-500/20 text-red-400'
      : 'bg-amber-500/20 text-amber-400';

  // RSI helpers
  const rsiNum = Number(rsiValue);
  const rsiColor = rsiNum < 30 ? 'bg-emerald-500' : rsiNum > 70 ? 'bg-red-500' : 'bg-yellow-500';
  const rsiLabel = rsiNum < 30 ? 'Oversold' : rsiNum > 70 ? 'Overbought' : 'Neutral';

  // MACD histogram chart data
  const macdChartData = Array.isArray(macdHistory)
    ? macdHistory.slice(-20).map((item, idx) => ({
        name: item.date ?? `${idx + 1}`,
        value: item.histogram ?? item.hist ?? item.value ?? 0,
      }))
    : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <Lightbulb className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Market Insights</h1>
          <p className="text-slate-400 text-sm">AI-powered market analysis & technical indicators</p>
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
          {/* Top Row: Sentiment, Trend, Risk */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Market Sentiment */}
            <div className={`bg-slate-800 border rounded-xl p-6 ${sentimentBg}`}>
              <h3 className="text-slate-400 text-sm font-medium mb-4">Market Sentiment</h3>
              <div className="text-center mb-4">
                <span className="text-5xl">{sentimentEmoji}</span>
              </div>
              <p className={`text-center text-xl font-bold mb-2 ${sentimentTextColor}`}>
                {sentimentLabel}
              </p>
              {sentimentExplanation && (
                <p className="text-slate-400 text-sm text-center leading-relaxed">
                  {sentimentExplanation}
                </p>
              )}
            </div>

            {/* Trend Analysis */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <h3 className="text-slate-400 text-sm font-medium">Trend Analysis</h3>
              </div>
              <p className="text-white text-sm leading-relaxed">
                {trendDescription || 'Trend analysis data not available for this stock.'}
              </p>
            </div>

            {/* Risk Level */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-slate-400" />
                <h3 className="text-slate-400 text-sm font-medium">Risk Level</h3>
              </div>
              <div className="mb-3">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${riskBadgeColor}`}>
                  {riskLevel}
                </span>
              </div>
              {riskExplanation && (
                <p className="text-slate-400 text-sm leading-relaxed">{riskExplanation}</p>
              )}
            </div>
          </div>

          {/* Technical Indicators */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Technical Indicators
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* RSI Card */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">RSI (Relative Strength Index)</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    rsiNum < 30 ? 'bg-emerald-500/20 text-emerald-400' :
                    rsiNum > 70 ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {rsiLabel}
                  </span>
                </div>
                <p className="text-3xl font-bold text-white mb-4">
                  {rsiValue !== null ? Number(rsiValue).toFixed(2) : '—'}
                </p>
                {/* RSI Bar */}
                <div className="relative mb-3">
                  <div className="w-full h-3 rounded-full bg-slate-700 overflow-hidden flex">
                    <div className="w-[30%] h-full bg-emerald-500/30" />
                    <div className="w-[40%] h-full bg-yellow-500/30" />
                    <div className="w-[30%] h-full bg-red-500/30" />
                  </div>
                  {rsiValue !== null && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg border-2 border-slate-900"
                      style={{ left: `${Math.min(100, Math.max(0, rsiNum))}%`, transform: 'translate(-50%, -50%)' }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0 (Oversold)</span>
                  <span>50</span>
                  <span>100 (Overbought)</span>
                </div>
                {rsiInterpretation && (
                  <p className="text-slate-400 text-sm mt-3">{rsiInterpretation}</p>
                )}
              </div>

              {/* MACD Card */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">MACD</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">MACD</p>
                    <p className={`text-lg font-bold ${
                      macdValue !== null && Number(macdValue) >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {macdValue !== null ? Number(macdValue).toFixed(2) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Signal</p>
                    <p className="text-white text-lg font-bold">
                      {macdSignal !== null ? Number(macdSignal).toFixed(2) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Histogram</p>
                    <p className={`text-lg font-bold ${
                      macdHistogram !== null && Number(macdHistogram) >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {macdHistogram !== null ? Number(macdHistogram).toFixed(2) : '—'}
                    </p>
                  </div>
                </div>
                {macdInterpretation && (
                  <p className="text-slate-400 text-sm mb-3">{macdInterpretation}</p>
                )}
                {macdChartData.length > 0 && (
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={macdChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Histogram">
                          {macdChartData.map((entry, idx) => (
                            <Cell
                              key={idx}
                              fill={entry.value >= 0 ? '#10b981' : '#ef4444'}
                              fillOpacity={0.8}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* SMA Card */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">SMA (Simple Moving Average)</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">SMA 20</span>
                    <span className="text-white font-bold">
                      {sma20 !== null ? Number(sma20).toFixed(2) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">SMA 50</span>
                    <span className="text-white font-bold">
                      {sma50 !== null ? Number(sma50).toFixed(2) : '—'}
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-700">
                  <p className="text-slate-400 text-xs mb-2">Crossover Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                      smaCrossover === 'Golden Cross' || smaCrossover?.toLowerCase?.().includes('golden')
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : smaCrossover === 'Death Cross' || smaCrossover?.toLowerCase?.().includes('death')
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {smaCrossover === 'Golden Cross' || smaCrossover?.toLowerCase?.().includes('golden') ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : smaCrossover === 'Death Cross' || smaCrossover?.toLowerCase?.().includes('death') ? (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    ) : (
                      <Activity className="w-3.5 h-3.5" />
                    )}
                    {smaCrossover || 'None'}
                  </span>
                </div>
              </div>

              {/* EMA Card */}
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">EMA (Exponential Moving Average)</h3>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">EMA 12</span>
                    <span className="text-white font-bold">
                      {ema12 !== null ? Number(ema12).toFixed(2) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">EMA 26</span>
                    <span className="text-white font-bold">
                      {ema26 !== null ? Number(ema26).toFixed(2) : '—'}
                    </span>
                  </div>
                </div>
                {ema12 !== null && ema26 !== null && (
                  <div className="pt-3 border-t border-slate-700">
                    <p className="text-slate-400 text-xs mb-2">Signal</p>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                        Number(ema12) > Number(ema26)
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {Number(ema12) > Number(ema26) ? (
                        <>
                          <TrendingUp className="w-3.5 h-3.5" />
                          Bullish (EMA12 {'>'} EMA26)
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3.5 h-3.5" />
                          Bearish (EMA12 {'<'} EMA26)
                        </>
                      )}
                    </span>
                  </div>
                )}
                {emaInterpretation && (
                  <p className="text-slate-400 text-sm mt-3">{emaInterpretation}</p>
                )}
              </div>
            </div>
          </div>

          {/* Opportunities */}
          {Array.isArray(opportunities) && opportunities.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                Opportunities
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunities.map((opp, idx) => {
                  const oppText = typeof opp === 'string' ? opp : (opp?.description ?? opp?.text ?? opp?.title ?? '');
                  const oppTitle = typeof opp === 'object' ? (opp?.title ?? opp?.name ?? '') : '';

                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 bg-slate-900/50 border border-slate-700/50 rounded-lg p-4"
                    >
                      <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        {oppTitle && (
                          <p className="text-white font-medium text-sm mb-1">{oppTitle}</p>
                        )}
                        <p className="text-slate-300 text-sm">{oppText}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Key Observations */}
          {Array.isArray(observations) && observations.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-400" />
                Key Observations
              </h3>
              <div className="space-y-3">
                {observations.map((obs, idx) => {
                  const obsText = typeof obs === 'string' ? obs : (obs?.description ?? obs?.text ?? obs?.observation ?? '');

                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-700/30 transition-colors"
                    >
                      <Eye className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                      <p className="text-slate-300 text-sm leading-relaxed">{obsText}</p>
                    </div>
                  );
                })}
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
                  The insights and technical indicators presented here are generated by automated
                  analysis tools and AI models. They are for informational and educational purposes
                  only, and do not constitute financial advice. Always perform your own due
                  diligence and consult with a certified financial advisor before making any
                  investment decisions.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Insights;
