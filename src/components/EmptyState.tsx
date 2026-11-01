import React from 'react';
import { Sparkles, SearchX, Clapperboard, Plus } from 'lucide-react';

interface EmptyStateProps {
  isSearchActive: boolean;
  searchQuery?: string;
  onClearSearch?: () => void;
  onAddNew?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isSearchActive,
  searchQuery,
  onClearSearch,
  onAddNew,
}) => {
  if (isSearchActive) {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-4 text-center max-w-md mx-auto animate-fade-in">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#F6EEEE] border border-[#F0D5DA] flex items-center justify-center text-[#781D33] shadow-sm mb-3.5">
          <SearchX className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1E080D] mb-1.5">
          Nenhum título encontrado
        </h3>
        <p className="text-xs sm:text-sm text-[#781D33]/80 leading-relaxed mb-5">
          {searchQuery
            ? `Não encontramos resultados para "${searchQuery}".`
            : 'Nenhum título corresponde ao filtro ou busca selecionada.'}
        </p>
        {onClearSearch && (
          <button
            onClick={onClearSearch}
            className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#F6EEEE] text-[#781D33] hover:bg-[#EBD2D7] border border-[#F0D5DA] transition-colors cursor-pointer"
          >
            Limpar filtros e busca
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-center max-w-md mx-auto animate-fade-in">
      <div className="relative mb-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-[#F6EEEE] to-[#FBF6F6] border border-[#F0D5DA] flex items-center justify-center text-[#781D33] shadow-sm transform -rotate-3">
          <Clapperboard className="w-8 h-8 sm:w-10 sm:h-10 text-[#781D33]" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#781D33] text-[#C99A4E] border border-[#C99A4E]/30 flex items-center justify-center shadow-sm">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1E080D] mb-2">
        Sua biblioteca Kino está vazia
      </h3>
      <p className="text-xs sm:text-sm text-[#781D33]/80 leading-relaxed mb-6">
        Organize seus filmes e séries favoritos em uma curadoria pessoal sofisticada, com capas de alta qualidade, notas e sincronização em nuvem.
      </p>

      {onAddNew && (
        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold bg-[#781D33] text-white hover:bg-[#8C253E] border border-[#C99A4E]/40 shadow-[0_6px_20px_rgba(120,29,51,0.25)] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#C99A4E]" />
          Adicionar Primeiro Título
        </button>
      )}
    </div>
  );
};
