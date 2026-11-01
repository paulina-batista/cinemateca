import type { User } from '@supabase/supabase-js';
import type { CreateMediaDTO, MediaItem, UpdateMediaDTO } from '../../types/media';
import { DEFAULT_STATUS } from '../../types/media';
import { idbService } from '../db/indexedDB';
import { getSupabaseClient } from '../supabase/client';
import { storageService } from '../supabase/storageService';
import { base64ToBlob } from '../../utils/image';

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
   * Normaliza um título para comparação semântica estrita (minúsculas e sem espaços nas extremidades).
   */
  private normalizeTitle(title: string): string {
    return title.trim().toLowerCase();
  }

  /**
   * Verifica se já existe um filme ou série com o mesmo título na biblioteca.
   */
  async checkDuplicateTitle(
    title: string,
    type: string,
    excludeId?: string,
    user?: User | null
  ): Promise<boolean> {
    const normalized = this.normalizeTitle(title);
    if (!normalized) return false;

    // Se estiver logado, consulta no Supabase
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

    // Consulta também no IndexedDB local
    const localItems = await idbService.getAll();
    return localItems.some(
      (item) =>
        item.id !== excludeId &&
        item.type === type &&
        this.normalizeTitle(item.title) === normalized
    );
  }

  /**
   * Retorna a lista unificada de títulos.
   * Quando o usuário está autenticado, busca da nuvem (Supabase como fonte da verdade)
   * e sincroniza quaisquer registros locais remanescentes.
   */
  async getAll(user?: User | null): Promise<MediaItem[]> {
    const client = getSupabaseClient();

    if (client && user) {
      try {
        // 1. Busca da fonte oficial remota no Supabase
        const { data: remoteItems, error } = await client
          .from('media_items')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (!error && remoteItems) {
          const remoteIdSet = new Set(remoteItems.map((r) => r.id));

          // 2. Verifica se existem itens salvos localmente no celular que ainda não foram para a nuvem
          const localItems = await idbService.getAll(true);
          const unsyncedLocals = localItems.filter(
            (item) => !item.isDeletedLocally && !remoteIdSet.has(item.id)
          );

          if (unsyncedLocals.length > 0) {
            console.log(`[Kino] Migrando ${unsyncedLocals.length} itens locais do celular para o Supabase...`);

            for (const localItem of unsyncedLocals) {
              // Verifica se já existe título equivalente na nuvem antes de migrar
              const isDuplicate = remoteItems.some(
                (r) =>
                  r.type === localItem.type &&
                  this.normalizeTitle(r.title) === this.normalizeTitle(localItem.title)
              );

              if (!isDuplicate) {
                let coverUrl = localItem.remoteCoverUrl || '';
                if (localItem.coverBlob) {
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

                await client.from('media_items').upsert({
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
                });
              }
            }

            // Recarrega lista após migração
            const { data: refreshed } = await client
              .from('media_items')
              .select('*')
              .eq('user_id', user.id)
              .is('deleted_at', null)
              .order('created_at', { ascending: false });

            if (refreshed) {
              return await this.mapRemoteItemsToMediaItems(refreshed);
            }
          }

          return await this.mapRemoteItemsToMediaItems(remoteItems);
        }
      } catch (err) {
        console.warn('[Kino] Falha ao consultar Supabase, utilizando cache local:', err);
      }
    }

    // Fallback: carregar do armazenamento local
    return await idbService.getAll();
  }

  private async mapRemoteItemsToMediaItems(
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
  ): Promise<MediaItem[]> {
    const result: MediaItem[] = [];

    for (const r of remoteList) {
      let coverBlob: Blob;

      if (r.cover_url && r.cover_url.startsWith('data:image/')) {
        try {
          coverBlob = await base64ToBlob(r.cover_url);
        } catch {
          coverBlob = new Blob([''], { type: 'image/webp' });
        }
      } else if (r.cover_url) {
        coverBlob = await storageService.downloadCoverAsBlob(r.cover_url);
      } else {
        coverBlob = new Blob([''], { type: 'image/webp' });
      }

      const item: MediaItem = {
        id: r.id,
        title: r.title,
        type: r.type as 'movie' | 'series',
        genre: r.genre,
        rating: Number(r.rating),
        status: r.status || DEFAULT_STATUS[r.type as keyof typeof DEFAULT_STATUS] || 'Assistido',
        coverBlob,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        notes: r.notes || '',
        syncedWithSupabase: true,
        remoteId: r.id,
        remoteCoverUrl: r.cover_url,
      };

      result.push(item);
    }

    // Atualiza cache atômico local do IndexedDB para consistência
    try {
      await idbService.putMany(result);
    } catch {
      // Ignora erro de cache
    }

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

    // Regra obrigatória: Impedir títulos duplicados (case-insensitive)
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
      // 1. Upload ou conversão da imagem de capa
      try {
        remoteCoverUrl = await storageService.uploadCover(user.id, id, dto.coverBlob);
      } catch (err) {
        console.warn('Erro ao processar capa para a nuvem:', err);
      }

      // 2. Gravação no Supabase
      const { error: insertError } = await client.from('media_items').insert({
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
      });

      if (insertError) {
        // Se violar o índice único no banco
        if (insertError.code === '23505') {
          throw new Error('Este título já está na sua biblioteca.');
        }
        throw new Error(`Falha ao salvar no banco Supabase: ${insertError.message}`);
      }
    }

    // Salva também no cache local
    const newItem: MediaItem = {
      id,
      title: dto.title.trim(),
      type: dto.type,
      genre: dto.genre.trim(),
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
    const existing = await idbService.getById(id);
    if (!existing) {
      throw new Error('Registro não encontrado para atualização.');
    }

    const targetType = dto.type || existing.type;
    const targetTitle = dto.title !== undefined ? dto.title.trim() : existing.title;

    // Regra obrigatória: Validar duplicação se alterou título ou tipo
    const isDuplicate = await this.checkDuplicateTitle(targetTitle, targetType, id, user);
    if (isDuplicate) {
      throw new Error('Este título já está na sua biblioteca.');
    }

    const now = new Date().toISOString();
    let remoteCoverUrl = existing.remoteCoverUrl || '';

    const client = getSupabaseClient();
    if (client && user) {
      if (dto.coverBlob) {
        try {
          remoteCoverUrl = await storageService.uploadCover(user.id, id, dto.coverBlob);
        } catch (err) {
          console.warn('Erro ao atualizar capa na nuvem:', err);
        }
      }

      const { error: updateError } = await client
        .from('media_items')
        .update({
          title: targetTitle,
          type: targetType,
          genre: dto.genre !== undefined ? dto.genre.trim() : existing.genre,
          rating: dto.rating !== undefined ? dto.rating : existing.rating,
          status: dto.status !== undefined ? dto.status : existing.status,
          cover_url: remoteCoverUrl,
          notes: dto.notes !== undefined ? dto.notes.trim() : existing.notes,
          updated_at: now,
        })
        .eq('id', id)
        .eq('user_id', user.id);

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
      rating: dto.rating !== undefined ? dto.rating : existing.rating,
      status: dto.status !== undefined ? dto.status : existing.status,
      coverBlob: dto.coverBlob !== undefined ? dto.coverBlob : existing.coverBlob,
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
      // Exclusão remota no Supabase
      const { error } = await client
        .from('media_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.warn('Aviso: falha ao deletar no Supabase, removendo localmente:', error.message);
      }

      await storageService.deleteCover(user.id, id);
    }

    // Remove do IndexedDB local
    await idbService.delete(id);
  }
}

export const mediaRepository: IMediaRepository = new KinoMediaRepository();
