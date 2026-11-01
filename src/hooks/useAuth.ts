import { useState, useEffect, useCallback, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { authService } from '../services/supabase/authService';
import { isSupabaseConfigured } from '../services/supabase/client';

export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

export interface UseAuthResult {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, pass: string) => Promise<{ user: User | null; session: Session | null; error?: string | null }>;
  signUp: (email: string, pass: string) => Promise<{ user: User | null; session: Session | null; error?: string | null }>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const isConfigured = isSupabaseConfigured();
  // Prevent multiple simultaneous session resolutions
  const initialized = useRef(false);

  useEffect(() => {
    if (!isConfigured) {
      setStatus('unauthenticated');
      return;
    }

    // Avoid duplicate initialization on StrictMode double-invoke
    if (initialized.current) return;
    initialized.current = true;

    // 1. Resolve the initial session synchronously from localStorage
    authService.getSession().then((initialSession) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setStatus(initialSession?.user ? 'authenticated' : 'unauthenticated');
    });

    // 2. Subscribe to future auth changes (token refresh, sign-in, sign-out)
    //    We deliberately do NOT trigger a syncNow here to avoid reload loops.
    //    Sync is triggered only on explicit user sign-in actions.
    const unsubscribe = authService.onAuthStateChange((event, newSession) => {
      // Ignore token refresh events to prevent reload loops
      if (event === 'TOKEN_REFRESHED') return;

      setSession(newSession);
      setUser(newSession?.user ?? null);
      setStatus(newSession?.user ? 'authenticated' : 'unauthenticated');
    });

    return () => {
      initialized.current = false;
      if (unsubscribe) unsubscribe();
    };
  }, [isConfigured]);

  const signIn = useCallback(async (email: string, pass: string) => {
    const res = await authService.signIn(email, pass);
    if (res.user) {
      setUser(res.user);
      setSession(res.session);
      setStatus('authenticated');
    }
    return res;
  }, []);

  const signUp = useCallback(async (email: string, pass: string) => {
    const res = await authService.signUp(email, pass);
    if (res.user) {
      setUser(res.user);
      setSession(res.session);
      setStatus('authenticated');
    }
    return res;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
    setStatus('unauthenticated');
  }, []);

  return {
    user,
    session,
    status,
    loading: status === 'initializing',
    isConfigured,
    signIn,
    signUp,
    signOut,
  };
}
