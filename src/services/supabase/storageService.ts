import { getSupabaseClient } from './client';

const BUCKET_NAME = 'media-covers';

export class StorageService {
  /**
   * Envia uma capa (Blob) para o bucket 'media-covers' no Supabase Storage.
   * Retorna a URL pública da imagem salva.
   */
  async uploadCover(userId: string, mediaId: string, coverBlob: Blob): Promise<string> {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase não configurado para upload de capas.');
    }

    const extension = coverBlob.type.includes('png')
      ? 'png'
      : coverBlob.type.includes('jpeg') || coverBlob.type.includes('jpg')
      ? 'jpg'
      : 'webp';

    const filePath = `${userId}/${mediaId}.${extension}`;

    const { error: uploadError } = await client.storage
      .from(BUCKET_NAME)
      .upload(filePath, coverBlob, {
        upsert: true,
        contentType: coverBlob.type || 'image/webp',
        cacheControl: '3600',
      });

    if (uploadError) {
      throw new Error(`Falha ao enviar capa para a nuvem: ${uploadError.message}`);
    }

    const { data } = client.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
  }

  /**
   * Remove uma imagem de capa do Supabase Storage.
   */
  async deleteCover(userId: string, mediaId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const possibleExtensions = ['webp', 'png', 'jpg', 'jpeg'];
    const paths = possibleExtensions.map((ext) => `${userId}/${mediaId}.${ext}`);

    try {
      await client.storage.from(BUCKET_NAME).remove(paths);
    } catch (err) {
      console.warn('Erro ao deletar capa do storage:', err);
    }
  }

  /**
   * Baixa uma imagem a partir de sua URL remota e retorna um Blob binário
   * para armazenamento offline no IndexedDB local.
   */
  async downloadCoverAsBlob(url: string): Promise<Blob> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Status ${response.status} ao baixar capa remota.`);
      }
      return await response.blob();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao baixar imagem';
      throw new Error(`Erro ao baixar capa para armazenamento offline: ${msg}`);
    }
  }
}

export const storageService = new StorageService();
