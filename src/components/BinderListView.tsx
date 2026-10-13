import React from 'react';
import { Book, Plus, Edit3 } from 'lucide-react';
import { Binder, SUPPORTED_GAMES } from '../types/binder';

interface BinderListViewProps {
  binders: Binder[];
  search?: string;
  onOpenBinder: (binder: Binder) => void;
  onOpenNewBinderModal: () => void;
  onEditBinder: (binder: Binder) => void;
  onDeleteBinder: (binderId: string) => void;
}

export const BinderListView: React.FC<BinderListViewProps> = ({
  binders,
  search = '',
  onOpenBinder,
  onOpenNewBinderModal,
  onEditBinder,
}) => {
  const filteredBinders = binders.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 w-full">
      {/* Binder Bookshelf Grid */}
      {filteredBinders.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBinders.map((binder) => {
            const cardCount = Object.keys(binder.cards).length;
            const capacity = binder.totalPages * 9;
            const sheetsCount = Math.round(binder.totalPages / 2);

            return (
              <div
                key={binder.id}
                onClick={() => onOpenBinder(binder)}
                className="group flex flex-col cursor-pointer transition-colors"
              >
                {/* Clean Portfolio Binder Cover */}
                <div className="relative aspect-[3/4] w-full rounded-2xl bg-[#141824] border border-slate-700/80 shadow-xl group-hover:border-slate-500 group-hover:shadow-indigo-950/40 transition-colors overflow-hidden">
                  {/* Cover Artwork */}
                  {binder.coverImageUrl ? (
                    <img
                      src={binder.coverImageUrl}
                      alt={binder.title}
                      className="w-full h-full object-cover object-center"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-neutral-900 via-[#141824] to-black">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-2 shadow-inner">
                        <Book className="w-7 h-7" />
                      </div>
                    </div>
                  )}

                  {/* Left Spine Simulation */}
                  <div className="absolute left-0 inset-y-0 w-3.5 bg-black/75 border-r border-white/10 z-10 flex flex-col justify-around items-center py-6 pointer-events-none">
                    <div className="w-1.5 h-3 rounded-full bg-slate-300 shadow-sm" />
                    <div className="w-1.5 h-3 rounded-full bg-slate-300 shadow-sm" />
                    <div className="w-1.5 h-3 rounded-full bg-slate-300 shadow-sm" />
                  </div>

                  {/* Right Edge Elastic Strap Simulation */}
                  <div className="absolute right-3.5 inset-y-0 w-2.5 bg-black/40 border-x border-white/10 z-10 opacity-70 pointer-events-none" />

                  {/* Subtle surface specular gloss */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>

                {/* Title & Info Below the Card */}
                <div className="mt-2.5 px-1 flex items-start justify-between gap-2">
                  <div className="text-left flex-1 min-w-0">
                    <h2 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1 leading-snug">
                      {binder.title}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <span className="font-mono tabular-nums text-slate-300 font-medium">
                        {cardCount} / {capacity} cartas
                      </span>
                      <span>·</span>
                      <span className="text-[11px] text-slate-400">
                        {sheetsCount} {sheetsCount === 1 ? 'folha' : 'folhas'}
                      </span>
                      {binder.game && (
                        <>
                          <span>·</span>
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-1.5 py-0.2 rounded">
                            {SUPPORTED_GAMES.find((g) => g.id === binder.game)?.label || binder.game}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditBinder(binder);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-lg transition-all cursor-pointer shrink-0 opacity-0 group-hover:opacity-100"
                    title="Editar ou excluir fichário"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700 mx-auto flex items-center justify-center text-slate-400 mb-3">
            <Book className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">
            {search ? 'Nenhum fichário encontrado' : 'Nenhum fichário criado ainda'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search
              ? `Nenhum fichário corresponde à busca "${search}".`
              : 'Comece seu fichário virtual agora mesmo para catalogar Pokémon, Magic ou Yu-Gi-Oh!.'}
          </p>
          <button
            type="button"
            onClick={onOpenNewBinderModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Fichário</span>
          </button>
        </div>
      )}
    </div>
  );
};
