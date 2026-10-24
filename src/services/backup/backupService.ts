import type { BackupMediaItem, CinematecaBackup, RestoreConflictStrategy, RestoreValidationResult } from '../../types/backup';
import type { MediaItem } from '../../types/media';
import { base64ToBlob, blobToBase64 } from '../../utils/image';
import { idbService } from '../db/indexedDB';

/**
 * Serviço responsável por gerar e restaurar backups independentes da biblioteca Cinemateca.
 */
export class BackupService {
  /**
   * Converte a lista atual de itens em um objeto estruturado de backup com imagens em Base64.
   */
  async exportBackup(items: MediaItem[]): Promise<CinematecaBackup> {
    const backupItems: BackupMediaItem[] = [];

    for (const item of items) {
      let coverBase64 = '';
      try {
        coverBase64 = await blobToBase64(item.coverBlob);
      } catch (err) {
        console.warn(`Aviso: falha ao converter capa de "${item.title}" para Base64:`, err);
        // Cria um fallback mínimo caso a imagem esteja corrompida
        coverBase64 = '';
      }

      backupItems.push({
        id: item.id,
        title: item.title,
        type: item.type,
        genre: item.genre,
        rating: item.rating,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        notes: item.notes || '',
        syncedWithSupabase: item.syncedWithSupabase ?? false,
        remoteId: item.remoteId ?? null,
        coverBase64,
      });
    }

    return {
      format: 'cinemateca-backup',
      version: 1,
      appName: 'Cinemateca',
      exportedAt: new Date().toISOString(),
      itemCount: backupItems.length,
      items: backupItems,
    };
  }

  /**
   * Dispara o download do arquivo JSON de backup no navegador.
   */
  downloadBackupFile(backup: CinematecaBackup): void {
    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `cinemateca_backup_${dateStr}.json`;

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

    const backup = parsed as Partial<CinematecaBackup>;

    if (backup.format !== 'cinemateca-backup') {
      return {
        valid: false,
        error: 'Formato incompatível: este arquivo não é um backup oficial do Cinemateca.',
      };
    }

    if (backup.version !== 1) {
      return {
        valid: false,
        error: `Versão ${backup.version} de backup não suportada por esta versão do aplicativo.`,
      };
    }

    if (!Array.isArray(backup.items)) {
      return { valid: false, error: 'Lista de registros corrompida ou ausente no backup.' };
    }

    // Validação de cada registro
    const validRatings = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    for (let i = 0; i < backup.items.length; i++) {
      const item = backup.items[i];
      if (!item.id || !item.title || !item.type || !item.genre) {
        return {
          valid: false,
          error: `O registro #${i + 1} possui campos obrigatórios em falta (título, tipo ou gênero).`,
        };
      }

      if (item.type !== 'movie' && item.type !== 'series') {
        return {
          valid: false,
          error: `O registro "${item.title}" possui um tipo inválido (${item.type}). Esperado: filme ou série.`,
        };
      }

      if (typeof item.rating !== 'number' || !validRatings.includes(item.rating)) {
        return {
          valid: false,
          error: `O registro "${item.title}" possui uma avaliação inválida (${item.rating}). Deve estar entre 0,5 e 5 estrelas.`,
        };
      }

      if (!item.coverBase64 || !item.coverBase64.startsWith('data:image/')) {
        return {
          valid: false,
          error: `O registro "${item.title}" não possui uma capa válida em formato Base64.`,
        };
      }
    }

    // Calcula estatísticas de conflitos com os dados atuais
    const existingIds = new Set(currentItems.map((i) => i.id));
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
      backup: backup as CinematecaBackup,
      stats: {
        totalInBackup: backup.items.length,
        existingCount: currentItems.length,
        conflictingCount,
        newCount,
      },
    };
  }

  /**
   * Executa a restauração com transação segura e política de conflitos escolhida.
   */
  async restoreBackup(
    backup: CinematecaBackup,
    strategy: RestoreConflictStrategy,
    currentItems: MediaItem[]
  ): Promise<{ addedCount: number; updatedCount: number }> {
    const existingMap = new Map<string, MediaItem>(currentItems.map((i) => [i.id, i]));
    const restoredItems: MediaItem[] = [];

    // Converte os itens do backup de volta para o formato de modelo com Blob binário
    for (const bItem of backup.items) {
      const coverBlob = await base64ToBlob(bItem.coverBase64);

      restoredItems.push({
        id: bItem.id,
        title: bItem.title.trim(),
        type: bItem.type,
        genre: bItem.genre.trim(),
        rating: bItem.rating,
        coverBlob,
        createdAt: bItem.createdAt || new Date().toISOString(),
        updatedAt: bItem.updatedAt || new Date().toISOString(),
        notes: bItem.notes || '',
        syncedWithSupabase: bItem.syncedWithSupabase ?? false,
        remoteId: bItem.remoteId ?? null,
      });
    }

    let addedCount = 0;
    let updatedCount = 0;

    if (strategy === 'replace-all') {
      // Substitui integralmente a biblioteca usando transação atômica
      await idbService.clearAndInsertAll(restoredItems);
      addedCount = restoredItems.length;
      return { addedCount, updatedCount };
    }

    if (strategy === 'merge-overwrite') {
      // Atualiza registros conflitantes e insere novos registros
      const toPut: MediaItem[] = [];
      for (const item of restoredItems) {
        if (existingMap.has(item.id)) {
          updatedCount++;
        } else {
          addedCount++;
        }
        toPut.push(item);
      }
      await idbService.putMany(toPut);
      return { addedCount, updatedCount };
    }

    if (strategy === 'merge-keep-existing') {
      // Mantém os existentes inalterados; adiciona apenas os que não existem
      const toAdd: MediaItem[] = [];
      for (const item of restoredItems) {
        if (!existingMap.has(item.id)) {
          toAdd.push(item);
          addedCount++;
        }
      }
      if (toAdd.length > 0) {
        await idbService.putMany(toAdd);
      }
      return { addedCount, updatedCount };
    }

    return { addedCount, updatedCount };
  }
}

export const backupService = new BackupService();
