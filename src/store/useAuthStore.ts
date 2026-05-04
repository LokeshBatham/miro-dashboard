import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, type AuthUser } from '../services/auth.service';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(email, password);
          localStorage.setItem('miro_token', response.token);
          localStorage.setItem('miro_user', JSON.stringify(response.user));
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          const msg =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Login failed. Please try again.';
          set({ error: msg, isLoading: false });
          throw error;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(name, email, password);
          localStorage.setItem('miro_token', response.token);
          localStorage.setItem('miro_user', JSON.stringify(response.user));
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          const msg =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Registration failed. Please try again.';
          set({ error: msg, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('miro_token');
        localStorage.removeItem('miro_user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'miro-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
