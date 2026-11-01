// Categorias oficiais suportadas pelo Kino: exclusivamente Filmes e Séries
export type MediaType = 'movie' | 'series';
export type LegacyMediaType = 'movie' | 'series' | 'book' | 'game';

export const VALID_RATINGS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;
export type ValidRating = (typeof VALID_RATINGS)[number];

// Status específicos por categoria para Filmes e Séries
export const STATUS_BY_TYPE: Record<MediaType, readonly string[]> = {
  movie:  ['Assistido', 'Quero Assistir', 'Assistindo', 'Abandonado'],
  series: ['Completa', 'Assistindo', 'Quero Assistir', 'Em Pausa', 'Abandonada'],
} as const;

export const DEFAULT_STATUS: Record<MediaType, string> = {
  movie:  'Assistido',
  series: 'Assistindo',
};

export interface MediaItem {
  id: string;
  coverBlob: Blob;
  title: string;
  type: MediaType | string;
  genre: string;
  rating: number;       // Escala decimal exata: 0.5 a 5.0 (passos de 0.5)
  status: string;       // Status específico
  createdAt: string;    // ISO 8601 (utilizada para identificar o último adicionado)
  updatedAt: string;    // ISO 8601

  // Metadados de sincronização com Supabase
  syncedWithSupabase?: boolean;
  remoteId?: string | null;
  remoteCoverUrl?: string | null;
  coverUrl?: string;
  lastSyncedAt?: string | null;
  isDeletedLocally?: boolean;
  notes?: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'unconfigured' | 'offline';

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
  status: string;
  coverBlob: Blob;
  notes?: string;
}

export interface UpdateMediaDTO {
  title?: string;
  type?: MediaType;
  genre?: string;
  rating?: number;
  status?: string;
  coverBlob?: Blob;
  notes?: string;
}

// Filtros oficiais na interface Kino: Todos, Filmes, Séries
export type MediaFilter = 'all' | 'movie' | 'series';

export type SortMode = 'recent' | 'title-asc' | 'title-desc' | 'rating-desc' | 'rating-asc' | 'status';

export const TYPE_LABELS: Record<MediaType, string> = {
  movie:  'Filme',
  series: 'Série',
};
