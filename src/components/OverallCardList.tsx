import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Layers,
  Sparkles,
  BookOpen,
  Package,
  ArrowRight,
  Trash2,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Binder, BinderCard, LooseCard, CardGame, CardFinish, SUPPORTED_GAMES } from '../types/binder';
import { CardSearchModal } from './CardSearchModal';

interface OverallCardListProps {
  binders: Binder[];
  looseCards: LooseCard[];
  onUpdateLooseCards: (cards: LooseCard[]) => void;
  onNavigateToBinder: (binderId: string, slotIndex?: number) => void;
  onViewCard: (card: BinderCard, slotIndex?: number | null) => void;
  onAddCardToDeck?: (card: BinderCard, count?: number) => void;
  onDeleteCard?: (item: AggregateCardItem) => void;
  showToast: (msg: string) => void;
}

export interface AggregateCardItem {
  id: string;
  sourceType: 'binder' | 'loose';
  card: BinderCard;
  quantity: number;
  binderId?: string;
  binderTitle?: string;
  slotIndex?: number;
  pageNumber?: number;
  notes?: string;
}

const GAME_BADGE_COLORS: Record<CardGame, { bg: string; text: string; border: string }> = {
  pokemon: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  magic: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  yugioh: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  digimon: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  battlescenes: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
};

