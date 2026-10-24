import type { CreateMediaDTO, MediaItem, UpdateMediaDTO } from '../../types/media';
import { DEFAULT_STATUS } from '../../types/media';
import { idbService } from '../db/indexedDB';

/**
 * Contrato abstrato para repositórios de mídia.
 */
export interface IMediaRepository {
  getAll(): Promise<MediaItem[]>;
  getById(id: string): Promise<MediaItem | null>;
  create(dto: CreateMediaDTO): Promise<MediaItem>;
  update(id: string, dto: UpdateMediaDTO): Promise<MediaItem>;
  delete(id: string): Promise<void>;
  getUnsynced(): Promise<MediaItem[]>;
  markSynced(id: string, remoteId: string): Promise<void>;
}

/**
 * Implementação do repositório utilizando IndexedDB nativo do navegador.
 */
export class IndexedDBMediaRepository implements IMediaRepository {
  async getAll(): Promise<MediaItem[]> {
    return await idbService.getAll();
  }

  async getById(id: string): Promise<MediaItem | null> {
    return await idbService.getById(id);
  }

  async create(dto: CreateMediaDTO): Promise<MediaItem> {
    const now = new Date().toISOString();
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newItem: MediaItem = {
      id,
      title: dto.title.trim(),
      type: dto.type,
      genre: dto.genre.trim(),
      rating: dto.rating,
      status: dto.status || DEFAULT_STATUS[dto.type] || 'Assistido',
      coverBlob: dto.coverBlob,
      createdAt: now,
      updatedAt: now,
      notes: dto.notes?.trim() || '',
      syncedWithSupabase: false,
      remoteId: null,
    };

    await idbService.add(newItem);
    return newItem;
  }

  async update(id: string, dto: UpdateMediaDTO): Promise<MediaItem> {
    const existing = await idbService.getById(id);
    if (!existing) {
      throw new Error(`Registro com ID ${id} não foi encontrado para atualização.`);
    }

    const updatedItem: MediaItem = {
      ...existing,
      title: dto.title !== undefined ? dto.title.trim() : existing.title,
      type: dto.type !== undefined ? dto.type : existing.type,
      genre: dto.genre !== undefined ? dto.genre.trim() : existing.genre,
      rating: dto.rating !== undefined ? dto.rating : existing.rating,
      status: dto.status !== undefined ? dto.status : existing.status,
      coverBlob: dto.coverBlob !== undefined ? dto.coverBlob : existing.coverBlob,
      notes: dto.notes !== undefined ? dto.notes.trim() : existing.notes,
      updatedAt: new Date().toISOString(),
      syncedWithSupabase: false,
    };

    await idbService.put(updatedItem);
    return updatedItem;
  }

  async delete(id: string): Promise<void> {
    const existing = await idbService.getById(id);
    if (!existing) {
      throw new Error(`Registro com ID ${id} não existe ou já foi excluído.`);
    }

    if (existing.syncedWithSupabase || existing.remoteId) {
      await idbService.softDelete(id);
    } else {
      await idbService.delete(id);
    }
  }

  async getUnsynced(): Promise<MediaItem[]> {
    const all = await this.getAll();
    return all.filter((item) => !item.syncedWithSupabase);
  }

  async markSynced(id: string, remoteId: string): Promise<void> {
    const existing = await idbService.getById(id);
    if (existing) {
      existing.syncedWithSupabase = true;
      existing.remoteId = remoteId;
      await idbService.put(existing);
    }
  }
}

export const mediaRepository: IMediaRepository = new IndexedDBMediaRepository();
