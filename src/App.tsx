import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { BinderListView } from './components/BinderListView';
import { BinderSpread } from './components/BinderSpread';
import { BinderModal } from './components/BinderModal';
import { CardSearchModal } from './components/CardSearchModal';
import { CardZoomModal } from './components/CardZoomModal';
import { Binder, BinderCard } from './types/binder';
import {
  loadBindersFromStorage,
  saveBindersToStorage,
} from './utils/storage';

export default function App() {
  const [binders, setBinders] = useState<Binder[]>([]);
  const [activeBinderId, setActiveBinderId] = useState<string | null>(null);
  const [binderSearch, setBinderSearch] = useState('');

  // Binder modal state (Create or Edit)
  const [isBinderModalOpen, setIsBinderModalOpen] = useState(false);
  const [editingBinder, setEditingBinder] = useState<Binder | null>(null);

  // Card search modal state (Web API query)
  const [cardSearchConfig, setCardSearchConfig] = useState<{
    isOpen: boolean;
    slotIndex: number | null;
    initialCard?: BinderCard;
  }>({
    isOpen: false,
    slotIndex: null,
  });

  // Card zoom modal state (view, edit, delete card)
  const [zoomConfig, setZoomConfig] = useState<{
    card: BinderCard | null;
    slotIndex: number | null;
  }>({
    card: null,
    slotIndex: null,
  });

  // Floating feedback toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 4000);
  };

  // Load from localStorage on mount
  useEffect(() => {
    const loadedBinders = loadBindersFromStorage();
    setBinders(loadedBinders);
  }, []);

  // Sync Binders to localStorage
  const handleUpdateBinders = (updatedList: Binder[]) => {
    setBinders(updatedList);
    saveBindersToStorage(updatedList);
  };

  const activeBinder = binders.find((b) => b.id === activeBinderId) || null;

  // Open Create Binder Modal
  const handleOpenCreateBinder = () => {
    setEditingBinder(null);
    setIsBinderModalOpen(true);
  };

  // Open Edit Binder Modal
  const handleOpenEditBinder = (binderToEdit: Binder) => {
    setEditingBinder(binderToEdit);
    setIsBinderModalOpen(true);
  };

  // Save Binder (Create or Edit)
  const handleSaveBinder = (savedBinder: Binder) => {
    const exists = binders.some((b) => b.id === savedBinder.id);
    let nextList: Binder[];
    if (exists) {
      nextList = binders.map((b) => (b.id === savedBinder.id ? savedBinder : b));
    } else {
      nextList = [savedBinder, ...binders];
      setActiveBinderId(savedBinder.id);
    }
    handleUpdateBinders(nextList);
    showToast(exists ? 'Fichário atualizado com sucesso!' : 'Novo fichário criado com sucesso!');
  };

  // Delete Binder
  const handleDeleteBinder = (binderId: string) => {
    const targetBinder = binders.find((b) => b.id === binderId);
    if (!targetBinder) return;

    const nextList = binders.filter((b) => b.id !== binderId);
    handleUpdateBinders(nextList);
    if (activeBinderId === binderId) {
      setActiveBinderId(null);
    }
    showToast(`Fichário "${targetBinder.title}" excluído com sucesso.`);
  };

  // Update active binder (cards, pages, etc.)
  const handleUpdateActiveBinder = (updatedBinder: Binder) => {
    const nextList = binders.map((b) => (b.id === updatedBinder.id ? updatedBinder : b));
    handleUpdateBinders(nextList);
  };

  // Open API search modal for card insertion in a specific binder pocket
  const handleAddCardToSlot = (slotIndex: number) => {
    setCardSearchConfig({
      isOpen: true,
      slotIndex,
      initialCard: undefined,
    });
  };

  // Open API search modal for card swap/edit in a specific binder pocket
  const handleEditCardInSlot = (slotIndex: number, card: BinderCard) => {
    setCardSearchConfig({
      isOpen: true,
      slotIndex,
      initialCard: card,
    });
  };

  // Delete card from a binder slot
  const handleDeleteCardInSlot = (slotIndex: number) => {
    if (!activeBinder) return;
    const cardToRemove = activeBinder.cards[slotIndex];
    if (!cardToRemove) return;

    const newCards = { ...activeBinder.cards };
    delete newCards[slotIndex];
    handleUpdateActiveBinder({
      ...activeBinder,
      cards: newCards,
      updatedAt: Date.now(),
    });
  };

  // Save selected API card(s) into active binder slots
  const handleSelectCards = (cards: BinderCard[]) => {
    if (cards.length === 0 || !activeBinder || cardSearchConfig.slotIndex === null) return;

    const startSlot = cardSearchConfig.slotIndex;
    const lastSlot = startSlot + cards.length - 1;
    const currentSlots = activeBinder.totalPages * 9;

    let newTotalPages = activeBinder.totalPages;
    let sheetsAdded = 0;

    // Check if cards exceed current binder capacity
    if (lastSlot >= currentSlots) {
      const currentSheets = Math.floor(activeBinder.totalPages / 2);
      const neededPages = Math.ceil((lastSlot + 1) / 9);
      const neededSheets = Math.ceil(neededPages / 2);
      newTotalPages = Math.max(activeBinder.totalPages, neededSheets * 2);
      sheetsAdded = neededSheets - currentSheets;
    }

    const newCards = { ...activeBinder.cards };
    cards.forEach((card, idx) => {
      newCards[startSlot + idx] = card;
    });

    handleUpdateActiveBinder({
      ...activeBinder,
      totalPages: newTotalPages,
      cards: newCards,
      updatedAt: Date.now(),
    });

    if (sheetsAdded > 0) {
      showToast(
        `${cards.length} ${cards.length === 1 ? 'carta alocada' : 'cartas alocadas'}! +${sheetsAdded} ${sheetsAdded === 1 ? 'folha nova foi criada' : 'folhas novas foram criadas'} automaticamente.`
      );
    } else if (cards.length > 1) {
      showToast(
        `${cards.length} cartas alocadas em sequência nos bolsos #${startSlot + 1} a #${startSlot + cards.length}!`
      );
    } else {
      showToast(`Carta inserida com sucesso no bolso #${startSlot + 1}!`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0f17] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        onGoHome={() => {
          setActiveBinderId(null);
          setBinderSearch('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        searchQuery={binderSearch}
        onSearchChange={(query) => {
          setBinderSearch(query);
          if (activeBinderId) {
            setActiveBinderId(null);
          }
        }}
        onOpenNewBinderModal={handleOpenCreateBinder}
        showSearch={true}
      />

      {/* Main View */}
      <main className="flex-1 flex flex-col">
        {activeBinder ? (
          // View 1: Active Binder Spread View
          <BinderSpread
            binder={activeBinder}
            onBack={() => setActiveBinderId(null)}
            onUpdateBinder={handleUpdateActiveBinder}
            onEditBinderDetails={handleOpenEditBinder}
            onDeleteBinder={handleDeleteBinder}
            onAddCardToSlot={handleAddCardToSlot}
            onViewCard={(card, slotIndex) => setZoomConfig({ card, slotIndex })}
            onDeleteCard={handleDeleteCardInSlot}
          />
        ) : (
          // View 2: Binders Shelf View
          <div className="flex-1 flex flex-col pb-12">
            <BinderListView
              binders={binders}
              search={binderSearch}
              onOpenBinder={(binder) => {
                setActiveBinderId(binder.id);
              }}
              onOpenNewBinderModal={handleOpenCreateBinder}
              onEditBinder={handleOpenEditBinder}
              onDeleteBinder={handleDeleteBinder}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        binders={binders}
        onImportSuccess={(mergedBinders) => {
          handleUpdateBinders(mergedBinders);
          showToast('Backup dos fichários importado com sucesso!');
        }}
      />

      {/* Binder Modal (Create / Edit) */}
      <BinderModal
        isOpen={isBinderModalOpen}
        onClose={() => setIsBinderModalOpen(false)}
        onSaveBinder={handleSaveBinder}
        onDeleteBinder={handleDeleteBinder}
        initialBinder={editingBinder}
      />

      {/* Card Search & Selection Modal (Web API query for binder slots) */}
      <CardSearchModal
        isOpen={cardSearchConfig.isOpen}
        onClose={() => setCardSearchConfig((prev) => ({ ...prev, isOpen: false }))}
        onSelectCards={handleSelectCards}
        slotIndex={cardSearchConfig.slotIndex}
        initialCard={cardSearchConfig.initialCard}
        defaultGame={
          cardSearchConfig.initialCard?.game ||
          activeBinder?.game ||
          'pokemon'
        }
        currentTotalSlots={activeBinder ? activeBinder.totalPages * 9 : 72}
      />

      {/* Card Zoom & Inspect Modal */}
      <CardZoomModal
        key={zoomConfig.card ? `${zoomConfig.card.id}-${zoomConfig.slotIndex ?? 'slot'}` : 'closed-zoom'}
        card={zoomConfig.card}
        slotIndex={zoomConfig.slotIndex}
        onClose={() => setZoomConfig({ card: null, slotIndex: null })}
        onChangeCard={zoomConfig.slotIndex !== null ? handleEditCardInSlot : undefined}
        onDeleteCard={zoomConfig.slotIndex !== null ? handleDeleteCardInSlot : undefined}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161c2d] border border-indigo-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
          <span className="text-xs font-semibold text-slate-100">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
