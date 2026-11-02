import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT token; let the browser set multipart boundaries
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ams_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  // Default Content-Type is application/json — that breaks FormData uploads
  // (and a bare "multipart/form-data" header without boundary also fails).
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers && typeof config.headers === 'object') {
      delete (config.headers as Record<string, unknown>)['Content-Type'];
      delete (config.headers as Record<string, unknown>)['content-type'];
    }
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('ams_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
