import type { BackupMediaItem, KinoBackup, RestoreConflictStrategy, RestoreValidationResult } from '../../types/backup';
import type { MediaItem, MediaType } from '../../types/media';
import { DEFAULT_STATUS } from '../../types/media';
import { base64ToBlob, blobToBase64 } from '../../utils/image';
import { idbService } from '../db/indexedDB';

/**
 * Serviço responsável por gerar e restaurar backups independentes da biblioteca Kino.
 */
export class BackupService {
  /**
   * Converte a lista atual de itens em um objeto estruturado de backup com imagens em Base64.
   */
  async exportBackup(items: MediaItem[]): Promise<KinoBackup> {
    const backupItems: BackupMediaItem[] = [];

    for (const item of items) {
      let coverBase64 = '';
      try {
        coverBase64 = await blobToBase64(item.coverBlob);
      } catch (err) {
        console.warn(`Aviso: falha ao converter capa de "${item.title}" para Base64:`, err);
        coverBase64 = '';
      }

      const itemType = (item.type === 'movie' || item.type === 'series') ? item.type : 'movie';

      backupItems.push({
        id: item.id,
        title: item.title,
        type: itemType as MediaType,
        genre: item.genre,
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
   * Suporta arquivos do formato atual (kino-backup v3) e dos formatos legados (iorhub-backup v2, cinemateca-backup v1).
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

    // Validação de cada registro
    const validRatings = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
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
          error: `O registro "${item.title}" possui um tipo inválido (${item.type}). Esperado: filme ou série.`,
        };
      }

      if (!validRatings.includes(item.rating)) {
        return {
          valid: false,
          error: `O registro "${item.title}" possui nota inválida (${item.rating}). Permitido apenas de 0,5 a 5,0.`,
        };
      }
    }

    // Cálculo das estatísticas de mesclagem
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
   * Executa a restauração no IndexedDB com base na estratégia escolhida pelo usuário.
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

    let addedCount = 0;
    let updatedCount = 0;

    for (const bItem of backup.items) {
      const exists = existingMap.has(bItem.id);

      if (exists && strategy === 'merge-keep-existing') {
        continue;
      }

      let coverBlob: Blob;
      if (bItem.coverBase64) {
        try {
          coverBlob = await base64ToBlob(bItem.coverBase64);
        } catch {
          coverBlob = new Blob([], { type: 'image/jpeg' });
        }
      } else {
        coverBlob = new Blob([], { type: 'image/jpeg' });
      }

      const itemType = (bItem.type === 'movie' || bItem.type === 'series') ? bItem.type : 'movie';

      const mediaItem: MediaItem = {
        id: bItem.id,
        title: bItem.title,
        type: itemType,
        genre: bItem.genre,
        rating: bItem.rating,
        status: bItem.status || DEFAULT_STATUS[itemType as MediaType] || 'Assistido',
        coverBlob,
        coverUrl: '',
        notes: bItem.notes || '',
        createdAt: bItem.createdAt || new Date().toISOString(),
        updatedAt: bItem.updatedAt || new Date().toISOString(),
        syncedWithSupabase: false,
        remoteId: null,
      };

      await idbService.save(mediaItem);

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
