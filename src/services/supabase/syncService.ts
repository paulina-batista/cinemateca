import type { MediaItem, SyncState } from '../../types/media';
import { idbService } from '../db/indexedDB';
import { getSupabaseClient, isSupabaseConfigured } from './client';
import { storageService } from './storageService';

type SyncListener = (state: SyncState) => void;

const LAST_SYNC_KEY = 'cinemateca_last_sync_timestamp';

export class SyncService {
  private listeners = new Set<SyncListener>();
  private currentState: SyncState = {
    status: 'idle',
    lastSyncedAt: typeof window !== 'undefined' ? localStorage.getItem(LAST_SYNC_KEY) : null,
    pendingCount: 0,
  };
  private isSyncInProgress = false;

  constructor() {
    // Atualiza contagem de pendências inicial
    this.refreshPendingCount();

    // Sincronização automática ao reconectar a internet
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        setTimeout(() => {
          this.syncNow();
        }, 1500);
      });
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(newState: Partial<SyncState>): void {
    this.currentState = { ...this.currentState, ...newState };
    if (newState.lastSyncedAt) {
      localStorage.setItem(LAST_SYNC_KEY, newState.lastSyncedAt);
    }
    this.listeners.forEach((l) => l(this.currentState));
  }

  public getState(): SyncState {
    return this.currentState;
  }

  public async refreshPendingCount(): Promise<number> {
    try {
      const pending = await idbService.getPendingSync();
      const count = pending.length;
      this.notify({ pendingCount: count });
      return count;
    } catch {
      return 0;
    }
  }

  /**
   * Executa a sincronização bidirecional completa (Push e Pull)
   * mantendo o catálogo local e remoto alinhados.
   */
  public async syncNow(): Promise<SyncState> {
    if (this.isSyncInProgress) {
      return this.currentState;
    }

    if (!isSupabaseConfigured()) {
      this.notify({ status: 'unconfigured', errorMessage: 'Supabase não configurado' });
      return this.currentState;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.notify({ status: 'offline', errorMessage: 'Sem conexão de rede' });
      return this.currentState;
    }

    const client = getSupabaseClient();
    if (!client) {
      this.notify({ status: 'unconfigured' });
      return this.currentState;
    }

    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      this.notify({ status: 'idle', errorMessage: 'Usuário não autenticado' });
      return this.currentState;
    }

    try {
      this.isSyncInProgress = true;
      this.notify({ status: 'syncing', errorMessage: undefined });

      // ==========================================
      // FASE 1: PUSH (Local -> Supabase)
      // ==========================================
      const localItemsIncludingDeleted = await idbService.getAll(true);

      for (const item of localItemsIncludingDeleted) {
        // Caso A: Item foi excluído enquanto estava offline
        if (item.isDeletedLocally) {
          // Remove no banco de dados Supabase
          await client
            .from('media_items')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', item.id)
            .eq('user_id', user.id);

          // Remove do Storage
          await storageService.deleteCover(user.id, item.id);

          // Remove fisicamente do IndexedDB local
          await idbService.delete(item.id);
          continue;
        }

        // Caso B: Item criado ou alterado localmente pendente de sync
        if (!item.syncedWithSupabase) {
          let remoteCoverUrl = item.remoteCoverUrl;

          // Se a capa ainda não foi enviada para o Supabase Storage
          if (item.coverBlob) {
            try {
              remoteCoverUrl = await storageService.uploadCover(user.id, item.id, item.coverBlob);
            } catch (storageErr) {
              console.warn(`Aviso: falha no upload da capa de ${item.title}:`, storageErr);
              // Mantém URL anterior ou placeholder se falhar
              remoteCoverUrl = remoteCoverUrl || '';
            }
          }

          // Grava/atualiza registro na tabela media_items
          const { error: upsertError } = await client.from('media_items').upsert({
            id: item.id,
            user_id: user.id,
            title: item.title,
            type: item.type,
            genre: item.genre,
            rating: item.rating,
            cover_url: remoteCoverUrl || '',
            notes: item.notes || '',
            created_at: item.createdAt,
            updated_at: item.updatedAt,
            deleted_at: null,
          });

          if (upsertError) {
            console.error(`Erro ao sincronizar item "${item.title}":`, upsertError);
            continue;
          }

          // Marca o item como sincronizado no IndexedDB
          item.syncedWithSupabase = true;
          item.remoteId = item.id;
          item.remoteCoverUrl = remoteCoverUrl;
          item.lastSyncedAt = new Date().toISOString();
          await idbService.put(item);
        }
      }

      // ==========================================
      // FASE 2: PULL (Supabase -> Local)
      // ==========================================
      const { data: remoteItems, error: fetchError } = await client
        .from('media_items')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) {
        throw new Error(`Erro ao buscar registros na nuvem: ${fetchError.message}`);
      }

      if (remoteItems) {
        const currentLocalMap = new Map(
          (await idbService.getAll(true)).map((i) => [i.id, i])
        );

        for (const rItem of remoteItems) {
          // Se o item foi excluído remotamente
          if (rItem.deleted_at) {
            if (currentLocalMap.has(rItem.id)) {
              await idbService.delete(rItem.id);
            }
            continue;
          }

          const localExisting = currentLocalMap.get(rItem.id);

          // Se o item não existe localmente ou foi atualizado remotamente
          if (!localExisting) {
            let downloadedBlob: Blob | null = null;
            try {
              if (rItem.cover_url) {
                downloadedBlob = await storageService.downloadCoverAsBlob(rItem.cover_url);
              }
            } catch (dlErr) {
              console.warn(`Não foi possível baixar capa de ${rItem.title} para cache offline:`, dlErr);
            }

            // Fallback caso o download falhe: cria Blob mínimo
            if (!downloadedBlob) {
              downloadedBlob = new Blob([''], { type: 'image/webp' });
            }

            const newLocalItem: MediaItem = {
              id: rItem.id,
              title: rItem.title,
              type: rItem.type,
              genre: rItem.genre,
              rating: Number(rItem.rating),
              coverBlob: downloadedBlob,
              createdAt: rItem.created_at,
              updatedAt: rItem.updated_at,
              notes: rItem.notes || '',
              syncedWithSupabase: true,
              remoteId: rItem.id,
              remoteCoverUrl: rItem.cover_url,
              lastSyncedAt: new Date().toISOString(),
              isDeletedLocally: false,
            };

            await idbService.put(newLocalItem);
          }
        }
      }

      const now = new Date().toISOString();
      const remainingPending = await this.refreshPendingCount();

      this.notify({
        status: 'success',
        lastSyncedAt: now,
        pendingCount: remainingPending,
        errorMessage: undefined,
      });

      return this.currentState;
    } catch (err: unknown) {
      console.error('Erro na sincronização:', err);
      const msg = err instanceof Error ? err.message : 'Falha na sincronização';
      this.notify({ status: 'error', errorMessage: msg });
      return this.currentState;
    } finally {
      this.isSyncInProgress = false;
    }
  }
}

export const syncService = new SyncService();
