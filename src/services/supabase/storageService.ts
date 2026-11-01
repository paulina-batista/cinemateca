import { getSupabaseClient } from './client';
import { blobToBase64 } from '../../utils/image';

const BUCKET_NAME = 'media-covers';

export class StorageService {
  /**
   * Envia uma capa (Blob) para o bucket 'media-covers' no Supabase Storage.
   * Se o bucket ainda não tiver sido criado no Supabase, converte a imagem
   * otimizada para Base64 Data URL, garantindo que o cartaz seja sincronizado
   * e visível em todos os dispositivos sem falhas.
   */
  async uploadCover(userId: string, mediaId: string, coverBlob: Blob): Promise<string> {
    const client = getSupabaseClient();
    if (!client) {
      return await blobToBase64(coverBlob);
    }

    const extension = coverBlob.type.includes('png')
      ? 'png'
      : coverBlob.type.includes('jpeg') || coverBlob.type.includes('jpg')
      ? 'jpg'
      : 'webp';

    const filePath = `${userId}/${mediaId}.${extension}`;

    try {
      const { error: uploadError } = await client.storage
        .from(BUCKET_NAME)
        .upload(filePath, coverBlob, {
          upsert: true,
          contentType: coverBlob.type || 'image/webp',
          cacheControl: '3600',
        });

      if (!uploadError) {
        const { data } = client.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        if (data?.publicUrl) {
          return data.publicUrl;
        }
      } else {
        console.warn('Storage upload notice (using base64 cloud storage):', uploadError.message);
      }
    } catch (err) {
      console.warn('Falha no upload ao storage, utilizando Base64 no banco:', err);
    }

    // Fallback garantido: armazena a imagem como Data URI para sincronizar perfeitamente
    return await blobToBase64(coverBlob);
  }

  /**
   * Remove uma imagem de capa do Supabase Storage se existir.
   */
  async deleteCover(userId: string, mediaId: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    const possibleExtensions = ['webp', 'png', 'jpg', 'jpeg'];
    const paths = possibleExtensions.map((ext) => `${userId}/${mediaId}.${ext}`);

    try {
      await client.storage.from(BUCKET_NAME).remove(paths);
    } catch {
      // Ignora falhas seguras de exclusão
    }
  }

  /**
   * Baixa uma imagem a partir de sua URL remota (ou converte Data URL)
   * e retorna um Blob binário.
   */
  async downloadCoverAsBlob(url: string): Promise<Blob> {
    if (!url) {
      return new Blob([''], { type: 'image/webp' });
    }

    // Se a capa estiver salva como Data URL Base64
    if (url.startsWith('data:')) {
      try {
        const response = await fetch(url);
        return await response.blob();
      } catch {
        return new Blob([''], { type: 'image/webp' });
      }
    }

    // Se for URL HTTP/HTTPS
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Status ${response.status} ao baixar capa remota.`);
      }
      return await response.blob();
    } catch (err: unknown) {
      console.warn('Não foi possível baixar capa remota:', err);
      return new Blob([''], { type: 'image/webp' });
    }
  }
}

export const storageService = new StorageService();
