import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { searchStocks, getStocksList } from '../services/api';

const StockSearch = ({ onSelect, placeholder = 'Search stocks...' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      let data;
      try {
        data = await searchStocks(searchQuery.trim());
      } catch {
        const allStocks = await getStocksList();
        const q = searchQuery.trim().toLowerCase();
        data = allStocks.filter(
          (s) =>
            (s.symbol && s.symbol.toLowerCase().includes(q)) ||
            (s.name && s.name.toLowerCase().includes(q))
        ).slice(0, 10);
      }
      setResults(Array.isArray(data) ? data : []);
      setIsOpen(true);
      setHighlightIndex(-1);
    } catch (error) {
      console.error('Stock search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  const handleSelect = (stock) => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHighlightIndex(-1);
    if (onSelect) {
      onSelect(stock);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHighlightIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < results.length) {
          handleSelect(results[highlightIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors duration-200"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl shadow-black/50 max-h-72 overflow-y-auto">
          {results.map((stock, index) => (
            <button
              key={stock.symbol || index}
              onClick={() => handleSelect(stock)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors duration-100 ${
                index === highlightIndex
                  ? 'bg-slate-700'
                  : 'hover:bg-slate-700/50'
              } ${index !== results.length - 1 ? 'border-b border-slate-800' : ''}`}
            >
              <div className="flex flex-col min-w-0">
                <span className="text-white font-semibold text-sm truncate">
                  {stock.symbol}
                </span>
                <span className="text-slate-400 text-xs truncate">
                  {stock.name || stock.company_name || '—'}
                </span>
              </div>
              {(stock.market || stock.exchange) && (
                <span className="text-slate-500 text-xs bg-slate-800 px-2 py-0.5 rounded-full ml-3 whitespace-nowrap">
                  {stock.market || stock.exchange}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {isOpen && !isLoading && query.trim() && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl shadow-black/50 p-4">
          <p className="text-slate-400 text-sm text-center">
            No stocks found for "{query}"
          </p>
        </div>
      )}
    </div>
  );
};

export default StockSearch;
