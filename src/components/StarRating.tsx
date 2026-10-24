import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0.5 a 5.0 em passos de 0.5
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onChange,
  readOnly = false,
  size = 'md',
  showLabel = false,
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starDimension = {
    sm: { box: 'w-4 h-4', icon: 'w-4 h-4' },
    md: { box: 'w-6 h-6', icon: 'w-6 h-6' },
    lg: { box: 'w-8 h-8', icon: 'w-8 h-8' },
  }[size];

  const activeValue = hoverRating ?? rating;

  const handleSelect = (val: number) => {
    if (!readOnly && onChange) {
      onChange(val);
    }
  };

  const handleMouseEnterHalf = (val: number) => {
    if (!readOnly) {
      setHoverRating(val);
    }
  };

  // Formata o número com vírgula (ex: 4,5 ou 5,0)
  const formattedValue = (typeof rating === 'number' ? rating : 0)
    .toFixed(1)
    .replace('.0', '')
    .replace('.', ',');

  return (
    <div className="inline-flex items-center gap-1.5 select-none" onMouseLeave={() => !readOnly && setHoverRating(null)}>
      <div
        className="inline-flex items-center gap-1"
        role={readOnly ? 'img' : 'group'}
        aria-label={`Avaliação: ${rating} de 5 estrelas`}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const halfValue = starIndex - 0.5;
          const fullValue = starIndex;

          const isFull = activeValue >= fullValue;
          const isHalf = !isFull && activeValue >= halfValue;

          return (
            <div
              key={starIndex}
              className={`relative ${starDimension.box} inline-block ${readOnly ? '' : 'cursor-pointer group'}`}
            >
              {/* Estrela de Fundo (Vazia) */}
              <Star
                className={`${starDimension.icon} absolute inset-0 text-[#e8cfd4] fill-transparent transition-colors`}
                aria-hidden="true"
              />

              {/* Estrela Preenchida Total */}
              {isFull && (
                <Star
                  className={`${starDimension.icon} absolute inset-0 text-[#e5a93c] fill-[#e5a93c] drop-shadow-[0_1px_3px_rgba(229,169,60,0.3)] transition-all`}
                  aria-hidden="true"
                />
              )}

              {/* Meia Estrela Preenchida (Metade Esquerda) */}
              {isHalf && (
                <div className="absolute inset-0 overflow-hidden w-1/2 pointer-events-none">
                  <Star
                    className={`${starDimension.icon} text-[#e5a93c] fill-[#e5a93c] drop-shadow-[0_1px_3px_rgba(229,169,60,0.3)]`}
                    aria-hidden="true"
                  />
                </div>
              )}

              {/* Áreas interativas para toque e clique (apenas modo interativo) */}
              {!readOnly && (
                <>
                  {/* Metade Esquerda: -0.5 */}
                  <button
                    type="button"
                    onClick={() => handleSelect(halfValue)}
                    onMouseEnter={() => handleMouseEnterHalf(halfValue)}
                    className="absolute left-0 top-0 w-1/2 h-full z-10 opacity-0 cursor-pointer focus:outline-none"
                    aria-label={`${halfValue} estrelas`}
                  />
                  {/* Metade Direita: inteira */}
                  <button
                    type="button"
                    onClick={() => handleSelect(fullValue)}
                    onMouseEnter={() => handleMouseEnterHalf(fullValue)}
                    className="absolute right-0 top-0 w-1/2 h-full z-10 opacity-0 cursor-pointer focus:outline-none"
                    aria-label={`${fullValue} estrelas`}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      {showLabel && (
        <span className="ml-1 text-xs font-bold text-[#722330]">
          {formattedValue} <span className="text-[10px] text-[#996a74] font-normal">/ 5</span>
        </span>
      )}
    </div>
  );
};
