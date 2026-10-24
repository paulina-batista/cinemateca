import type { MediaItem } from '../../types/media';

const DB_NAME = 'CineCoquetteDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_items';

/**
 * Inicializa e gerencia a conexão com o IndexedDB do navegador.
 */
class IndexedDBService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  public async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('O navegador não suporta IndexedDB ou o acesso ao armazenamento local está bloqueado.');
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('rating', 'rating', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(`Erro ao abrir banco de dados local: ${request.error?.message || 'Falha desconhecida'}`));
      };

      request.onblocked = () => {
        console.warn('Conexão ao IndexedDB bloqueada por outra aba aberta.');
      };
    });

    return this.dbPromise;
  }

  /**
   * Retorna todos os itens salvos localmente (excluindo os marcados como excluídos localmente por padrão).
   */
  public async getAll(includeDeleted = false): Promise<MediaItem[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as MediaItem[]) || [];
        if (includeDeleted) {
          resolve(results);
        } else {
          resolve(results.filter((item) => !item.isDeletedLocally));
        }
      };

      request.onerror = () => {
        reject(new Error(`Falha ao ler registros do IndexedDB: ${request.error?.message}`));
      };
    });
  }

  /**
   * Retorna itens que necessitam sincronização com a nuvem (novos, alterados ou excluídos offline).
   */
  public async getPendingSync(): Promise<MediaItem[]> {
    const all = await this.getAll(true);
    return all.filter((item) => !item.syncedWithSupabase || item.isDeletedLocally);
  }

  /**
   * Obtém um item específico pelo ID.
   */
  public async getById(id: string): Promise<MediaItem | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const item = request.result as MediaItem | undefined;
        if (!item || item.isDeletedLocally) {
          resolve(null);
        } else {
          resolve(item);
        }
      };

      request.onerror = () => {
        reject(new Error(`Falha ao buscar registro por ID: ${request.error?.message}`));
      };
    });
  }

  /**
   * Adiciona um novo registro ao IndexedDB.
   */
  public async add(item: MediaItem): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(item);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Falha ao salvar no IndexedDB: ${request.error?.message || 'Erro ao gravar registro'}`));
      };
    });
  }

  /**
   * Atualiza um registro existente.
   */
  public async put(item: MediaItem): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(item);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Falha ao atualizar no IndexedDB: ${request.error?.message || 'Erro ao regravar registro'}`));
      };
    });
  }

  /**
   * Marca um registro como excluído para propagar à nuvem na próxima sincronização (soft delete).
   */
  public async softDelete(id: string): Promise<void> {
    const item = await this.getById(id);
    if (!item) return;

    item.isDeletedLocally = true;
    item.syncedWithSupabase = false;
    item.updatedAt = new Date().toISOString();
    await this.put(item);
  }

  /**
   * Exclui fisicamente um registro pelo ID.
   */
  public async delete(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Falha ao excluir do IndexedDB: ${request.error?.message || 'Erro ao remover registro'}`));
      };
    });
  }

  /**
   * Grava múltiplos registros em uma única transação atômica.
   */
  public async putMany(items: MediaItem[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error(`Falha na transação atômica ao salvar registros: ${transaction.error?.message}`));
      };

      transaction.onabort = () => {
        reject(new Error('Transação cancelada durante a gravação dos registros.'));
      };

      for (const item of items) {
        store.put(item);
      }
    });
  }

  /**
   * Substitui integralmente a biblioteca em uma única transação atômica.
   * Se qualquer item falhar, a transação aborta preservando os dados anteriores.
   */
  public async clearAndInsertAll(items: MediaItem[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(new Error(`Falha ao restaurar banco de dados: ${transaction.error?.message}`));
      };

      transaction.onabort = () => {
        reject(new Error('Restauração abortada para evitar corrupção dos dados.'));
      };

      store.clear();
      for (const item of items) {
        store.put(item);
      }
    });
  }
}

export const idbService = new IndexedDBService();

