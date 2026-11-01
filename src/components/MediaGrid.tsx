import React from 'react';
import type { MediaItem } from '../types/media';
import { MediaCard } from './MediaCard';
import { EmptyState } from './EmptyState';

interface MediaGridProps {
  items: MediaItem[];
  totalRawItems: number;
  latestAddedId?: string | null;
  isSearchActive: boolean;
  searchQuery?: string;
  onClearSearch?: () => void;
  onSelectItem: (item: MediaItem) => void;
  onAddNew: () => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  totalRawItems,
  latestAddedId,
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
    /* Exatamente 3 cartazes por linha no celular (grid-cols-3) com espaçamento compacto */
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3.5 md:gap-4.5 animate-fade-in">
      {items.map((item) => (
        <MediaCard
          key={item.id}
          item={item}
          isLatestAdded={item.id === latestAddedId}
          onClick={() => onSelectItem(item)}
        />
      ))}
    </div>
  );
};
