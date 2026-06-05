import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { UserProfile, UserRole } from '../types';

export type { UserRole };

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isDemoMode: boolean;

  // Actions
  signUp: (email: string, password: string, fullName: string, phone: string, role: UserRole) => Promise<{ success: boolean; error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: string | null }>;
  signOut: () => Promise<void>;
  initialize: () => () => void; // returns an unsubscribe cleanup function
  clearError: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error: string | null }>;
}

// Support offline mock-database inside localStorage for Demo Mode
const GET_MOCK_USERS = (): UserProfile[] => {
  const users = localStorage.getItem('vuu_mock_users');
  return users ? JSON.parse(users) : [
    {
      id: 'mock-rider-id',
      email: 'rider@vuu.com',
      full_name: 'Benjamin Rider',
      phone: '+250 788 123 456',
      role: 'rider',
      is_online: true,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=260',
      created_at: new Date().toISOString(),
      rating: 4.85,
      num_ratings: 14,
    },
    {
      id: 'mock-customer-id',
      email: 'customer@vuu.com',
      full_name: 'Sarah Customer',
      phone: '+250 789 234 567',
      role: 'customer',
      is_online: true,
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=260',
      created_at: new Date().toISOString(),
      rating: 4.90,
      num_ratings: 20,
    },
    {
      id: 'mock-driver-id',
      email: 'driver@vuu.com',
      full_name: 'Alex Driver',
      phone: '+250 783 765 432',
      role: 'driver',
      is_online: true,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=260',
      created_at: new Date().toISOString(),
      rating: 4.78,
      num_ratings: 43,
    }
  ];
};

const SAVE_MOCK_USER = (profile: UserProfile, passwordSecret: string) => {
  const users = GET_MOCK_USERS();
  users.push(profile);
  localStorage.setItem('vuu_mock_users', JSON.stringify(users));
  // Save credentials mapping for demo login
  const credentials = localStorage.getItem('vuu_mock_credentials') ? JSON.parse(localStorage.getItem('vuu_mock_credentials')!) : {};
  credentials[profile.email.toLowerCase()] = { profile, password: passwordSecret };
  localStorage.setItem('vuu_mock_credentials', JSON.stringify(credentials));
};

