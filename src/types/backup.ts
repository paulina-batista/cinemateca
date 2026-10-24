import type { MediaType } from './media';

export interface BackupMediaItem {
  id: string;
  title: string;
  type: MediaType;
  genre: string;
  rating: number; // 0.5 a 5.0
  createdAt: string;
  updatedAt: string;
  notes?: string;
  syncedWithSupabase?: boolean;
  remoteId?: string | null;
  // Imagem em formato base64 data URL completo (data:image/...;base64,...)
  coverBase64: string;
}

export interface CinematecaBackup {
  format: 'cinemateca-backup';
  version: 1;
  appName: 'Cinemateca';
  exportedAt: string; // ISO 8601
  itemCount: number;
  items: BackupMediaItem[];
}

export type RestoreConflictStrategy =
  | 'merge-keep-existing' // Mantém o que já tem com o mesmo ID, só adiciona novos
  | 'merge-overwrite'     // Atualiza registros que tiverem o mesmo ID e adiciona novos
  | 'replace-all';        // Substitui integralmente a biblioteca após confirmação explícita

export interface RestorePreviewStats {
  totalInBackup: number;
  existingCount: number;
  newCount: number;
  conflictingCount: number;
}

export interface RestoreValidationResult {
  valid: boolean;
  error?: string;
  backup?: CinematecaBackup;
  stats?: RestorePreviewStats;
}
