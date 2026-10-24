import React, { useState } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudOff,
  RefreshCw,
  User as UserIcon,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSync } from '../hooks/useSync';

interface SyncStatusBadgeProps {
  onOpenAuth: () => void;
  onOpenConfig: () => void;
  isOnline: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  onOpenAuth,
  onOpenConfig,
  isOnline,
}) => {
  const { user, signOut, isConfigured } = useAuth();
  const { syncState, syncNow } = useSync();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  // Formata o timestamp da última sincronização
  const formatLastSync = (isoString: string | null) => {
    if (!isoString) return 'Ainda não sincronizado';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  // Se o usuário NÃO estiver logado:
  if (!user) {
    return (
      <button
        onClick={onOpenAuth}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#faeded] text-[#722330] hover:bg-[#f7d6dc] border border-[#f3ccd3] shadow-sm transition-all cursor-pointer"
        title={isConfigured ? 'Fazer login para sincronizar' : 'Configurar nuvem e entrar'}
      >
        <Cloud className="w-3.5 h-3.5 text-[#c56d7b]" />
        <span className="hidden sm:inline">Entrar na Nuvem</span>
        <span className="sm:hidden">Entrar</span>
      </button>
    );
  }

  // Se o usuário ESTIVER logado:
  const isSyncing = syncState.status === 'syncing';
  const hasPending = syncState.pendingCount > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-[#4a1c24] hover:bg-[#fdf2f4] border border-[#f0cdd4] shadow-sm transition-all cursor-pointer"
        aria-expanded={menuOpen}
        aria-haspopup="true"
      >
        {/* Ícone de Estado de Sincronização */}
        {isSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 text-[#c56d7b] animate-spin" />
        ) : !isOnline ? (
          <CloudOff className="w-3.5 h-3.5 text-amber-600" />
        ) : hasPending ? (
          <div className="relative flex items-center">
            <CloudUpload className="w-3.5 h-3.5 text-[#c56d7b]" />
            <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
        ) : (
          <Cloud className="w-3.5 h-3.5 text-emerald-600" />
        )}

        {/* E-mail ou status resumido */}
        <span className="hidden md:inline max-w-[120px] truncate">
          {user.email?.split('@')[0]}
        </span>
        <span className="md:hidden">
          {isSyncing ? 'Sincronizando' : hasPending ? `${syncState.pendingCount} pendente(s)` : 'Nuvem'}
        </span>

        <ChevronDown className="w-3 h-3 text-[#996a74]" />
      </button>

      {/* Menu Popover */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 rounded-3xl bg-[#fff9fa] border border-[#f3ccd3] p-4 shadow-xl z-40 animate-modal-pop text-left space-y-3">
            <div className="border-b border-[#f3d9de] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#faeded] text-[#722330] flex items-center justify-center font-bold text-xs">
                  <UserIcon className="w-4 h-4 text-[#c56d7b]" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-[#3d121a] truncate">{user.email}</p>
                  <p className="text-[10px] text-[#80555e]">Conta Conectada</p>
                </div>
              </div>
            </div>

            {/* Informações de Sincronização */}
            <div className="space-y-1.5 text-xs text-[#5c2a33]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#80555e]">Última sync:</span>
                <span className="font-semibold text-[#3d121a]">{formatLastSync(syncState.lastSyncedAt)}</span>
              </div>

              {hasPending && (
                <div className="flex items-center justify-between text-[11px] text-amber-700 bg-[#fff5e6] p-2 rounded-xl border border-[#fcdba8]">
                  <span>Alterações offline:</span>
                  <span className="font-bold">{syncState.pendingCount} item(ns)</span>
                </div>
              )}

              {syncState.errorMessage && (
                <p className="text-[10px] text-[#9c2436] bg-[#fff0f2] p-1.5 rounded-lg border border-[#f5b3be]">
                  {syncState.errorMessage}
                </p>
              )}
            </div>

            {/* Ações */}
            <div className="pt-2 border-t border-[#f3d9de] space-y-1">
              <button
                type="button"
                onClick={async () => {
                  await syncNow();
                }}
                disabled={isSyncing || !isOnline}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#722330] hover:bg-[#faeded] disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenConfig();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#704850] hover:bg-[#faeded] transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-[#c56d7b]" />
                <span>Configurações do Supabase</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setMenuOpen(false);
                  await signOut();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-[#9c2436] hover:bg-[#fff0f2] transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