const GET_MOCK_CREDENTIALS = () => {
  const defaults: Record<string, any> = {
    'rider@vuu.com': {
      profile: GET_MOCK_USERS()[0],
      password: 'password123'
    },
    'customer@vuu.com': {
      profile: GET_MOCK_USERS()[1],
      password: 'password123'
    },
    'driver@vuu.com': {
      profile: GET_MOCK_USERS()[2],
      password: 'password123'
    }
  };
  const saved = localStorage.getItem('vuu_mock_credentials');
  return saved ? JSON.parse(saved) : defaults;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  error: null,
  isDemoMode: !isSupabaseConfigured,

  clearError: () => set({ error: null }),

  signUp: async (email, password, fullName, phone, role) => {
    set({ loading: true, error: null });
    
    if (get().isDemoMode) {
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 800));

      const credentials = GET_MOCK_CREDENTIALS();
      if (credentials[email.toLowerCase()]) {
        set({ loading: false, error: 'An account with this email already exists in DEMO database.' });
        return { success: false, error: 'An account with this email already exists.' };
      }

      const mockId = `mock-user-${Math.random().toString(36).substr(2, 9)}`;
      const newProfile: UserProfile = {
        id: mockId,
        email,
        full_name: fullName,
        phone,
        role,
        is_online: true,
        avatar_url: `https://images.unsplash.com/photo-${role === 'driver' ? '1500648767791-00dcc994a43e' : '1494790108377-be9c29b29330'}?auto=format&fit=crop&q=80&w=260`,
        created_at: new Date().toISOString(),
      };

      SAVE_MOCK_USER(newProfile, password);

      const fakeSession = {
        access_token: 'demo-token-' + mockId,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'demo-refresh-' + mockId,
        user: {
          id: mockId,
          email,
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: { full_name: fullName, phone, role },
        } as unknown as User,
      } as Session;

      set({
        user: fakeSession.user,
        profile: newProfile,
        session: fakeSession,
        loading: false,
      });

      localStorage.setItem('vuu_demo_session', JSON.stringify({ session: fakeSession, profile: newProfile }));
      return { success: true, error: null };
    }

    try {
      // 1. Supabase Auth SignUp
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role,
          },
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('User signup succeeded but no user data was returned.');

      // 2. Generate/Save user custom profile in the public 'profiles' table
      const profileData: UserProfile = {
        id: data.user.id,
        email,
        full_name: fullName,
        phone,
        role,
        is_online: true,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`,
        created_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([profileData]);

      if (profileError) {
        console.error('Error inserting user custom profile, checking if trigger automatically created it:', profileError);
        // Sometimes a DB trigger creates the profile on auth signup. Let's try to fetch it.
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (existingProfile) {
          set({ user: data.user, profile: existingProfile as UserProfile, session: data.session, loading: false });
          return { success: true, error: null };
        }
      }

      set({
        user: data.user,
        profile: profileData,
        session: data.session,
        loading: false,
      });

      return { success: true, error: null };
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });

    if (get().isDemoMode) {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const credentials = GET_MOCK_CREDENTIALS();
      const matched = credentials[email.toLowerCase()];

      if (matched && matched.password === password) {
        const mockProfile = matched.profile as UserProfile;
        const fakeSession = {
          access_token: 'demo-token-' + mockProfile.id,
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'demo-refresh-' + mockProfile.id,
          user: {
            id: mockProfile.id,
            email,
            aud: 'authenticated',
            role: 'authenticated',
            created_at: mockProfile.created_at,
            app_metadata: {},
            user_metadata: { full_name: mockProfile.full_name, phone: mockProfile.phone, role: mockProfile.role },
          } as unknown as User,
        } as Session;

        set({
          user: fakeSession.user,
          profile: mockProfile,
          session: fakeSession,
          loading: false,
        });

        localStorage.setItem('vuu_demo_session', JSON.stringify({ session: fakeSession, profile: mockProfile }));
        return { success: true, error: null };
      }

      set({ loading: false, error: 'Invalid email or password in Demo Database. Try email: rider@vuu.com or driver@vuu.com with password: password123' });
      return { success: false, error: 'Invalid credentials' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Sign in failed unexpectedly.');

      // Fetch Profile from 'profiles' table
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileErr) {
        console.warn('Profile not found in profiles table, generating a baseline profile:', profileErr);
        // Fallback profile if table fetching failed
        const fallbackProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || '',
          full_name: data.user.user_metadata?.full_name || 'VUU User',
          phone: data.user.user_metadata?.phone || '',
          role: (data.user.user_metadata?.role as UserRole) || 'rider',
          is_online: true,
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.user.user_metadata?.full_name || 'User')}`,
          created_at: data.user.created_at || new Date().toISOString(),
        };
        set({ user: data.user, profile: fallbackProfile, session: data.session, loading: false });
      } else {
        set({
          user: data.user,
          profile: profile as UserProfile,
          session: data.session,
          loading: false,
        });
      }

      return { success: true, error: null };
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });

    if (get().isDemoMode) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      localStorage.removeItem('vuu_demo_session');
      set({ user: null, profile: null, session: null, loading: false });
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, profile: null, session: null, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  updateProfile: async (updates) => {
    set({ loading: true, error: null });

    if (get().isDemoMode) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (!get().profile) {
        set({ loading: false, error: 'No active session found.' });
        return { success: false, error: 'No active session' };
      }

      const updatedProfile = { ...get().profile!, ...updates };
      set({ profile: updatedProfile, loading: false });

      // Persist in localStorage session
      const savedSessionStr = localStorage.getItem('vuu_demo_session');
      if (savedSessionStr) {
        const payload = JSON.parse(savedSessionStr);
        payload.profile = updatedProfile;
        localStorage.setItem('vuu_demo_session', JSON.stringify(payload));
      }

      // Update in our mock user list as well
      const credentials = GET_MOCK_CREDENTIALS();
      const userEmail = get().user?.email;
      if (userEmail && credentials[userEmail.toLowerCase()]) {
        credentials[userEmail.toLowerCase()].profile = updatedProfile;
        localStorage.setItem('vuu_mock_credentials', JSON.stringify(credentials));
      }

      return { success: true, error: null };
    }

    try {
      const activeUser = get().user;
      if (!activeUser) throw new Error('No user is currently authenticated.');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', activeUser.id);

      if (error) throw error;

      set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
        loading: false,
      }));

      return { success: true, error: null };
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  initialize: () => {
    // Return early if we are in Demo mode with state hydration from storage
    if (get().isDemoMode) {
      const cachedSession = localStorage.getItem('vuu_demo_session');
      if (cachedSession) {
        try {
          const { session, profile } = JSON.parse(cachedSession);
          set({
            session,
            user: session.user,
            profile,
            loading: false,
          });
        } catch {
          localStorage.removeItem('vuu_demo_session');
          set({ loading: false });
        }
      } else {
        const mockProfile = GET_MOCK_USERS()[0];
        set({ 
          user: { id: mockProfile.id, email: mockProfile.email } as any, 
          profile: mockProfile, 
          loading: false 
        });
      }

      // Return a dummy unsubscribe function
      return () => {};
    }

    // Set up real Supabase auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        set({ session, user: session?.user ?? null, loading: true });

        if (session?.user) {
          try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (error) {
              // Graceful profile creation callback if not present in public table
              const fallbackProfile: UserProfile = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || 'VUU Rider',
                phone: session.user.user_metadata?.phone || '',
                role: (session.user.user_metadata?.role as UserRole) || 'rider',
                is_online: true,
                avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.user.user_metadata?.full_name || 'Rider')}`,
                created_at: session.user.created_at || new Date().toISOString(),
              };
              set({ profile: fallbackProfile, loading: false });
            } else {
              set({ profile: profile as UserProfile, loading: false });
            }
          } catch (e) {
            set({ loading: false });
          }
        } else {
          set({ profile: null, loading: false });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  },
}));
