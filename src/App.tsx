import React, { useState, useEffect, useMemo } from 'react';
import { Header, AppNavTab } from './components/Header';
import { Footer } from './components/Footer';
import { BinderListView } from './components/BinderListView';
import { BinderSpread } from './components/BinderSpread';
import { BinderModal } from './components/BinderModal';
import { CardSearchModal } from './components/CardSearchModal';
import { CardZoomModal } from './components/CardZoomModal';
import { CollectionProgressModal } from './components/CollectionProgressModal';
import { CollectionProgressView } from './components/CollectionProgressView';
import { OverallCardList, AggregateCardItem } from './components/OverallCardList';
import { Binder, BinderCard } from './types/binder';
import { fixPokemonRegisteredCards } from './services/pokemonRarity';
import {
  loadBindersFromStorage,
  saveBindersToStorage,
} from './utils/storage';
import { auth } from './lib/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  loginWithGoogle,
  logoutUser,
  loadBindersFromFirestore,
  saveBinderToFirestore,
  deleteBinderFromFirestore,
} from './services/firebaseSync';

export default function App() {
  const [binders, setBinders] = useState<Binder[]>([]);
  const [activeBinderId, setActiveBinderId] = useState<string | null>(null);
  const [binderSearch, setBinderSearch] = useState('');
  const [activeTab, setActiveTab] = useState<AppNavTab>('binders');
  const [user, setUser] = useState<User | null>(null);

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

  // Card zoom modal state (view, edit, delete)
  const [zoomConfig, setZoomConfig] = useState<{
    card: BinderCard | null;
    slotIndex: number | null;
    binderId?: string | null;
  }>({
    card: null,
    slotIndex: null,
    binderId: null,
  });

  // Collection progress modal state
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  // Floating feedback toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 4000);
  };

  // Load from localStorage on mount & listen to Firebase Auth
  useEffect(() => {
    const loadedBinders = loadBindersFromStorage();
    setBinders(loadedBinders);

    // Automatically check and fix Pokémon rarities for registered cards
    fixPokemonRegisteredCards(loadedBinders).then(({ updatedBinders, changedCount }) => {
      if (changedCount > 0) {
        setBinders(updatedBinders);
        saveBindersToStorage(updatedBinders);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const remoteBinders = await loadBindersFromFirestore(currentUser.uid);
          if (remoteBinders.length > 0) {
            setBinders(remoteBinders);
            saveBindersToStorage(remoteBinders);
            showToast('Dados sincronizados com a nuvem!');

            // Also check and fix Pokémon rarities for remote binders
            fixPokemonRegisteredCards(remoteBinders).then(async ({ updatedBinders, changedCount }) => {
              if (changedCount > 0) {
                setBinders(updatedBinders);
                saveBindersToStorage(updatedBinders);
                for (const b of updatedBinders) {
                  await saveBinderToFirestore(currentUser.uid, b);
                }
              }
            });
          } else {
            // Upload local binders to Firestore if remote is empty
            if (loadedBinders.length > 0) {
              for (const b of loadedBinders) {
                await saveBinderToFirestore(currentUser.uid, b);
              }
              showToast('Fichários salvos na nuvem!');
            }
          }
        } catch (err) {
          console.error('Error syncing with Firestore:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        showToast('Login realizado com sucesso!');
      }
    } catch (err) {
      showToast('Erro ao realizar login com Google.');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      showToast('Você saiu da sua conta.');
    } catch (err) {
      showToast('Erro ao sair da conta.');
    }
  };

  // Sync state to localStorage and Firestore
  const handleUpdateBinders = async (updatedList: Binder[], deletedBinderId?: string) => {
    setBinders(updatedList);
    saveBindersToStorage(updatedList);

    if (user) {
      try {
        if (deletedBinderId) {
          await deleteBinderFromFirestore(user.uid, deletedBinderId);
        }
        for (const binder of updatedList) {
          await saveBinderToFirestore(user.uid, binder);
        }
      } catch (err) {
        console.error('Error syncing update to Firestore:', err);
      }
    }
  };

  const handleUpdateCardProperty = (binderId: string, slotIndex: number, updatedFields: Partial<BinderCard>) => {
    const binder = binders.find((b) => b.id === binderId);
    if (!binder) return;
    const currentCard = binder.cards[slotIndex];
    if (!currentCard) return;

    const updatedCard = { ...currentCard, ...updatedFields };
    const newCards = { ...binder.cards, [slotIndex]: updatedCard };
    const nextList = binders.map((b) =>
      b.id === binderId ? { ...b, cards: newCards, updatedAt: Date.now() } : b
    );
    handleUpdateBinders(nextList);
  };

  const activeBinder = binders.find((b) => b.id === activeBinderId) || null;

  // Total overall physical cards across binders
  const totalAllCardsCount = useMemo(() => {
    let count = 0;
    binders.forEach((b) => {
      count += Object.keys(b.cards).length;
    });
    return count;
  }, [binders]);

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
      setActiveTab('binders');
    }
    handleUpdateBinders(nextList);
    showToast(exists ? 'Fichário atualizado com sucesso!' : 'Novo fichário criado com sucesso!');
  };

  // Delete Binder
  const handleDeleteBinder = (binderId: string) => {
    const targetBinder = binders.find((b) => b.id === binderId);
    if (!targetBinder) return;

    const nextList = binders.filter((b) => b.id !== binderId);
    handleUpdateBinders(nextList, binderId);
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
    handleRemoveCardFromBinder(activeBinder.id, slotIndex);
  };

  const handleRemoveCardFromBinder = (binderId: string, slotIndex: number) => {
    const binder = binders.find((b) => b.id === binderId);
    if (!binder) return;

    const cardToRemove = binder.cards[slotIndex];
    if (!cardToRemove) return;

    const newCards = { ...binder.cards };
    delete newCards[slotIndex];

    const nextList = binders.map((b) =>
      b.id === binderId ? { ...b, cards: newCards, updatedAt: Date.now() } : b
    );
    handleUpdateBinders(nextList);
    showToast(`Carta "${cardToRemove.name}" removida do bolso #${slotIndex + 1}.`);
  };

  // Delete card from OverallCardList
  const handleDeleteOverallCard = (item: AggregateCardItem) => {
    handleRemoveCardFromBinder(item.binderId, item.slotIndex);
  };

  // Save selected API card(s) into active binder slots
  const handleSelectCards = (cards: BinderCard[]) => {
    if (cards.length === 0 || !activeBinder || cardSearchConfig.slotIndex === null) return;

    const binderGame = activeBinder.game || 'pokemon';
    const invalidGameCard = cards.find((c) => c.game !== binderGame);
    if (invalidGameCard) {
      showToast(`O sistema permite a inclusão apenas de cartas do mesmo jogo registrado no fichário (${binderGame.toUpperCase()}).`);
      return;
    }

    const startSlot = cardSearchConfig.slotIndex;
    const lastSlot = startSlot + cards.length - 1;
    const currentSlots = activeBinder.totalPages * 9;

    let newTotalPages = activeBinder.totalPages;
    let sheetsAdded = 0;

    // Only add cards that fit in current slots
    const allowedCardsCount = Math.max(0, currentSlots - startSlot);
    const cardsToAdd = cards.slice(0, allowedCardsCount);

    if (cardsToAdd.length < cards.length) {
      showToast('O fichário está cheio, apenas algumas cartas foram adicionadas.');
    }

    const newCards = { ...activeBinder.cards };
    cardsToAdd.forEach((card, idx) => {
      newCards[startSlot + idx] = {
        ...card,
        condition: card.condition || 'NM',
        language: card.language || 'PT',
      };
    });

    const updatedBinder: Binder = {
      ...activeBinder,
      totalPages: newTotalPages,
      cards: newCards,
      updatedAt: Date.now(),
    };

    handleUpdateActiveBinder(updatedBinder);
    setCardSearchConfig({ isOpen: false, slotIndex: null });
    showToast(`${cardsToAdd.length} carta(s) adicionada(s) com sucesso!`);
  };

  // Navigate directly to binder and slot from OverallCardList
  const handleNavigateToBinder = (binderId: string, slotIndex?: number) => {
    setActiveBinderId(binderId);
    setActiveTab('binders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Full JSON Backup Restoration
  const handleImportFullBackup = (data: {
    binders: Binder[];
  }) => {
    handleUpdateBinders(data.binders);
    showToast('Backup de fichários do BinderDex restaurado com sucesso!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0f17] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header with Navigation Tabs */}
      <Header
        onGoHome={() => {
          setActiveBinderId(null);
          setBinderSearch('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'binders') {
            setActiveBinderId(null);
          }
        }}
        bindersCount={binders.length}
        allCardsCount={totalAllCardsCount}
        searchQuery={binderSearch}
        onSearchChange={(query) => {
          setBinderSearch(query);
          if (activeBinderId) {
            setActiveBinderId(null);
          }
        }}
        onOpenNewBinderModal={handleOpenCreateBinder}
        showSearch={true}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'binders' && (
          <>
            {activeBinder ? (
              // View 1A: Active Binder Spread View
              <BinderSpread
                binder={activeBinder}
                onBack={() => setActiveBinderId(null)}
                onUpdateBinder={handleUpdateActiveBinder}
                onEditBinderDetails={handleOpenEditBinder}
                onDeleteBinder={handleDeleteBinder}
                onAddCardToSlot={handleAddCardToSlot}
                onViewCard={(card, slotIndex) => setZoomConfig({ card, slotIndex, binderId: activeBinder?.id })}
                onDeleteCard={handleDeleteCardInSlot}
              />
            ) : (
              // View 1B: Binders Shelf View
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
          </>
        )}

        {activeTab === 'all-cards' && (
          // View 2: Overall Collection Card List (All Cards in Binders)
          <OverallCardList
            binders={binders}
            onNavigateToBinder={handleNavigateToBinder}
            onViewCard={(card, slotIndex, binderId) => setZoomConfig({ card, slotIndex: slotIndex ?? null, binderId: binderId || activeBinderId })}
            onDeleteCard={handleDeleteOverallCard}
            onUpdateCardProperty={handleUpdateCardProperty}
            showToast={showToast}
          />
        )}

        {activeTab === 'progress' && (
          // View 3: Dedicated Collection Progress View
          <CollectionProgressView binders={binders} />
        )}
      </main>

      {/* Footer with full Backup JSON Export / Import */}
      <Footer
        binders={binders}
        onImportSuccess={handleImportFullBackup}
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
        lockGame={Boolean(activeBinder)}
        currentTotalSlots={activeBinder ? activeBinder.totalPages * 9 : 72}
      />

      {/* Card Zoom & Inspect Modal */}
      <CardZoomModal
        key={zoomConfig.card ? `${zoomConfig.card.id}-${zoomConfig.binderId ?? 'b'}-${zoomConfig.slotIndex ?? 'slot'}` : 'closed-zoom'}
        card={zoomConfig.card}
        slotIndex={zoomConfig.slotIndex}
        binderId={zoomConfig.slotIndex !== null ? zoomConfig.binderId : null}
        binders={binders}
        onClose={() => setZoomConfig({ card: null, slotIndex: null, binderId: null })}
        onChangeCard={zoomConfig.slotIndex !== null ? handleEditCardInSlot : undefined}
        onDeleteCard={zoomConfig.slotIndex !== null ? handleDeleteCardInSlot : undefined}
        onUpdateCardProperty={handleUpdateCardProperty}
      />

      {/* Collection Progress Modal */}
      <CollectionProgressModal
        isOpen={isProgressModalOpen}
        onClose={() => setIsProgressModalOpen(false)}
        binders={binders}
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
