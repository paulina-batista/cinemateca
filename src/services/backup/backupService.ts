import type { BackupMediaItem, KinoBackup, RestoreConflictStrategy, RestoreValidationResult } from '../../types/backup';
import type { MediaItem, MediaType } from '../../types/media';
import { DEFAULT_STATUS } from '../../types/media';
import { base64ToBlob, blobToBase64 } from '../../utils/image';
import { idbService } from '../db/indexedDB';
import { getSupabaseClient } from '../supabase/client';
import { storageService } from '../supabase/storageService';

/**
 * Serviço responsável por gerar e restaurar backups da biblioteca Kino.
 */
export class BackupService {
  /**
   * Converte a lista atual de itens em um objeto estruturado de backup com imagens em Base64.
   */
  async exportBackup(items: MediaItem[]): Promise<KinoBackup> {
    const backupItems: BackupMediaItem[] = [];

    for (const item of items) {
      let coverBase64 = '';

      // Se há blob local com conteúdo real, converte
      if (item.coverBlob && item.coverBlob.size > 0) {
        try {
          coverBase64 = await blobToBase64(item.coverBlob);
        } catch (err) {
          console.warn(`Aviso: falha ao converter capa de "${item.title}" para Base64:`, err);
        }
      }
      // Se não há blob mas há URL remota, usa a URL diretamente no backup
      if (!coverBase64 && item.remoteCoverUrl) {
        coverBase64 = item.remoteCoverUrl;
      }

      const itemType = (item.type === 'movie' || item.type === 'series') ? item.type : 'movie';

      backupItems.push({
        id: item.id,
        title: item.title,
        type: itemType as MediaType,
        genre: item.genre,
        year: item.year ?? null,
        duration: item.duration ?? null,
        seasons: item.seasons ?? null,
        episodes: item.episodes ?? null,
        rating: item.rating,
        status: item.status || DEFAULT_STATUS[itemType as MediaType] || 'Assistido',
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        notes: item.notes || '',
        syncedWithSupabase: item.syncedWithSupabase ?? false,
        remoteId: item.remoteId ?? null,
        coverBase64,
      });
    }

    return {
      format: 'kino-backup',
      version: 3,
      appName: 'Kino',
      exportedAt: new Date().toISOString(),
      itemCount: backupItems.length,
      items: backupItems,
    };
  }

