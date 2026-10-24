/**
 * Utilitários para manuseio de imagens locais em formato Blob e Base64 para backup.
 */

const blobUrlRegistry = new Set<string>();

/**
 * Cria uma URL segura para visualização do Blob e registra para controle.
 */
export function createBlobUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  blobUrlRegistry.add(url);
  return url;
}

/**
 * Libera a URL do Blob para evitar vazamento de memória.
 */
export function revokeBlobUrl(url: string | null | undefined): void {
  if (!url) return;
  if (blobUrlRegistry.has(url)) {
    URL.revokeObjectURL(url);
    blobUrlRegistry.delete(url);
  }
}

/**
 * Valida o arquivo de imagem selecionado pelo usuário.
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Por favor, selecione uma imagem para a capa.' };
  }

  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'O arquivo selecionado não é uma imagem válida (PNG, JPG, WEBP, etc).' };
  }

  // Limite razoável de 15MB para armazenamento no IndexedDB
  const maxBytes = 15 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: 'A imagem selecionada é muito pesada (máximo permitido: 15MB).' };
  }

  return { valid: true };
}

/**
 * Otimiza e padroniza a imagem opcionalmente se for muito grande,
 * retornando um Blob no formato WebP ou JPEG de alta qualidade.
 */
export async function processImageToBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem do dispositivo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao decodificar a imagem selecionada. Formato não suportado.'));
      img.onload = () => {
        // Redimensiona proporcionalmente para no máximo 1400px de altura (alta definição para posters)
        const maxDimension = 1400;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Se não conseguir contexto canvas, retorna o arquivo original como Blob
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file); // fallback para o arquivo original
            }
          },
          'image/webp',
          0.9
        );
      };

      if (typeof reader.result === 'string') {
        img.src = reader.result;
      } else {
        resolve(file);
      }
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Converte um Blob de imagem em string Base64 (Data URL) para exportação em JSON de backup.
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao converter imagem para base64 durante o backup.'));
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Formato de dados inesperado ao converter imagem.'));
      }
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Converte uma string Base64 (Data URL) de volta em um Blob binário para persistência no IndexedDB.
 */
export async function base64ToBlob(dataUrl: string): Promise<Blob> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    throw new Error('Formato de imagem Base64 inválido no arquivo de restauração.');
  }

  const response = await fetch(dataUrl);
  return await response.blob();
}
