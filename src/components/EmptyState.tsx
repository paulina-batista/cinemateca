import React from 'react';
import { Film, Plus, Sparkles, SearchX } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-[#fdebed] border border-[#f5ccd3] flex items-center justify-center text-[#c56d7b] shadow-sm mb-4">
          <SearchX className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-serif font-bold text-[#4a1c24] mb-2">
          Nenhum título encontrado
        </h3>
        <p className="text-sm text-[#734e56] leading-relaxed mb-6">
          {searchQuery
            ? `Não encontramos filmes ou séries correspondentes a "${searchQuery}".`
            : 'Nenhum resultado corresponde aos filtros selecionados.'}
        </p>
        {onClearSearch && (
          <button
            onClick={onClearSearch}
            className="px-5 py-2.5 rounded-full text-sm font-medium bg-[#fbe7ea] text-[#722330] hover:bg-[#f7d6dc] border border-[#f0c3cc] transition-colors"
          >
            Limpar filtros e busca
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto animate-fade-in">
      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#faeded] to-[#fce4e8] border border-[#f0c5cd] flex items-center justify-center text-[#c56d7b] shadow-sm transform -rotate-3">
          <Film className="w-10 h-10" />
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#722330] text-[#fdebed] flex items-center justify-center shadow-sm">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      <h3 className="text-2xl font-serif font-bold text-[#3f1019] mb-2">
        Sua cinemateca está vazia
      </h3>
      <p className="text-sm text-[#6e4952] leading-relaxed mb-8">
        Adicione os filmes e séries que você já assistiu. Salve capas, avaliações com estrelas e notas com elegância.
      </p>

      {onAddNew && (
        <button
          onClick={onAddNew}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-[#722330] text-white hover:bg-[#8c2d3c] shadow-[0_6px_20px_rgba(114,35,48,0.25)] hover:shadow-[0_8px_25px_rgba(114,35,48,0.35)] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4" />
          Cadastrar primeiro título
        </button>
      )}
    </div>
  );
};
