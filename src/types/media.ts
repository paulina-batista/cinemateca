// Quatro categorias de conteúdo suportadas pelo IorHub
export type MediaType = 'movie' | 'series' | 'book' | 'game';

export const VALID_RATINGS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] as const;
export type ValidRating = (typeof VALID_RATINGS)[number];

// Status disponíveis por categoria (isolados para evitar mistura semântica)
export const STATUS_BY_TYPE: Record<MediaType, readonly string[]> = {
  movie:  ['Assistido', 'Quero Assistir', 'Assistindo', 'Abandonado'],
  series: ['Completa', 'Assistindo', 'Quero Assistir', 'Em Pausa', 'Abandonada'],
  book:   ['Lido', 'Lendo', 'Quero Ler', 'Em Pausa', 'Abandonado'],
  game:   ['Zerado', 'Jogando', 'Quero Jogar', 'Em Pausa', 'Abandonado'],
} as const;

export const DEFAULT_STATUS: Record<MediaType, string> = {
  movie:  'Assistido',
  series: 'Assistindo',
  book:   'Lendo',
  game:   'Jogando',
};

export interface MediaItem {
  id: string;
  coverBlob: Blob;
  title: string;
  type: MediaType;
  genre: string;
  rating: number;       // Escala decimal: 0.5 a 5.0 (passos de 0.5)
  status: string;       // Status específico da categoria
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601

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

// Filtros: all + os 4 tipos
export type MediaFilter = 'all' | MediaType;

export type SortMode = 'title-asc' | 'title-desc' | 'rating-desc' | 'rating-asc' | 'recent' | 'status';

// Labels e ícones por tipo (usados em componentes)
export const TYPE_LABELS: Record<MediaType, string> = {
  movie:  'Filme',
  series: 'Série',
  book:   'Livro',
  game:   'Jogo',
};
