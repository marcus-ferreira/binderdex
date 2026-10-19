import React, { useState, useMemo, useEffect } from 'react';
import {
  Trophy,
  Search,
  Filter,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Layers,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { Binder, CardGame, SUPPORTED_GAMES } from '../types/binder';
import {
  calculateAllCollectionsProgress,
  CollectionProgressItem,
} from '../services/collectionProgress';
import { searchCards, ApiCardResult } from '../services/cardApi';

interface CollectionProgressViewProps {
  binders: Binder[];
}

const GAME_BADGE_COLORS: Record<CardGame, { bg: string; text: string; border: string }> = {
  pokemon: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  magic: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  yugioh: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  digimon: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  battlescenes: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
};

type FilterStatus = 'all' | 'owned' | 'missing';

export const CollectionProgressView: React.FC<CollectionProgressViewProps> = ({ binders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState<CardGame | 'all'>('all');
  const [selectedCollection, setSelectedCollection] = useState<CollectionProgressItem | null>(null);

  // Cards inside the currently selected collection
  const [setCards, setSetCards] = useState<ApiCardResult[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [cardsFilterStatus, setCardsFilterStatus] = useState<FilterStatus>('all');
  const [cardSearchQuery, setCardSearchQuery] = useState('');

  // Calculate overall collections progress across binders
  const allProgress = useMemo(() => {
    return calculateAllCollectionsProgress(binders);
  }, [binders]);

  // Filtered collections list
  const filteredCollections = useMemo(() => {
    return allProgress.filter((item) => {
      if (selectedGame !== 'all' && item.game !== selectedGame) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          item.setName.toLowerCase().includes(q) ||
          item.cleanSetName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allProgress, selectedGame, searchTerm]);

  // Overall statistics
  const totalSetsCount = allProgress.length;
  const completedSetsCount = allProgress.filter((p) => p.percentage === 100).length;
  const totalUniqueCardsOwned = allProgress.reduce((acc, curr) => acc + curr.ownedUniqueCount, 0);
  const totalAllCardsOwned = allProgress.reduce((acc, curr) => acc + curr.totalCardsOwned, 0);

  // When a collection is selected, fetch all cards belonging to that collection
  useEffect(() => {
    if (!selectedCollection) {
      setSetCards([]);
      setIsLoadingCards(false);
      return;
    }

    let isMounted = true;
    setIsLoadingCards(true);
    setCardsFilterStatus('all');
    setCardSearchQuery('');

    const targetSet = selectedCollection.cleanSetName || selectedCollection.setName;

    searchCards(selectedCollection.game, '', targetSet)
      .then((results) => {
        if (!isMounted) return;

        // Sort by rawNumber / collectorNumber ascending
        const sorted = [...results].sort((a, b) => {
          if (a.rawNumber && b.rawNumber) return a.rawNumber - b.rawNumber;
          return a.collectorNumber.localeCompare(b.collectorNumber, undefined, { numeric: true });
        });

        setSetCards(sorted);
        setIsLoadingCards(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error loading set cards:', err);
        setIsLoadingCards(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCollection]);

  // Set of owned identifiers for quick lookup in detail view
  const { ownedNumbers, ownedNames } = useMemo(() => {
    if (!selectedCollection) {
      return { ownedNumbers: new Set<string>(), ownedNames: new Set<string>() };
    }

    const nums = new Set<string>();
    const names = new Set<string>();

    selectedCollection.cards.forEach((c) => {
      if (c.collectorNumber) {
        nums.add(c.collectorNumber.trim().toLowerCase());
        // Also add without '#' prefix
        nums.add(c.collectorNumber.replace(/^#/, '').trim().toLowerCase());
      }
      if (c.name) {
        names.add(c.name.trim().toLowerCase());
      }
    });

    return { ownedNumbers: nums, ownedNames: names };
  }, [selectedCollection]);

  // Helper to check if a card is registered/owned
  const isCardOwned = (card: ApiCardResult): boolean => {
    if (card.collectorNumber) {
      const trimmed = card.collectorNumber.trim().toLowerCase();
      const raw = card.collectorNumber.replace(/^#/, '').trim().toLowerCase();
      if (ownedNumbers.has(trimmed) || ownedNumbers.has(raw)) return true;
    }
    if (card.name && ownedNames.has(card.name.trim().toLowerCase())) {
      return true;
    }
    return false;
  };

  // Filter cards in collection detail
  const visibleCards = useMemo(() => {
    return setCards.filter((c) => {
      const owned = isCardOwned(c);
      if (cardsFilterStatus === 'owned' && !owned) return false;
      if (cardsFilterStatus === 'missing' && owned) return false;
      if (cardSearchQuery.trim()) {
        const q = cardSearchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.collectorNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [setCards, cardsFilterStatus, cardSearchQuery, ownedNumbers, ownedNames]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* View 1: Collections Overview List (when no collection is selected) */}
      {!selectedCollection ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <Trophy className="w-6 h-6 text-amber-400" />
                <span>Progresso das Coleções</span>
              </h1>
            </div>
          </div>

          {/* Top Summary Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#131724] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400">Coleções Iniciadas</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-white tracking-tight font-mono">
                  {totalSetsCount}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">expansões</span>
              </div>
            </div>

            <div className="bg-[#131724] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400">Cartas Únicas Registradas</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-emerald-400 tracking-tight font-mono">
                  {totalUniqueCardsOwned}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">únicas</span>
              </div>
            </div>

            <div className="bg-[#131724] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400">Total com Cópias</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-indigo-400 tracking-tight font-mono">
                  {totalAllCardsOwned}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">nos bolsos</span>
              </div>
            </div>

            <div className="bg-[#131724] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400">100% Completas</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-amber-400 tracking-tight font-mono">
                  {completedSetsCount}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">concluídas</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-[#131724] border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* Search Bar */}
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar coleção por nome (ex: Base Set, Jungle, Foundations)..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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

              {/* Game Filter */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2">
                <Filter className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value as CardGame | 'all')}
                  className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">Todos os Jogos</option>
                  {SUPPORTED_GAMES.map((g) => (
                    <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Collections List */}
          {filteredCollections.length === 0 ? (
            <div className="bg-[#121624] border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {totalSetsCount === 0 ? 'Nenhuma coleção registrada ainda' : 'Nenhuma coleção encontrada'}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  {totalSetsCount === 0
                    ? 'Adicione cartas aos seus fichários para que o BinderDex calcule automaticamente o progresso e as cartas que faltam para completar cada coleção.'
                    : 'Nenhuma coleção corresponde aos filtros ativos. Tente alterar o jogo ou termo de busca.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCollections.map((col) => {
                const badge = GAME_BADGE_COLORS[col.game] || GAME_BADGE_COLORS.pokemon;
                const isComplete = col.percentage === 100;

                return (
                  <div
                    key={`${col.game}-${col.setName}`}
                    onClick={() => setSelectedCollection(col)}
                    className="bg-[#131724] border border-slate-800 hover:border-indigo-500/60 rounded-2xl p-4.5 flex flex-col justify-between group transition-all hover:shadow-xl hover:shadow-indigo-950/20 hover:-translate-y-0.5 cursor-pointer"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {col.game}
                        </span>
                        {col.year && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {col.year}
                          </span>
                        )}
                        {isComplete ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded ml-auto">
                            <Sparkles className="w-3 h-3" />
                            100% Completa
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-indigo-400 font-bold ml-auto">
                            {col.percentage}%
                          </span>
                        )}
                      </div>

                      {/* Collection Title */}
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {col.cleanSetName || col.setName}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {col.totalInSet > 0
                          ? `Possui ${col.ownedUniqueCount} de ${col.totalInSet} cartas do ${col.cleanSetName || col.setName}`
                          : `${col.ownedUniqueCount} cartas catalogadas`}
                      </p>

                      {/* Progress Bar */}
                      <div className="mt-3.5">
                        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isComplete
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
                            }`}
                            style={{ width: `${Math.max(col.percentage, col.ownedUniqueCount > 0 ? 3 : 0)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Details & Action */}
                    <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                        {col.totalInSet > 0 && col.missingCount > 0 ? (
                          <span>
                            Faltam <strong className="text-amber-400 font-bold">{col.missingCount}</strong> cartas
                          </span>
                        ) : isComplete ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Coleção completa!
                          </span>
                        ) : (
                          <span>{col.totalCardsOwned} cópias nos fichários</span>
                        )}
                      </div>

                      <span className="text-indigo-400 group-hover:text-indigo-300 font-semibold text-xs flex items-center gap-1 transition-colors">
                        Ver cartas →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* View 2: Collection Detail Cards View (when a specific collection is clicked) */
        <div className="space-y-6">
          {/* Top Bar with Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedCollection(null)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500 transition-colors text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para Coleções</span>
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold rounded border ${GAME_BADGE_COLORS[selectedCollection.game]?.bg} ${GAME_BADGE_COLORS[selectedCollection.game]?.text} ${GAME_BADGE_COLORS[selectedCollection.game]?.border}`}>
                    {selectedCollection.game}
                  </span>
                  {selectedCollection.year && (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {selectedCollection.year}
                    </span>
                  )}
                  <h2 className="text-xl font-black text-white tracking-tight">
                    {selectedCollection.cleanSetName || selectedCollection.setName}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Progress Card */}
          <div className="bg-[#131724] border border-slate-800/80 rounded-2xl p-4.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-300 font-medium">
                Progresso de cartas catalogadas nos fichários para esta coleção:
              </span>
              <div className="font-mono text-xs text-slate-300">
                Possui <strong className="text-emerald-400 font-bold">{selectedCollection.ownedUniqueCount}</strong> de{' '}
                <strong className="text-white font-bold">{selectedCollection.totalInSet}</strong> cartas (
                <strong className="text-indigo-400 font-bold">{selectedCollection.percentage}%</strong>)
              </div>
            </div>

            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-emerald-400 to-amber-400 transition-all duration-300"
                style={{ width: `${Math.max(selectedCollection.percentage, selectedCollection.ownedUniqueCount > 0 ? 3 : 0)}%` }}
              />
            </div>
          </div>

          {/* Cards Filter & Search Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121624] border border-slate-800 rounded-xl p-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setCardsFilterStatus('all')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  cardsFilterStatus === 'all'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todas ({setCards.length})
              </button>
              <button
                type="button"
                onClick={() => setCardsFilterStatus('owned')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  cardsFilterStatus === 'owned'
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Registradas ({selectedCollection.ownedUniqueCount})
              </button>
              <button
                type="button"
                onClick={() => setCardsFilterStatus('missing')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  cardsFilterStatus === 'missing'
                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Faltando ({selectedCollection.missingCount})
              </button>
            </div>

            {/* In-Collection Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={cardSearchQuery}
                onChange={(e) => setCardSearchQuery(e.target.value)}
                placeholder="Filtrar por nome ou número..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-7 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {cardSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCardSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Cards Gallery */}
          {isLoadingCards ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <span className="text-xs text-slate-400 font-mono">
                Carregando cartas oficiais de {selectedCollection.cleanSetName || selectedCollection.setName}...
              </span>
            </div>
          ) : visibleCards.length === 0 ? (
            <div className="py-16 text-center bg-[#131724] border border-dashed border-slate-800 rounded-2xl space-y-2">
              <p className="text-sm font-semibold text-slate-300">
                Nenhuma carta encontrada para este filtro.
              </p>
              <p className="text-xs text-slate-500">
                Tente selecionar &quot;Todas&quot; ou limpar a busca.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
              {visibleCards.map((card) => {
                const owned = isCardOwned(card);

                return (
                  <div
                    key={card.apiId || `${card.name}-${card.collectorNumber}`}
                    className="relative rounded-xl p-2 flex flex-col justify-between transition-all select-none pointer-events-none cursor-default bg-[#121624]/60"
                  >

                    {/* Card Image: Colorful if owned, Grayscale Black & White if missing */}
                    <div className="aspect-[5/7] rounded-lg overflow-hidden bg-black/60 relative mb-2 flex items-center justify-center">
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt={card.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-contain pointer-events-none select-none transition-all duration-200 ${
                            owned
                              ? 'filter-none opacity-100'
                              : 'filter grayscale contrast-90 opacity-60'
                          }`}
                        />
                      ) : (
                        <div className="text-center p-3">
                          <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center mx-auto mb-1 text-[10px] font-mono font-bold text-slate-400">
                            {card.game.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {card.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Info Details */}
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="font-bold text-slate-300">
                          {card.collectorNumber || '—'}
                        </span>
                        <span className="truncate max-w-[60%] text-slate-500">
                          {card.rarity || 'Comum'}
                        </span>
                      </div>
                      <h4
                        className={`text-xs font-bold truncate leading-tight ${
                          owned ? 'text-white' : 'text-slate-400'
                        }`}
                        title={card.name}
                      >
                        {card.name}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
