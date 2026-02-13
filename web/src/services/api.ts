import axios from 'axios';

const API_URL = import.meta.env.PROD 
  ? 'https://top-production-1874.up.railway.app/api'
  : 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: { email: string; username: string; password: string; displayName?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data: { displayName?: string; bio?: string; isPrivate?: boolean; theme?: string }) =>
    api.put('/auth/me', data)
};

// Categories
export const categoriesApi = {
  list: () => api.get('/categories'),
  get: (id: string) => api.get(`/categories/${id}`),
  create: (data: { name: string; description?: string; icon?: string; color?: string; isPrivate?: boolean; maxItems?: number }) =>
    api.post('/categories', data),
  update: (id: string, data: Partial<{ name: string; description: string; icon: string; color: string; isPrivate: boolean; maxItems: number }>) =>
    api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`)
};

// Submissions
export const submissionsApi = {
  get: (id: string) => api.get(`/submissions/${id}`),
  create: (data: { categoryId: string; title: string; description?: string; imageUrl?: string; notes?: string; rank?: number; isPrivate?: boolean }) =>
    api.post('/submissions', data),
  update: (id: string, data: Partial<{ title: string; description: string; imageUrl: string; notes: string; isPrivate: boolean }>) =>
    api.put(`/submissions/${id}`, data),
  delete: (id: string) => api.delete(`/submissions/${id}`),
  reorder: (submissions: { id: string; rank: number }[]) =>
    api.post('/submissions/reorder', { submissions }),
  like: (id: string) => api.post(`/submissions/${id}/like`),
  unlike: (id: string) => api.delete(`/submissions/${id}/like`),
  addComment: (id: string, content: string) =>
    api.post(`/submissions/${id}/comments`, { content })
};

// Users
export const usersApi = {
  search: (query: string) => api.get(`/users?q=${encodeURIComponent(query)}`),
  getProfile: (username: string) => api.get(`/users/${username}`),
  follow: (username: string) => api.post(`/users/${username}/follow`),
  unfollow: (username: string) => api.delete(`/users/${username}/follow`),
  getFollowers: (username: string) => api.get(`/users/${username}/followers`),
  getFollowing: (username: string) => api.get(`/users/${username}/following`)
};

// Feed
export const feedApi = {
  trending: (period?: string, limit?: number) =>
    api.get('/feed/trending', { params: { period, limit } }),
  following: (limit?: number, offset?: number) =>
    api.get('/feed/following', { params: { limit, offset } }),
  discover: (limit?: number) =>
    api.get('/feed/discover', { params: { limit } }),
  search: (query: string, type?: string) =>
    api.get('/feed/search', { params: { q: query, type } })
};

export default api;
