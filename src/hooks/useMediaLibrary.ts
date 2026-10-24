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

  // Carrega itens do IndexedDB
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

  // Adiciona novo item
  const addItem = useCallback(
    async (dto: CreateMediaDTO): Promise<MediaItem> => {
      const newItem = await mediaRepository.create(dto);
      // Atualiza a biblioteca imediatamente mantendo a ordenação
      setItems((prev) => [...prev, newItem]);
      return newItem;
    },
    []
  );

  // Atualiza item existente
  const updateItem = useCallback(
    async (id: string, dto: UpdateMediaDTO): Promise<MediaItem> => {
      const updated = await mediaRepository.update(id, dto);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    },
    []
  );

  // Remove item
  const deleteItem = useCallback(async (id: string): Promise<void> => {
    await mediaRepository.delete(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Contadores
  const stats = useMemo(() => {
    const total = items.length;
    const movies = items.filter((i) => i.type === 'movie').length;
    const series = items.filter((i) => i.type === 'series').length;
    return { total, movies, series };
  }, [items]);

  // Lista filtrada e ordenada (não altera os dados brutos salvos)
  const filteredAndSortedItems = useMemo(() => {
    // 1. Filtro por tipo
    let list = items;
    if (typeFilter !== 'all') {
      list = list.filter((item) => item.type === typeFilter);
    }

    // 2. Busca por título ou gênero
    list = filterMediaItems(list, searchQuery);

    // 3. Ordenação inteligente (padrão alfabético A-Z tratando artigos)
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
