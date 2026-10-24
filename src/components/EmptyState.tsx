import React from 'react';
import { Sparkles, SearchX, Library } from 'lucide-react';

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
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#fdebed] border border-[#f5ccd3] flex items-center justify-center text-[#c56d7b] shadow-sm mb-3.5">
          <SearchX className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <h3 className="text-lg sm:text-xl font-serif font-bold text-[#4a1c24] mb-1.5">
          Nenhum item encontrado
        </h3>
        <p className="text-xs sm:text-sm text-[#734e56] leading-relaxed mb-5">
          {searchQuery
            ? `Não encontramos resultados para "${searchQuery}".`
            : 'Nenhum resultado corresponde à categoria ou busca selecionada.'}
        </p>
        {onClearSearch && (
          <button
            onClick={onClearSearch}
            className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-[#fbe7ea] text-[#722330] hover:bg-[#f7d6dc] border border-[#f0c3cc] transition-colors cursor-pointer"
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
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-[#faeded] to-[#fce4e8] border border-[#f0c5cd] flex items-center justify-center text-[#c56d7b] shadow-sm transform -rotate-3">
          <Library className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#722330] text-[#fdebed] flex items-center justify-center shadow-sm">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>

      <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#3f1019] mb-2">
        Sua biblioteca IorHub está vazia
      </h3>
      <p className="text-xs sm:text-sm text-[#6e4952] leading-relaxed mb-6">
        Organize seus filmes, séries, livros e jogos em um só lugar. Salve capas dos seus arquivos, avaliações detalhadas com meias estrelas e notas com delicadeza.
      </p>

      {onAddNew && (
        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-semibold bg-[#722330] text-white hover:bg-[#8c2d3c] shadow-[0_6px_20px_rgba(114,35,48,0.25)] hover:shadow-[0_8px_25px_rgba(114,35,48,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          Cadastrar primeiro item
        </button>
      )}
    </div>
  );
};
