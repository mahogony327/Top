import { create } from 'zustand';
import { authApi, setToken, removeToken, getToken } from '../services/api';

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  isPrivate: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const { token, user } = response.data;
    await setToken(token);
    set({ user, isAuthenticated: true });
  },

  register: async (email: string, username: string, password: string, displayName?: string) => {
    const response = await authApi.register({ email, username, password, displayName });
    const { token, user } = response.data;
    await setToken(token);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    await removeToken();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    const token = await getToken();
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const response = await authApi.getMe();
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch {
      await removeToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
