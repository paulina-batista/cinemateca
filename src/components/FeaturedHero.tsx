import React, { useEffect, useState } from 'react';
import { Sparkles, Star, Film, Tv, ArrowRight, Eye } from 'lucide-react';
import type { MediaItem } from '../types/media';
import { createBlobUrl, revokeBlobUrl } from '../utils/image';

interface FeaturedHeroProps {
  item: MediaItem | null;
  onViewDetails: (item: MediaItem) => void;
}

export const FeaturedHero: React.FC<FeaturedHeroProps> = ({ item, onViewDetails }) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    let url = '';
    if (item?.coverBlob && item.coverBlob.size > 0) {
      try {
        url = createBlobUrl(item.coverBlob);
        setImageUrl(url);
      } catch {
        setImageUrl('');
      }
    } else {
      setImageUrl('');
    }

    return () => {
      if (url) revokeBlobUrl(url);
    };
  }, [item?.coverBlob]);

  const createdAt = item?.createdAt;
  const formattedTime = React.useMemo(() => {
    if (!createdAt) return 'Recentemente';
    try {
      const d = new Date(createdAt);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'Recentemente';
    }
  }, [createdAt]);

  if (!item) return null;

  const isMovie = item.type === 'movie';

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#781D33] via-[#7D1F36] to-[#8C253E] text-white p-4 sm:p-6 mb-6 shadow-[0_12px_36px_rgba(120,29,51,0.28)] border border-[#a2324e]/40 animate-fade-in">
      {/* Detalhes luminosos sutis estilo Google Stitch */}
      <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#C99A4E]/15 blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-[#1E080D]/30 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-stretch gap-4 sm:gap-6">
        {/* Capa em miniatura com moldura requintada */}
        <div
          onClick={() => onViewDetails(item)}
          className="relative w-24 sm:w-28 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden bg-[#1E080D]/40 border-2 border-[#C99A4E]/50 shadow-lg cursor-pointer group transform transition-transform hover:scale-105"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Capa de ${item.title}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#C99A4E]">
              {isMovie ? <Film className="w-8 h-8 opacity-60" /> : <Tv className="w-8 h-8 opacity-60" />}
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="w-6 h-6 text-white drop-shadow" />
          </div>
        </div>

        {/* Informações de Destaque */}
        <div className="flex-1 flex flex-col justify-between text-center sm:text-left min-w-0">
          <div>
            {/* Tag de Último Adicionado */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#C99A4E] text-[#1E080D] shadow-sm">
                <Sparkles className="w-3 h-3 fill-[#1E080D]" />
                Último Adicionado
              </span>
              <span className="text-xs text-[#f7dede] font-light">
                • {formattedTime}
              </span>
            </div>

            {/* Título e Avaliação */}
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif text-white tracking-tight line-clamp-1">
                {item.title}
              </h2>
              <div className="inline-flex items-center justify-center gap-1 text-[#C99A4E] font-bold text-sm sm:text-base self-center sm:self-auto shrink-0 bg-black/20 px-2 py-0.5 rounded-full">
                <Star className="w-4 h-4 fill-[#C99A4E]" />
                <span>{item.rating.toFixed(1).replace('.', ',')}</span>
              </div>
            </div>

            {/* Metadados: Categoria, Gênero, Status */}
            <p className="text-xs sm:text-sm text-[#f6d7dd] font-medium mb-2">
              {isMovie ? 'Filme' : 'Série'} • <span className="text-[#C99A4E]">{item.genre}</span> • Status: {item.status}
            </p>

            {/* Anotações ou Sinopse */}
            {item.notes ? (
              <p className="text-xs text-[#fae8eb]/90 line-clamp-2 italic leading-relaxed max-w-2xl font-light">
                "{item.notes}"
              </p>
            ) : (
              <p className="text-xs text-[#fae8eb]/70 italic font-light">
                Recém-adicionado à sua coleção cinematográfica pessoal no Kino.
              </p>
            )}
          </div>

          {/* Botão de Ação: Ver Ficha Completa */}
          <div className="mt-3 sm:mt-2 flex items-center justify-center sm:justify-start gap-3">
            <button
              onClick={() => onViewDetails(item)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-semibold bg-white text-[#781D33] hover:bg-[#FBF6F6] hover:text-[#1E080D] transition-all shadow-md transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Ver Ficha Completa</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C99A4E]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
