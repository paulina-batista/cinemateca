import React, { useState } from 'react';
import { Mail, Lock, X, AlertCircle, Loader2, Sparkles, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConfig?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onOpenConfig }) => {
  const { signIn, signUp, isConfigured } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('A senha deve conter pelo menos 6 caracteres.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (mode === 'signin') {
        const res = await signIn(trimmedEmail, password);
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          onClose();
        }
      } else {
        const res = await signUp(trimmedEmail, password);
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          setSuccessMessage('Conta criada com sucesso! Faça login para sincronizar sua biblioteca.');
          setMode('signin');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na autenticação.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#1E080D]/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#FFFDFD] rounded-3xl border border-[#F0D5DA] shadow-[0_25px_60px_rgba(30,8,13,0.35)] overflow-hidden animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-[#F0D5DA] flex items-center justify-between bg-[#FBF6F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#781D33] to-[#8C253E] border border-[#C99A4E]/30 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5 text-[#C99A4E]" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-lg font-bold font-serif text-[#1E080D]">
                {mode === 'signin' ? 'Entrar no Kino' : 'Criar sua Conta Kino'}
              </h2>
              <p className="text-xs text-[#781D33]/80">
                {mode === 'signin'
                  ? 'Acesse para sincronizar entre computador e celular'
                  : 'Sincronização em nuvem e backup seguro'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F6EEEE] hover:bg-[#EBD2D7] text-[#781D33] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Aviso caso Supabase não esteja configurado */}
        {!isConfigured && (
          <div className="m-5 p-3.5 rounded-2xl bg-[#FFF9E6] border border-[#F2D785] text-xs text-[#8A5A14] space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-[#C99A4E]" />
              Conexão com Supabase necessária
            </p>
            <p className="text-[11px] leading-relaxed">
              Para entrar e sincronizar, configure a URL e a Publishable Key do Supabase:
            </p>
            {onOpenConfig && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenConfig();
                }}
                className="mt-1 inline-flex items-center text-xs font-bold text-[#781D33] underline hover:text-[#8C253E]"
              >
                Configurar credenciais do Supabase →
              </button>
            )}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tabs Entrar / Cadastrar */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#F6EEEE] border border-[#F0D5DA]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-[#781D33] shadow-sm'
                  : 'text-[#781D33]/70 hover:text-[#1E080D]'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-[#781D33] shadow-sm'
                  : 'text-[#781D33]/70 hover:text-[#1E080D]'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Alertas */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#FFF2F4] border border-[#F0B8C2] text-[#781D33] text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#781D33]" />
              <div className="flex-1 font-semibold leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#F0FBF4] border border-[#A7E2B7] text-[#145A27] text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1 font-semibold leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Campo E-mail */}
          <div>
            <label className="block text-xs font-semibold text-[#1E080D] uppercase tracking-wider mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A88B91]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-[#F0D5DA] text-sm text-[#1E080D] placeholder-[#A88B91] focus:outline-none focus:ring-2 focus:ring-[#781D33]/30 focus:border-[#781D33] shadow-sm"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-xs font-semibold text-[#1E080D] uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A88B91]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full pl-9 pr-10 py-2.5 rounded-2xl bg-white border border-[#F0D5DA] text-sm text-[#1E080D] placeholder-[#A88B91] focus:outline-none focus:ring-2 focus:ring-[#781D33]/30 focus:border-[#781D33] shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A88B91] hover:text-[#781D33] p-1 cursor-pointer"
                aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-[#781D33]/80 leading-relaxed pt-1">
            ✨ Seus títulos locais são preservados. Ao entrar, todos os seus filmes e séries serão sincronizados em nuvem via Supabase.
          </p>

          {/* Botão de Envio */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !isConfigured}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-xs sm:text-sm font-semibold bg-[#781D33] text-white hover:bg-[#8C253E] border border-[#C99A4E]/30 disabled:opacity-60 shadow-[0_4px_14px_rgba(120,29,51,0.22)] transition-all cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' ? 'Entrar e Sincronizar' : 'Criar Conta no Kino'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
