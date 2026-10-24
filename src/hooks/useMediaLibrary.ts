import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CreateMediaDTO, MediaFilter, MediaItem, SortMode, UpdateMediaDTO } from '../types/media';
import { mediaRepository } from '../services/repository/mediaRepository';
import { filterMediaItems, sortMediaItems } from '../utils/sorting';

export function useMediaLibrary() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<MediaFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('title-asc');

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mediaRepository.getAll();
      setItems(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao acessar o banco de dados local.';
      setError(msg);
      console.error('Falha ao carregar itens do IndexedDB:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const addItem = useCallback(
    async (dto: CreateMediaDTO): Promise<MediaItem> => {
      const newItem = await mediaRepository.create(dto);
      setItems((prev) => [...prev, newItem]);
      return newItem;
    },
    []
  );

  const updateItem = useCallback(
    async (id: string, dto: UpdateMediaDTO): Promise<MediaItem> => {
      const updated = await mediaRepository.update(id, dto);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    },
    []
  );

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    await mediaRepository.delete(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Contadores por categoria
  const stats = useMemo(() => {
    const total = items.length;
    const movies = items.filter((i) => i.type === 'movie').length;
    const series = items.filter((i) => i.type === 'series').length;
    const books = items.filter((i) => i.type === 'book').length;
    const games = items.filter((i) => i.type === 'game').length;
    return { total, movies, series, books, games };
  }, [items]);

  const filteredAndSortedItems = useMemo(() => {
    let list = items;
    if (typeFilter !== 'all') {
      list = list.filter((item) => item.type === typeFilter);
    }
    list = filterMediaItems(list, searchQuery);
    return sortMediaItems(list, sortMode);
  }, [items, typeFilter, searchQuery, sortMode]);

  return {
    items: filteredAndSortedItems,
    rawItems: items,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    sortMode,
    setSortMode,
    stats,
    addItem,
    updateItem,
    deleteItem,
    reload: loadItems,
  };
}
