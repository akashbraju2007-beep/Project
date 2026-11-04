import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import {
  Activity, BarChart3, Brain, Lightbulb, GitCompare, Star, Info,
  Menu, X, Wifi, WifiOff
} from 'lucide-react';
import { getHealth } from './services/api';

import Dashboard from './pages/Dashboard';
import StockAnalysis from './pages/StockAnalysis';
import Predictions from './pages/Predictions';
import Insights from './pages/Insights';
import Comparison from './pages/Comparison';
import Watchlist from './pages/Watchlist';
import About from './pages/About';

const navItems = [
  { path: '/', label: 'Dashboard', icon: Activity },
  { path: '/analysis', label: 'Stock Analysis', icon: BarChart3 },
  { path: '/predictions', label: 'AI Predictions', icon: Brain },
  { path: '/insights', label: 'Market Insights', icon: Lightbulb },
  { path: '/comparison', label: 'Stock Comparison', icon: GitCompare },
  { path: '/watchlist', label: 'My Watchlist', icon: Star },
  { path: '/about', label: 'About Project', icon: Info },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Sidebar({ isOpen, onClose, isConnected }) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-50 transform transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">StockAI</h1>
                <p className="text-[10px] text-slate-500 leading-tight">AI-Powered Analysis</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            {isConnected ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400">Backend Connected</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-red-400">Backend Disconnected</span>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await getHealth();
        setIsConnected(true);
      } catch {
        setIsConnected(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-gray-950 text-white">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isConnected={isConnected} />

        {/* Mobile header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-b border-slate-800 z-30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-white">StockAI</span>
          </div>
          {isConnected ? (
            <Wifi className="w-4 h-4 text-emerald-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
        </div>

        <main className="lg:ml-64 min-h-screen">
          <div className="p-4 md:p-6 lg:p-8 pt-16 lg:pt-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analysis" element={<StockAnalysis />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/comparison" element={<Comparison />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}
