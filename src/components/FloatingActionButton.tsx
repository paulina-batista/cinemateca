import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-[calc(1.25rem+env(safe-area-inset-right,0px))] z-40 flex items-center justify-center w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-[#781D33] text-white border-2 border-[#C99A4E]/40 shadow-[0_8px_25px_rgba(120,29,51,0.45)] hover:bg-[#8C253E] hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-[#781D33]/40 cursor-pointer group"
      aria-label="Cadastrar novo título no Kino"
      title="Adicionar título"
    >
      <Plus className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5] text-white group-hover:rotate-90 transition-transform duration-300" />
    </button>
  );
};
