import React from 'react';
import { Film, Tv, Search, Plus, Sparkles, X, ArrowDownAZ, Archive } from 'lucide-react';
import type { MediaFilter, SortMode } from '../types/media';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { SyncStatusBadge } from './SyncStatusBadge';

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
  onOpenCreateModal: () => void;
  onOpenBackupModal: () => void;
  onOpenAuthModal: () => void;
  onOpenConfigModal: () => void;
  isOnline: boolean;
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
  onOpenCreateModal,
  onOpenBackupModal,
  onOpenAuthModal,
  onOpenConfigModal,
  isOnline,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full glass-header border-b border-[#f3d9de] shadow-[0_2px_12px_rgba(114,35,48,0.03)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
        {/* Linha Superior: Logo + Título + Status Online + Ações Primárias */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Emblema Coquette */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#fceeed] to-[#f8d7dc] border border-[#f0c1ca] flex items-center justify-center text-[#722330] shadow-sm shrink-0">
              <Sparkles className="w-5 h-5 text-[#c56d7b]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-[#3d121a] tracking-tight">
                  Cinemateca
                </h1>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#faeded] text-[#722330] border border-[#f3d0d6]">
                  {totalCount} {totalCount === 1 ? 'título' : 'títulos'}
                </span>
                {/* Indicador de Conexão */}
                <NetworkStatusIndicator isOnline={isOnline} />
              </div>
              <p className="text-[11px] sm:text-xs text-[#704850] font-normal">
                Minha cinemateca pessoal • {movieCount} filmes e {seriesCount} séries
              </p>
            </div>
          </div>

          {/* Botões de Ação no Topo: Nuvem/Auth, Backup e Cadastrar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Badge de Nuvem / Autenticação Supabase */}
            <SyncStatusBadge
              onOpenAuth={onOpenAuthModal}
              onOpenConfig={onOpenConfigModal}
              isOnline={isOnline}
            />

            {/* Botão de Backup e Restauração */}
            <button
              onClick={onOpenBackupModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs font-semibold bg-white text-[#722330] hover:bg-[#faeded] border border-[#edd1d6] shadow-sm transition-all cursor-pointer"
              title="Gerenciamento de dados e backup"
              aria-label="Backup e Restauração"
            >
              <Archive className="w-4 h-4 text-[#c56d7b]" />
              <span className="hidden lg:inline">Backup</span>
            </button>

            {/* Botão de Cadastro */}
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#722330] text-white hover:bg-[#8c2d3c] shadow-[0_4px_14px_rgba(114,35,48,0.22)] hover:shadow-[0_6px_18px_rgba(114,35,48,0.32)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              aria-label="Cadastrar novo título"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Adicionar Título</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>
        </div>

        {/* Linha Inferior: Barra de Busca + Filtros + Ordenação */}
        <div className="mt-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Campo de Busca */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3757e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por título ou gênero..."
              className="w-full pl-9 pr-9 py-2 rounded-full bg-white/90 border border-[#f0cdd4] text-xs sm:text-sm text-[#3d121a] placeholder-[#aa828a] focus:outline-none focus:ring-2 focus:ring-[#c56d7b]/40 focus:border-[#c56d7b] shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-[#faeded] text-[#9c6e76] transition-colors"
                aria-label="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtros por Categoria & Ordenação */}
          <div className="flex items-center justify-between md:justify-end gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Tabs de Tipo */}
            <div className="inline-flex p-1 rounded-full bg-[#f6e2e5] border border-[#edd1d6] shrink-0">
              <button
                onClick={() => onFilterChange('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === 'all'
                    ? 'bg-white text-[#722330] shadow-sm'
                    : 'text-[#6e464e] hover:text-[#3d121a]'
                }`}
              >
                Todos ({totalCount})
              </button>
              <button
                onClick={() => onFilterChange('movie')}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === 'movie'
                    ? 'bg-white text-[#722330] shadow-sm'
                    : 'text-[#6e464e] hover:text-[#3d121a]'
                }`}
              >
                <Film className="w-3 h-3 text-[#c56d7b]" />
                Filmes ({movieCount})
              </button>
              <button
                onClick={() => onFilterChange('series')}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeFilter === 'series'
                    ? 'bg-white text-[#722330] shadow-sm'
                    : 'text-[#6e464e] hover:text-[#3d121a]'
                }`}
              >
                <Tv className="w-3 h-3 text-[#c56d7b]" />
                Séries ({seriesCount})
              </button>
            </div>

            {/* Seletor de Ordenação */}
            <div className="relative shrink-0 flex items-center">
              <label htmlFor="sort-select" className="sr-only">
                Ordenar por
              </label>
              <div className="flex items-center gap-1 pl-2 pr-2.5 py-1.5 rounded-full bg-white border border-[#f0cdd4] text-xs font-medium text-[#5c2a33] shadow-sm">
                <ArrowDownAZ className="w-3.5 h-3.5 text-[#c56d7b]" />
                <select
                  id="sort-select"
                  value={sortMode}
                  onChange={(e) => onSortChange(e.target.value as SortMode)}
                  className="bg-transparent text-xs text-[#5c2a33] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="title-asc">A-Z (Alfabética)</option>
                  <option value="title-desc">Z-A</option>
                  <option value="rating-desc">Maior Nota (★ 5 a 0,5)</option>
                  <option value="rating-asc">Menor Nota (★ 0,5 a 5)</option>
                  <option value="recent">Mais Recentes</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
