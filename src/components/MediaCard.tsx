import React, { useEffect, useState } from 'react';
import { Film, Tv, BookOpen, Gamepad2, Star } from 'lucide-react';
import type { MediaItem, MediaType } from '../types/media';
import { TYPE_LABELS } from '../types/media';
import { createBlobUrl, revokeBlobUrl } from '../utils/image';

interface MediaCardProps {
  item: MediaItem;
  onClick: () => void;
}

const TYPE_ICONS: Record<MediaType, React.ReactNode> = {
  movie:  <Film   className="w-2.5 h-2.5" />,
  series: <Tv     className="w-2.5 h-2.5" />,
  book:   <BookOpen className="w-2.5 h-2.5" />,
  game:   <Gamepad2 className="w-2.5 h-2.5" />,
};

const TYPE_BADGE_STYLE: Record<MediaType, string> = {
  movie:  'bg-white/90 text-[#722330] border border-[#f5d0d6]',
  series: 'bg-[#722330]/90 text-white border border-[#8c2d3c]',
  book:   'bg-[#4a2060]/90 text-white border border-[#6a3c88]',
  game:   'bg-[#1a4060]/90 text-white border border-[#2a5c88]',
};

// Ícone de placeholder por tipo (sem capa)
const PlaceholderIcons: Record<MediaType, React.ReactNode> = {
  movie:  <Film     className="w-8 h-8 opacity-40 text-[#c56d7b]" />,
  series: <Tv       className="w-8 h-8 opacity-40 text-[#c56d7b]" />,
  book:   <BookOpen className="w-8 h-8 opacity-40 text-[#7c4daa]" />,
  game:   <Gamepad2 className="w-8 h-8 opacity-40 text-[#4d7caa]" />,
};

export const MediaCard: React.FC<MediaCardProps> = ({ item, onClick }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [hasImageError, setHasImageError] = useState<boolean>(false);

  useEffect(() => {
    let url = '';
    try {
      if (item.coverBlob && item.coverBlob.size > 0) {
        url = createBlobUrl(item.coverBlob);
        setImageUrl(url);
        setHasImageError(false);
      } else {
        setHasImageError(true);
      }
    } catch {
      setHasImageError(true);
    }

    return () => {
      if (url) revokeBlobUrl(url);
    };
  }, [item.coverBlob]);

  const type = item.type as MediaType;
  const titleInitial = item.title.charAt(0).toUpperCase();

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative flex flex-col cursor-pointer select-none rounded-xl sm:rounded-2xl bg-white border border-[#f3d9de] shadow-[0_2px_8px_rgba(114,35,48,0.06)] hover:shadow-[0_6px_20px_rgba(114,35,48,0.14)] hover:border-[#e29ba6] transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#c56d7b] focus:ring-offset-1"
      aria-label={`Ver detalhes de ${item.title}`}
    >
      {/* Container da Capa — aspect-ratio 2:3 (proporção de pôster) */}
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded-xl sm:rounded-2xl bg-[#faeded]">
        {!hasImageError && imageUrl ? (
          <img
            src={imageUrl}
            alt={`Capa de ${item.title}`}
            onError={() => setHasImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          /* Placeholder elegante com inicial e ícone */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#fceeed] to-[#f0d4da] text-[#a8747e]">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-[#c56d7b]/60 mb-1">{titleInitial}</span>
            {PlaceholderIcons[type]}
          </div>
        )}

        {/* Gradiente base estilo streaming */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2f0e15]/85 via-[#2f0e15]/10 to-black/15 opacity-70 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none" />

        {/* Badge de Tipo — canto superior esquerdo */}
        <div className="absolute top-1.5 left-1.5 z-10">
          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold tracking-wide backdrop-blur-md shadow-sm ${TYPE_BADGE_STYLE[type]}`}>
            {TYPE_ICONS[type]}
            <span className="hidden sm:inline">{TYPE_LABELS[type]}</span>
          </span>
        </div>

        {/* Badge de Nota — canto superior direito */}
        <div className="absolute top-1.5 right-1.5 z-10">
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/95 text-[#4a1c24] text-[9px] sm:text-[10px] font-bold shadow-sm backdrop-blur-sm border border-[#f5d0d6]">
            <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-[#e5a93c] text-[#e5a93c]" />
            <span>{item.rating.toString().replace('.', ',')}</span>
          </div>
        </div>

        {/* Informações na base do pôster */}
        <div className="absolute bottom-0 inset-x-0 p-2 sm:p-3 z-10 flex flex-col justify-end">
          <span className="text-[8px] sm:text-[10px] font-medium text-[#ffd2da] line-clamp-1 drop-shadow-sm uppercase tracking-wider">
            {item.genre}
          </span>
          <h2 className="text-[11px] sm:text-sm font-semibold text-white line-clamp-2 leading-tight drop-shadow font-serif">
            {item.title}
          </h2>
        </div>
      </div>
    </div>
  );
};
