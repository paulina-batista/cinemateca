import { useState, useEffect } from 'react';
import { Library, Loader2, RefreshCw } from 'lucide-react';
import type { CreateMediaDTO, MediaItem, UpdateMediaDTO } from './types/media';
import { useMediaLibrary } from './hooks/useMediaLibrary';
import { useToast } from './hooks/useToast';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { useAuth } from './hooks/useAuth';
import { useSync } from './hooks/useSync';
import { Header } from './components/Header';
import { MediaGrid } from './components/MediaGrid';
import { MediaDetailModal } from './components/MediaDetailModal';
import { MediaFormModal } from './components/MediaFormModal';
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog';
import { FloatingActionButton } from './components/FloatingActionButton';
import { ToastContainer } from './components/Toast';
import { BackupModal } from './components/BackupModal';
import { AuthModal } from './components/AuthModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';

export function App() {
  const {
    items,
    rawItems,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    sortMode,
    setSortMode,
    stats,
    addItem,
    updateItem,
    deleteItem,
    reload,
  } = useMediaLibrary();

  const { toasts, showToast, removeToast } = useToast();
  const { isOnline } = useNetworkStatus();
  const { user } = useAuth();
  const { syncNow } = useSync();

  // Modais e Estados de Seleção
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
  const [backupModalOpen, setBackupModalOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [configModalOpen, setConfigModalOpen] = useState<boolean>(false);

  // Abertura do formulário de criação
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  // Abertura do formulário de edição a partir do modal de detalhes
  const handleOpenEdit = (item: MediaItem) => {
    setSelectedItem(null);
    setEditingItem(item);
    setFormModalOpen(true);
  };

  // Submissão do formulário (Criação ou Edição)
  const handleFormSubmit = async (data: CreateMediaDTO | UpdateMediaDTO) => {
    try {
      if (editingItem) {
        const updated = await updateItem(editingItem.id, data as UpdateMediaDTO);
        setSelectedItem(updated);
        showToast('success', 'Registro atualizado', `"${updated.title}" foi atualizado no IorHub.`);
      } else {
        const created = await addItem(data as CreateMediaDTO);
        showToast('success', 'Item adicionado', `"${created.title}" foi salvo na sua biblioteca.`);
      }

      // Sincroniza em segundo plano com a nuvem se estiver conectado
      if (user && isOnline) {
        syncNow().then(() => reload());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao persistir no IndexedDB.';
      showToast('error', 'Falha ao salvar', msg);
      throw err;
    }
  };

  // Confirmação e execução da exclusão
  const handleConfirmDelete = async (id: string) => {
    try {
      const itemTitle = itemToDelete?.title || 'Item';
      await deleteItem(id);
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      setItemToDelete(null);
      showToast('success', 'Registro excluído', `"${itemTitle}" foi removido do IorHub.`);

      // Sincroniza exclusão com a nuvem
      if (user && isOnline) {
        syncNow().then(() => reload());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao remover do banco de dados.';
      showToast('error', 'Falha ao excluir', msg);
    }
  };

  // Sincronização periódica ou ao recarregar a página
  useEffect(() => {
    if (user && isOnline) {
      syncNow().then(() => reload());
    }
  }, [user, isOnline, syncNow, reload]);

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-[#fdf8f8] text-[#3d121a]">
      {/* Header Fixo com Busca, Filtros para 4 Categorias, Ordenação, Backup e Nuvem */}
      <Header
        totalCount={stats.total}
        movieCount={stats.movies}
        seriesCount={stats.series}
        bookCount={stats.books}
        gameCount={stats.games}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={typeFilter}
        onFilterChange={setTypeFilter}
        sortMode={sortMode}
        onSortChange={setSortMode}
        onOpenCreateModal={handleOpenCreate}
        onOpenBackupModal={() => setBackupModalOpen(true)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenConfigModal={() => setConfigModalOpen(true)}
        isOnline={isOnline}
      />

      {/* Conteúdo Principal — sem transbordamento horizontal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3.5 sm:py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 text-[#c56d7b]">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-xs uppercase tracking-widest font-semibold text-[#80555e]">
              Carregando o IorHub...
            </p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto p-6 bg-[#fff2f4] rounded-3xl border border-[#f5b8c2] text-center">
            <Library className="w-10 h-10 text-[#a32a3d] mx-auto mb-3" />
            <h2 className="text-lg font-bold font-serif text-[#54101d] mb-1">
              Falha ao carregar catálogo
            </h2>
            <p className="text-xs text-[#703b46] mb-4">{error}</p>
            <button
              onClick={() => reload()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#722330] text-white hover:bg-[#8c2d3c] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tentar novamente
            </button>
          </div>
        ) : (
          <MediaGrid
            items={items}
            totalRawItems={rawItems.length}
            isSearchActive={searchQuery.trim().length > 0}
            searchQuery={searchQuery}
            onClearSearch={() => {
              setSearchQuery('');
              setTypeFilter('all');
            }}
            onSelectItem={(item) => setSelectedItem(item)}
            onAddNew={handleOpenCreate}
          />
        )}
      </main>

      {/* Botão Flutuante Mobile (+) */}
      <FloatingActionButton onClick={handleOpenCreate} />

      {/* Modal de Detalhes */}
      <MediaDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onEdit={handleOpenEdit}
        onDeleteRequest={(item) => {
          setItemToDelete(item);
        }}
      />

      {/* Modal de Cadastro e Edição */}
      <MediaFormModal
        isOpen={formModalOpen}
        initialData={editingItem}
        onClose={() => {
          setFormModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
      />

      {/* Diálogo de Confirmação de Exclusão */}
      <DeleteConfirmDialog
        item={itemToDelete}
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal de Gerenciamento de Dados & Backup */}
      <BackupModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        currentItems={rawItems}
        onRestoreSuccess={async () => {
          await reload();
          if (user && isOnline) {
            await syncNow();
          }
          showToast('success', 'Restauração Concluída', 'Biblioteca recarregada com sucesso.');
        }}
      />

      {/* Modal de Autenticação Supabase */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onOpenConfig={() => setConfigModalOpen(true)}
      />

      {/* Modal de Configuração de Credenciais Supabase */}
      <SupabaseConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onConfigSaved={async () => {
          await reload();
          showToast('success', 'Configuração Salva', 'Credenciais do Supabase atualizadas.');
        }}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Rodapé Elegante com Identidade IorHub */}
      <footer className="mt-auto border-t border-[#f3d9de] py-4 px-4 text-center text-xs text-[#80555e] bg-white/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <p className="font-serif">
            <span className="font-bold text-[#722330]">IorHub</span> • Filmes, Séries, Livros & Jogos • Offline & Nuvem
          </p>
          <div className="flex items-center gap-3 text-[#996a74]">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{isOnline ? 'Conectado à Internet' : 'Modo Offline Ativo'}</span>
            </div>
            <span>•</span>
            <span>IndexedDB Local + Supabase Cloud</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
