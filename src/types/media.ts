// Categorias oficiais suportadas pelo Kino: exclusivamente Filmes e Séries
export type MediaType = 'movie' | 'series';
export type LegacyMediaType = 'movie' | 'series' | 'book' | 'game';

// Escala de avaliação: 0 (não avaliado) a 5 em passos de 0.5
export const VALID_RATINGS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;
export type ValidRating = (typeof VALID_RATINGS)[number];

// Status oficiais do Kino: apenas Assistido e Na lista
export const KINO_STATUSES = ['Assistido', 'Na lista'] as const;
export type KinoStatus = (typeof KINO_STATUSES)[number];

// Status por tipo (ambos os tipos têm os mesmos status)
export const STATUS_BY_TYPE: Record<MediaType, readonly string[]> = {
  movie:  ['Assistido', 'Na lista'],
  series: ['Assistido', 'Na lista'],
} as const;

export const DEFAULT_STATUS: Record<MediaType, string> = {
  movie:  'Assistido',
  series: 'Assistido',
};

/**
 * Migra status legados para os dois status oficiais do Kino.
 * Preserva registros antigos sem perda de dados.
 */
export function migrateLegacyStatus(status: string): string {
  if (!status) return 'Assistido';
  const normalized = status.toLowerCase().trim();
  // Status que significam "já assisti"
  if (
    normalized === 'assistido' ||
    normalized === 'completa' ||
    normalized === 'completo' ||
    normalized === 'finalizado'
  ) return 'Assistido';
  // Status que significam "quero assistir" / "pendente"
  if (
    normalized === 'na lista' ||
    normalized === 'quero assistir' ||
    normalized === 'quero ver'
  ) return 'Na lista';
  // Status ambíguos: "em andamento", "assistindo", "abandonado" → Na lista (mais seguro)
  return 'Na lista';
}

export interface MediaItem {
  id: string;
  coverBlob: Blob;
  title: string;
  type: MediaType | string;
  genre: string;
  year?: number | null;
  duration?: string | null;           // para filmes (ex: 2h 15m ou 135 min)
  seasons?: number | string | null;   // para séries (ex: 4)
  episodes?: number | string | null;  // para séries (ex: 32)
  rating: number;       // 0 (não avaliado) a 5.0 em passos de 0.5
  status: string;       // 'Assistido' | 'Na lista'
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601

  // Metadados de sincronização
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
  year?: number | null;
  duration?: string | null;
  seasons?: number | string | null;
  episodes?: number | string | null;
  rating: number;
  status: string;
  coverBlob: Blob;
  notes?: string;
}

export interface UpdateMediaDTO {
  title?: string;
  type?: MediaType;
  genre?: string;
  year?: number | null;
  duration?: string | null;
  seasons?: number | string | null;
  episodes?: number | string | null;
  rating?: number;
  status?: string;
  coverBlob?: Blob;
  notes?: string;
}

// Filtros na interface Kino: Todos, Filmes, Séries
export type MediaFilter = 'all' | 'movie' | 'series';

export type SortMode = 'recent' | 'title-asc' | 'title-desc' | 'rating-desc' | 'rating-asc' | 'status';

export const TYPE_LABELS: Record<MediaType, string> = {
  movie:  'Filme',
  series: 'Série',
};
