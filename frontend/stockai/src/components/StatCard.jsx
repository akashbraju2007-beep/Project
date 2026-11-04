import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, change, icon: Icon, prefix = '', suffix = '' }) => {
  const isPositive = change !== undefined && change !== null && change >= 0;
  const hasChange = change !== undefined && change !== null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
          {Icon && <Icon className="w-5 h-5 text-emerald-400" />}
        </div>
        {hasChange && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              isPositive
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-red-500/15 text-red-400'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{isPositive ? '+' : ''}{typeof change === 'number' ? change.toFixed(2) : change}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <p className="text-white text-2xl font-bold tracking-tight">
          {prefix}
          {typeof value === 'number' ? value.toLocaleString() : value}
          {suffix}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
