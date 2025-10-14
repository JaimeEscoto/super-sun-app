import axios from 'axios';

const apiBase = (() => {
  if (!import.meta.env.VITE_API_URL) {
    return '/api/v1';
  }

  const rawBase = String(import.meta.env.VITE_API_URL).replace(/\/$/, '');

  if (/\/api\/v\d+$/i.test(rawBase)) {
    return rawBase;
  }

  if (/\/api$/i.test(rawBase)) {
    return `${rawBase}/v1`;
  }

  return `${rawBase}/api/v1`;
})();

const api = axios.create({
  baseURL: apiBase
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
