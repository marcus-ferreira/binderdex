import React, { useState, useMemo } from 'react';
import {
  X,
  Trophy,
  CheckCircle2,
  Circle,
  Search,
  Layers,
  Sparkles,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { Binder, CardGame, SUPPORTED_GAMES } from '../types/binder';
import {
  calculateAllCollectionsProgress,
  CollectionProgressItem,
} from '../services/collectionProgress';

interface CollectionProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  binders: Binder[];
  initialSelectedSet?: string;
  onSelectSetInOverallList?: (setName: string, game: CardGame) => void;
}

const GAME_BADGE_COLORS: Record<CardGame, { bg: string; text: string; border: string }> = {
  pokemon: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  magic: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  yugioh: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  digimon: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  battlescenes: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
};

export const CollectionProgressModal: React.FC<CollectionProgressModalProps> = ({
  isOpen,
  onClose,
  binders,
  initialSelectedSet,
  onSelectSetInOverallList,
}) => {
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState<CardGame | 'all'>('all');
  const [selectedSetDetail, setSelectedSetDetail] = useState<CollectionProgressItem | null>(null);

  const allProgress = useMemo(() => {
    return calculateAllCollectionsProgress(binders);
  }, [binders]);

  // If initialSelectedSet is passed, auto-select it when modal opens
  React.useEffect(() => {
    if (initialSelectedSet && initialSelectedSet !== 'all') {
      const match = allProgress.find(
        (p) =>
          p.setName.toLowerCase() === initialSelectedSet.toLowerCase() ||
          p.cleanSetName.toLowerCase() === initialSelectedSet.toLowerCase()
      );
      if (match) {
        setSelectedSetDetail(match);
      }
    }
  }, [initialSelectedSet, allProgress, isOpen]);

  const filteredProgress = useMemo(() => {
    return allProgress.filter((item) => {
      if (selectedGame !== 'all' && item.game !== selectedGame) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.setName.toLowerCase().includes(q) ||
          item.cleanSetName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allProgress, selectedGame, search]);

  // Overall statistics
  const totalSetsCount = allProgress.length;
  const completedSetsCount = allProgress.filter((p) => p.percentage === 100).length;
  const totalOwnedCardsCount = allProgress.reduce((acc, curr) => acc + curr.ownedUniqueCount, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-[#121624] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f131f] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Progresso das Coleções
              </h2>
              <p className="text-xs text-slate-400">
                Acompanhe quantas cartas possui e quantas faltam para completar cada coleção
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Stats Summary Bar */}
        <div className="grid grid-cols-3 gap-2 px-6 py-3 border-b border-slate-800/80 bg-[#141828]/60 text-center shrink-0">
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono uppercase">
              Coleções Ativas
            </span>
            <span className="text-sm sm:text-base font-bold text-white">
              {totalSetsCount}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono uppercase">
              Cartas Únicas
            </span>
            <span className="text-sm sm:text-base font-bold text-indigo-400">
              {totalOwnedCardsCount}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-mono uppercase">
              Completas (100%)
            </span>
            <span className="text-sm sm:text-base font-bold text-emerald-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {completedSetsCount}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-[#121624] flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar coleção (ex: Base Set, 151, Jungle...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 hidden sm:block" />
            <button
              type="button"
              onClick={() => setSelectedGame('all')}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer shrink-0 font-medium ${
                selectedGame === 'all'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Todos
            </button>
            {SUPPORTED_GAMES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGame(g.id)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer shrink-0 font-medium ${
                  selectedGame === g.id
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Collection List or Single Set Detail Checklist */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {selectedSetDetail ? (
            /* Detailed Checklist View for a specific set */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedSetDetail(null)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                >
                  ← Voltar para todas as coleções
                </button>
                {onSelectSetInOverallList && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectSetInOverallList(selectedSetDetail.setName, selectedSetDetail.game);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-lg"
                  >
                    <span>Ver cartas na Coleção Geral</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Set Summary Banner */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono uppercase font-bold rounded border ${
                          GAME_BADGE_COLORS[selectedSetDetail.game]?.bg || 'bg-slate-800'
                        } ${
                          GAME_BADGE_COLORS[selectedSetDetail.game]?.text || 'text-slate-300'
                        } ${
                          GAME_BADGE_COLORS[selectedSetDetail.game]?.border || 'border-slate-700'
                        }`}
                      >
                        {selectedSetDetail.game}
                      </span>
                      {selectedSetDetail.year && (
                        <span className="text-[10px] font-mono text-slate-400">
                          Ano {selectedSetDetail.year}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {selectedSetDetail.setName}
                    </h3>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-sm font-semibold text-white font-mono">
                      <strong className="text-emerald-400">{selectedSetDetail.ownedUniqueCount}</strong>/
                      <strong className="text-slate-300">{selectedSetDetail.totalInSet}</strong> ({selectedSetDetail.percentage}%)
                    </div>
                    <div className="text-xs text-amber-400 font-medium">
                      {selectedSetDetail.missingCount > 0 ? (
                        <>Faltam <strong className="text-amber-300">{selectedSetDetail.missingCount}</strong> cartas para completar</>
                      ) : (
                        <span className="text-emerald-400 font-bold flex items-center sm:justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Coleção 100% Completa!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                    <span>Progresso da Coleção</span>
                    <span className="font-bold text-white">{selectedSetDetail.percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        selectedSetDetail.percentage === 100
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                      }`}
                      style={{ width: `${selectedSetDetail.percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Owned Cards Grid in this Set */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Cartas Registradas ({selectedSetDetail.cards.length} no fichário)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedSetDetail.cards.map((card, i) => (
                    <div
                      key={`${card.id}-${i}`}
                      className="flex items-center gap-2 p-2 bg-slate-900/60 border border-slate-800 rounded-lg text-xs"
                    >
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt={card.name}
                          className="w-8 h-11 object-cover rounded shrink-0 bg-black/40"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-8 h-11 rounded bg-slate-800 flex items-center justify-center text-[9px] text-slate-500 shrink-0">
                          #{card.collectorNumber || '—'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white truncate">{card.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          Nº {card.collectorNumber || '—'} • {card.condition || 'NM'} • {card.language || 'PT'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Collection Cards List */
            <>
              {filteredProgress.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <Layers className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm font-semibold text-white">
                    Nenhuma coleção encontrada
                  </p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Adicione cartas aos seus fichários para ver o progresso detalhado de cada coleção.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredProgress.map((item) => {
                    const badge = GAME_BADGE_COLORS[item.game] || GAME_BADGE_COLORS.pokemon;
                    return (
                      <div
                        key={`${item.game}-${item.setName}`}
                        onClick={() => setSelectedSetDetail(item)}
                        className="bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-3.5 space-y-2.5 transition-all cursor-pointer group shadow-sm hover:shadow-indigo-950/20"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span
                                className={`px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold rounded border ${badge.bg} ${badge.text} ${badge.border}`}
                              >
                                {item.game}
                              </span>
                              {item.year && (
                                <span className="text-[9px] font-mono text-slate-500">
                                  {item.year}
                                </span>
                              )}
                            </div>
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                              {item.setName}
                            </h4>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-bold text-white block">
                              {item.percentage}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.ownedUniqueCount}/{item.totalInSet}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              item.percentage === 100
                                ? 'bg-emerald-400'
                                : 'bg-indigo-500'
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>

                        {/* Summary sentence */}
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60 font-mono">
                          <span className="text-slate-300">
                            <strong className="text-emerald-400">{item.ownedUniqueCount}</strong>/
                            <strong>{item.totalInSet}</strong> ({item.percentage}%)
                          </span>
                          <span className="text-amber-400 font-medium">
                            {item.missingCount > 0
                              ? `Faltam ${item.missingCount}`
                              : 'Completo!'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#10141f] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>
            {totalSetsCount} {totalSetsCount === 1 ? 'coleção registrada' : 'coleções registradas'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
