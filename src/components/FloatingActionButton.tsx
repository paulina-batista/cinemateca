import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-5 z-40 sm:hidden flex items-center justify-center w-13 h-13 rounded-full bg-[#722330] text-white shadow-[0_8px_25px_rgba(114,35,48,0.38)] active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-[#c56d7b]/50 cursor-pointer"
      aria-label="Cadastrar novo item no IorHub"
    >
      <Plus className="w-7 h-7 stroke-[2.5]" />
    </button>
  );
};
