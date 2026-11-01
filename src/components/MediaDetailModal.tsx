import React, { useEffect, useState } from 'react';
import { Film, Tv, Calendar, Clock, Edit3, Trash2, X, Star, CheckCircle2 } from 'lucide-react';
import type { MediaItem, MediaType } from '../types/media';
import { TYPE_LABELS } from '../types/media';
import { createBlobUrl, revokeBlobUrl } from '../utils/image';
import { StarRating } from './StarRating';

interface MediaDetailModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onEdit: (item: MediaItem) => void;
  onDeleteRequest: (item: MediaItem) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  movie:  <Film className="w-3.5 h-3.5" />,
  series: <Tv className="w-3.5 h-3.5" />,
};

const TYPE_BADGE_STYLE: Record<string, string> = {
  movie:  'bg-[#F6EEEE] text-[#781D33] border border-[#F0D5DA]',
  series: 'bg-[#781D33] text-white border border-[#8C253E]',
};

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  onClose,
  onEdit,
  onDeleteRequest,
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    let url = '';
    if (item?.coverBlob && item.coverBlob.size > 0) {
      url = createBlobUrl(item.coverBlob);
      setImageUrl(url);
    } else if (item?.coverUrl) {
      setImageUrl(item.coverUrl);
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

  const type = (item.type === 'movie' || item.type === 'series') ? item.type : 'movie';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#1E080D]/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#FFFDFD] rounded-2xl sm:rounded-3xl border border-[#F0D5DA] shadow-[0_20px_60px_rgba(30,8,13,0.35)] overflow-hidden animate-modal-pop max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#781D33] flex items-center justify-center shadow-md transition-colors cursor-pointer"
          aria-label="Fechar detalhes"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="overflow-y-auto p-4 sm:p-7 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-7 items-center sm:items-start">
            {/* Capa */}
            <div className="w-36 sm:w-48 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-[#FBF6F6] border border-[#F0D5DA] shadow-md relative">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`Capa de ${item.title}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#781D33]">
                  {TYPE_ICONS[type] || <Film className="w-8 h-8" />}
                </div>
              )}
            </div>

            {/* Informações Centrais */}
            <div className="flex-1 w-full space-y-2.5 sm:space-y-3">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {/* Badge de Tipo */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${TYPE_BADGE_STYLE[type] || TYPE_BADGE_STYLE.movie}`}>
                  {TYPE_ICONS[type] || <Film className="w-3.5 h-3.5" />}
                  {TYPE_LABELS[type as MediaType] || 'Filme'}
                </span>

                {/* Badge de Gênero */}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-[#1E080D] border border-[#F0D5DA]">
                  {item.genre}
                </span>

                {/* Badge de Ano */}
                {item.year && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-[#1E080D] border border-[#F0D5DA]">
                    {item.year}
                  </span>
                )}

                {/* Badge de Duração (Filme) */}
                {type === 'movie' && item.duration && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-[#1E080D] border border-[#F0D5DA]">
                    <Clock className="w-3 h-3 text-[#C99A4E]" />
                    {item.duration}
                  </span>
                )}

                {/* Badge de Temporadas / Episódios (Série) */}
                {type === 'series' && (item.seasons || item.episodes) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-[#1E080D] border border-[#F0D5DA]">
                    {item.seasons && `${item.seasons} ${Number(item.seasons) === 1 ? 'temporada' : 'temporadas'}`}
                    {item.seasons && item.episodes && ' • '}
                    {item.episodes && `${item.episodes} eps`}
                  </span>
                )}

                {/* Badge de Status */}
                {item.status && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F6EEEE] text-[#781D33] border border-[#F0D5DA]">
                    <CheckCircle2 className="w-3 h-3 text-[#781D33]" />
                    {item.status}
                  </span>
                )}
              </div>

              <h2 id="detail-title" className="text-xl sm:text-2xl font-bold font-serif text-[#1E080D] leading-tight">
                {item.title}
              </h2>

              {/* Avaliação em Estrelas Douradas */}
              <div className="flex items-center gap-2 pt-0.5">
                <StarRating rating={item.rating} readOnly size="md" />
                <span className="text-sm font-bold text-[#781D33] flex items-center gap-1">
                  {item.rating > 0 ? (
                    <>
                      <Star className="w-3.5 h-3.5 fill-[#C99A4E] text-[#C99A4E]" />
                      {item.rating.toString().replace('.', ',')} de 5 estrelas
                    </>
                  ) : (
                    <span className="text-xs text-[#A88B91] font-normal">Obra não avaliada</span>
                  )}
                </span>
              </div>

              {/* Observações / Notas */}
              {item.notes && (
                <div className="mt-2 p-3.5 rounded-2xl bg-[#FBF6F6] border border-[#F0D5DA] text-xs sm:text-sm text-[#1E080D]/90 leading-relaxed">
                  <p className="font-semibold text-xs text-[#781D33] uppercase tracking-wider mb-1">
                    Curadoria & Impressões:
                  </p>
                  <p className="whitespace-pre-line">{item.notes}</p>
                </div>
              )}

              {/* Metadados e Datas */}
              <div className="pt-2.5 border-t border-[#F0D5DA] space-y-1 text-xs text-[#781D33]/80">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C99A4E]" />
                  <span>Cadastrado em: {formatDate(item.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C99A4E]" />
                  <span>Última atualização: {formatDate(item.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Ações: Editar e Excluir */}
          <div className="pt-3 border-t border-[#F0D5DA] flex items-center justify-end gap-2.5">
            <button
              onClick={() => onDeleteRequest(item)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#8C253E] hover:bg-[#F6EEEE] border border-[#F0D5DA] transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </button>

            <button
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold bg-[#781D33] text-white hover:bg-[#8C253E] border border-[#C99A4E]/30 shadow-sm transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
