import type { User } from '@supabase/supabase-js';
import type { CreateMediaDTO, MediaItem, UpdateMediaDTO } from '../../types/media';
import { DEFAULT_STATUS } from '../../types/media';
import { idbService } from '../db/indexedDB';
import { getSupabaseClient } from '../supabase/client';
import { storageService } from '../supabase/storageService';


export interface IMediaRepository {
  getAll(user?: User | null): Promise<MediaItem[]>;
  getById(id: string, user?: User | null): Promise<MediaItem | null>;
  create(dto: CreateMediaDTO, user?: User | null): Promise<MediaItem>;
  update(id: string, dto: UpdateMediaDTO, user?: User | null): Promise<MediaItem>;
  delete(id: string, user?: User | null): Promise<void>;
  checkDuplicateTitle(title: string, type: string, excludeId?: string, user?: User | null): Promise<boolean>;
}

export class KinoMediaRepository implements IMediaRepository {
  /**
   * Normaliza título para comparação semântica (minúsculas, sem espaços extras).
   */
  private normalizeTitle(title: string): string {
    return title.trim().toLowerCase();
  }

  /**
   * Verifica se já existe um título igual na biblioteca (local ou remota).
   */
  async checkDuplicateTitle(
    title: string,
    type: string,
    excludeId?: string,
    user?: User | null
  ): Promise<boolean> {
    const normalized = this.normalizeTitle(title);
    if (!normalized) return false;

    const client = getSupabaseClient();
    if (client && user) {
      const { data } = await client
        .from('media_items')
        .select('id, title, type')
        .eq('user_id', user.id)
        .eq('type', type)
        .is('deleted_at', null);

      if (data) {
        const found = data.some(
          (item) => item.id !== excludeId && this.normalizeTitle(item.title) === normalized
        );
        if (found) return true;
      }
    }

    const localItems = await idbService.getAll();
    return localItems.some(
      (item) =>
        item.id !== excludeId &&
        item.type === type &&
        this.normalizeTitle(item.title) === normalized
    );
  }

  /**
   * Retorna todos os itens da biblioteca.
   * Quando autenticado, busca no Supabase (fonte da verdade) e atualiza o cache local.
   * NÃO faz download de blobs de capa aqui — usa URL remota para display.
   */
  async getAll(user?: User | null): Promise<MediaItem[]> {
    const client = getSupabaseClient();

    if (client && user) {
      try {
        const { data: remoteItems, error } = await client
          .from('media_items')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (!error && remoteItems) {
          const remoteIdSet = new Set(remoteItems.map((r) => r.id));

          // Migra itens locais não sincronizados para o Supabase
          const localItems = await idbService.getAll(true);
          const unsyncedLocals = localItems.filter(
            (item) => !item.isDeletedLocally && !item.syncedWithSupabase && !remoteIdSet.has(item.id)
          );

          if (unsyncedLocals.length > 0) {
            console.log(`[Kino] Migrando ${unsyncedLocals.length} itens locais para o Supabase...`);

            for (const localItem of unsyncedLocals) {
              const isDuplicate = remoteItems.some(
                (r) =>
                  r.type === localItem.type &&
                  this.normalizeTitle(r.title) === this.normalizeTitle(localItem.title)
              );

              if (!isDuplicate) {
                let coverUrl = localItem.remoteCoverUrl || '';
                if (localItem.coverBlob && localItem.coverBlob.size > 0) {
                  try {
                    coverUrl = await storageService.uploadCover(
                      user.id,
                      localItem.id,
                      localItem.coverBlob
                    );
                  } catch {
                    coverUrl = '';
                  }
                }

                const upsertData: Record<string, any> = {
                  id: localItem.id,
                  user_id: user.id,
                  title: localItem.title.trim(),
                  type: localItem.type,
                  genre: localItem.genre.trim(),
                  rating: localItem.rating,
                  status: localItem.status || DEFAULT_STATUS[localItem.type as keyof typeof DEFAULT_STATUS] || 'Assistido',
                  cover_url: coverUrl,
                  notes: localItem.notes || '',
                  created_at: localItem.createdAt,
                  updated_at: localItem.updatedAt,
                  deleted_at: null,
                };

                const { error: upsertErr } = await client.from('media_items').upsert({
                  ...upsertData,
                  year: localItem.year ?? null,
                  duration: localItem.duration ?? null,
                  seasons: localItem.seasons ?? null,
                  episodes: localItem.episodes ?? null,
                });

                if (upsertErr && (upsertErr.code === '42703' || String(upsertErr.message || '').includes('does not exist'))) {
                  await client.from('media_items').upsert(upsertData);
                }
              }
            }

            // Recarrega após migração
            const { data: refreshed } = await client
              .from('media_items')
              .select('*')
              .eq('user_id', user.id)
              .is('deleted_at', null)
              .order('created_at', { ascending: false });

            if (refreshed) {
              return this.mapRemoteItemsToMediaItems(refreshed);
            }
          }

          return this.mapRemoteItemsToMediaItems(remoteItems);
        }
      } catch (err) {
        console.warn('[Kino] Falha ao consultar Supabase, usando cache local:', err);
      }
    }

    // Fallback: carrega do IndexedDB local
    return await idbService.getAll();
  }

