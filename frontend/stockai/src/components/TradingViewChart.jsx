import React, { useState, useMemo, useRef } from 'react';
import {
  CandlestickChart,
  LineChart as LineIcon,
  Maximize2,
  Minimize2,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff
} from 'lucide-react';

export default function TradingViewChart({
  data = [],
  symbol = 'RELIANCE.NS',
  stockName = 'Stock',
  currentPrice = 0,
  percentChange = 0,
  height = 460,
  period = '1mo',
  onPeriodChange = null,
  showPeriodSelector = false,
}) {
  const [chartType, setChartType] = useState('candles'); // 'candles' | 'line'
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const isIndian = !symbol || symbol.endsWith('.NS') || symbol.endsWith('.BO');
  const currencySymbol = isIndian ? '₹' : '$';

  // Sort and sanitize data
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    return data
      .filter((d) => d && d.close !== null && !isNaN(d.close))
      .map((d) => ({
        date: d.date,
        open: Number(d.open ?? d.close),
        high: Number(d.high ?? Math.max(d.open ?? d.close, d.close)),
        low: Number(d.low ?? Math.min(d.open ?? d.close, d.close)),
        close: Number(d.close),
        volume: Number(d.volume ?? 0),
        sma20: d.sma20 !== null && d.sma20 !== undefined ? Number(d.sma20) : null,
        sma50: d.sma50 !== null && d.sma50 !== undefined ? Number(d.sma50) : null,
      }));
  }, [data]);

  // Price Domain calculation
  const { minPrice, maxPrice, maxVolume, priceRange } = useMemo(() => {
    if (chartData.length === 0) return { minPrice: 0, maxPrice: 100, maxVolume: 1, priceRange: 100 };
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    chartData.forEach((d) => {
      if (d.low < min) min = d.low;
      if (d.high > max) max = d.high;
      if (showSMA20 && d.sma20) {
        if (d.sma20 < min) min = d.sma20;
        if (d.sma20 > max) max = d.sma20;
      }
      if (showSMA50 && d.sma50) {
        if (d.sma50 < min) min = d.sma50;
        if (d.sma50 > max) max = d.sma50;
      }
      if (d.volume > maxVol) maxVol = d.volume;
    });

    const padding = (max - min) * 0.08 || 1;
    return {
      minPrice: Math.max(0, min - padding),
      maxPrice: max + padding,
      maxVolume: maxVol || 1,
      priceRange: max - min + padding * 2,
    };
  }, [chartData, showSMA20, showSMA50]);

  // Dimensions
  const chartWidth = 900;
  const chartHeight = isFullscreen ? 650 : height;
  const paddingRight = 65; // Y-axis price label area
  const paddingLeft = 12;
  const paddingTop = 36;
  const paddingBottom = 40; // X-axis date area

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const volumeHeight = showVolume ? plotHeight * 0.22 : 0;
  const pricePlotHeight = plotHeight - volumeHeight;

  // Active candle for HUD (hovered or last available)
  const activePoint = useMemo(() => {
    if (hoverIndex !== null && chartData[hoverIndex]) {
      return chartData[hoverIndex];
    }
    return chartData[chartData.length - 1] || null;
  }, [hoverIndex, chartData]);

  // Coordinate mappers
  const getY = (price) => {
    if (!priceRange) return pricePlotHeight / 2;
    const normalized = (price - minPrice) / priceRange;
    return paddingTop + pricePlotHeight - normalized * pricePlotHeight;
  };

  const getX = (index) => {
    if (chartData.length <= 1) return paddingLeft + plotWidth / 2;
    return paddingLeft + (index / (chartData.length - 1)) * plotWidth;
  };

  const getVolY = (vol) => {
    const norm = vol / (maxVolume || 1);
    const h = norm * volumeHeight;
    return paddingTop + plotHeight - h;
  };

  // Hover tracker
  const handleMouseMove = (e) => {
    if (!containerRef.current || chartData.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * chartWidth;
    const mouseY = ((e.clientY - rect.top) / rect.height) * chartHeight;

    const clampedX = Math.max(paddingLeft, Math.min(chartWidth - paddingRight, mouseX));
    const ratio = (clampedX - paddingLeft) / plotWidth;
    const index = Math.round(ratio * (chartData.length - 1));

    if (index >= 0 && index < chartData.length) {
      setHoverIndex(index);
      setMousePos({ x: clampedX, y: mouseY });
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Price grid steps (5 horizontal ticks)
  const priceTicks = useMemo(() => {
    const ticks = [];
    const count = 5;
    for (let i = 0; i <= count; i++) {
      const price = minPrice + (priceRange / count) * i;
      ticks.push({ price, y: getY(price) });
    }
    return ticks;
  }, [minPrice, priceRange, pricePlotHeight]);

  // Date grid steps (approx 6 ticks)
  const dateTicks = useMemo(() => {
    if (chartData.length === 0) return [];
    const ticks = [];
    const step = Math.max(1, Math.floor(chartData.length / 5));
    for (let i = 0; i < chartData.length; i += step) {
      ticks.push({ date: chartData[i].date, x: getX(i) });
    }
    // Always include last date
    if (ticks.length === 0 || ticks[ticks.length - 1].x < getX(chartData.length - 1) - 40) {
      ticks.push({ date: chartData[chartData.length - 1].date, x: getX(chartData.length - 1) });
    }
    return ticks;
  }, [chartData, plotWidth]);

  // Construct Line & Area path strings
  const linePath = useMemo(() => {
    if (chartData.length === 0) return '';
    return chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.close)}`).join(' ');
  }, [chartData, minPrice, priceRange]);

  const areaPath = useMemo(() => {
    if (chartData.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(chartData.length - 1);
    const bottomY = paddingTop + pricePlotHeight;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, chartData, pricePlotHeight]);

  // SMA paths
  const sma20Path = useMemo(() => {
    if (!showSMA20 || chartData.length === 0) return '';
    const points = chartData
      .map((d, i) => (d.sma20 !== null ? { x: getX(i), y: getY(d.sma20) } : null))
      .filter(Boolean);
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [chartData, showSMA20, minPrice, priceRange]);

  const sma50Path = useMemo(() => {
    if (!showSMA50 || chartData.length === 0) return '';
    const points = chartData
      .map((d, i) => (d.sma50 !== null ? { x: getX(i), y: getY(d.sma50) } : null))
      .filter(Boolean);
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [chartData, showSMA50, minPrice, priceRange]);

  // Candle width based on dataset count
  const candleWidth = useMemo(() => {
    if (chartData.length === 0) return 8;
    const available = plotWidth / chartData.length;
    return Math.max(2.5, Math.min(20, available * 0.75));
  }, [chartData.length, plotWidth]);

  const activeCandleChange = activePoint
    ? ((activePoint.close - activePoint.open) / (activePoint.open || 1)) * 100
    : 0;

  if (chartData.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-slate-900/80 rounded-xl border border-slate-800 p-8 text-center"
        style={{ height }}
      >
        <CandlestickChart className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
        <p className="text-slate-400 font-medium text-sm">Loading market price chart...</p>
        <p className="text-slate-600 text-xs mt-1">Connecting to live market exchange feed</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-[#0b0e14] border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col ${
        isFullscreen ? 'fixed inset-4 z-50 bg-[#0b0e14]/95 backdrop-blur-md' : 'relative'
      }`}
    >
      {/* TradingView Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
        {/* Left: Stock info & Type Toggles */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm tracking-wide">{symbol.replace('.NS', '')}</span>
            <span className="text-slate-400 text-xs hidden sm:inline">{stockName}</span>
          </div>

          <div className="h-4 w-px bg-slate-700 hidden sm:block" />

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setChartType('candles')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                chartType === 'candles'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Candlestick Chart"
            >
              <CandlestickChart className="w-3.5 h-3.5" />
              <span>Candles</span>
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                chartType === 'line'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Area Line Chart"
            >
              <LineIcon className="w-3.5 h-3.5" />
              <span>Line</span>
            </button>
          </div>

          {/* Indicators toggles */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setShowSMA20(!showSMA20)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                showSMA20 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'text-slate-500 bg-slate-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"></span>
              SMA 20
            </button>
            <button
              onClick={() => setShowSMA50(!showSMA50)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                showSMA50 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-500 bg-slate-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
              SMA 50
            </button>
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                showVolume ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' : 'text-slate-500 bg-slate-800'
              }`}
            >
              Vol
            </button>
          </div>
        </div>

        {/* Right: Period selector & fullscreen */}
        <div className="flex items-center gap-2">
          {showPeriodSelector && onPeriodChange && (
            <div className="flex items-center gap-1 bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
              {['1d', '5d', '1mo', '3mo', '6mo', '1y', '5y'].map((p) => (
                <button
                  key={p}
                  onClick={() => onPeriodChange(p)}
                  className={`px-2 py-1 rounded text-xs uppercase font-medium transition-all ${
                    period === p ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* TradingView Live OHLC HUD Bar */}
      {activePoint && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1.5 bg-[#0f141c] text-xs font-mono border-b border-slate-800/60">
          <div className="text-slate-400 font-sans">
            Date: <span className="text-white">{activePoint.date}</span>
          </div>
          <div>
            <span className="text-slate-500">O:</span>{' '}
            <span className="text-white">{currencySymbol}{activePoint.open.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500">H:</span>{' '}
            <span className="text-emerald-400">{currencySymbol}{activePoint.high.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500">L:</span>{' '}
            <span className="text-red-400">{currencySymbol}{activePoint.low.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-slate-500">C:</span>{' '}
            <span className="text-white font-bold">{currencySymbol}{activePoint.close.toFixed(2)}</span>
          </div>
          <div className={`font-semibold ${activeCandleChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {activeCandleChange >= 0 ? '+' : ''}{activeCandleChange.toFixed(2)}%
          </div>
          {activePoint.volume > 0 && (
            <div className="text-slate-400 hidden lg:inline">
              Vol: <span className="text-slate-300">{(activePoint.volume / 1e3).toFixed(1)}K</span>
            </div>
          )}
          {showSMA20 && activePoint.sma20 && (
            <div className="text-blue-400 hidden xl:inline">
              SMA20: {currencySymbol}{activePoint.sma20.toFixed(2)}
            </div>
          )}
          {showSMA50 && activePoint.sma50 && (
            <div className="text-amber-400 hidden xl:inline">
              SMA50: {currencySymbol}{activePoint.sma50.toFixed(2)}
            </div>
          )}
        </div>
      )}

      {/* Interactive SVG Chart Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="flex-1 w-full relative cursor-crosshair select-none"
      >
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-full block"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="tvAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
              <stop offset="70%" stopColor="#22c55e" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="tvBearGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal Price Grid Lines */}
          {priceTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={chartWidth - paddingRight}
                y2={tick.y}
                stroke="#1e293b"
                strokeDasharray="2 3"
                strokeWidth="0.8"
              />
              <text
                x={chartWidth - paddingRight + 6}
                y={tick.y + 4}
                fill="#64748b"
                fontSize="10"
                fontFamily="monospace"
              >
                {tick.price.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Vertical Date Grid Lines & Labels */}
          {dateTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.x}
                y1={paddingTop}
                x2={tick.x}
                y2={chartHeight - paddingBottom}
                stroke="#1e293b"
                strokeDasharray="2 3"
                strokeWidth="0.8"
              />
              <text
                x={tick.x}
                y={chartHeight - paddingBottom + 16}
                fill="#64748b"
                fontSize="10"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {tick.date.slice(5)}
              </text>
            </g>
          ))}

          {/* Volume Sub-Panel */}
          {showVolume &&
            chartData.map((d, i) => {
              const x = getX(i) - candleWidth / 2;
              const y = getVolY(d.volume);
              const barHeight = paddingTop + plotHeight - y;
              const isUp = d.close >= d.open;
              return (
                <rect
                  key={`vol-${i}`}
                  x={x}
                  y={y}
                  width={candleWidth}
                  height={Math.max(1, barHeight)}
                  fill={isUp ? '#22c55e' : '#ef4444'}
                  fillOpacity="0.25"
                />
              );
            })}

          {/* Line Chart Mode */}
          {chartType === 'line' && (
            <>
              <path d={areaPath} fill="url(#tvAreaGrad)" />
              <path d={linePath} fill="none" stroke="#22c55e" strokeWidth="2" />
            </>
          )}

          {/* Candlestick Chart Mode (TradingView Style) */}
          {chartType === 'candles' &&
            chartData.map((d, i) => {
              const isUp = d.close >= d.open;
              const color = isUp ? '#26a69a' : '#ef5350';
              const x = getX(i);
              const candleLeft = x - candleWidth / 2;

              const openY = getY(d.open);
              const closeY = getY(d.close);
              const highY = getY(d.high);
              const lowY = getY(d.low);

              const bodyTop = Math.min(openY, closeY);
              const bodyHeight = Math.max(1.5, Math.abs(openY - closeY));

              return (
                <g key={`candle-${i}`}>
                  {/* Upper Wick */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={bodyTop}
                    stroke={color}
                    strokeWidth="1.2"
                  />
                  {/* Lower Wick */}
                  <line
                    x1={x}
                    y1={bodyTop + bodyHeight}
                    x2={x}
                    y2={lowY}
                    stroke={color}
                    strokeWidth="1.2"
                  />
                  {/* Candle Body */}
                  <rect
                    x={candleLeft}
                    y={bodyTop}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={color}
                    stroke={color}
                    strokeWidth="0.8"
                    rx="0.5"
                  />
                </g>
              );
            })}

          {/* SMA 20 Overlay Line */}
          {showSMA20 && sma20Path && (
            <path
              d={sma20Path}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          )}

          {/* SMA 50 Overlay Line */}
          {showSMA50 && sma50Path && (
            <path
              d={sma50Path}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          )}

          {/* Interactive TradingView Crosshair */}
          {hoverIndex !== null && activePoint && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={getX(hoverIndex)}
                y1={paddingTop}
                x2={getX(hoverIndex)}
                y2={chartHeight - paddingBottom}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              {/* Horizontal Crosshair Line */}
              <line
                x1={paddingLeft}
                y1={mousePos.y}
                x2={chartWidth - paddingRight}
                y2={mousePos.y}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              {/* Date Tag on X-axis */}
              <rect
                x={getX(hoverIndex) - 35}
                y={chartHeight - paddingBottom + 2}
                width="70"
                height="18"
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="0.8"
                rx="3"
              />
              <text
                x={getX(hoverIndex)}
                y={chartHeight - paddingBottom + 14}
                fill="#f8fafc"
                fontSize="10"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {activePoint.date}
              </text>

              {/* Price Tag on Y-axis */}
              {(() => {
                const hoverPrice =
                  maxPrice - ((mousePos.y - paddingTop) / pricePlotHeight) * priceRange;
                return (
                  <g>
                    <rect
                      x={chartWidth - paddingRight + 2}
                      y={mousePos.y - 9}
                      width={paddingRight - 4}
                      height="18"
                      fill="#0284c7"
                      rx="3"
                    />
                    <text
                      x={chartWidth - paddingRight + 5}
                      y={mousePos.y + 3}
                      fill="#ffffff"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {Math.max(0, hoverPrice).toFixed(1)}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
        </svg>
      </div>

      {/* Bottom Footer Info Bar */}
      <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            TradingView Interactive Engine
          </span>
          <span className="hidden sm:inline text-slate-500">•</span>
          <span className="hidden sm:inline text-slate-500">
            Hover over candles to inspect OHLC values and wicks
          </span>
        </div>
        <div className="text-slate-500 font-mono">
          Last Close: {currencySymbol}{chartData[chartData.length - 1]?.close.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

