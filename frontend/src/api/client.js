import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL,
  withCredentials: false,
});

const TOKEN_KEY = 'admin_platform_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 && typeof onUnauthorized === 'function') {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export function extractApiError(error, fallback = 'Something went wrong') {
  if (!error) return fallback;
  const data = error.response?.data;
  if (data?.details?.length) {
    return data.details.map((d) => `${d.field}: ${d.message}`).join(', ');
  }
  return data?.message || error.message || fallback;
}

export default api;
