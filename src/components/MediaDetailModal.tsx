import React, { useEffect, useState } from 'react';
import { Film, Tv, BookOpen, Gamepad2, Calendar, Clock, Edit3, Trash2, X, Star, CheckCircle2 } from 'lucide-react';
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

const TYPE_ICONS: Record<MediaType, React.ReactNode> = {
  movie:  <Film className="w-3.5 h-3.5" />,
  series: <Tv className="w-3.5 h-3.5" />,
  book:   <BookOpen className="w-3.5 h-3.5" />,
  game:   <Gamepad2 className="w-3.5 h-3.5" />,
};

const TYPE_BADGE_STYLE: Record<MediaType, string> = {
  movie:  'bg-[#faeded] text-[#722330] border border-[#f3ccd3]',
  series: 'bg-[#722330] text-white',
  book:   'bg-[#4a2060] text-white',
  game:   'bg-[#1a4060] text-white',
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

  const type = item.type as MediaType;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#fff9fa] rounded-2xl sm:rounded-3xl border border-[#f3d0d6] shadow-[0_20px_60px_rgba(72,16,25,0.25)] overflow-hidden animate-modal-pop max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#704850] hover:text-[#3d121a] flex items-center justify-center shadow-md transition-colors cursor-pointer"
          aria-label="Fechar detalhes"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <div className="overflow-y-auto p-4 sm:p-7 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-7 items-center sm:items-start">
            {/* Capa */}
            <div className="w-36 sm:w-48 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-[#faeded] border border-[#f3d0d6] shadow-md relative">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`Capa de ${item.title}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#c56d7b]">
                  {TYPE_ICONS[type]}
                </div>
              )}
            </div>

            {/* Informações Centrais */}
            <div className="flex-1 w-full space-y-2.5 sm:space-y-3">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {/* Badge de Tipo */}
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${TYPE_BADGE_STYLE[type]}`}>
                  {TYPE_ICONS[type]}
                  {TYPE_LABELS[type]}
                </span>

                {/* Badge de Gênero */}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-[#5c2a33] border border-[#f0cdd4]">
                  {item.genre}
                </span>

                {/* Badge de Status Pessoal */}
                {item.status && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fceeed] text-[#722330] border border-[#f3ccd3]">
                    <CheckCircle2 className="w-3 h-3 text-[#c56d7b]" />
                    {item.status}
                  </span>
                )}
              </div>

              <h2 id="detail-title" className="text-xl sm:text-2xl font-bold font-serif text-[#3d121a] leading-tight">
                {item.title}
              </h2>

              {/* Avaliação em Estrelas */}
              <div className="flex items-center gap-2 pt-0.5">
                <StarRating rating={item.rating} readOnly size="md" />
                <span className="text-sm font-bold text-[#722330] flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-[#e5a93c] text-[#e5a93c]" />
                  {item.rating.toString().replace('.', ',')} de 5 estrelas
                </span>
              </div>

              {/* Observações / Notas */}
              {item.notes && (
                <div className="mt-2 p-3 rounded-2xl bg-[#fdf2f4] border border-[#f8dce1] text-xs sm:text-sm text-[#5a2e37] leading-relaxed">
                  <p className="font-semibold text-xs text-[#8c2d3c] uppercase tracking-wider mb-0.5">
                    Suas impressões:
                  </p>
                  <p className="whitespace-pre-line">{item.notes}</p>
                </div>
              )}

              {/* Metadados e Datas */}
              <div className="pt-2.5 border-t border-[#f5d9df] space-y-1 text-xs text-[#80555e]">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#c56d7b]" />
                  <span>Cadastrado em: {formatDate(item.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#c56d7b]" />
                  <span>Última atualização: {formatDate(item.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Barra de Ações: Editar e Excluir */}
          <div className="pt-3 border-t border-[#f5d9df] flex items-center justify-end gap-2.5">
            <button
              onClick={() => onDeleteRequest(item)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#8c2d3c] hover:bg-[#faeded] border border-[#f0c3cb] transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Excluir
            </button>

            <button
              onClick={() => onEdit(item)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#722330] text-white hover:bg-[#8c2d3c] shadow-sm transition-all cursor-pointer"
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
