import { create } from 'zustand';
import { supabase } from './supabase';

type UserRole = 'eoc' | 'pho' | 'institution' | 'civilian';

interface User {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User | null, token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole, organizationId?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: (user, token) => set({ user, token, isLoading: false }),

  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const user: User = {
      id: data.user.id,
      email: data.user.email!,
      role: data.user.user_metadata?.role || 'civilian',
      organizationId: data.user.user_metadata?.organizationId,
    };

    set({ user, token: data.session.access_token, isLoading: false });
  },

  register: async (email: string, password: string, role: UserRole, organizationId?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          organizationId,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        role,
        organizationId,
      };

      set({ user, token: data.session?.access_token || null, isLoading: false });
    }
  },

  logout: () => {
    supabase.auth.signOut();
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      const user: User = {
        id: data.session.user.id,
        email: data.session.user.email!,
        role: data.session.user.user_metadata?.role || 'civilian',
        organizationId: data.session.user.user_metadata?.organizationId,
      };

      set({ user, token: data.session.access_token, isLoading: false });
    } else {
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
