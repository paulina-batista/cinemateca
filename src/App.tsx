import { useState, useEffect, useRef } from 'react';
import { Clapperboard, Loader2, RefreshCw } from 'lucide-react';
import type { CreateMediaDTO, MediaItem, UpdateMediaDTO } from './types/media';
import { useMediaLibrary } from './hooks/useMediaLibrary';
import { useToast } from './hooks/useToast';
import { useAuth } from './hooks/useAuth';
import { useSync } from './hooks/useSync';
import { Header } from './components/Header';
import { FeaturedHero } from './components/FeaturedHero';
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
  const { user, status: authStatus } = useAuth();
  // Track the previous userId to detect genuine login transitions
  const prevUserIdRef = useRef<string | null>(null);
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
  } = useMediaLibrary(user);

  const { toasts, showToast, removeToast } = useToast();
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
        showToast('success', 'Título atualizado', `"${updated.title}" foi atualizado no Kino.`);
      } else {
        const created = await addItem(data as CreateMediaDTO);
        showToast('success', 'Título adicionado', `"${created.title}" foi salvo na sua curadoria Kino.`);
      }

      // Sincroniza em segundo plano se o usuário estiver autenticado
      if (user) {
        syncNow().then(() => reload());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao persistir o título.';
      showToast('error', 'Falha ao salvar', msg);
      throw err;
    }
  };

  // Confirmação e execução da exclusão
  const handleConfirmDelete = async (id: string) => {
    try {
      const itemTitle = itemToDelete?.title || 'Título';
      await deleteItem(id);
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
      setItemToDelete(null);
      showToast('success', 'Título removido', `"${itemTitle}" foi removido do Kino.`);

      if (user) {
        syncNow().then(() => reload());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao remover do banco de dados.';
      showToast('error', 'Falha ao excluir', msg);
    }
  };

  // Sync ONCE when a new user session is detected (login event only, not token refresh)
  useEffect(() => {
    if (authStatus === 'initializing') return;

    const currentId = user?.id ?? null;
    const prevId = prevUserIdRef.current;

    // Only sync when transitioning from no-user to a user (actual sign-in)
    if (currentId && prevId === null) {
      syncNow().then(() => reload()).catch(console.warn);
    }

    prevUserIdRef.current = currentId;
  }, [user, authStatus, syncNow, reload]);

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-[#FBF6F6] text-[#1E080D]">
      {/* Header Fixo com Identidade Kino, Busca, Filtros (Todos, Filmes, Séries), Ordenação, Backup e Usuário */}
      <Header
        totalCount={stats.total}
        movieCount={stats.movies}
        seriesCount={stats.series}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={typeFilter}
        onFilterChange={setTypeFilter}
        sortMode={sortMode}
        onSortChange={setSortMode}
        onOpenBackupModal={() => setBackupModalOpen(true)}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        isAuthenticated={Boolean(user)}
        userEmail={user?.email}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3.5 sm:py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 text-[#781D33]">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-[#781D33]" />
            <p className="text-xs uppercase tracking-widest font-semibold text-[#781D33]/80">
              Carregando Kino...
            </p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto p-6 bg-[#FFF2F4] rounded-3xl border border-[#F0B8C2] text-center">
            <Clapperboard className="w-10 h-10 text-[#781D33] mx-auto mb-3" />
            <h2 className="text-lg font-bold font-serif text-[#1E080D] mb-1">
              Falha ao carregar catálogo
            </h2>
            <p className="text-xs text-[#781D33]/80 mb-4">{error}</p>
            <button
              onClick={() => reload()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#781D33] text-white hover:bg-[#8C253E] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Destaque para o Último Título Adicionado (Google Stitch style) */}
            {stats.latestAdded && !searchQuery.trim() && typeFilter === 'all' && (
              <FeaturedHero
                item={stats.latestAdded}
                onViewDetails={(item) => setSelectedItem(item)}
              />
            )}

            {/* Grid de Cartazes — 3 colunas rigorosas no celular, até 6 no desktop */}
            <MediaGrid
              items={items}
              totalRawItems={rawItems.length}
              isSearchActive={searchQuery.trim().length > 0}
              searchQuery={searchQuery}
              latestAddedId={stats.latestAdded?.id}
              onClearSearch={() => {
                setSearchQuery('');
                setTypeFilter('all');
              }}
              onSelectItem={(item) => setSelectedItem(item)}
              onAddNew={handleOpenCreate}
            />
          </div>
        )}
      </main>

      {/* Botão Flutuante Único (+) no Canto Inferior Direito (Mobile e Desktop) */}
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

      {/* Modal de Cadastro e Edição com Proteção contra Duplicatas */}
      <MediaFormModal
        isOpen={formModalOpen}
        initialData={editingItem}
        existingItems={rawItems}
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
          if (user) {
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

      {/* Rodapé Oficial Kino — Sem indicadores de conexão */}
      <footer className="mt-auto border-t border-[#F0D5DA] py-4 px-4 text-xs text-[#781D33]/80 bg-[#FBF6F6]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <p className="font-serif">
            <span className="font-bold text-[#781D33]">Kino</span> — Curadoria pessoal de arte e mídias
          </p>
          <div className="flex items-center gap-3 text-[#781D33]/70">
            <span>Total no acervo: <strong className="text-[#1E080D] font-bold">{stats.total}</strong> {stats.total === 1 ? 'título' : 'títulos'}</span>
            {stats.latestAdded && (
              <>
                <span>•</span>
                <span>Último adicionado: <strong className="text-[#781D33] font-semibold">{stats.latestAdded.title}</strong></span>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
