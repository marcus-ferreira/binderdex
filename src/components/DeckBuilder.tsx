import React, { useState, useMemo } from 'react';
import {
  Swords,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  ArrowLeft,
  Search,
  BookOpen,
  Package,
  Sparkles,
  Layers,
  Edit3,
  X,
} from 'lucide-react';
import { Deck, DeckCardItem, CardGame, Binder, LooseCard, BinderCard, SUPPORTED_GAMES } from '../types/binder';

interface DeckBuilderProps {
  decks: Deck[];
  onUpdateDecks: (decks: Deck[]) => void;
  binders: Binder[];
  looseCards: LooseCard[];
  onViewCard: (card: BinderCard) => void;
  showToast: (msg: string) => void;
}

const GAME_DECK_LIMITS: Record<CardGame, { min: number; max: number; label: string; maxCopiesPerCard: number }> = {
  pokemon: { min: 60, max: 60, label: 'Exatamente 60 cartas', maxCopiesPerCard: 4 },
  magic: { min: 60, max: 100, label: 'Mínimo 60 cartas (ou 100 no Commander)', maxCopiesPerCard: 4 },
  yugioh: { min: 40, max: 60, label: 'Entre 40 e 60 cartas', maxCopiesPerCard: 3 },
  digimon: { min: 50, max: 50, label: 'Exatamente 50 cartas no Deck Principal', maxCopiesPerCard: 4 },
  battlescenes: { min: 60, max: 60, label: 'Exatamente 60 cartas', maxCopiesPerCard: 3 },
};

