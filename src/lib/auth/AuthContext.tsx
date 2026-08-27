'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { db } from '../db';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isOfflineMode: boolean;
  registerUser: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<{ error?: string }>;
  loginUser: (identifier: string, password: string) => Promise<{ error?: string }>;
  logoutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'budget_cat_cached_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured()) {
        // Fallback offline mock session for demo/offline usage
        loadCachedUser();
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession?.user) {
          if (isMounted) {
            setSession(initialSession);
            setUser(initialSession.user);
          }
          await fetchAndCacheProfile(initialSession.user);
        } else {
          loadCachedUser();
        }
      } catch (err) {
        console.warn('[AuthContext] Error initializing Supabase auth, checking local cache:', err);
        loadCachedUser();
      } finally {
        if (isMounted) setLoading(false);
      }

      // Listen to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (!isMounted) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchAndCacheProfile(currentSession.user);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setProfile(null);
          localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchAndCacheProfile = async (authUser: User) => {
    try {
      // Try to fetch profile from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      let userProf: UserProfile;

      if (!error && data) {
        userProf = {
          ...data,
          sync_status: 'synced'
        };
      } else {
        // Fallback default profile if trigger hasn't completed yet
        userProf = {
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || 'Cat Budgeter',
          email: authUser.email || '',
          phone: authUser.user_metadata?.phone || '',
          avatar_url: authUser.user_metadata?.avatar_url || 'cat-happy',
          currency: 'USD',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          sync_status: 'synced',
          created_at: new Date().toISOString()
        };
      }

      setProfile(userProf);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userProf));
      await db.profiles.put(userProf);
    } catch (e) {
      console.warn('[AuthContext] Could not fetch remote profile, checking Dexie local table:', e);
      const localProf = await db.profiles.get(authUser.id);
      if (localProf) {
        setProfile(localProf);
      }
    }
  };

  const loadCachedUser = () => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (cached) {
        const parsed: UserProfile = JSON.parse(cached);
        setProfile(parsed);
        setUser({
          id: parsed.id,
          email: parsed.email,
          user_metadata: { full_name: parsed.full_name, phone: parsed.phone },
          app_metadata: {},
          aud: 'authenticated',
          created_at: parsed.created_at
        } as User);
        setIsOfflineMode(true);
      }
    } catch (e) {
      console.error('[AuthContext] Error loading cached user:', e);
    }
  };

  const registerUser = async ({ email, password, fullName, phone }: { email: string; password: string; fullName: string; phone?: string }) => {
    setLoading(true);

    if (!isSupabaseConfigured()) {
      // Offline fallback signup
      const mockId = 'offline-' + Date.now();
      const mockProfile: UserProfile = {
        id: mockId,
        full_name: fullName,
        email,
        phone: phone || '',
        avatar_url: 'cat-happy',
        currency: 'USD',
        timezone: 'UTC',
        sync_status: 'pending',
        created_at: new Date().toISOString()
      };

      setProfile(mockProfile);
      setUser({
        id: mockId,
        email,
        user_metadata: { full_name: fullName, phone },
        app_metadata: {},
        aud: 'authenticated',
        created_at: mockProfile.created_at
      } as User);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockProfile));
      await db.profiles.put(mockProfile);
      setLoading(false);
      return {};
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone || '',
            avatar_url: 'cat-happy'
          }
        }
      });

      if (error) {
        setLoading(false);
        return { error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        const newProf: UserProfile = {
          id: data.user.id,
          full_name: fullName,
          email,
          phone: phone || '',
          avatar_url: 'cat-happy',
          currency: 'USD',
          timezone: 'UTC',
          sync_status: 'synced',
          created_at: new Date().toISOString()
        };
        setProfile(newProf);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newProf));
        await db.profiles.put(newProf);
      }

      setLoading(false);
      return {};
    } catch (err: any) {
      setLoading(false);
      return { error: err.message || 'Registration failed' };
    }
  };

  const loginUser = async (identifier: string, password: string) => {
    setLoading(true);

    if (!isSupabaseConfigured()) {
      // Offline fallback login check
      const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (cached) {
        loadCachedUser();
        setLoading(false);
        return {};
      }
      // Mock log in
      const mockId = 'user-' + Date.now();
      const mockProf: UserProfile = {
        id: mockId,
        full_name: identifier.includes('@') ? identifier.split('@')[0] : identifier,
        email: identifier.includes('@') ? identifier : `${identifier}@budgetcat.local`,
        phone: identifier.includes('@') ? '' : identifier,
        avatar_url: 'cat-happy',
        currency: 'USD',
        timezone: 'UTC',
        sync_status: 'pending',
        created_at: new Date().toISOString()
      };
      setProfile(mockProf);
      setUser({
        id: mockId,
        email: mockProf.email,
        user_metadata: { full_name: mockProf.full_name },
        app_metadata: {},
        aud: 'authenticated',
        created_at: mockProf.created_at
      } as User);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockProf));
      await db.profiles.put(mockProf);
      setLoading(false);
      return {};
    }

    try {
      let isEmail = identifier.includes('@');
      let loginEmail = identifier;

      // If user passed a phone number instead of email, query profiles or format email
      if (!isEmail) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('email')
          .eq('phone', identifier)
          .single();
        if (prof?.email) {
          loginEmail = prof.email;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password
      });

      if (error) {
        setLoading(false);
        return { error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchAndCacheProfile(data.user);
      }

      setLoading(false);
      return {};
    } catch (err: any) {
      setLoading(false);
      return { error: err.message || 'Login failed' };
    }
  };

  const logoutUser = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('[AuthContext] Error signing out with Supabase:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return { message: 'Password reset link sent (Offline demo mode).' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      return { error: error.message };
    }

    return { message: 'Password reset instructions have been sent to your email.' };
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return { error: 'No user profile found' };

    const updated = {
      ...profile,
      ...data,
      updated_at: new Date().toISOString()
    };

    setProfile(updated);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updated));
    await db.profiles.put(updated);

    if (isSupabaseConfigured() && user) {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
      if (error) return { error: error.message };
    }

    return {};
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isOfflineMode,
        registerUser,
        loginUser,
        logoutUser,
        resetPassword,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