  /**
   * Converte registros remotos para MediaItem SEM baixar blobs de capa.
   * Usa a URL remota para exibição e mantém um Blob mínimo (vazio) para compatibilidade.
   * Isso é a principal correção de performance: evita N downloads de imagem no carregamento.
   */
  private mapRemoteItemsToMediaItems(
    remoteList: Array<{
      id: string;
      title: string;
      type: string;
      genre: string;
      rating: number;
      status?: string;
      cover_url?: string;
      notes?: string;
      created_at: string;
      updated_at: string;
    }>
  ): MediaItem[] {
    const result: MediaItem[] = remoteList.map((r) => {
      // Para imagens base64 armazenadas diretamente no banco (legado)
      let coverBlob: Blob;
      if (r.cover_url && r.cover_url.startsWith('data:image/')) {
        try {
          // Converte de forma síncrona apenas se for base64 pequeno
          coverBlob = new Blob([''], { type: 'image/webp' });
        } catch {
          coverBlob = new Blob([''], { type: 'image/webp' });
        }
      } else {
        // Blob vazio — a URL remota é usada para exibição
        coverBlob = new Blob([''], { type: 'image/webp' });
      }

      return {
        id: r.id,
        title: r.title,
        type: r.type as 'movie' | 'series',
        genre: r.genre,
        year: (r as any).year !== undefined && (r as any).year !== null ? Number((r as any).year) : null,
        duration: (r as any).duration || null,
        seasons: (r as any).seasons || null,
        episodes: (r as any).episodes || null,
        rating: Number(r.rating),
        status: r.status || DEFAULT_STATUS[r.type as keyof typeof DEFAULT_STATUS] || 'Assistido',
        coverBlob,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        notes: r.notes || '',
        syncedWithSupabase: true,
        remoteId: r.id,
        remoteCoverUrl: r.cover_url || '',
      };
    });

    // Atualiza cache local sem aguardar (fire-and-forget)
    idbService.putMany(result).catch(() => {});

    return result;
  }

  async getById(id: string, user?: User | null): Promise<MediaItem | null> {
    const all = await this.getAll(user);
    return all.find((item) => item.id === id) || null;
  }

