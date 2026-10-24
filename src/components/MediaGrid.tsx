import React from 'react';
import type { MediaItem } from '../types/media';
import { MediaCard } from './MediaCard';
import { EmptyState } from './EmptyState';

interface MediaGridProps {
  items: MediaItem[];
  totalRawItems: number;
  isSearchActive: boolean;
  searchQuery?: string;
  onClearSearch?: () => void;
  onSelectItem: (item: MediaItem) => void;
  onAddNew: () => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  totalRawItems,
  isSearchActive,
  searchQuery,
  onClearSearch,
  onSelectItem,
  onAddNew,
}) => {
  if (items.length === 0) {
    return (
      <EmptyState
        isSearchActive={isSearchActive || totalRawItems > 0}
        searchQuery={searchQuery}
        onClearSearch={onClearSearch}
        onAddNew={onAddNew}
      />
    );
  }

  return (
    /* Exatamente 3 colunas em telas mobile (grid-cols-3), expandindo para 4, 5 e 6 em telas maiores */
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3.5 md:gap-5 animate-fade-in">
      {items.map((item) => (
        <MediaCard
          key={item.id}
          item={item}
          onClick={() => onSelectItem(item)}
        />
      ))}
    </div>
  );
};
