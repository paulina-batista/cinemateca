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
          setSuccessMessage('Conta criada com sucesso! Verifique seu e-mail ou faça login para continuar.');
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#fff9fa] rounded-3xl border border-[#f3d0d6] shadow-[0_25px_60px_rgba(72,16,25,0.25)] overflow-hidden animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="px-6 py-5 border-b border-[#f3d9de] flex items-center justify-between bg-white/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#fceeed] to-[#f8d7dc] border border-[#f0c1ca] flex items-center justify-center text-[#722330] shadow-sm">
              <Sparkles className="w-5 h-5 text-[#c56d7b]" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-lg font-bold font-serif text-[#3d121a]">
                {mode === 'signin' ? 'Entrar na Cinemateca' : 'Criar sua Conta'}
              </h2>
              <p className="text-xs text-[#704850]">
                {mode === 'signin'
                  ? 'Acesse sua conta para sincronizar seus títulos'
                  : 'Cadastre-se para backup na nuvem'}
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

        {/* Aviso caso Supabase não esteja configurado */}
        {!isConfigured && (
          <div className="m-5 p-3.5 rounded-2xl bg-[#fff5e6] border border-[#fcdba8] text-xs text-[#9c5810] space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Supabase ainda não configurado
            </p>
            <p className="text-[11px] leading-relaxed">
              Para fazer login e sincronizar na nuvem, configure sua URL e Chave Anon nas variáveis de ambiente (.env) ou clique abaixo:
            </p>
            {onOpenConfig && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenConfig();
                }}
                className="mt-1 inline-flex items-center text-xs font-bold text-[#722330] underline hover:text-[#8c2d3c]"
              >
                Configurar credenciais do Supabase →
              </button>
            )}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tabs Entrar / Cadastrar */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#f6e2e5] border border-[#edd1d6]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'signin'
                  ? 'bg-white text-[#722330] shadow-sm'
                  : 'text-[#6e464e] hover:text-[#3d121a]'
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
              className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-white text-[#722330] shadow-sm'
                  : 'text-[#6e464e] hover:text-[#3d121a]'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Alertas */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#fff0f2] border border-[#f5b3be] text-[#781928] text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#b02e42]" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#f0fbf4] border border-[#a7e2b7] text-[#145a27] text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1 font-medium leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* Campo E-mail */}
          <div>
            <label className="block text-xs font-semibold text-[#5c2a33] uppercase tracking-wider mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3757e]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-[#edd1d6] text-sm text-[#3d121a] placeholder-[#ab868e] focus:outline-none focus:ring-2 focus:ring-[#c56d7b]/40 focus:border-[#c56d7b] shadow-sm"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-xs font-semibold text-[#5c2a33] uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3757e]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full pl-9 pr-10 py-2.5 rounded-2xl bg-white border border-[#edd1d6] text-sm text-[#3d121a] placeholder-[#ab868e] focus:outline-none focus:ring-2 focus:ring-[#c56d7b]/40 focus:border-[#c56d7b] shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a3757e] hover:text-[#722330] p-1"
                aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-[#80555e] leading-relaxed pt-1">
            ✨ Sua biblioteca local é preservada. Ao entrar, todos os seus filmes e séries serão sincronizados com seu perfil no Supabase.
          </p>

          {/* Botão de Envio */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !isConfigured}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl text-xs sm:text-sm font-semibold bg-[#722330] text-white hover:bg-[#8c2d3c] disabled:opacity-60 shadow-[0_4px_14px_rgba(114,35,48,0.22)] transition-all cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' ? 'Entrar e Sincronizar' : 'Criar Conta na Cinemateca'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
