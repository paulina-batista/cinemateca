import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import type { MediaItem } from '../types/media';

interface DeleteConfirmDialogProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  item,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  if (!isOpen || !item) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm(item.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-desc"
    >
      <div className="relative w-full max-w-md bg-[#fff9fa] rounded-3xl border border-[#f3ccd3] p-6 shadow-2xl animate-modal-pop">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#fceeed] hover:bg-[#f7d6dc] text-[#704850] flex items-center justify-center transition-colors"
          aria-label="Cancelar exclusão"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-[#feecee] border border-[#f5b3be] text-[#9c2436] flex items-center justify-center shrink-0 shadow-sm">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <h3 id="delete-dialog-title" className="text-lg font-bold font-serif text-[#3d121a]">
              Excluir este título?
            </h3>
            <p id="delete-dialog-desc" className="text-xs text-[#704850] mt-1 leading-relaxed">
              Você está prestes a remover <span className="font-semibold text-[#3d121a]">"{item.title}"</span> da sua biblioteca local. A capa e os registros salvos no IndexedDB serão apagados permanentemente.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-full text-xs font-semibold text-[#704850] hover:bg-[#faeded] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-[#9c2436] text-white hover:bg-[#7a1827] disabled:opacity-60 shadow-sm transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
          </button>
        </div>
      </div>
    </div>
  );
};