  /**
   * Dispara o download do arquivo JSON de backup no navegador.
   */
  downloadBackupFile(backup: KinoBackup): void {
    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `kino_backup_${dateStr}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  /**
   * Valida a integridade, esquema e compatibilidade do arquivo de backup antes de aplicar.
   * Suporta formatos: kino-backup v3, iorhub-backup v2, cinemateca-backup v1.
   */
  validateBackupFile(fileContent: string, currentItems: MediaItem[]): RestoreValidationResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(fileContent);
    } catch {
      return { valid: false, error: 'O arquivo selecionado não é um arquivo JSON legível.' };
    }

    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Estrutura inválida de arquivo de backup.' };
    }

    const backup = parsed as Partial<KinoBackup>;

    if (
      backup.format !== 'kino-backup' &&
      backup.format !== 'iorhub-backup' &&
      backup.format !== 'cinemateca-backup'
    ) {
      return {
        valid: false,
        error: 'Formato incompatível: este arquivo não é um backup oficial do Kino ou versões anteriores.',
      };
    }

    if (!Array.isArray(backup.items)) {
      return { valid: false, error: 'Lista de registros corrompida ou ausente no backup.' };
    }

    const validRatings = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    const validTypes = ['movie', 'series', 'book', 'game'];

    for (let i = 0; i < backup.items.length; i++) {
      const item = backup.items[i];
      if (!item.id || !item.title || !item.type || !item.genre) {
        return {
          valid: false,
          error: `O registro #${i + 1} possui campos obrigatórios em falta (título, tipo ou gênero).`,
        };
      }

      if (!validTypes.includes(item.type)) {
        return {
          valid: false,
          error: `O registro "${item.title}" possui um tipo inválido (${item.type}).`,
        };
      }

      if (!validRatings.includes(item.rating)) {
        return {
          valid: false,
          error: `O registro "${item.title}" possui nota inválida (${item.rating}). Permitido de 0 a 5,0.`,
        };
      }
    }

    const existingIds = new Set(currentItems.map((it) => it.id));
    let conflictingCount = 0;
    let newCount = 0;

    for (const item of backup.items) {
      if (existingIds.has(item.id)) {
        conflictingCount++;
      } else {
        newCount++;
      }
    }

    return {
      valid: true,
      backup: backup as KinoBackup,
      stats: {
        totalInBackup: backup.items.length,
        existingCount: currentItems.length,
        newCount,
        conflictingCount,
      },
    };
  }

  /**
   * Executa a restauração com base na estratégia escolhida.
   * Persiste no IndexedDB local E no Supabase (se autenticado).
   */
  async restoreBackup(
    backup: KinoBackup,
    strategy: RestoreConflictStrategy,
    currentItems: MediaItem[]
  ): Promise<{ addedCount: number; updatedCount: number }> {
    const existingMap = new Map(currentItems.map((it) => [it.id, it]));

    if (strategy === 'replace-all') {
      await idbService.clearAll();
      existingMap.clear();
    }

    const client = getSupabaseClient();
    let userId: string | null = null;

    if (client) {
      try {
        const { data: { user } } = await client.auth.getUser();
        userId = user?.id ?? null;
      } catch {
        userId = null;
      }
    }

    // Se replace-all e usuário autenticado: limpa registros remotos antes de importar
    if (strategy === 'replace-all' && client && userId) {
      try {
        await client
          .from('media_items')
          .update({ deleted_at: new Date().toISOString() })
          .eq('user_id', userId)
          .is('deleted_at', null);
      } catch (err) {
        console.warn('[Kino Backup] Aviso: falha ao limpar registros remotos antes de restaurar:', err);
      }
    }

    let addedCount = 0;
    let updatedCount = 0;

    for (const bItem of backup.items) {
      const exists = existingMap.has(bItem.id);

      if (exists && strategy === 'merge-keep-existing') {
        continue;
      }

      // Converte capa: base64 → Blob, ou usa URL remota como fallback
      let coverBlob: Blob;
      let remoteCoverUrl = '';

      if (bItem.coverBase64 && bItem.coverBase64.startsWith('data:image/')) {
        try {
          coverBlob = await base64ToBlob(bItem.coverBase64);
        } catch {
          coverBlob = new Blob([], { type: 'image/jpeg' });
        }
      } else if (bItem.coverBase64 && bItem.coverBase64.startsWith('http')) {
        // URL remota salva no backup
        remoteCoverUrl = bItem.coverBase64;
        coverBlob = new Blob([], { type: 'image/webp' });
      } else {
        coverBlob = new Blob([], { type: 'image/jpeg' });
      }

      const itemType: MediaType = (bItem.type === 'movie' || bItem.type === 'series')
        ? bItem.type
        : 'movie';

      const now = new Date().toISOString();

      // Se autenticado, persiste no Supabase primeiro
      if (client && userId) {
        try {
          // Upload da capa se tiver blob real
          if (coverBlob.size > 0) {
            try {
              remoteCoverUrl = await storageService.uploadCover(userId, bItem.id, coverBlob);
            } catch {
              remoteCoverUrl = remoteCoverUrl || '';
            }
          }

          await client.from('media_items').upsert({
            id: bItem.id,
            user_id: userId,
            title: bItem.title.trim(),
            type: itemType,
            genre: bItem.genre.trim(),
            rating: bItem.rating,
            status: bItem.status || DEFAULT_STATUS[itemType] || 'Assistido',
            cover_url: remoteCoverUrl,
            notes: bItem.notes || '',
            created_at: bItem.createdAt || now,
            updated_at: now,
            deleted_at: null,
          });
        } catch (err) {
          console.warn(`[Kino Backup] Aviso: falha ao persistir "${bItem.title}" no Supabase:`, err);
        }
      }

      // Persiste no IndexedDB local
      const mediaItem: MediaItem = {
        id: bItem.id,
        title: bItem.title,
        type: itemType,
        genre: bItem.genre,
        year: bItem.year ?? null,
        duration: bItem.duration ?? null,
        seasons: bItem.seasons ?? null,
        episodes: bItem.episodes ?? null,
        rating: bItem.rating,
        status: bItem.status || DEFAULT_STATUS[itemType] || 'Assistido',
        coverBlob,
        notes: bItem.notes || '',
        createdAt: bItem.createdAt || now,
        updatedAt: now,
        syncedWithSupabase: Boolean(client && userId),
        remoteId: client && userId ? bItem.id : null,
        remoteCoverUrl,
      };

      await idbService.put(mediaItem);

      if (exists) {
        updatedCount++;
      } else {
        addedCount++;
      }
    }

    return { addedCount, updatedCount };
  }
}

export const backupService = new BackupService();