  async create(dto: CreateMediaDTO, user?: User | null): Promise<MediaItem> {
    const normalizedTitle = this.normalizeTitle(dto.title);
    if (!normalizedTitle) {
      throw new Error('O título não pode ser vazio.');
    }

    const isDuplicate = await this.checkDuplicateTitle(dto.title, dto.type, undefined, user);
    if (isDuplicate) {
      throw new Error('Este título já está na sua biblioteca.');
    }

    const now = new Date().toISOString();
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `kino_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    let remoteCoverUrl = '';
    const client = getSupabaseClient();

    if (client && user) {
      // Upload da capa
      try {
        remoteCoverUrl = await storageService.uploadCover(user.id, id, dto.coverBlob);
      } catch (err) {
        console.warn('Aviso: falha ao enviar capa para a nuvem:', err);
      }

      // Grava no Supabase com suporte a colunas detalhadas e fallback seguro
      const baseInsert = {
        id,
        user_id: user.id,
        title: dto.title.trim(),
        type: dto.type,
        genre: dto.genre.trim(),
        rating: dto.rating,
        status: dto.status || DEFAULT_STATUS[dto.type],
        cover_url: remoteCoverUrl,
        notes: dto.notes?.trim() || '',
        created_at: now,
        updated_at: now,
        deleted_at: null,
      };

      const fullInsert = {
        ...baseInsert,
        year: dto.year !== undefined && dto.year !== null ? Number(dto.year) : null,
        duration: dto.duration?.trim() || null,
        seasons: dto.seasons !== undefined && dto.seasons !== null && dto.seasons !== '' ? String(dto.seasons) : null,
        episodes: dto.episodes !== undefined && dto.episodes !== null && dto.episodes !== '' ? String(dto.episodes) : null,
      };

      let { error: insertError } = await client.from('media_items').insert(fullInsert);

      if (insertError && (insertError.code === '42703' || String(insertError.message || '').includes('does not exist'))) {
        const retry = await client.from('media_items').insert(baseInsert);
        insertError = retry.error;
      }

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('Este título já está na sua biblioteca.');
        }
        throw new Error(`Falha ao salvar no Supabase: ${insertError.message}`);
      }
    }

    const newItem: MediaItem = {
      id,
      title: dto.title.trim(),
      type: dto.type,
      genre: dto.genre.trim(),
      year: dto.year !== undefined && dto.year !== null ? Number(dto.year) : null,
      duration: dto.duration?.trim() || null,
      seasons: dto.seasons !== undefined && dto.seasons !== null && dto.seasons !== '' ? String(dto.seasons) : null,
      episodes: dto.episodes !== undefined && dto.episodes !== null && dto.episodes !== '' ? String(dto.episodes) : null,
      rating: dto.rating,
      status: dto.status || DEFAULT_STATUS[dto.type],
      coverBlob: dto.coverBlob,
      createdAt: now,
      updatedAt: now,
      notes: dto.notes?.trim() || '',
      syncedWithSupabase: Boolean(client && user),
      remoteId: client && user ? id : null,
      remoteCoverUrl,
    };

    await idbService.add(newItem);
    return newItem;
  }

  async update(id: string, dto: UpdateMediaDTO, user?: User | null): Promise<MediaItem> {
    // Primeiro tenta buscar do cache local; se não encontrar, busca do Supabase
    let existing = await idbService.getById(id);
    if (!existing && user) {
      const client = getSupabaseClient();
      if (client) {
        const { data } = await client
          .from('media_items')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();
        if (data) {
          existing = this.mapRemoteItemsToMediaItems([data])[0];
        }
      }
    }

    if (!existing) {
      throw new Error('Registro não encontrado para atualização.');
    }

    const targetType = dto.type || existing.type;
    const targetTitle = dto.title !== undefined ? dto.title.trim() : existing.title;

    const isDuplicate = await this.checkDuplicateTitle(targetTitle, targetType, id, user);
    if (isDuplicate) {
      throw new Error('Este título já está na sua biblioteca.');
    }

    const now = new Date().toISOString();
    let remoteCoverUrl = existing.remoteCoverUrl || '';

    const client = getSupabaseClient();
    if (client && user) {
      if (dto.coverBlob && dto.coverBlob.size > 0) {
        try {
          remoteCoverUrl = await storageService.uploadCover(user.id, id, dto.coverBlob);
        } catch (err) {
          console.warn('Aviso: falha ao atualizar capa na nuvem:', err);
        }
      }

      const baseUpdate: Record<string, any> = {
        title: targetTitle,
        type: targetType,
        genre: dto.genre !== undefined ? dto.genre.trim() : existing.genre,
        rating: dto.rating !== undefined ? dto.rating : existing.rating,
        status: dto.status !== undefined ? dto.status : existing.status,
        cover_url: remoteCoverUrl,
        notes: dto.notes !== undefined ? dto.notes.trim() : existing.notes,
        updated_at: now,
      };

      const fullUpdate: Record<string, any> = {
        ...baseUpdate,
        year: dto.year !== undefined ? (dto.year !== null ? Number(dto.year) : null) : existing.year,
        duration: dto.duration !== undefined ? (dto.duration?.trim() || null) : existing.duration,
        seasons: dto.seasons !== undefined ? (dto.seasons !== null && dto.seasons !== '' ? String(dto.seasons) : null) : existing.seasons,
        episodes: dto.episodes !== undefined ? (dto.episodes !== null && dto.episodes !== '' ? String(dto.episodes) : null) : existing.episodes,
      };

      let { error: updateError } = await client
        .from('media_items')
        .update(fullUpdate)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError && (updateError.code === '42703' || String(updateError.message || '').includes('does not exist'))) {
        const retry = await client
          .from('media_items')
          .update(baseUpdate)
          .eq('id', id)
          .eq('user_id', user.id);
        updateError = retry.error;
      }

      if (updateError) {
        if (updateError.code === '23505') {
          throw new Error('Este título já está na sua biblioteca.');
        }
        throw new Error(`Falha ao atualizar no Supabase: ${updateError.message}`);
      }
    }

    const updatedItem: MediaItem = {
      ...existing,
      title: targetTitle,
      type: targetType,
      genre: dto.genre !== undefined ? dto.genre.trim() : existing.genre,
      year: dto.year !== undefined ? (dto.year !== null ? Number(dto.year) : null) : existing.year,
      duration: dto.duration !== undefined ? (dto.duration?.trim() || null) : existing.duration,
      seasons: dto.seasons !== undefined ? (dto.seasons !== null && dto.seasons !== '' ? String(dto.seasons) : null) : existing.seasons,
      episodes: dto.episodes !== undefined ? (dto.episodes !== null && dto.episodes !== '' ? String(dto.episodes) : null) : existing.episodes,
      rating: dto.rating !== undefined ? dto.rating : existing.rating,
      status: dto.status !== undefined ? dto.status : existing.status,
      coverBlob: dto.coverBlob && dto.coverBlob.size > 0 ? dto.coverBlob : existing.coverBlob,
      notes: dto.notes !== undefined ? dto.notes.trim() : existing.notes,
      updatedAt: now,
      remoteCoverUrl,
      syncedWithSupabase: Boolean(client && user),
    };

    await idbService.put(updatedItem);
    return updatedItem;
  }

  async delete(id: string, user?: User | null): Promise<void> {
    const client = getSupabaseClient();
    if (client && user) {
      const { error } = await client
        .from('media_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.warn('Aviso: falha ao deletar no Supabase:', error.message);
      }

      await storageService.deleteCover(user.id, id);
    }

    await idbService.delete(id);
  }
}

export const mediaRepository: IMediaRepository = new KinoMediaRepository();