export const DeckBuilder: React.FC<DeckBuilderProps> = ({
  decks,
  onUpdateDecks,
  binders,
  looseCards,
  onViewCard,
  showToast,
}) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  // Deck modal (Create / Edit metadata)
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [deckName, setDeckName] = useState('');
  const [deckGame, setDeckGame] = useState<CardGame>('pokemon');
  const [deckDescription, setDeckDescription] = useState('');
  const [deckCover, setDeckCover] = useState('');

  // Import text modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');

  // Search filter inside collection drawer
  const [collectionSearchTerm, setCollectionSearchTerm] = useState('');

  const activeDeck = useMemo(() => {
    return decks.find((d) => d.id === selectedDeckId) || null;
  }, [decks, selectedDeckId]);

  // Total cards in active deck
  const totalDeckCardsCount = useMemo(() => {
    if (!activeDeck) return 0;
    return activeDeck.cards.reduce((sum, c) => sum + (c.count || 1), 0);
  }, [activeDeck]);

  // Inventory cache: calculate how many copies the user owns in binders and loose cards
  const userInventoryMap = useMemo(() => {
    const map = new Map<
      string,
      {
        totalOwned: number;
        sources: {
          type: 'binder' | 'loose';
          name: string;
          count: number;
          pageNumber?: number;
          slotIndex?: number;
        }[];
        card: BinderCard;
      }
    >();

    // From binders
    binders.forEach((b) => {
      Object.entries(b.cards).forEach(([slotStr, card]) => {
        const slotIdx = Number(slotStr);
        const key = `${card.game}:${card.name.trim().toLowerCase()}`;
        if (!map.has(key)) {
          map.set(key, { totalOwned: 0, sources: [], card });
        }
        const item = map.get(key)!;
        item.totalOwned += 1;
        item.sources.push({
          type: 'binder',
          name: b.title,
          count: 1,
          pageNumber: Math.floor(slotIdx / 9) + 1,
          slotIndex: slotIdx,
        });
      });
    });

    // From loose cards
    looseCards.forEach((l) => {
      const key = `${l.game}:${l.name.trim().toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, { totalOwned: 0, sources: [], card: l });
      }
      const item = map.get(key)!;
      item.totalOwned += l.quantity || 1;
      item.sources.push({
        type: 'loose',
        name: 'Coleção Avulsa',
        count: l.quantity || 1,
      });
    });

    return map;
  }, [binders, looseCards]);

  // Available collection cards matching active deck's game (STRICT: only cards owned in collection)
  const collectionCardsForDeck = useMemo(() => {
    if (!activeDeck) return [];
    const list: {
      key: string;
      card: BinderCard;
      totalOwned: number;
      usedInDeck: number;
      sources: any[];
    }[] = [];

    userInventoryMap.forEach((val, key) => {
      if (val.card.game === activeDeck.game) {
        const usedInDeck =
          activeDeck.cards
            .filter((dc) => dc.name.trim().toLowerCase() === val.card.name.trim().toLowerCase())
            .reduce((sum, c) => sum + c.count, 0);

        list.push({
          key,
          card: val.card,
          totalOwned: val.totalOwned,
          usedInDeck,
          sources: val.sources,
        });
      }
    });

    if (collectionSearchTerm.trim()) {
      const query = collectionSearchTerm.toLowerCase();
      return list.filter(
        (item) =>
          item.card.name.toLowerCase().includes(query) ||
          item.card.setName?.toLowerCase().includes(query) ||
          item.card.collectorNumber?.toLowerCase().includes(query)
      );
    }

    return list;
  }, [activeDeck, userInventoryMap, collectionSearchTerm]);

  // Open Create Deck Modal
  const handleOpenCreateDeck = () => {
    setEditingDeck(null);
    setDeckName('');
    setDeckGame('pokemon');
    setDeckDescription('');
    setDeckCover('');
    setIsDeckModalOpen(true);
  };

  // Open Edit Deck Modal
  const handleOpenEditDeck = (deck: Deck) => {
    setEditingDeck(deck);
    setDeckName(deck.name);
    setDeckGame(deck.game);
    setDeckDescription(deck.description || '');
    setDeckCover(deck.coverImageUrl || '');
    setIsDeckModalOpen(true);
  };

  // Save Deck metadata
  const handleSaveDeck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckName.trim()) return;

    if (editingDeck) {
      const updated: Deck = {
        ...editingDeck,
        name: deckName.trim(),
        game: deckGame,
        description: deckDescription.trim() || undefined,
        coverImageUrl: deckCover.trim() || undefined,
        updatedAt: Date.now(),
      };
      onUpdateDecks(decks.map((d) => (d.id === updated.id ? updated : d)));
      showToast('Deck atualizado com sucesso!');
    } else {
      const newDeck: Deck = {
        id: `deck-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: deckName.trim(),
        game: deckGame,
        description: deckDescription.trim() || undefined,
        coverImageUrl: deckCover.trim() || undefined,
        cards: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      onUpdateDecks([newDeck, ...decks]);
      setSelectedDeckId(newDeck.id);
      showToast('Novo deck criado com sucesso!');
    }

    setIsDeckModalOpen(false);
  };

  // Delete Deck
  const handleDeleteDeck = (deckId: string) => {
    const target = decks.find((d) => d.id === deckId);
    if (!target) return;
    if (confirm(`Tem certeza que deseja excluir o deck "${target.name}"?`)) {
      onUpdateDecks(decks.filter((d) => d.id !== deckId));
      if (selectedDeckId === deckId) setSelectedDeckId(null);
      showToast(`Deck "${target.name}" excluído.`);
    }
  };

  // Duplicate Deck
  const handleDuplicateDeck = (deck: Deck) => {
    const cloned: Deck = {
      ...deck,
      id: `deck-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${deck.name} (Cópia)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onUpdateDecks([cloned, ...decks]);
    setSelectedDeckId(cloned.id);
    showToast(`Deck duplicado com sucesso!`);
  };

  // Add Card to active deck (STRICT: Only cards owned in collection)
  const handleAddCardToDeck = (card: BinderCard, sourceType: 'binder' | 'loose') => {
    if (!activeDeck) return;

    // Verify ownership in collection
    const key = `${activeDeck.game}:${card.name.trim().toLowerCase()}`;
    const inv = userInventoryMap.get(key);

    if (!inv || inv.totalOwned <= 0) {
      showToast(`Apenas cartas presentes na sua coleção (fichários ou avulsas) podem ser incluídas nos decks!`);
      return;
    }

    const existingIndex = activeDeck.cards.findIndex(
      (c) => c.name.trim().toLowerCase() === card.name.trim().toLowerCase()
    );

    const limits = GAME_DECK_LIMITS[activeDeck.game] || { maxCopiesPerCard: 4 };

    let updatedCards = [...activeDeck.cards];
    if (existingIndex >= 0) {
      const currentCount = updatedCards[existingIndex].count;
      if (currentCount >= limits.maxCopiesPerCard) {
        showToast(`Limite de ${limits.maxCopiesPerCard} cópias atingido para ${card.name}.`);
        return;
      }
      if (currentCount >= inv.totalOwned) {
        showToast(`Você possui apenas ${inv.totalOwned} cópia(s) desta carta na coleção.`);
        return;
      }
      updatedCards[existingIndex] = {
        ...updatedCards[existingIndex],
        count: currentCount + 1,
      };
    } else {
      const newItem: DeckCardItem = {
        id: `deckitem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        cardId: card.id,
        name: card.name,
        game: card.game,
        imageUrl: card.imageUrl,
        finish: card.finish,
        setName: card.setName,
        collectorNumber: card.collectorNumber,
        rarity: card.rarity,
        artist: card.artist,
        sourceType,
        count: 1,
        category: 'main',
      };
      updatedCards.push(newItem);
    }

    const updatedDeck: Deck = {
      ...activeDeck,
      cards: updatedCards,
      updatedAt: Date.now(),
    };

    onUpdateDecks(decks.map((d) => (d.id === updatedDeck.id ? updatedDeck : d)));
    showToast(`+1 "${card.name}" adicionado ao deck.`);
  };

  // Adjust card quantity in deck
  const handleAdjustCount = (itemIndex: number, delta: number) => {
    if (!activeDeck) return;
    const updatedCards = [...activeDeck.cards];
    const item = updatedCards[itemIndex];
    if (!item) return;

    const limits = GAME_DECK_LIMITS[activeDeck.game] || { maxCopiesPerCard: 4 };
    const nextCount = item.count + delta;

    if (nextCount <= 0) {
      updatedCards.splice(itemIndex, 1);
      showToast(`"${item.name}" removido do deck.`);
    } else if (nextCount > limits.maxCopiesPerCard) {
      showToast(`Limite máximo de ${limits.maxCopiesPerCard} cópias atingido.`);
      return;
    } else {
      // Check collection ownership limit
      const key = `${activeDeck.game}:${item.name.trim().toLowerCase()}`;
      const inv = userInventoryMap.get(key);
      if (inv && nextCount > inv.totalOwned) {
        showToast(`Você possui apenas ${inv.totalOwned} cópia(s) desta carta na coleção.`);
        return;
      }
      updatedCards[itemIndex] = { ...item, count: nextCount };
    }

    const updatedDeck: Deck = {
      ...activeDeck,
      cards: updatedCards,
      updatedAt: Date.now(),
    };
    onUpdateDecks(decks.map((d) => (d.id === updatedDeck.id ? updatedDeck : d)));
  };

  // Remove card entirely from deck
  const handleRemoveCard = (itemIndex: number) => {
    if (!activeDeck) return;
    const updatedCards = activeDeck.cards.filter((_, idx) => idx !== itemIndex);
    const updatedDeck: Deck = {
      ...activeDeck,
      cards: updatedCards,
      updatedAt: Date.now(),
    };
    onUpdateDecks(decks.map((d) => (d.id === updatedDeck.id ? updatedDeck : d)));
  };

  // Export decklist as standard universal text format
  const getDecklistText = () => {
    if (!activeDeck) return '';
    return activeDeck.cards.map((c) => `${c.count} ${c.name}`).join('\n');
  };

  const handleCopyDecklist = () => {
    const text = getDecklistText();
    navigator.clipboard.writeText(text);
    showToast('Decklist copiada para a área de transferência!');
  };

  const handleDownloadDecklist = () => {
    if (!activeDeck) return;
    const text = getDecklistText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${activeDeck.name.replace(/\s+/g, '_')}_decklist.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast('Arquivo de decklist baixado com sucesso!');
  };

  // Import decklist from text (STRICT: Only cards owned in collection are added)
  const handleImportTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeck || !importText.trim()) return;

    const lines = importText.split('\n');
    const newItems: DeckCardItem[] = [];
    let skippedCount = 0;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) return;

      const match = trimmed.match(/^(\d+)[xX]?\s+(.+)$/);
      let count = 1;
      let cardName = trimmed;
      if (match) {
        count = parseInt(match[1], 10) || 1;
        cardName = match[2].trim();
      }

      // STRICT RULE: Only cards present in collection (binders or loose) can be added to decks
      const key = `${activeDeck.game}:${cardName.toLowerCase()}`;
      const inv = userInventoryMap.get(key);

      if (!inv || inv.totalOwned <= 0) {
        skippedCount++;
        return;
      }

      const effectiveCount = Math.min(count, inv.totalOwned, 4);

      newItems.push({
        id: `import-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        cardId: inv.card.id,
        name: inv.card.name,
        game: activeDeck.game,
        imageUrl: inv.card.imageUrl,
        finish: inv.card.finish,
        setName: inv.card.setName,
        collectorNumber: inv.card.collectorNumber,
        rarity: inv.card.rarity,
        sourceType: inv.sources[0]?.type || 'loose',
        count: effectiveCount,
        category: 'main',
      });
    });

    const updatedDeck: Deck = {
      ...activeDeck,
      cards: [...activeDeck.cards, ...newItems],
      updatedAt: Date.now(),
    };
    onUpdateDecks(decks.map((d) => (d.id === updatedDeck.id ? updatedDeck : d)));
    setIsImportModalOpen(false);
    setImportText('');

    if (skippedCount > 0) {
      showToast(
        `${newItems.length} tipo(s) de cartas importadas! (${skippedCount} ignoradas por não constarem na sua coleção).`
      );
    } else {
      showToast(`${newItems.length} tipos de cartas importadas para o deck com sucesso!`);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* View 1: Decks Shelf / Management List */}
      {!activeDeck ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <Swords className="w-6 h-6 text-indigo-400" />
                <span>Decks</span>
              </h1>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateDeck}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Deck</span>
            </button>
          </div>

          {/* Decks Grid */}
          {decks.length === 0 ? (
            <div className="bg-[#121624] border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <Swords className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Nenhum deck criado ainda</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Crie seu primeiro deck escolhendo um dos 5 jogos suportados e adicione cartas dos seus fichários e coleção avulsa!
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreateDeck}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer"
              >
                Criar Meu Primeiro Deck
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {decks.map((deck) => {
                const totalCards = deck.cards.reduce((sum, c) => sum + (c.count || 1), 0);
                const limits = GAME_DECK_LIMITS[deck.game] || { min: 60, max: 60 };
                const isComplete = totalCards >= limits.min && totalCards <= limits.max;

                return (
                  <div
                    key={deck.id}
                    className="bg-[#131724] border border-slate-800 hover:border-indigo-500/50 rounded-xl overflow-hidden shadow-lg transition-all group flex flex-col justify-between"
                  >
                    {/* Deck Cover / Header */}
                    <div
                      onClick={() => setSelectedDeckId(deck.id)}
                      className="h-32 w-full bg-gradient-to-br from-slate-900 to-indigo-950/60 relative cursor-pointer overflow-hidden p-3 flex flex-col justify-between"
                    >
                      {deck.coverImageUrl && deck.coverImageUrl.trim() !== '' && (
                        <img
                          src={deck.coverImageUrl.trim()}
                          alt={deck.name}
                          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-bold tracking-wider rounded bg-black/60 border border-white/10 text-white backdrop-blur-xs">
                          {deck.game}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                            isComplete
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {totalCards} cartas
                        </span>
                      </div>

                      <div className="relative z-10">
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {deck.name}
                        </h3>
                        {deck.description && (
                          <p className="text-[11px] text-slate-300 line-clamp-1 opacity-80">{deck.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Deck Bottom Bar */}
                    <div className="p-3 bg-[#0f131f] border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {deck.cards.length} cartas distintas
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateDeck(deck)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Duplicar deck"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditDeck(deck)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar informações"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDeck(deck.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Excluir deck"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedDeckId(deck.id)}
                          className="ml-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
                        >
                          Abrir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* View 2: Deck Construction Workspace */
        <div className="space-y-6">
          {/* Deck Top Header */}
          <div className="bg-[#121624] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedDeckId(null)}
                className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-700/80 rounded-xl transition-colors cursor-pointer"
                title="Voltar para a lista de decks"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-bold tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {activeDeck.game}
                  </span>
                  <h2 className="text-xl font-black text-white">{activeDeck.name}</h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeDeck.description || 'Deck personalizado construído no BinderDex'}
                </p>
              </div>
            </div>

            {/* Actions: Export, Import, Edit */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopyDecklist}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors cursor-pointer"
                title="Copiar decklist em texto"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Lista</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadDecklist}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors cursor-pointer"
                title="Baixar arquivo TXT da decklist"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar (.txt)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors cursor-pointer"
                title="Importar decklist em texto"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar Lista</span>
              </button>
            </div>
          </div>

          {/* Deck Validation Status Banner */}
          <div className="bg-[#131724] border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Status do Deck:</span>
              <span className="font-bold text-white font-mono text-sm">
                {totalDeckCardsCount} cartas
              </span>
              <span className="text-slate-500 font-mono">
                ({GAME_DECK_LIMITS[activeDeck.game]?.label || 'Deck'})
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="text-slate-400">
                Cartas únicas: <strong className="text-white">{activeDeck.cards.length}</strong>
              </span>
              <span className="text-slate-400">
                Foils no deck:{' '}
                <strong className="text-amber-300">
                  {activeDeck.cards.filter((c) => c.finish !== 'normal').reduce((sum, c) => sum + c.count, 0)}
                </strong>
              </span>
            </div>
          </div>

          {/* Two-Column Layout: Decklist on Left, Collection Drawer on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: Current Deck Cards (7 cols) */}
            <div className="lg:col-span-7 bg-[#121624] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Cartas no Deck ({totalDeckCardsCount})</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Limite: até {GAME_DECK_LIMITS[activeDeck.game]?.maxCopiesPerCard || 4} cópias de cada
                </span>
              </div>

              {activeDeck.cards.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
                  <p className="text-xs text-slate-400">Seu deck está vazio no momento.</p>
                  <p className="text-[11px] text-slate-500">
                    Use o painel à direita para adicionar cartas da sua coleção (fichários e avulsas)!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
                  {activeDeck.cards.map((item, idx) => {
                    const key = `${item.game}:${item.name.toLowerCase()}`;
                    const inv = userInventoryMap.get(key);
                    const totalOwned = inv ? inv.totalOwned : 0;
                    const isFoil = item.finish !== 'normal';
                    const hasEnoughCopies = totalOwned >= item.count;

                    return (
                      <div
                        key={item.id}
                        className="bg-[#161a28] border border-slate-800 hover:border-slate-700/80 rounded-xl p-2.5 flex items-center justify-between gap-3 transition-colors"
                      >
                        {/* Thumbnail & Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            onClick={() => onViewCard(item as any)}
                            className={`w-10 h-14 rounded overflow-hidden bg-black/60 shrink-0 cursor-pointer ${
                              isFoil ? 'holo-foil' : ''
                            }`}
                          >
                            {item.imageUrl && item.imageUrl.trim() !== '' ? (
                              <img
                                src={item.imageUrl.trim()}
                                alt={item.name}
                                className="w-full h-full object-cover pointer-events-none"
                              />
                            ) : (
                              <div className="w-full h-full p-1 bg-slate-900 flex flex-col justify-center items-center text-[8px] text-slate-400">
                                <span>CARD</span>
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4
                                onClick={() => onViewCard(item as any)}
                                className="text-xs font-bold text-white hover:text-indigo-400 cursor-pointer truncate"
                              >
                                {item.name}
                              </h4>
                              {isFoil && <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />}
                            </div>

                            <p className="text-[10px] text-slate-400 truncate">
                              {item.setName} &middot; {item.collectorNumber || '—'}
                            </p>

                            {/* Inventory presence badge */}
                            <div className="flex items-center gap-1.5 mt-1">
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${
                                  hasEnoughCopies
                                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                                    : 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                                }`}
                                title={inv?.sources.map((s) => `${s.name}: ${s.count}x`).join(' | ')}
                              >
                                <BookOpen className="w-2.5 h-2.5" />
                                <span>
                                  Na coleção: {totalOwned}x (No deck: {item.count}x)
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls & Remove */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleAdjustCount(idx, -1)}
                              className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                              title="Diminuir quantidade"
                            >
                              -
                            </button>
                            <span className="w-7 text-center font-mono font-bold text-xs text-white">
                              {item.count}x
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustCount(idx, 1)}
                              className="w-6 h-6 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                              title="Aumentar quantidade"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveCard(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Remover do deck"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT: User Collection Drawer to Add Cards (5 cols) - STRICTLY ONLY OWNED CARDS */}
            <div className="lg:col-span-5 bg-[#121624] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Sua Coleção ({activeDeck.game})</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {collectionCardsForDeck.length} disponíveis
                </span>
              </div>

              {/* Search Inside Collection */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar na sua coleção..."
                  value={collectionSearchTerm}
                  onChange={(e) => setCollectionSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                {collectionSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setCollectionSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Collection Cards List with 1-click + Add */}
              {collectionCardsForDeck.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
                  <p className="text-xs text-slate-400">
                    Nenhuma carta deste jogo na sua coleção (fichários ou avulsas).
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Adicione cartas aos seus fichários ou como avulsas para poder incluí-las nos decks.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                  {collectionCardsForDeck.map((item) => {
                    const isFoil = item.card.finish !== 'normal';

                    return (
                      <div
                        key={item.key}
                        className="bg-[#151927] border border-slate-800/80 rounded-xl p-2 flex items-center justify-between gap-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            onClick={() => onViewCard(item.card)}
                            className={`w-8 h-11 rounded overflow-hidden bg-black/60 shrink-0 cursor-pointer ${
                              isFoil ? 'holo-foil' : ''
                            }`}
                          >
                            {item.card.imageUrl && item.card.imageUrl.trim() !== '' ? (
                              <img
                                src={item.card.imageUrl.trim()}
                                alt={item.card.name}
                                className="w-full h-full object-cover pointer-events-none"
                              />
                            ) : (
                              <div className="w-full h-full p-1 bg-slate-900 flex items-center justify-center text-[7px] text-slate-500">
                                CARD
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p
                              onClick={() => onViewCard(item.card)}
                              className="text-xs font-bold text-white hover:text-indigo-400 cursor-pointer truncate"
                            >
                              {item.card.name}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {item.card.setName} &middot; {item.card.collectorNumber || '—'}
                            </p>
                            <span className="text-[9px] text-slate-500 font-mono">
                              Possui: {item.totalOwned}x | No Deck: {item.usedInDeck}x
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddCardToDeck(item.card, 'binder')}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
                          title="Adicionar ao deck"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create / Edit Deck */}
      {isDeckModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#131724] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f131f]">
              <h3 className="text-base font-bold text-white">
                {editingDeck ? 'Editar Informações do Deck' : 'Criar Novo Deck'}
              </h3>
              <button
                type="button"
                onClick={() => setIsDeckModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeck} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Deck *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Charizard ex Turbo, Azorius Control, Digimon Beelzemon..."
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Jogo *</label>
                <select
                  disabled={Boolean(editingDeck)}
                  value={deckGame}
                  onChange={(e) => setDeckGame(e.target.value as CardGame)}
                  className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                >
                  {SUPPORTED_GAMES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição / Notas</label>
                <textarea
                  rows={2}
                  placeholder="Notas estratégicas, formato (Standard, Modern, Commander, etc.)..."
                  value={deckDescription}
                  onChange={(e) => setDeckDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  URL da Capa do Deck (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={deckCover}
                  onChange={(e) => setDeckCover(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeckModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {editingDeck ? 'Salvar Alterações' : 'Criar Deck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Import Decklist Text */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#131724] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f131f]">
              <h3 className="text-base font-bold text-white">Importar Lista de Cartas</h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportTextSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-400">
                Cole sua lista em formato de texto (ex: <code>4 Lightning Bolt</code> ou <code>1 Charizard ex</code>). Apenas cartas que você já possui na sua coleção (fichários ou avulsas) serão importadas para o deck.
              </p>

              <textarea
                rows={8}
                required
                placeholder="4 Lightning Bolt&#10;2 Counterspell&#10;1 Black Lotus"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
                >
                  Processar e Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
