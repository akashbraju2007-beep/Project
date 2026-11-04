import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const getHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

export const getStocksList = async () => {
  const res = await api.get('/stocks/list');
  return res.data;
};

export const searchStocks = async (query) => {
  const res = await api.get(`/stocks/search?q=${encodeURIComponent(query)}`);
  return res.data;
};

export const getStockQuote = async (symbol) => {
  const res = await api.get(`/stocks/${encodeURIComponent(symbol)}/quote`);
  return res.data;
};

export const getMarketOverview = async () => {
  const res = await api.get('/market/overview');
  return res.data;
};

export const getStockHistory = async (symbol, period = '1mo') => {
  const res = await api.get(`/stocks/${encodeURIComponent(symbol)}/history?period=${period}`);
  return res.data;
};

export const getStockPrediction = async (symbol) => {
  const res = await api.get(`/stocks/${encodeURIComponent(symbol)}/predict`);
  return res.data;
};

export const getStockIndicators = async (symbol) => {
  const res = await api.get(`/stocks/${encodeURIComponent(symbol)}/indicators`);
  return res.data;
};

export const getStockInsights = async (symbol) => {
  const res = await api.get(`/stocks/${encodeURIComponent(symbol)}/insights`);
  return res.data;
};

export const compareStocks = async (symbols) => {
  const res = await api.get(`/stocks/compare?symbols=${symbols.join(',')}`);
  return res.data;
};

export default api;