export const OverallCardList: React.FC<OverallCardListProps> = ({
  binders,
  looseCards,
  onUpdateLooseCards,
  onNavigateToBinder,
  onViewCard,
  onAddCardToDeck,
  onDeleteCard,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState<CardGame | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<'all' | 'binder' | 'loose'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name-asc' | 'name-desc' | 'game' | 'set'>('recent');

  // Modal to add new loose cards via API search
  const [isAddLooseModalOpen, setIsAddLooseModalOpen] = useState(false);
  const [addGame, setAddGame] = useState<CardGame>('pokemon');

  // Modal to move loose card to binder
  const [moveToBinderCard, setMoveToBinderCard] = useState<LooseCard | null>(null);

  // Flatten all cards from binders and loose cards
  const allAggregateCards = useMemo(() => {
    const list: AggregateCardItem[] = [];

    // 1. From Binders
    binders.forEach((binder) => {
      Object.entries(binder.cards).forEach(([slotStr, card]) => {
        const slotIdx = Number(slotStr);
        list.push({
          id: `binder-${binder.id}-${slotIdx}-${card.id}`,
          sourceType: 'binder',
          card,
          quantity: 1,
          binderId: binder.id,
          binderTitle: binder.title,
          slotIndex: slotIdx,
          pageNumber: Math.floor(slotIdx / 9) + 1,
        });
      });
    });

    // 2. From Loose Cards
    looseCards.forEach((loose) => {
      list.push({
        id: `loose-${loose.id}`,
        sourceType: 'loose',
        card: loose,
        quantity: loose.quantity || 1,
        notes: loose.notes,
      });
    });

    return list;
  }, [binders, looseCards]);

  // Overall Statistics
  const totalPhysicalCards = useMemo(() => {
    let binderCount = 0;
    binders.forEach((b) => {
      binderCount += Object.keys(b.cards).length;
    });
    let looseCount = 0;
    looseCards.forEach((l) => {
      looseCount += l.quantity || 1;
    });
    return {
      total: binderCount + looseCount,
      binders: binderCount,
      loose: looseCount,
    };
  }, [binders, looseCards]);

  const uniqueCardsCount = useMemo(() => {
    const names = new Set<string>();
    allAggregateCards.forEach((item) => names.add(`${item.card.game}:${item.card.name}`));
    return names.size;
  }, [allAggregateCards]);

  // Filtering
  const filteredCards = useMemo(() => {
    return allAggregateCards.filter((item) => {
      // Game filter
      if (selectedGame !== 'all' && item.card.game !== selectedGame) return false;

      // Source filter
      if (selectedSource === 'binder' && item.sourceType !== 'binder') return false;
      if (selectedSource === 'loose' && item.sourceType !== 'loose') return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = item.card.name.toLowerCase().includes(query);
        const matchSet = item.card.setName?.toLowerCase().includes(query);
        const matchNumber = item.card.collectorNumber?.toLowerCase().includes(query);
        const matchBinder = item.binderTitle?.toLowerCase().includes(query);
        if (!matchName && !matchSet && !matchNumber && !matchBinder) return false;
      }

      return true;
    });
  }, [allAggregateCards, selectedGame, selectedSource, searchTerm]);

  // Sorting
  const sortedCards = useMemo(() => {
    const list = [...filteredCards];
    list.sort((a, b) => {
      if (sortBy === 'recent') {
        return (b.card.addedAt || 0) - (a.card.addedAt || 0);
      }
      if (sortBy === 'name-asc') {
        return a.card.name.localeCompare(b.card.name);
      }
      if (sortBy === 'name-desc') {
        return b.card.name.localeCompare(a.card.name);
      }
      if (sortBy === 'game') {
        return a.card.game.localeCompare(b.card.game);
      }
      if (sortBy === 'set') {
        return (a.card.setName || '').localeCompare(b.card.setName || '');
      }
      return 0;
    });
    return list;
  }, [filteredCards, sortBy]);

  // Handlers for loose cards
  const handleIncreaseLooseQuantity = (looseId: string) => {
    const updated = looseCards.map((c) => (c.id === looseId ? { ...c, quantity: c.quantity + 1 } : c));
    onUpdateLooseCards(updated);
    showToast('Quantidade atualizada (+1)');
  };

  const handleDecreaseLooseQuantity = (looseId: string) => {
    const card = looseCards.find((c) => c.id === looseId);
    if (!card) return;
    if (card.quantity <= 1) {
      const updated = looseCards.filter((c) => c.id !== looseId);
      onUpdateLooseCards(updated);
      showToast('Carta removida das avulsas.');
    } else {
      const updated = looseCards.map((c) => (c.id === looseId ? { ...c, quantity: c.quantity - 1 } : c));
      onUpdateLooseCards(updated);
      showToast('Quantidade reduzida (-1)');
    }
  };

  const handleDeleteLooseCard = (looseId: string) => {
    const updated = looseCards.filter((c) => c.id !== looseId);
    onUpdateLooseCards(updated);
    showToast('Carta removida das avulsas.');
  };

  // Handle adding new loose cards from CardSearchModal
  const handleAddLooseCardsFromApi = (newCards: BinderCard[]) => {
    if (newCards.length === 0) return;

    const currentMap = new Map<string, LooseCard>();
    looseCards.forEach((c) => {
      const key = `${c.game}:${c.name}:${c.setName}:${c.collectorNumber}:${c.finish}`;
      currentMap.set(key, { ...c });
    });

    newCards.forEach((c) => {
      const key = `${c.game}:${c.name}:${c.setName}:${c.collectorNumber}:${c.finish}`;
      if (currentMap.has(key)) {
        const existing = currentMap.get(key)!;
        existing.quantity += 1;
      } else {
        currentMap.set(key, {
          ...c,
          quantity: 1,
        });
      }
    });

    const nextLooseList = Array.from(currentMap.values());
    onUpdateLooseCards(nextLooseList);
    showToast(`${newCards.length} carta(s) adicionada(s) à coleção geral!`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-400" />
            <span>Coleção Geral</span>
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setIsAddLooseModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Carta Avulsa</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-[#131724] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Total de Cartas</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-white">{totalPhysicalCards.total}</span>
            <span className="text-[10px] text-slate-500 font-mono">unidades</span>
          </div>
        </div>

        <div className="bg-[#131724] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Cartas Únicas</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-indigo-400">{uniqueCardsCount}</span>
            <span className="text-[10px] text-slate-500 font-mono">distintas</span>
          </div>
        </div>

        <div className="bg-[#131724] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Nos Fichários</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-emerald-400">{totalPhysicalCards.binders}</span>
            <span className="text-[10px] text-slate-500 font-mono">em bolsos</span>
          </div>
        </div>

        <div className="bg-[#131724] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Avulsas (Fora)</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-amber-400">{totalPhysicalCards.loose}</span>
            <span className="text-[10px] text-slate-500 font-mono">fora de fichário</span>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121624] border border-slate-800 rounded-xl p-4 space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome, coleção, número (#10) ou nome do fichário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-900 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Location Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 shrink-0 text-xs font-medium">
            <button
              type="button"
              onClick={() => setSelectedSource('all')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                selectedSource === 'all'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setSelectedSource('binder')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedSource === 'binder'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Fichários</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSource('loose')}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedSource === 'loose'
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3 h-3" />
              <span>Avulsas</span>
            </button>
          </div>

          {/* Sort selector */}
          <div className="shrink-0 flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs bg-slate-900 border border-slate-700/80 rounded-lg text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="recent">Mais Recentes</option>
              <option value="name-asc">Nome (A - Z)</option>
              <option value="name-desc">Nome (Z - A)</option>
              <option value="game">Por Jogo</option>
              <option value="set">Por Coleção</option>
            </select>
          </div>
        </div>

        {/* Game Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Jogo:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedGame('all')}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer shrink-0 font-medium ${
              selectedGame === 'all'
                ? 'bg-white text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todos os Jogos
          </button>

          {SUPPORTED_GAMES.map((gameOpt) => {
            const isSelected = selectedGame === gameOpt.id;
            return (
              <button
                key={gameOpt.id}
                type="button"
                onClick={() => setSelectedGame(gameOpt.id)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer shrink-0 font-medium ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {gameOpt.label}
              </button>
            );
          })}

        </div>
      </div>

      {/* Cards Grid */}
      {sortedCards.length === 0 ? (
        <div className="bg-[#121624] border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Nenhuma carta encontrada</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Nenhuma carta corresponde aos filtros ativos. Tente alterar o jogo, limpar o termo de busca ou cadastrar novas cartas avulsas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedGame('all');
              setSelectedSource('all');
            }}
            className="px-4 py-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 border border-indigo-800/60 rounded-xl transition-colors cursor-pointer"
          >
            Limpar Todos os Filtros
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Mostrando <strong className="text-white">{sortedCards.length}</strong> registro{sortedCards.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {sortedCards.map((item) => {
              const badgeStyle = GAME_BADGE_COLORS[item.card.game] || GAME_BADGE_COLORS.pokemon;

              return (
                <div
                  key={item.id}
                  className="bg-[#131724] border border-slate-800 hover:border-slate-700/80 rounded-xl p-2.5 flex flex-col justify-between group transition-all hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5"
                >
                  {/* Card Visual / Thumbnail */}
                  <div
                    onClick={() => onViewCard(item.card, item.slotIndex ?? null)}
                    className="aspect-[5/7] rounded-lg overflow-hidden bg-black/60 relative cursor-pointer"
                  >
                    {item.card.imageUrl && item.card.imageUrl.trim() !== '' ? (
                      <img
                        src={item.card.imageUrl.trim()}
                        alt={item.card.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full p-2 flex flex-col justify-between bg-gradient-to-b from-slate-800 to-slate-950">
                        <span className="text-[9px] font-mono uppercase text-slate-400">{item.card.game}</span>
                        <p className="text-xs font-bold text-white line-clamp-3 leading-tight">{item.card.name}</p>
                        <span className="text-[9px] text-slate-400 truncate">{item.card.setName}</span>
                      </div>
                    )}

                    {/* Quick delete button on hover */}
                    {onDeleteCard && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCard(item);
                        }}
                        className="absolute top-1 left-1 z-30 p-1 rounded bg-black/80 hover:bg-rose-600 text-slate-300 hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md"
                        title={`Remover "${item.card.name}" da coleção`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}

                    {/* Loose Quantity Tag if > 1 */}
                    {item.sourceType === 'loose' && item.quantity > 1 && (
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-amber-600/90 text-white font-mono text-[10px] font-bold shadow">
                        x{item.quantity}
                      </span>
                    )}
                  </div>

                  {/* Card Details */}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold rounded border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} truncate`}
                      >
                        {item.card.game}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 truncate">
                        {item.card.collectorNumber || '—'}
                      </span>
                    </div>

                    <h4
                      onClick={() => onViewCard(item.card, item.slotIndex ?? null)}
                      className="text-xs font-bold text-white truncate cursor-pointer hover:text-indigo-400 transition-colors"
                      title={item.card.name}
                    >
                      {item.card.name}
                    </h4>

                    <p className="text-[10px] text-slate-400 truncate" title={item.card.setName}>
                      {item.card.setName || 'Coleção'}
                    </p>
                  </div>

                  {/* Location Tag / Action Button */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                    {item.sourceType === 'binder' ? (
                      <button
                        type="button"
                        onClick={() => onNavigateToBinder(item.binderId!, item.slotIndex)}
                        className="w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-300 text-[10px] font-medium transition-colors cursor-pointer group/btn"
                        title={`Ir para o fichário "${item.binderTitle}", Página ${item.pageNumber}`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <BookOpen className="w-3 h-3 shrink-0 text-emerald-400" />
                          <span className="truncate">{item.binderTitle}</span>
                        </div>
                        <span className="font-mono shrink-0 text-emerald-400 group-hover/btn:translate-x-0.5 transition-transform">
                          P.{item.pageNumber} →
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between gap-1 bg-amber-950/30 border border-amber-800/40 rounded-lg p-1">
                        <div className="flex items-center gap-1 pl-1 text-[10px] text-amber-300 font-medium">
                          <Package className="w-3 h-3 shrink-0" />
                          <span>Avulsa ({item.quantity})</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => handleDecreaseLooseQuantity(item.card.id)}
                            className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                            title="Diminuir quantidade"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => handleIncreaseLooseQuantity(item.card.id)}
                            className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                            title="Aumentar quantidade"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Card Search Modal for adding Loose Cards */}
      <CardSearchModal
        isOpen={isAddLooseModalOpen}
        onClose={() => setIsAddLooseModalOpen(false)}
        onSelectCards={handleAddLooseCardsFromApi}
        defaultGame={addGame}
        slotIndex={null}
        currentTotalSlots={999}
      />
    </div>
  );
};
