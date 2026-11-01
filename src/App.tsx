import { useState, useEffect, useRef, useMemo } from 'react';
import { Clapperboard, Loader2, RefreshCw, BookOpen, Plus, ListVideo } from 'lucide-react';
import type { CreateMediaDTO, MediaItem, UpdateMediaDTO } from './types/media';
import { migrateLegacyStatus } from './types/media';
import { useMediaLibrary } from './hooks/useMediaLibrary';
import { useToast } from './hooks/useToast';
import { useAuth } from './hooks/useAuth';
import { useSync } from './hooks/useSync';
import { Header } from './components/Header';
import { FeaturedHero } from './components/FeaturedHero';
import { MediaGrid } from './components/MediaGrid';
import { MediaCard } from './components/MediaCard';
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

  // Modal states
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
  const [backupModalOpen, setBackupModalOpen] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [configModalOpen, setConfigModalOpen] = useState<boolean>(false);

  // ─── Computed sections: Último Adicionado, MINHA LISTA, Biblioteca ─────────
  const isSearching = searchQuery.trim().length > 0;
  const isFiltering = typeFilter !== 'all';

  const { latestAdded, watchlistItems, libraryItems } = useMemo(() => {
    // Apply legacy status migration on all items
    const migratedItems = items.map((item) => ({
      ...item,
      status: migrateLegacyStatus(item.status),
    }));

    // Latest added = most recent by createdAt
    const sorted = [...migratedItems].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const latest = sorted.length > 0 ? sorted[0] : null;
    const latestId = latest?.id;

    // "Na lista" items (excluding the latest-added hero)
    const watchlist = migratedItems.filter(
      (item) => item.status === 'Na lista' && item.id !== latestId
    );

    // "Assistido" items (excluding the latest-added hero)
    const library = migratedItems.filter(
      (item) => item.status === 'Assistido' && item.id !== latestId
    );

    return {
      latestAdded: latest,
      watchlistItems: watchlist,
      libraryItems: library,
    };
  }, [items]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (item: MediaItem) => {
    setSelectedItem(null);
    setEditingItem(item);
    setFormModalOpen(true);
  };

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

      if (user) {
        syncNow().then(() => reload());
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao persistir o título.';
      showToast('error', 'Falha ao salvar', msg);
      throw err;
    }
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      const itemTitle = itemToDelete?.title || 'Título';
      await deleteItem(id);
      if (selectedItem?.id === id) setSelectedItem(null);
      setItemToDelete(null);
      showToast('success', 'Título removido', `"${itemTitle}" foi removido do Kino.`);
      if (user) { syncNow().then(() => reload()); }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao remover do banco de dados.';
      showToast('error', 'Falha ao excluir', msg);
    }
  };

  // Sync once on login
  useEffect(() => {
    if (authStatus === 'initializing') return;
    const currentId = user?.id ?? null;
    const prevId = prevUserIdRef.current;
    if (currentId && prevId === null) {
      syncNow().then(() => reload()).catch(console.warn);
    }
    prevUserIdRef.current = currentId;
  }, [user, authStatus, syncNow, reload]);

  // Show all sections only when not actively searching/filtering
  const showSections = !isSearching && !isFiltering;

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-[#FBF6F6] text-[#1E080D]">
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
            <h2 className="text-lg font-bold font-serif text-[#1E080D] mb-1">Falha ao carregar catálogo</h2>
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
          <div className="space-y-6 sm:space-y-8">

            {/* ══════════ ÁREA 1: ÚLTIMO ADICIONADO ══════════ */}
            {showSections && latestAdded && (
              <FeaturedHero
                item={latestAdded}
                onViewDetails={(item) => setSelectedItem(item)}
              />
            )}

            {/* ══════════ ÁREA 2: MINHA LISTA (Na lista) ══════════ */}
            {showSections && (
              <section className="rounded-3xl bg-white/70 border border-[#F0D5DA] p-3.5 sm:p-5 shadow-[0_4px_20px_rgba(30,8,13,0.03)] backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2.5 mb-3.5 pb-2.5 border-b border-[#F0D5DA]/60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#C99A4E]/15 border border-[#C99A4E]/30 flex items-center justify-center">
                      <BookOpen className="w-3.5 h-3.5 text-[#C99A4E]" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold font-serif text-[#1E080D] tracking-wide uppercase">
                        MINHA LISTA
                      </h2>
                      <p className="text-[10px] text-[#781D33]/60 hidden sm:block">
                        Obras marcadas como "Na lista" que pretendo assistir
                      </p>
                    </div>
                  </div>
                  {watchlistItems.length > 0 && (
                    <span className="text-[10px] font-bold text-[#C99A4E] bg-[#C99A4E]/15 border border-[#C99A4E]/30 px-2.5 py-0.5 rounded-full">
                      {watchlistItems.length} {watchlistItems.length === 1 ? 'título pendente' : 'títulos pendentes'}
                    </span>
                  )}
                </div>

                {watchlistItems.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3.5">
                    {watchlistItems.map((item) => (
                      <MediaCard
                        key={item.id}
                        item={item}
                        onClick={() => setSelectedItem(item)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#FBF6F6]/80 border border-dashed border-[#E5BDC5] text-center flex flex-col items-center justify-center">
                    <ListVideo className="w-6 h-6 text-[#C99A4E]/60 mb-1.5" />
                    <p className="text-xs text-[#781D33]/70 font-semibold mb-0.5">
                      Sua lista está vazia
                    </p>
                    <p className="text-[10px] text-[#781D33]/50 mb-2.5">
                      Adicione filmes e séries que pretende assistir futuramente
                    </p>
                    <button
                      onClick={handleOpenCreate}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold text-[#781D33] border border-[#C99A4E]/40 bg-white hover:bg-[#F6EEEE] transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3 h-3 text-[#C99A4E]" />
                      Adicionar à lista
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* ══════════ ÁREA 3: MINHA BIBLIOTECA (Assistido) ══════════ */}
            {showSections && (
              <section>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#781D33]/10 flex items-center justify-center">
                      <Clapperboard className="w-4 h-4 text-[#781D33]" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold font-serif text-[#1E080D]">
                      Minha Biblioteca
                    </h2>
                  </div>
                  {libraryItems.length > 0 && (
                    <span className="text-[10px] font-semibold text-[#781D33] bg-[#781D33]/10 px-2 py-0.5 rounded-full">
                      {libraryItems.length} {libraryItems.length === 1 ? 'título' : 'títulos'}
                    </span>
                  )}
                </div>

                <MediaGrid
                  items={libraryItems}
                  totalRawItems={rawItems.length}
                  isSearchActive={false}
                  onClearSearch={() => { setSearchQuery(''); setTypeFilter('all'); }}
                  onSelectItem={(item) => setSelectedItem(item)}
                  onAddNew={handleOpenCreate}
                />
              </section>
            )}

            {/* ══════════ WHEN SEARCHING/FILTERING: Show all results ══════════ */}
            {!showSections && (
              <MediaGrid
                items={items}
                totalRawItems={rawItems.length}
                isSearchActive={isSearching}
                searchQuery={searchQuery}
                latestAddedId={latestAdded?.id}
                onClearSearch={() => { setSearchQuery(''); setTypeFilter('all'); }}
                onSelectItem={(item) => setSelectedItem(item)}
                onAddNew={handleOpenCreate}
              />
            )}
          </div>
        )}
      </main>

      <FloatingActionButton onClick={handleOpenCreate} />

      <MediaDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onEdit={handleOpenEdit}
        onDeleteRequest={(item) => setItemToDelete(item)}
      />

      <MediaFormModal
        isOpen={formModalOpen}
        initialData={editingItem}
        existingItems={rawItems}
        onClose={() => { setFormModalOpen(false); setEditingItem(null); }}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirmDialog
        item={itemToDelete}
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <BackupModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
        currentItems={rawItems}
        onRestoreSuccess={async () => {
          await reload();
          if (user) await syncNow();
          showToast('success', 'Restauração Concluída', 'Biblioteca recarregada com sucesso.');
        }}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onOpenConfig={() => setConfigModalOpen(true)}
      />

      <SupabaseConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onConfigSaved={async () => {
          await reload();
          showToast('success', 'Configuração Salva', 'Credenciais do Supabase atualizadas.');
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <footer className="mt-auto border-t border-[#F0D5DA] py-4 px-4 text-xs text-[#781D33]/80 bg-[#FBF6F6]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <p className="font-serif">
            <span className="font-bold text-[#781D33]">Kino</span> — Curadoria pessoal de filmes e séries
          </p>
          <div className="flex items-center gap-3 text-[#781D33]/70">
            <span>Total: <strong className="text-[#1E080D] font-bold">{stats.total}</strong> {stats.total === 1 ? 'título' : 'títulos'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
