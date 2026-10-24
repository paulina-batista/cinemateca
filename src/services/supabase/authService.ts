import type { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient } from './client';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error?: string | null;
}

/**
 * Traduz erros comuns de autenticação do Supabase para mensagens amigáveis em português.
 */
export function formatAuthError(error: AuthError | Error | null | unknown): string {
  if (!error) return 'Erro desconhecido.';
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos. Verifique suas credenciais.';
  }
  if (message.includes('User already registered') || message.includes('already registered')) {
    return 'Este endereço de e-mail já possui uma conta cadastrada. Tente fazer login.';
  }
  if (message.includes('Password should be at least')) {
    return 'A senha deve conter no mínimo 6 caracteres.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Por favor, confirme seu e-mail antes de fazer login.';
  }
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Sem conexão com a internet ou servidor do Supabase inacessível no momento.';
  }

  return message;
}

export class AuthService {
  /**
   * Realiza login com e-mail e senha.
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    const client = getSupabaseClient();
    if (!client) {
      return { user: null, session: null, error: 'O Supabase ainda não foi configurado.' };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { user: null, session: null, error: formatAuthError(error) };
      }

      return { user: data.user, session: data.session, error: null };
    } catch (err) {
      return { user: null, session: null, error: formatAuthError(err) };
    }
  }

  /**
   * Cadastra novo usuário com e-mail e senha.
   */
  async signUp(email: string, password: string): Promise<AuthResponse> {
    const client = getSupabaseClient();
    if (!client) {
      return { user: null, session: null, error: 'O Supabase ainda não foi configurado.' };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        return { user: null, session: null, error: formatAuthError(error) };
      }

      return { user: data.user, session: data.session, error: null };
    } catch (err) {
      return { user: null, session: null, error: formatAuthError(err) };
    }
  }

  /**
   * Encerra a sessão ativa.
   */
  async signOut(): Promise<{ error?: string | null }> {
    const client = getSupabaseClient();
    if (!client) return { error: null };

    try {
      const { error } = await client.auth.signOut();
      if (error) {
        return { error: formatAuthError(error) };
      }
      return { error: null };
    } catch (err) {
      return { error: formatAuthError(err) };
    }
  }

  /**
   * Obtém a sessão atual se houver.
   */
  async getSession(): Promise<Session | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data } = await client.auth.getSession();
      return data.session;
    } catch {
      return null;
    }
  }

  /**
   * Registra listener para mudanças no estado de autenticação.
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void): (() => void) | null {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }
}

export const authService = new AuthService();
