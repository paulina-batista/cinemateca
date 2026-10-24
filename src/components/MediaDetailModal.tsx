import React, { useEffect, useState } from 'react';
import { Film, Tv, Calendar, Clock, Edit3, Trash2, X, Star } from 'lucide-react';
import type { MediaItem } from '../types/media';
import { createBlobUrl, revokeBlobUrl } from '../utils/image';
import { StarRating } from './StarRating';

interface MediaDetailModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onEdit: (item: MediaItem) => void;
  onDeleteRequest: (item: MediaItem) => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  onClose,
  onEdit,
  onDeleteRequest,
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    let url = '';
    if (item?.coverBlob) {
      url = createBlobUrl(item.coverBlob);
      setImageUrl(url);
    } else {
      setImageUrl('');
    }

    return () => {
      if (url) {
        revokeBlobUrl(url);
      }
    };
  }, [item]);

  if (!item) return null;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const isMovie = item.type === 'movie';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#fff9fa] rounded-3xl border border-[#f3d0d6] shadow-[0_20px_60px_rgba(72,16,25,0.25)] overflow-hidden animate-modal-pop max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão fechar flutuante */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#704850] hover:text-[#3d121a] flex items-center justify-center shadow-md transition-colors"
          aria-label="Fechar detalhes"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-7 items-start">
            {/* Capa */}
            <div className="w-full sm:w-48 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-[#faeded] border border-[#f3d0d6] shadow-md relative">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`Capa de ${item.title}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#c56d7b]">
                  <Film className="w-12 h-12 opacity-40" />
                </div>
              )}
            </div>

            {/* Informações Centrais */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    isMovie
                      ? 'bg-[#faeded] text-[#722330] border border-[#f3ccd3]'
                      : 'bg-[#722330] text-white'
                  }`}
                >
                  {isMovie ? <Film className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
                  {isMovie ? 'Filme' : 'Série'}
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white text-[#5c2a33] border border-[#f0cdd4]">
                  {item.genre}
                </span>
              </div>

              <h2 id="detail-title" className="text-2xl sm:text-3xl font-bold font-serif text-[#3d121a] leading-tight">
                {item.title}
              </h2>

              {/* Avaliação em Estrelas */}
              <div className="flex items-center gap-2.5 pt-1">
                <StarRating rating={item.rating} readOnly size="md" />
                <span className="text-sm font-bold text-[#722330] flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-[#e5a93c] text-[#e5a93c]" />
                  {item.rating.toString().replace('.', ',')} de 5 estrelas
                </span>
              </div>

              {/* Notas pessoais se houver */}
              {item.notes && (
                <div className="mt-3 p-3.5 rounded-2xl bg-[#fdf2f4] border border-[#f8dce1] text-xs sm:text-sm text-[#5a2e37] leading-relaxed">
                  <p className="font-semibold text-xs text-[#8c2d3c] uppercase tracking-wider mb-1">
                    Suas impressões:
                  </p>
                  <p className="whitespace-pre-line">{item.notes}</p>
                </div>
              )}

              {/* Metadados e Datas */}
              <div className="pt-3 border-t border-[#f5d9df] space-y-1.5 text-xs text-[#80555e]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#c56d7b]" />
                  <span>Cadastrado em: {formatDate(item.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#c56d7b]" />
                  <span>Última atualização: {formatDate(item.updatedAt)}</span>
                </div>
                <div className="text-[10px] text-[#aa858c] font-mono pt-1">
                  ID: {item.id}
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Ações: Editar e Excluir */}
          <div className="pt-4 border-t border-[#f5d9df] flex items-center justify-end gap-3">
            <button
              onClick={() => onDeleteRequest(item)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#8c2d3c] hover:bg-[#faeded] border border-[#f0c3cb] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </button>

            <button
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-[#722330] text-white hover:bg-[#8c2d3c] shadow-sm transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editar Título
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
