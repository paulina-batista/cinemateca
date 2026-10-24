import React, { useState } from 'react';
import { Database, X, CheckCircle2, AlertCircle, Key, Globe, FileCode } from 'lucide-react';
import { getSupabaseCredentials, isSupabaseConfigured, setSupabaseCredentials, clearSupabaseCredentials } from '../services/supabase/client';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const current = getSupabaseCredentials();
  const [url, setUrl] = useState<string>(current.url);
  const [anonKey, setAnonKey] = useState<string>(current.anonKey);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      setErrorMessage('Informe tanto a URL quanto a Chave Anon do projeto Supabase.');
      return;
    }

    try {
      const parsed = new URL(cleanUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setErrorMessage('A URL deve iniciar com https:// ou http://');
        return;
      }
    } catch {
      setErrorMessage('Formato de URL inválido. Exemplo: https://seu-projeto.supabase.co');
      return;
    }

    setSupabaseCredentials(cleanUrl, cleanKey);
    setSaveSuccess(true);
    if (onConfigSaved) onConfigSaved();

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    clearSupabaseCredentials();
    setUrl('');
    setAnonKey('');
    setSaveSuccess(false);
    if (onConfigSaved) onConfigSaved();
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="supabase-config-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#fff9fa] rounded-3xl border border-[#f3d0d6] shadow-[0_25px_60px_rgba(72,16,25,0.25)] overflow-hidden animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-[#f3d9de] flex items-center justify-between bg-white/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#faeded] text-[#722330] flex items-center justify-center border border-[#f3ccd3]">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 id="supabase-config-title" className="text-base font-bold font-serif text-[#3d121a]">
                Conexão com Supabase
              </h2>
              <p className="text-xs text-[#704850]">
                Configure suas credenciais para banco de dados e sincronização
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#fceeed] hover:bg-[#f7d6dc] text-[#704850] flex items-center justify-center transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {saveSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#f0fbf4] border border-[#a7e2b7] text-[#145a27] text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Credenciais salvas com sucesso! Conectando...</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-[#fff0f2] border border-[#f5b3be] text-[#781928] text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#b02e42]" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Campo URL */}
          <div>
            <label className="block text-xs font-semibold text-[#5c2a33] uppercase tracking-wider mb-1.5">
              URL do Projeto (Project URL)
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3757e]" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemplo.supabase.co"
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-[#edd1d6] text-xs text-[#3d121a] placeholder-[#ab868e] focus:outline-none focus:ring-2 focus:ring-[#c56d7b]/40 shadow-sm"
              />
            </div>
          </div>

          {/* Campo Anon Key */}
          <div>
            <label className="block text-xs font-semibold text-[#5c2a33] uppercase tracking-wider mb-1.5">
              Chave Anon Pública (anon public key)
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3757e]" />
              <input
                type="text"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-[#edd1d6] text-xs font-mono text-[#3d121a] placeholder-[#ab868e] focus:outline-none focus:ring-2 focus:ring-[#c56d7b]/40 shadow-sm"
              />
            </div>
          </div>

          {/* Instruções do Schema */}
          <div className="p-3.5 rounded-2xl bg-[#fdf2f4] border border-[#f8dce1] text-xs text-[#6e464e] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#722330]">
              <FileCode className="w-4 h-4 text-[#c56d7b]" />
              Script SQL de Migração Pronto
            </div>
            <p className="text-[11px] leading-relaxed">
              O arquivo <strong>supabase/schema.sql</strong> foi criado no projeto contendo as tabelas, índices, bucket de capas <code className="text-[#722330] bg-white px-1 rounded">media-covers</code> e as políticas de segurança RLS para colar no SQL Editor do seu Supabase.
            </p>
          </div>

          {/* Ações */}
          <div className="pt-2 flex items-center justify-between">
            {isConfigured ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-[#9c2436] hover:underline"
              >
                Limpar dados
              </button>
            ) : <div />}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#704850] hover:bg-[#faeded]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full text-xs font-semibold bg-[#722330] text-white hover:bg-[#8c2d3c] shadow-sm"
              >
                Salvar Credenciais
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
