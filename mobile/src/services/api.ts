import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Production backend URL
const API_URL = 'https://top-production-1874.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Token management
export const setToken = async (token: string) => {
  await SecureStore.setItemAsync('token', token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync('token');
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync('token');
};

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  register: (data: { email: string; username: string; password: string; displayName?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data: { displayName?: string; bio?: string; isPrivate?: boolean }) =>
    api.put('/auth/me', data)
};

// Categories
export const categoriesApi = {
  list: () => api.get('/categories'),
  get: (id: string) => api.get(`/categories/${id}`),
  create: (data: { name: string; description?: string; icon?: string; isPrivate?: boolean; maxItems?: number }) =>
    api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`)
};

// Submissions
export const submissionsApi = {
  create: (data: { categoryId: string; title: string; description?: string }) =>
    api.post('/submissions', data),
  update: (id: string, data: any) => api.put(`/submissions/${id}`, data),
  delete: (id: string) => api.delete(`/submissions/${id}`),
  reorder: (submissions: { id: string; rank: number }[]) =>
    api.post('/submissions/reorder', { submissions }),
  like: (id: string) => api.post(`/submissions/${id}/like`),
  unlike: (id: string) => api.delete(`/submissions/${id}/like`)
};

// Users
export const usersApi = {
  getProfile: (username: string) => api.get(`/users/${username}`),
  follow: (username: string) => api.post(`/users/${username}/follow`),
  unfollow: (username: string) => api.delete(`/users/${username}/follow`)
};

// Feed
export const feedApi = {
  trending: (period?: string) => api.get('/feed/trending', { params: { period } }),
  discover: () => api.get('/feed/discover'),
  search: (query: string) => api.get('/feed/search', { params: { q: query } })
};

export default api;
