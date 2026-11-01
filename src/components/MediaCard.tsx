import React, { useEffect, useState } from 'react';
import { Film, Tv, Star } from 'lucide-react';
import type { MediaItem } from '../types/media';
import { createBlobUrl, revokeBlobUrl } from '../utils/image';

interface MediaCardProps {
  item: MediaItem;
  onClick: () => void;
  isLatestAdded?: boolean;
}

export const MediaCard: React.FC<MediaCardProps> = ({ item, onClick, isLatestAdded }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [hasImageError, setHasImageError] = useState<boolean>(false);

  useEffect(() => {
    let blobUrl = '';

    // Prioridade: blob local > URL remota
    if (item.coverBlob && item.coverBlob.size > 0) {
      try {
        blobUrl = createBlobUrl(item.coverBlob);
        setImageUrl(blobUrl);
        setHasImageError(false);
      } catch {
        // Fallback para URL remota
        if (item.remoteCoverUrl) {
          setImageUrl(item.remoteCoverUrl);
          setHasImageError(false);
        } else {
          setHasImageError(true);
        }
      }
    } else if (item.remoteCoverUrl) {
      setImageUrl(item.remoteCoverUrl);
      setHasImageError(false);
    } else {
      setImageUrl('');
      setHasImageError(true);
    }

    return () => {
      if (blobUrl) revokeBlobUrl(blobUrl);
    };
  }, [item.coverBlob, item.remoteCoverUrl]);

  const isMovie = item.type === 'movie';
  const titleInitial = item.title.charAt(0).toUpperCase();
  const hasRating = item.rating > 0;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      }}
      className={`group relative flex flex-col cursor-pointer select-none rounded-xl sm:rounded-2xl bg-white border transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#781D33] ${
        isLatestAdded
          ? 'border-[#781D33] shadow-[0_6px_20px_rgba(120,29,51,0.22)] ring-1 ring-[#781D33]'
          : 'border-[#F0D5DA] shadow-[0_2px_8px_rgba(30,8,13,0.04)] hover:shadow-[0_8px_24px_rgba(120,29,51,0.15)] hover:border-[#781D33]'
      }`}
      aria-label={`Ver detalhes de ${item.title}`}
    >
      {/* Capa — proporção 2:3 */}
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded-xl sm:rounded-2xl bg-[#F6EEEE]">
        {!hasImageError && imageUrl ? (
          <img
            src={imageUrl}
            alt={`Capa de ${item.title}`}
            onError={() => setHasImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#F6EEEE] via-[#eedde2] to-[#e4ccd3] text-[#781D33]">
            <span className="text-2xl sm:text-3xl font-bold font-serif text-[#781D33]/70 mb-1">{titleInitial}</span>
            {isMovie ? <Film className="w-6 h-6 opacity-40" /> : <Tv className="w-6 h-6 opacity-40" />}
          </div>
        )}

        {/* Gradiente na base */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E080D]/90 via-[#1E080D]/25 to-black/15 opacity-80 group-hover:opacity-95 transition-opacity duration-300 pointer-events-none" />

        {/* Badge de tipo */}
        <div className="absolute top-1.5 left-1.5 z-10">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold tracking-wide backdrop-blur-md shadow-sm ${
            isMovie
              ? 'bg-white/95 text-[#781D33] border border-[#F0D5DA]'
              : 'bg-[#781D33]/90 text-white border border-[#8C253E]'
          }`}>
            {isMovie ? <Film className="w-2.5 h-2.5 text-[#C99A4E]" /> : <Tv className="w-2.5 h-2.5 text-[#C99A4E]" />}
            <span className="hidden sm:inline">{isMovie ? 'Filme' : 'Série'}</span>
          </span>
        </div>

        {/* Badge de nota (só mostra se rating > 0) */}
        {hasRating && (
          <div className="absolute top-1.5 right-1.5 z-10">
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/95 text-[#1E080D] text-[9px] sm:text-[10px] font-bold shadow-sm backdrop-blur-sm border border-[#F0D5DA]">
              <Star className="w-2.5 h-2.5 fill-[#C99A4E] text-[#C99A4E]" />
              <span>{item.rating.toString().replace('.', ',')}</span>
            </div>
          </div>
        )}

        {/* Informações na base */}
        <div className="absolute bottom-0 inset-x-0 p-2 sm:p-2.5 z-10 flex flex-col justify-end">
          <span className="text-[8px] sm:text-[9px] font-bold text-[#C99A4E] line-clamp-1 drop-shadow-sm uppercase tracking-wider">
            {item.genre}
          </span>
          <h2 className="text-[11px] sm:text-xs font-semibold text-white line-clamp-2 leading-tight drop-shadow font-serif">
            {item.title}
          </h2>
          <span className="text-[8px] sm:text-[9px] text-[#F6EEEE]/80 line-clamp-1 font-light mt-0.5">
            {item.status}
          </span>
        </div>
      </div>
    </div>
  );
};
