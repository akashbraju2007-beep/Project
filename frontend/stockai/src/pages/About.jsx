import React from 'react';
import {
  Brain, AlertTriangle, Lightbulb, CheckCircle, Code, BarChart3,
  TrendingUp, Star, GitCompare, Eye, GraduationCap, Cpu, Database, LineChart
} from 'lucide-react';

const technologies = [
  { name: 'React.js', desc: 'Frontend UI Framework', icon: '⚛️' },
  { name: 'Tailwind CSS', desc: 'Utility-First Styling', icon: '🎨' },
  { name: 'Recharts', desc: 'Interactive Charts', icon: '📊' },
  { name: 'Python', desc: 'Backend Language', icon: '🐍' },
  { name: 'FastAPI', desc: 'High-Performance API', icon: '⚡' },
  { name: 'Scikit-learn', desc: 'Machine Learning', icon: '🤖' },
  { name: 'yfinance', desc: 'Financial Data API', icon: '📈' },
  { name: 'Random Forest', desc: 'ML Prediction Model', icon: '🌲' },
  { name: 'Pandas & NumPy', desc: 'Data Analysis', icon: '🔢' },
];

const benefits = [
  'Saves time in stock market analysis',
  'Helps users understand market trends',
  'Provides data-driven predictions using Machine Learning',
  'Makes financial information easier to understand',
  'Demonstrates practical applications of Artificial Intelligence',
];

const features = [
  { title: 'Dashboard', desc: 'Market overview with live indices and stock data', icon: BarChart3, color: 'emerald' },
  { title: 'Stock Analysis', desc: 'Historical data analysis with interactive charts', icon: LineChart, color: 'blue' },
  { title: 'AI Predictions', desc: 'ML-powered stock price predictions', icon: Brain, color: 'purple' },
  { title: 'Market Insights', desc: 'Technical indicators and trend analysis', icon: Eye, color: 'amber' },
  { title: 'Stock Comparison', desc: 'Compare multiple stocks side by side', icon: GitCompare, color: 'cyan' },
  { title: 'Watchlist', desc: 'Track your favorite stocks in one place', icon: Star, color: 'yellow' },
];

const colorMap = {
  emerald: 'bg-emerald-500/20 text-emerald-400',
  blue: 'bg-blue-500/20 text-blue-400',
  purple: 'bg-purple-500/20 text-purple-400',
  amber: 'bg-amber-500/20 text-amber-400',
  cyan: 'bg-cyan-500/20 text-cyan-400',
  yellow: 'bg-yellow-500/20 text-yellow-400',
};

export default function About() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center p-4 bg-emerald-500/20 rounded-2xl mb-6">
          <Brain className="w-12 h-12 text-emerald-400" />
        </div>
        <h1 className="text-5xl font-extrabold mb-3">
          <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">StockAI</span>
        </h1>
        <p className="text-xl text-slate-300 mb-2">AI-Based Stock Market Analysis and Prediction System</p>
        <p className="text-slate-500 text-sm">BTech Computer Science Engineering Project</p>
      </div>

      {/* Problem Statement */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-red-500/20 rounded-lg shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Problem Statement</h2>
            <p className="text-slate-300 leading-relaxed">
              Investors and individuals face significant difficulties in analyzing stock market trends,
              understanding historical stock performance, and making informed financial decisions.
              The complexity of financial data, multiple technical indicators, and rapidly changing market
              conditions make it challenging for users to extract meaningful insights without specialized
              knowledge and tools. This application uses Artificial Intelligence and Machine Learning to
              analyze historical stock data and generate potential future price predictions, making
              financial analysis accessible to everyone.
            </p>
          </div>
        </div>
      </div>

      {/* Solution */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-emerald-500/20 rounded-lg shrink-0">
            <Lightbulb className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Our Solution</h2>
            <p className="text-slate-300 leading-relaxed">
              StockAI provides an intelligent, user-friendly platform for comprehensive stock market analysis.
              By leveraging Machine Learning algorithms (Random Forest Regression), the system analyzes
              historical stock data to identify patterns, compute technical indicators (SMA, EMA, RSI, MACD),
              predict potential future prices, and generate actionable investment insights. The application
              combines real-time financial data from Yahoo Finance with advanced AI techniques to deliver
              a professional-grade analysis tool accessible through a modern web dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Technologies Used */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Code className="w-6 h-6 text-blue-400" />
          Technologies Used
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {technologies.map(tech => (
            <div key={tech.name} className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
              <div className="text-3xl mb-2">{tech.icon}</div>
              <h3 className="text-white font-semibold">{tech.name}</h3>
              <p className="text-slate-400 text-sm">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-400" />
          System Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <h3 className="text-emerald-400 font-semibold mb-2">Frontend</h3>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• React.js with Hooks</li>
              <li>• Tailwind CSS</li>
              <li>• Recharts for visualization</li>
              <li>• Lucide React icons</li>
              <li>• React Router for navigation</li>
            </ul>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <h3 className="text-blue-400 font-semibold mb-2">Backend</h3>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• Python with FastAPI</li>
              <li>• RESTful API design</li>
              <li>• yfinance for stock data</li>
              <li>• In-memory caching</li>
              <li>• CORS middleware</li>
            </ul>
          </div>
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
            <h3 className="text-purple-400 font-semibold mb-2">AI / ML</h3>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• Scikit-learn</li>
              <li>• Random Forest Regression</li>
              <li>• Pandas & NumPy</li>
              <li>• Feature engineering</li>
              <li>• Chronological train/test split</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Project Benefits */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Project Benefits</h2>
        <div className="space-y-3">
          {benefits.map((benefit, i) => (
            <div key={i} className="flex items-start gap-3 bg-slate-800 border border-slate-700 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-slate-300">{benefit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Key Features */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Key Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(feat => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
                <div className={`inline-flex p-2 rounded-lg mb-3 ${colorMap[feat.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-white font-semibold mb-1">{feat.title}</h3>
                <p className="text-slate-400 text-sm">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-amber-400 font-semibold mb-1">Disclaimer</h3>
            <p className="text-amber-200/70 text-sm leading-relaxed">
              This application is developed for educational and demonstration purposes as part of a
              BTech Computer Science Engineering project. The stock price predictions and analysis
              provided are based on historical data and Machine Learning models. They are estimates
              and should not be considered as guaranteed investment advice. Always consult a qualified
              financial advisor before making investment decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-slate-800">
        <div className="inline-flex items-center gap-2 text-slate-500">
          <GraduationCap className="w-5 h-5" />
          <span className="text-sm">Built for BTech CSE Project Demonstration</span>
        </div>
        <p className="text-slate-600 text-xs mt-2">
          StockAI © {new Date().getFullYear()} — AI-Powered Stock Market Analysis
        </p>
      </div>
    </div>
  );
}

