import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Layers,
  BookOpen,
  Trash2,
  SlidersHorizontal,
  LayoutGrid,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Binder, BinderCard, CardGame, SUPPORTED_GAMES, CARD_CONDITIONS, CARD_LANGUAGES, CardFinish, CARD_FINISHES } from '../types/binder';

export interface AggregateCardItem {
  id: string;
  card: BinderCard;
  binderId: string;
  binderTitle: string;
  slotIndex: number;
  pageNumber: number;
  pocketNumber: number;
}

interface OverallCardListProps {
  binders: Binder[];
  onNavigateToBinder: (binderId: string, slotIndex?: number) => void;
  onViewCard: (card: BinderCard, slotIndex?: number | null, binderId?: string | null) => void;
  onDeleteCard?: (item: AggregateCardItem) => void;
  onUpdateCardProperty?: (binderId: string, slotIndex: number, updatedFields: Partial<BinderCard>) => void;
  showToast: (msg: string) => void;
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
  onNavigateToBinder,
  onViewCard,
  onDeleteCard,
  onUpdateCardProperty,
}) => {
  // Persist view state to localStorage
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem('binderdex_overall_search') || '';
  });
  const [selectedGame, setSelectedGame] = useState<CardGame | 'all'>(() => {
    return (localStorage.getItem('binderdex_overall_game') as CardGame | 'all') || 'all';
  });
  const [selectedSet, setSelectedSet] = useState<string>(() => {
    return localStorage.getItem('binderdex_overall_set') || 'all';
  });
  const [sortBy, setSortBy] = useState<'recent' | 'name-asc' | 'name-desc' | 'number-asc' | 'number-desc' | 'game' | 'set' | 'binder'>(() => {
    return (localStorage.getItem('binderdex_overall_sort') as any) || 'recent';
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('binderdex_overall_view') as 'grid' | 'list') || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('binderdex_overall_search', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem('binderdex_overall_game', selectedGame);
  }, [selectedGame]);

  useEffect(() => {
    localStorage.setItem('binderdex_overall_set', selectedSet);
  }, [selectedSet]);

  useEffect(() => {
    localStorage.setItem('binderdex_overall_sort', sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem('binderdex_overall_view', viewMode);
  }, [viewMode]);

  // Aggregate all cards from all binders
  const allAggregateCards = useMemo(() => {
    const list: AggregateCardItem[] = [];

    binders.forEach((binder) => {
      Object.entries(binder.cards).forEach(([slotStr, card]) => {
        const slotIdx = Number(slotStr);
        const pageNumber = Math.floor(slotIdx / 9) + 1;
        const pocketNumber = (slotIdx % 9) + 1;
        list.push({
          id: `binder-${binder.id}-${slotIdx}-${card.id}`,
          card: {
            ...card,
            condition: card.condition || 'NM',
            language: card.language || 'PT',
          },
          binderId: binder.id,
          binderTitle: binder.title,
          slotIndex: slotIdx,
          pageNumber,
          pocketNumber,
        });
      });
    });

    return list;
  }, [binders]);

  // Dynamic set list based on selected game
  const availableSets = useMemo(() => {
    const setsSet = new Set<string>();
    allAggregateCards.forEach((item) => {
      if (selectedGame === 'all' || item.card.game === selectedGame) {
        if (item.card.setName) {
          setsSet.add(item.card.setName);
        }
      }
    });
    return Array.from(setsSet).sort();
  }, [allAggregateCards, selectedGame]);

  // Reset selectedSet if it's not in availableSets when game changes
  useEffect(() => {
    if (selectedSet !== 'all' && !availableSets.includes(selectedSet)) {
      setSelectedSet('all');
    }
  }, [selectedGame, availableSets, selectedSet]);

  // Overall statistics from binders
  const totalCardsCount = allAggregateCards.length;

  const uniqueCardsCount = useMemo(() => {
    const names = new Set<string>();
    allAggregateCards.forEach((item) => names.add(`${item.card.game}:${item.card.name}`));
    return names.size;
  }, [allAggregateCards]);

  const uniqueGamesCount = useMemo(() => {
    const games = new Set<string>();
    allAggregateCards.forEach((item) => games.add(item.card.game));
    return games.size;
  }, [allAggregateCards]);

  // Filtering
  const filteredCards = useMemo(() => {
    return allAggregateCards.filter((item) => {
      // Game filter
      if (selectedGame !== 'all' && item.card.game !== selectedGame) return false;

      // Set filter
      if (selectedSet !== 'all' && item.card.setName !== selectedSet) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = item.card.name.toLowerCase().includes(query);
        const matchSet = item.card.setName?.toLowerCase().includes(query);
        const matchNumber = item.card.collectorNumber?.toLowerCase().includes(query);
        const matchBinder = item.binderTitle?.toLowerCase().includes(query);
        const matchCondition = item.card.condition?.toLowerCase().includes(query);
        const matchLanguage = item.card.language?.toLowerCase().includes(query);
        if (!matchName && !matchSet && !matchNumber && !matchBinder && !matchCondition && !matchLanguage) return false;
      }

      return true;
    });
  }, [allAggregateCards, selectedGame, selectedSet, searchTerm]);

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
      if (sortBy === 'number-asc') {
        return (a.card.collectorNumber || '').localeCompare(b.card.collectorNumber || '', undefined, { numeric: true });
      }
      if (sortBy === 'number-desc') {
        return (b.card.collectorNumber || '').localeCompare(a.card.collectorNumber || '', undefined, { numeric: true });
      }
      if (sortBy === 'game') {
        return a.card.game.localeCompare(b.card.game);
      }
      if (sortBy === 'set') {
        return (a.card.setName || '').localeCompare(b.card.setName || '');
      }
      if (sortBy === 'binder') {
        return a.binderTitle.localeCompare(b.binderTitle);
      }
      return 0;
    });
    return list;
  }, [filteredCards, sortBy]);

  // Pagination (24 cards per page)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 24;

  // Reset to first page when search, filter, or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGame, selectedSet, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedCards.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedCards = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedCards.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedCards, currentPage]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-400" />
            <span>Coleção Geral</span>
          </h1>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#131724] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Total nos Fichários</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-white">{totalCardsCount}</span>
            <span className="text-[10px] text-slate-500 font-mono">cartas</span>
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
          <span className="text-[11px] font-medium text-slate-400">Fichários Cadastrados</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-emerald-400">{binders.length}</span>
            <span className="text-[10px] text-slate-500 font-mono">fichários</span>
          </div>
        </div>

        <div className="bg-[#131724] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-400">Jogos Ativos</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-amber-400">{uniqueGamesCount}</span>
            <span className="text-[10px] text-slate-500 font-mono">TCGs</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Dropdowns for Game, Collection/Set, Sort, and Text Search) */}
      <div className="bg-[#121624] border border-slate-800 rounded-xl p-4 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar nome, número (#10)..."
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

          {/* Game Dropdown Filter */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value as CardGame | 'all')}
              className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">Todos os Jogos</option>
              {SUPPORTED_GAMES.map((gameOpt) => (
                <option key={gameOpt.id} value={gameOpt.id} className="bg-slate-900 text-white">
                  {gameOpt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Collection / Set Dropdown Filter (filtered by selected game) */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <select
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">Todas as Coleções</option>
              {availableSets.map((setName) => (
                <option key={setName} value={setName} className="bg-slate-900 text-white">
                  {setName}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="recent" className="bg-slate-900 text-white">Mais Recentes</option>
              <option value="name-asc" className="bg-slate-900 text-white">Nome (A - Z)</option>
              <option value="name-desc" className="bg-slate-900 text-white">Nome (Z - A)</option>
              <option value="number-asc" className="bg-slate-900 text-white">Número (Asc)</option>
              <option value="number-desc" className="bg-slate-900 text-white">Número (Desc)</option>
              <option value="game" className="bg-slate-900 text-white">Por Jogo</option>
              <option value="set" className="bg-slate-900 text-white">Por Coleção</option>
              <option value="binder" className="bg-slate-900 text-white">Por Fichário</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cards View */}
      {sortedCards.length === 0 ? (
        <div className="bg-[#121624] border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {totalCardsCount === 0 ? 'Nenhuma carta nos fichários' : 'Nenhuma carta encontrada'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {totalCardsCount === 0
                ? 'Abra ou crie um fichário e adicione cartas aos bolsos para visualizá-las aqui na coleção geral.'
                : 'Nenhuma carta corresponde aos filtros ativos. Tente alterar os filtros ou limpar a busca.'}
            </p>
          </div>
          {totalCardsCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedGame('all');
                setSelectedSet('all');
              }}
              className="px-4 py-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 border border-indigo-800/60 rounded-xl transition-colors cursor-pointer"
            >
              Limpar Todos os Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top Bar above Cards: Count, Page info and Grade/Lista View Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 bg-[#121624] border border-slate-800 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                Mostrando <strong className="text-white">{sortedCards.length}</strong> carta{sortedCards.length > 1 ? 's' : ''} em fichários
              </span>
              {totalPages > 1 && (
                <span className="text-slate-500 font-mono text-[11px]">
                  • Página <strong className="text-indigo-400">{currentPage}</strong> de <strong className="text-slate-300">{totalPages}</strong> (24 por página)
                </span>
              )}
            </div>

            {/* Grid vs List View Mode Toggle - placed directly above table/grid */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Visualização em Grade com imagens"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grade</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Visualização em Lista sem imagens"
              >
                <ListIcon className="w-3.5 h-3.5" />
                <span>Lista</span>
              </button>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {paginatedCards.map((item) => {
                const badgeStyle = GAME_BADGE_COLORS[item.card.game] || GAME_BADGE_COLORS.pokemon;
                const finishClass =
                  item.card.finish === 'foil'
                    ? 'finish-foil'
                    : item.card.finish === 'holo'
                    ? 'finish-holo'
                    : item.card.finish === 'reverse'
                    ? 'finish-reverse'
                    : item.card.finish === 'secret'
                    ? 'finish-secret'
                    : '';
                const isFoil = Boolean(item.card.finish && item.card.finish !== 'normal');

                return (
                  <div
                    key={item.id}
                    className="bg-[#131724] border border-slate-800 hover:border-slate-700/80 rounded-xl p-2.5 flex flex-col justify-between group transition-all hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5"
                  >
                    {/* Card Visual / Thumbnail */}
                    <div
                      onClick={() => onViewCard(item.card, item.slotIndex, item.binderId)}
                      className={`aspect-[5/7] rounded-lg overflow-hidden bg-black/60 relative cursor-pointer ${finishClass}`}
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

                      {isFoil && (
                        <div className="absolute bottom-1 left-1 pointer-events-none">
                          <span className="px-1.5 py-0.5 text-[8px] font-mono uppercase bg-amber-400 text-black font-extrabold rounded shadow-sm">
                            {item.card.finish === 'reverse' ? 'REV' : item.card.finish}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Location Tag: direct link to Binder & relative page/pocket (green info) */}
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => onNavigateToBinder(item.binderId, item.slotIndex)}
                        className="w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-300 text-[10px] font-medium transition-colors cursor-pointer group/btn"
                        title={`Ir para o fichário "${item.binderTitle}", Página ${item.pageNumber}, Bolso ${item.pocketNumber}`}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <BookOpen className="w-3 h-3 shrink-0 text-emerald-400" />
                          <span className="truncate">{item.binderTitle}</span>
                        </div>
                        <span className="font-mono shrink-0 text-emerald-400 group-hover/btn:translate-x-0.5 transition-transform">
                          p.{item.pageNumber} b.{item.pocketNumber} →
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View (read-only finish, condition, language - separated columns) */
            <div className="bg-[#121624] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400 bg-slate-900/60 select-none">
                      <th
                        className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                        onClick={() => setSortBy(sortBy === 'game' ? 'recent' : 'game')}
                        title="Ordenar por Jogo"
                      >
                        <div className="flex items-center gap-1">
                          <span>Jogo</span>
                          {sortBy === 'game' && <span className="text-indigo-400">●</span>}
                        </div>
                      </th>
                      <th
                        className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                        onClick={() => setSortBy(sortBy === 'name-asc' ? 'name-desc' : 'name-asc')}
                        title="Ordenar por Nome (A-Z / Z-A)"
                      >
                        <div className="flex items-center gap-1">
                          <span>Carta</span>
                          {sortBy === 'name-asc' && <span className="text-indigo-400">↑</span>}
                          {sortBy === 'name-desc' && <span className="text-indigo-400">↓</span>}
                        </div>
                      </th>
                      <th
                        className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                        onClick={() => setSortBy(sortBy === 'set' ? 'recent' : 'set')}
                        title="Ordenar por Coleção"
                      >
                        <div className="flex items-center gap-1">
                          <span>Coleção</span>
                          {sortBy === 'set' && <span className="text-indigo-400">●</span>}
                        </div>
                      </th>
                      <th
                        className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                        onClick={() => setSortBy(sortBy === 'number-asc' ? 'number-desc' : 'number-asc')}
                        title="Ordenar por Número (Crescente / Decrescente)"
                      >
                        <div className="flex items-center gap-1">
                          <span>Número</span>
                          {sortBy === 'number-asc' && <span className="text-indigo-400">↑</span>}
                          {sortBy === 'number-desc' && <span className="text-indigo-400">↓</span>}
                        </div>
                      </th>
                      <th className="py-3 px-3">Raridade</th>
                      <th className="py-3 px-3">Acabamento</th>
                      <th className="py-3 px-3">Conservação</th>
                      <th className="py-3 px-3">Idioma</th>
                      <th className="py-3 px-3">Edição</th>
                      <th
                        className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
                        onClick={() => setSortBy(sortBy === 'binder' ? 'recent' : 'binder')}
                        title="Ordenar por Fichário"
                      >
                        <div className="flex items-center gap-1">
                          <span>Fichário / Local</span>
                          {sortBy === 'binder' && <span className="text-indigo-400">●</span>}
                        </div>
                      </th>
                      <th className="py-3 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
                    {paginatedCards.map((item) => {
                      const badgeStyle = GAME_BADGE_COLORS[item.card.game] || GAME_BADGE_COLORS.pokemon;
                      const finishLabel = CARD_FINISHES.find((f) => f.value === item.card.finish)?.label || 'Normal';
                      return (
                        <tr key={item.id} className="hover:bg-slate-900/40 transition-colors group">
                          {/* 1. Jogo */}
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold rounded border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                              {item.card.game}
                            </span>
                          </td>

                          {/* 2. Carta (clique para abrir detalhes e editar) */}
                          <td className="py-2.5 px-3 font-bold text-white">
                            <button
                              type="button"
                              onClick={() => onViewCard(item.card, item.slotIndex, item.binderId)}
                              className="hover:text-indigo-400 text-left transition-colors cursor-pointer group-hover:text-indigo-300"
                              title="Clique para ver e editar detalhes da carta"
                            >
                              {item.card.name}
                            </button>
                          </td>

                          {/* 3. Coleção */}
                          <td className="py-2.5 px-3 text-slate-300">
                            <span className="truncate block max-w-[170px]" title={item.card.setName || '—'}>
                              {item.card.setName || '—'}
                            </span>
                          </td>

                          {/* 4. Número */}
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {item.card.collectorNumber || '—'}
                          </td>

                          {/* 5. Raridade */}
                          <td className="py-2.5 px-3 text-slate-300">
                            <span className="truncate block max-w-[120px]" title={item.card.rarity || 'Comum'}>
                              {item.card.rarity || 'Comum'}
                            </span>
                          </td>

                          {/* 6. Acabamento (apenas leitura) */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {item.card.finish && item.card.finish !== 'normal' ? (
                              <span
                                className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded border inline-flex items-center gap-1 ${
                                  item.card.finish === 'foil'
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                    : item.card.finish === 'holo'
                                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                    : item.card.finish === 'reverse'
                                    ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                    : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                                }`}
                              >
                                {finishLabel}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Normal</span>
                            )}
                          </td>

                          {/* 7. Conservação (apenas leitura) */}
                          <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                            <span
                              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-900 border border-slate-700/80 text-slate-200"
                              title={CARD_CONDITIONS.find((c) => c.value === item.card.condition)?.label || item.card.condition || 'Near Mint'}
                            >
                              {item.card.condition || 'NM'}
                            </span>
                          </td>

                          {/* 8. Idioma (apenas leitura) */}
                          <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                            <span
                              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-900 border border-slate-700/80 text-slate-200"
                              title={CARD_LANGUAGES.find((l) => l.value === item.card.language)?.label || item.card.language || 'Português'}
                            >
                              {item.card.language || 'PT'}
                            </span>
                          </td>

                          {/* 9. Edição / Observação (apenas leitura) */}
                          <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                            <span
                              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-900 border border-slate-700/80 text-slate-200"
                              title={item.card.edition === 'first_edition' ? '1ª Edição' : 'Ilimitada'}
                            >
                              {item.card.edition === 'first_edition' ? '1ª Edição' : 'Ilimitada'}
                            </span>
                          </td>

                          {/* 10. Fichário / Local */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onNavigateToBinder(item.binderId, item.slotIndex)}
                              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer"
                              title={`Ir para o fichário "${item.binderTitle}", Página ${item.pageNumber}, Bolso ${item.pocketNumber}`}
                            >
                              <BookOpen className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-[130px]">{item.binderTitle}</span>
                              <span className="font-mono text-[10px] bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded shrink-0">
                                p.{item.pageNumber} b.{item.pocketNumber}
                              </span>
                            </button>
                          </td>

                          {/* 11. Ações */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {onDeleteCard && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Tem certeza que deseja remover "${item.card.name}" do fichário "${item.binderTitle}"?`)) {
                                      onDeleteCard(item);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
                                  title="Remover carta do fichário"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Controls Bar */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80 px-2 bg-[#121624]/60 p-3 rounded-xl">
              <div className="text-xs text-slate-400 font-mono">
                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, sortedCards.length)} de <strong className="text-white">{sortedCards.length}</strong> cartas
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2;
                    })
                    .map((page, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      const hasGap = prevPage && page - prevPage > 1;

                      return (
                        <React.Fragment key={page}>
                          {hasGap && <span className="text-slate-600 px-1 text-xs">...</span>}
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentPage(page);
                              window.scrollTo({ top: 350, behavior: 'smooth' });
                            }}
                            className={`min-w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                              currentPage === page
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <span>Próxima</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
