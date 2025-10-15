import axios from 'axios';

const redirectToLogin = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  const isLoginRoute = window.location.pathname.startsWith('/login');
  if (!isLoginRoute) {
    window.location.href = '/login?sessionExpired=1';
  }
};

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

export default api;
