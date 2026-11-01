import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'kino_supabase_url';
const STORAGE_KEY_ANON = 'kino_supabase_anon_key';

// Credenciais permanentes do projeto Supabase Kino
export const DEFAULT_SUPABASE_URL = 'https://jcfxgcynetnojlvphkgt.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_7RhpQjMWhsA3n5WwPG7kEA_HU5G59Wr';

let cachedClient: SupabaseClient | null = null;
let currentUrl: string = '';
let currentKey: string = '';

/**
 * Obtém as credenciais ativas do Supabase (Vite .env, localStorage ou padrão oficial).
 */
export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) || '' : '';

  const url = (storedUrl || envUrl || DEFAULT_SUPABASE_URL).trim();
  const anonKey = (storedKey || envKey || DEFAULT_SUPABASE_KEY).trim();

  return { url, anonKey };
}

/**
 * Verifica se as credenciais configuradas são válidas.
 */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  if (!url || !anonKey) return false;
  if (url.includes('seu-projeto') || anonKey.includes('sua-chave')) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Salva credenciais personalizadas salvas localmente se necessário.
 */
export function setSupabaseCredentials(url: string, anonKey: string): void {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
    localStorage.setItem(STORAGE_KEY_ANON, cleanKey);
  }

  cachedClient = null;
}

/**
 * Remove credenciais personalizadas do armazenamento local.
 */
export function clearSupabaseCredentials(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
  }
  cachedClient = null;
}

/**
 * Retorna a instância única do cliente Supabase configurada para o Kino.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { url, anonKey } = getSupabaseCredentials();

  if (cachedClient && currentUrl === url && currentKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'kino_auth_session',
      },
    });
    currentUrl = url;
    currentKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.warn('Erro ao inicializar cliente Supabase:', err);
    return null;
  }
}
