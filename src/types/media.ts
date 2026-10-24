export type MediaType = 'movie' | 'series';

export const VALID_RATINGS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;
export type ValidRating = (typeof VALID_RATINGS)[number];

export interface MediaItem {
  id: string;
  coverBlob: Blob;
  title: string;
  type: MediaType;
  genre: string;
  rating: number; // Escala decimal: 0.5 a 5.0 (passos de 0.5)
  createdAt: string; // ISO 8601 string
  updatedAt: string; // ISO 8601 string

  // Metadados de sincronização com Supabase
  syncedWithSupabase?: boolean;
  remoteId?: string | null;
  remoteCoverUrl?: string | null;
  lastSyncedAt?: string | null;
  isDeletedLocally?: boolean; // Para sincronizar exclusões realizadas offline
  notes?: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline' | 'unconfigured';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  pendingCount: number;
  errorMessage?: string;
}

export interface CreateMediaDTO {
  title: string;
  type: MediaType;
  genre: string;
  rating: number;
  coverBlob: Blob;
  notes?: string;
}

export interface UpdateMediaDTO {
  title?: string;
  type?: MediaType;
  genre?: string;
  rating?: number;
  coverBlob?: Blob;
  notes?: string;
}

export type MediaFilter = 'all' | 'movie' | 'series';

export type SortMode = 'title-asc' | 'title-desc' | 'rating-desc' | 'rating-asc' | 'recent';
