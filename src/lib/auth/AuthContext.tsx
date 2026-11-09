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
  registerUser: (data: { email: string; password: string; fullName: string; phone: string }) => Promise<{ error?: string }>;
  loginUser: (identifier: string, password: string) => Promise<{ error?: string }>;
  logoutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'budget_cat_cached_user';
const REGISTERED_USERS_KEY = 'budget_cat_registered_users';

function normalizePhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+63') && digits.length >= 12) {
    return '0' + digits.slice(3);
  }
  if (digits.startsWith('63') && digits.length === 12) {
    return '0' + digits.slice(2);
  }
  return digits.replace(/\D/g, '');
}

function isLooksLikePhoneOrEmail(name?: string, email?: string, phone?: string): boolean {
  if (!name || !name.trim()) return true;
  const trimmed = name.trim();
  if (trimmed.includes('@')) return true;
  if (/^\+?\d[\d\s\-()]{5,}$/.test(trimmed)) return true;
  if (phone && normalizePhone(trimmed) === normalizePhone(phone) && normalizePhone(phone).length > 0) return true;
  if (email && trimmed.toLowerCase() === email.split('@')[0].toLowerCase() && /\d{3,}/.test(trimmed)) return true;
  return false;
}

function getRegisteredProfilesFromStorage(): UserProfile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRegisteredProfileToStorage(prof: UserProfile) {
  if (typeof window === 'undefined') return;
  try {
    const list = getRegisteredProfilesFromStorage();
    const normPhone = normalizePhone(prof.phone);
    const normEmail = (prof.email || '').trim().toLowerCase();
    const filtered = list.filter((p) => {
      if (p.id === prof.id) return false;
      if (normEmail && (p.email || '').trim().toLowerCase() === normEmail) return false;
      if (normPhone && normalizePhone(p.phone) === normPhone) return false;
      return true;
    });
    filtered.push(prof);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('[AuthContext] Failed to save registered profile:', e);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const FRESH_AUTH_KEY = 'budget_cat_fresh_auth_2026_11_09';
      if (typeof window !== 'undefined' && !localStorage.getItem(FRESH_AUTH_KEY)) {
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
        await Promise.all([
          db.profiles.clear(),
          db.sync_queue.clear(),
          db.transactions.clear(),
          db.budgets.clear(),
          db.budget_categories.clear(),
          db.income.clear(),
          db.bills.clear(),
          db.savings_goals.clear(),
          db.debts.clear()
        ]);
        localStorage.setItem(FRESH_AUTH_KEY, 'true');
      }

      if (!isSupabaseConfigured()) {
        await loadCachedUser();
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
          await loadCachedUser();
        }
      } catch (err) {
        console.warn('[AuthContext] Error initializing Supabase auth, checking local cache:', err);
        await loadCachedUser();
      } finally {
        if (isMounted) setLoading(false);
      }

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

  const applyActiveProfile = (userProf: UserProfile) => {
    setProfile(userProf);
    setUser({
      id: userProf.id,
      email: userProf.email,
      user_metadata: { full_name: userProf.full_name, phone: userProf.phone },
      app_metadata: {},
      aud: 'authenticated',
      created_at: userProf.created_at
    } as User);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(userProf));
    saveRegisteredProfileToStorage(userProf);
  };

  const fetchAndCacheProfile = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      let userProf: UserProfile;

      if (!error && data) {
        userProf = {
          ...data,
          full_name: data.full_name || authUser.user_metadata?.full_name || 'Cat Budgeter',
          phone: data.phone || authUser.user_metadata?.phone || '',
          sync_status: 'synced'
        };
      } else {
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

      applyActiveProfile(userProf);
      await db.profiles.put(userProf);
    } catch (e) {
      console.warn('[AuthContext] Could not fetch remote profile, checking Dexie local table:', e);
      const localProf = await db.profiles.get(authUser.id);
      if (localProf) {
        applyActiveProfile(localProf);
      }
    }
  };

  const findMatchingProfile = async (identifier: string): Promise<UserProfile | null> => {
    const cleanId = identifier.trim();
    const isEmail = cleanId.includes('@');
    const normEmail = cleanId.toLowerCase();
    const normPhone = normalizePhone(cleanId);

    // Gather all known profiles from Dexie, localStorage registry, and cloud sync store
    const dexieProfiles = await db.profiles.toArray();
    const storageProfiles = getRegisteredProfilesFromStorage();
    let remoteProfiles: UserProfile[] = [];
    try {
      const res = await fetch('/api/sync');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.data?.profiles)) {
          remoteProfiles = json.data.profiles;
        }
      }
    } catch {
      // Ignore offline fetch error
    }

    const allCandidates = [...dexieProfiles, ...storageProfiles, ...remoteProfiles];

    // 1. Direct match by email or phone with a valid Full Name
    const exactWithRealName = allCandidates.find((p) => {
      if (!p) return false;
      const matchesEmail = isEmail && (p.email || '').trim().toLowerCase() === normEmail;
      const matchesPhone = !isEmail && normPhone.length > 0 && normalizePhone(p.phone) === normPhone;
      return (matchesEmail || matchesPhone) && !isLooksLikePhoneOrEmail(p.full_name, p.email, p.phone);
    });
    if (exactWithRealName) return exactWithRealName;

    // 2. If there is a registered profile with a real full_name in the database/storage that is missing phone or was created before phone login, link it
    const realNamedProfiles = allCandidates.filter((p) => p && !isLooksLikePhoneOrEmail(p.full_name, p.email, p.phone));
    if (realNamedProfiles.length > 0) {
      const best = realNamedProfiles[realNamedProfiles.length - 1];
      if (!isEmail && normPhone.length > 0 && (!best.phone || normalizePhone(best.phone) === normPhone)) {
        return {
          ...best,
          phone: cleanId
        };
      }
    }

    // 3. Fallback direct match by email or phone
    const anyMatch = allCandidates.find((p) => {
      if (!p) return false;
      const matchesEmail = isEmail && (p.email || '').trim().toLowerCase() === normEmail;
      const matchesPhone = !isEmail && normPhone.length > 0 && normalizePhone(p.phone) === normPhone;
      return matchesEmail || matchesPhone;
    });
    if (anyMatch && !isLooksLikePhoneOrEmail(anyMatch.full_name, anyMatch.email, anyMatch.phone)) {
      return anyMatch;
    }

    return null;
  };

  const loadCachedUser = async () => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (cached) {
        const parsed: UserProfile = JSON.parse(cached);

        // If the cached user has a phone number or email as their full_name, try to repair it from registered profiles
        if (isLooksLikePhoneOrEmail(parsed.full_name, parsed.email, parsed.phone)) {
          const repaired = await findMatchingProfile(parsed.phone || parsed.email || '');
          if (repaired && !isLooksLikePhoneOrEmail(repaired.full_name, repaired.email, repaired.phone)) {
            applyActiveProfile(repaired);
            await db.profiles.put(repaired);
            setIsOfflineMode(true);
            return;
          } else {
            // Clear broken mock session where phone number was used as name so user can register/login properly
            localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
            await db.profiles.delete(parsed.id);
            return;
          }
        }

        applyActiveProfile(parsed);
        setIsOfflineMode(true);
      }
    } catch (e) {
      console.error('[AuthContext] Error loading cached user:', e);
    }
  };

  const registerUser = async ({ email, password, fullName, phone }: { email: string; password: string; fullName: string; phone: string }) => {
    setLoading(true);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanEmail || !cleanPhone) {
      setLoading(false);
      return { error: 'Full Name, Email Address, and Phone Number are required.' };
    }

    if (!isSupabaseConfigured()) {
      const mockId = 'user-' + Date.now();
      const mockProfile: UserProfile = {
        id: mockId,
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        avatar_url: 'cat-happy',
        currency: 'PHP',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        sync_status: 'pending',
        created_at: new Date().toISOString()
      };

      // Remove any old placeholder profiles that had the phone number as full_name
      const existing = await db.profiles.toArray();
      for (const p of existing) {
        if (isLooksLikePhoneOrEmail(p.full_name, p.email, p.phone)) {
          await db.profiles.delete(p.id);
        }
      }

      applyActiveProfile(mockProfile);
      await db.profiles.put(mockProfile);
      setIsOfflineMode(true);
      setLoading(false);
      return {};
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone,
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
          full_name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          avatar_url: 'cat-happy',
          currency: 'PHP',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          sync_status: 'synced',
          created_at: new Date().toISOString()
        };
        applyActiveProfile(newProf);
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
    const cleanId = identifier.trim();

    if (!isSupabaseConfigured()) {
      const matchedProfile = await findMatchingProfile(cleanId);
      if (matchedProfile) {
        applyActiveProfile(matchedProfile);
        await db.profiles.put(matchedProfile);
        setIsOfflineMode(true);
        setLoading(false);
        return {};
      }

      setLoading(false);
      return {
        error: 'No account found for that email or phone number. Please create an account first so we know your Full Name.'
      };
    }

    try {
      const isEmail = cleanId.includes('@');
      let loginEmail = cleanId;

      if (!isEmail) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('email, full_name, phone')
          .eq('phone', cleanId)
          .single();
        if (prof?.email) {
          loginEmail = prof.email;
        } else {
          const localMatch = await findMatchingProfile(cleanId);
          if (localMatch?.email) {
            loginEmail = localMatch.email;
          }
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
      setIsOfflineMode(false);
      try {
        localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('budget_cat_cached_user'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      } catch (e) {
        console.warn('[AuthContext] Local storage cleanup error:', e);
      }
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

    const updated: UserProfile = {
      ...profile,
      ...data,
      updated_at: new Date().toISOString()
    };

    applyActiveProfile(updated);
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
