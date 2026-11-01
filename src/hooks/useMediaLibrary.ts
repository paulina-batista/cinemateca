import { useState, useEffect, useMemo, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import type { CreateMediaDTO, MediaFilter, MediaItem, SortMode, UpdateMediaDTO } from '../types/media';
import { mediaRepository } from '../services/repository/mediaRepository';
import { filterMediaItems, sortMediaItems } from '../utils/sorting';
import { getSupabaseClient } from '../services/supabase/client';

export function useMediaLibrary(user?: User | null) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<MediaFilter>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mediaRepository.getAll(user);
      // Filtra estritamente filmes e séries na interface do Kino
      const kinoData = data.filter((item) => item.type === 'movie' || item.type === 'series');
      setItems(kinoData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao acessar a biblioteca Kino.';
      setError(msg);
      console.error('Falha ao carregar itens:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Carrega ao montar ou quando o usuário mudar
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Inscrição em tempo real (Supabase Realtime) para sincronização instantânea entre celular e PC
  useEffect(() => {
    if (!user) return;
    const client = getSupabaseClient();
    if (!client) return;

    const channel = client
      .channel(`kino_sync_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'media_items',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          console.log('[Kino Realtime] Mudança remota detectada, atualizando biblioteca...');
          loadItems();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [user, loadItems]);

  const addItem = useCallback(
    async (dto: CreateMediaDTO): Promise<MediaItem> => {
      const newItem = await mediaRepository.create(dto, user);
      setItems((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
      return newItem;
    },
    [user]
  );

  const updateItem = useCallback(
    async (id: string, dto: UpdateMediaDTO): Promise<MediaItem> => {
      const updated = await mediaRepository.update(id, dto, user);
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      return updated;
    },
    [user]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      await mediaRepository.delete(id, user);
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    [user]
  );

  // Estatísticas oficiais: total, filmes, séries, média do acervo e último título adicionado
  const stats = useMemo(() => {
    const movies = items.filter((i) => i.type === 'movie').length;
    const series = items.filter((i) => i.type === 'series').length;
    const total = items.length;

    const totalRatings = items.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    const averageRating = total > 0 ? (totalRatings / total).toFixed(1) : '0.0';

    // Identifica o título adicionado mais recentemente com base em createdAt
    const sortedByDate = [...items].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const latestAdded = sortedByDate.length > 0 ? sortedByDate[0] : null;

    // Gêneros disponíveis com contagens
    const genreMap: Record<string, number> = {};
    items.forEach((item) => {
      if (item.genre) {
        genreMap[item.genre] = (genreMap[item.genre] || 0) + 1;
      }
    });

    return { total, movies, series, averageRating, latestAdded, genreMap };
  }, [items]);

  // Lista filtrada e ordenada
  const filteredAndSortedItems = useMemo(() => {
    let list = items;

    // 1. Filtro por tipo (Filme / Série / Todos)
    if (typeFilter !== 'all') {
      list = list.filter((item) => item.type === typeFilter);
    }

    // 2. Filtro por gênero específico
    if (genreFilter !== 'all') {
      list = list.filter((item) => item.genre.toLowerCase() === genreFilter.toLowerCase());
    }

    // 3. Busca por título ou gênero
    list = filterMediaItems(list, searchQuery);

    // 4. Ordenação
    return sortMediaItems(list, sortMode);
  }, [items, typeFilter, genreFilter, searchQuery, sortMode]);

  return {
    items: filteredAndSortedItems,
    rawItems: items,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    genreFilter,
    setGenreFilter,
    sortMode,
    setSortMode,
    stats,
    addItem,
    updateItem,
    deleteItem,
    reload: loadItems,
  };
}
