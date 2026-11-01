import React from 'react';
import { Film, Tv, Search, X, ArrowDownAZ, Archive, UserCheck, User } from 'lucide-react';
import type { MediaFilter, SortMode } from '../types/media';

interface HeaderProps {
  totalCount: number;
  movieCount: number;
  seriesCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: MediaFilter;
  onFilterChange: (filter: MediaFilter) => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  onOpenBackupModal: () => void;
  onOpenAuthModal: () => void;
  isAuthenticated: boolean;
  userEmail?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  movieCount,
  seriesCount,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  sortMode,
  onSortChange,
  onOpenBackupModal,
  onOpenAuthModal,
  isAuthenticated,
  userEmail,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#FBF6F6]/90 border-b border-[#F0D5DA] shadow-[0_2px_12px_rgba(30,8,13,0.04)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
        {/* Linha Superior: Logo Kino + Subtítulo + Ações Secundárias (Backup, Usuário) */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Emblema Oficial Kino */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#781D33] border border-[#C99A4E]/40 flex items-center justify-center text-white shadow-sm shrink-0 overflow-hidden">
              <img src="/favicon.png" alt="Kino" className="w-full h-full object-cover" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#1E080D] tracking-tight">
                  Kino
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F6EEEE] text-[#781D33] border border-[#F0D5DA]">
                  {totalCount} {totalCount === 1 ? 'título' : 'títulos'}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-[#781D33]/80 font-normal">
                Curadoria pessoal de arte e mídias
              </p>
            </div>
          </div>

          {/* Botões de Ação Secundários no Topo (Sem botão de adicionar - este fica exclusivamente no botão flutuante) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Status da Conta / Supabase */}
            <button
              onClick={onOpenAuthModal}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
                isAuthenticated
                  ? 'bg-[#781D33] text-white border-[#781D33] hover:bg-[#8C253E]'
                  : 'bg-white text-[#781D33] hover:bg-[#F6EEEE] border-[#F0D5DA]'
              }`}
              title={isAuthenticated ? `Conta conectada: ${userEmail || ''}` : 'Fazer login / conectar Supabase'}
              aria-label="Perfil do usuário e nuvem"
            >
              {isAuthenticated ? (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-[#C99A4E]" />
                  <span className="hidden md:inline text-[11px] truncate max-w-[120px] font-medium">
                    {userEmail?.split('@')[0] || 'Conectado'}
                  </span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-[#C99A4E]" />
                  <span className="hidden sm:inline">Entrar</span>
                </>
              )}
            </button>

            {/* Botão de Backup */}
            <button
              onClick={onOpenBackupModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-[#1E080D] hover:bg-[#F6EEEE] border border-[#F0D5DA] shadow-sm transition-all cursor-pointer"
              title="Backup e Restauração de dados"
              aria-label="Backup e Restauração"
            >
              <Archive className="w-3.5 h-3.5 text-[#C99A4E]" />
              <span className="hidden md:inline">Backup</span>
            </button>
          </div>
        </div>

        {/* Linha Inferior: Barra de Busca + Filtros de Categoria (Todos, Filmes, Séries) + Ordenação */}
        <div className="mt-2.5 sm:mt-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Campo de Busca */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#781D33]/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar título, gênero ou diretor..."
              className="w-full pl-9 pr-8 py-2 rounded-full bg-white border border-[#F0D5DA] text-base sm:text-sm text-[#1E080D] placeholder-[#781D33]/40 focus:outline-none focus:ring-2 focus:ring-[#781D33]/30 focus:border-[#781D33] shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-[#F6EEEE] text-[#781D33] transition-colors cursor-pointer"
                aria-label="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtros por Categoria (Apenas Filmes e Séries) & Ordenação */}
          <div className="flex items-center justify-between md:justify-end gap-2 overflow-x-auto no-scrollbar pb-0.5 md:pb-0">
            {/* Tabs de Categoria */}
            <div className="inline-flex p-1 rounded-full bg-[#F6EEEE] border border-[#F0D5DA] shrink-0">
              <button
                onClick={() => onFilterChange('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-[#781D33] text-white shadow-sm'
                    : 'text-[#1E080D]/80 hover:text-[#781D33]'
                }`}
              >
                Todos ({totalCount})
              </button>
              <button
                onClick={() => onFilterChange('movie')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'movie'
                    ? 'bg-[#781D33] text-white shadow-sm'
                    : 'text-[#1E080D]/80 hover:text-[#781D33]'
                }`}
              >
                <Film className="w-3 h-3 text-[#C99A4E]" />
                Filmes ({movieCount})
              </button>
              <button
                onClick={() => onFilterChange('series')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === 'series'
                    ? 'bg-[#781D33] text-white shadow-sm'
                    : 'text-[#1E080D]/80 hover:text-[#781D33]'
                }`}
              >
                <Tv className="w-3 h-3 text-[#C99A4E]" />
                Séries ({seriesCount})
              </button>
            </div>

            {/* Seletor de Ordenação */}
            <div className="relative shrink-0 flex items-center">
              <label htmlFor="sort-select" className="sr-only">
                Ordenar por
              </label>
              <div className="flex items-center gap-1 pl-2.5 pr-2 py-1.5 rounded-full bg-white border border-[#F0D5DA] text-xs font-medium text-[#1E080D] shadow-sm">
                <ArrowDownAZ className="w-3.5 h-3.5 text-[#C99A4E]" />
                <select
                  id="sort-select"
                  value={sortMode}
                  onChange={(e) => onSortChange(e.target.value as SortMode)}
                  className="bg-transparent text-xs text-[#1E080D] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="recent">Mais Recentes</option>
                  <option value="title-asc">A-Z (Alfabética)</option>
                  <option value="title-desc">Z-A</option>
                  <option value="rating-desc">Maior Nota (★ 5 a 0,5)</option>
                  <option value="rating-asc">Menor Nota (★ 0,5 a 5)</option>
                  <option value="status">Por Status</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
