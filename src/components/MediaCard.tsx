import React, { useEffect, useState } from 'react';
import { Film, Tv, Star } from 'lucide-react';
import type { MediaItem } from '../types/media';
import { createBlobUrl, revokeBlobUrl } from '../utils/image';

interface MediaCardProps {
  item: MediaItem;
  onClick: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, onClick }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [hasImageError, setHasImageError] = useState<boolean>(false);

  useEffect(() => {
    let url = '';
    try {
      if (item.coverBlob) {
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
      if (url) {
        revokeBlobUrl(url);
      }
    };
  }, [item.coverBlob]);

  const isMovie = item.type === 'movie';

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
      className="group relative flex flex-col cursor-pointer select-none rounded-2xl bg-white border border-[#f3d9de] shadow-[0_4px_16px_rgba(114,35,48,0.06)] hover:shadow-[0_8px_24px_rgba(114,35,48,0.14)] hover:border-[#e29ba6] transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#c56d7b]"
      aria-label={`Ver detalhes de ${item.title}`}
    >
      {/* Container da Capa com Aspect Ratio 2:3 */}
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded-2xl bg-[#faeded]">
        {!hasImageError && imageUrl ? (
          <img
            src={imageUrl}
            alt={`Capa de ${item.title}`}
            onError={() => setHasImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-[#a8747e] bg-gradient-to-b from-[#fceeed] to-[#f7dbe0]">
            <Film className="w-10 h-10 mb-2 opacity-50 text-[#c56d7b]" />
            <span className="text-xs text-center font-medium">Capa não disponível</span>
          </div>
        )}

        {/* Gradiente estilo Streaming na base do pôster */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2f0e15]/85 via-transparent to-black/10 opacity-70 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none" />

        {/* Badge de Tipo no Topo Esquerdo */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide backdrop-blur-md shadow-sm ${
              isMovie
                ? 'bg-[#ffffff]/90 text-[#722330] border border-[#f5d0d6]'
                : 'bg-[#722330]/90 text-white border border-[#8c2d3c]'
            }`}
          >
            {isMovie ? <Film className="w-3 h-3 text-[#c56d7b]" /> : <Tv className="w-3 h-3 text-[#f5d0d6]" />}
            {isMovie ? 'Filme' : 'Série'}
          </span>
        </div>

        {/* Badge de Nota no Topo Direito */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/95 text-[#4a1c24] text-[11px] font-bold shadow-sm backdrop-blur-sm border border-[#f5d0d6]">
            <Star className="w-3 h-3 fill-[#e5a93c] text-[#e5a93c]" />
            <span>{item.rating.toString().replace('.', ',')}</span>
          </div>
        </div>

        {/* Informações sobrepostas na base do pôster */}
        <div className="absolute bottom-0 inset-x-0 p-3 z-10 flex flex-col justify-end">
          <span className="text-[11px] font-medium text-[#ffd2da] line-clamp-1 drop-shadow-sm uppercase tracking-wider">
            {item.genre}
          </span>
          <h2 className="text-sm font-semibold text-white line-clamp-2 leading-tight drop-shadow font-serif">
            {item.title}
          </h2>
        </div>
      </div>
    </div>
  );
};
