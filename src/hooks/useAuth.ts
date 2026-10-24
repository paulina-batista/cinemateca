import { useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { authService } from '../services/supabase/authService';
import { isSupabaseConfigured } from '../services/supabase/client';
import { syncService } from '../services/supabase/syncService';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // Carrega a sessão inicial
    authService.getSession().then((initialSession) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);

      if (initialSession?.user) {
        // Dispara sincronização inicial com a nuvem
        syncService.syncNow();
      }
    });

    // Inscreve para mudanças no estado de login
    const unsubscribe = authService.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      if (newSession?.user) {
        syncService.syncNow();
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isConfigured]);

  const signIn = useCallback(async (email: string, pass: string) => {
    const res = await authService.signIn(email, pass);
    if (res.user) {
      setUser(res.user);
      setSession(res.session);
      await syncService.syncNow();
    }
    return res;
  }, []);

  const signUp = useCallback(async (email: string, pass: string) => {
    const res = await authService.signUp(email, pass);
    if (res.user) {
      setUser(res.user);
      setSession(res.session);
    }
    return res;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return {
    user,
    session,
    loading,
    isConfigured,
    signIn,
    signUp,
    signOut,
  };
}
