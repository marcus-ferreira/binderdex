import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Layers,
  BookOpen,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import { Binder, BinderCard, CardGame, SUPPORTED_GAMES } from '../types/binder';

export interface AggregateCardItem {
  id: string;
  card: BinderCard;
  binderId: string;
  binderTitle: string;
  slotIndex: number;
  pageNumber: number;
}

interface OverallCardListProps {
  binders: Binder[];
  onNavigateToBinder: (binderId: string, slotIndex?: number) => void;
  onViewCard: (card: BinderCard, slotIndex?: number | null) => void;
  onDeleteCard?: (item: AggregateCardItem) => void;
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
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState<CardGame | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name-asc' | 'name-desc' | 'game' | 'set' | 'binder'>('recent');

  // Aggregate all cards from all binders
  const allAggregateCards = useMemo(() => {
    const list: AggregateCardItem[] = [];

    binders.forEach((binder) => {
      Object.entries(binder.cards).forEach(([slotStr, card]) => {
        const slotIdx = Number(slotStr);
        list.push({
          id: `binder-${binder.id}-${slotIdx}-${card.id}`,
          card,
          binderId: binder.id,
          binderTitle: binder.title,
          slotIndex: slotIdx,
          pageNumber: Math.floor(slotIdx / 9) + 1,
        });
      });
    });

    return list;
  }, [binders]);

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
  }, [allAggregateCards, selectedGame, searchTerm]);

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
      if (sortBy === 'binder') {
        return a.binderTitle.localeCompare(b.binderTitle);
      }
      return 0;
    });
    return list;
  }, [filteredCards, sortBy]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-400" />
            <span>Coleção Geral</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Todas as cartas armazenadas e catalogadas nos seus fichários virtuais.
          </p>
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

      {/* Filter and Search Bar */}
      <div className="bg-[#121624] border border-slate-800 rounded-xl p-4 space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nome, coleção, número (#10) ou fichário..."
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
              <option value="binder">Por Fichário</option>
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
            <h3 className="text-base font-bold text-white">
              {totalCardsCount === 0 ? 'Nenhuma carta nos fichários' : 'Nenhuma carta encontrada'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {totalCardsCount === 0
                ? 'Abra ou crie um fichário e adicione cartas aos bolsos para visualizá-las aqui na coleção geral.'
                : 'Nenhuma carta corresponde aos filtros ativos. Tente alterar o jogo ou limpar o termo de busca.'}
            </p>
          </div>
          {totalCardsCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedGame('all');
              }}
              className="px-4 py-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 border border-indigo-800/60 rounded-xl transition-colors cursor-pointer"
            >
              Limpar Todos os Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Mostrando <strong className="text-white">{sortedCards.length}</strong> carta{sortedCards.length > 1 ? 's' : ''} em fichários
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
                    onClick={() => onViewCard(item.card, item.slotIndex)}
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
                          if (window.confirm(`Tem certeza que deseja remover "${item.card.name}" do fichário "${item.binderTitle}"?`)) {
                            onDeleteCard(item);
                          }
                        }}
                        className="absolute top-1 left-1 z-30 p-1 rounded bg-black/80 hover:bg-rose-600 text-slate-300 hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md"
                        title={`Remover "${item.card.name}" do fichário`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
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
                      onClick={() => onViewCard(item.card, item.slotIndex)}
                      className="text-xs font-bold text-white truncate cursor-pointer hover:text-indigo-400 transition-colors"
                      title={item.card.name}
                    >
                      {item.card.name}
                    </h4>

                    <p className="text-[10px] text-slate-400 truncate" title={item.card.setName}>
                      {item.card.setName || 'Coleção'}
                    </p>
                  </div>

                  {/* Location Tag: direct link to Binder & Page */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => onNavigateToBinder(item.binderId, item.slotIndex)}
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
