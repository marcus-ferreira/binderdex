import React from 'react';
import { BookOpen, Search, Plus } from 'lucide-react';

interface HeaderProps {
  onGoHome: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenNewBinderModal: () => void;
  showSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onGoHome,
  searchQuery = '',
  onSearchChange,
  onOpenNewBinderModal,
  showSearch = true,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0d111c]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Wordmark */}
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-left text-slate-100 hover:text-white transition-colors group cursor-pointer whitespace-nowrap shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform overflow-hidden shadow-inner">
            <img src="/favicon.svg" alt="BinderDex" className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-white leading-none">
              Binder<span className="text-indigo-400">Dex</span>
            </span>
          </div>
        </button>

        {/* Right: Search Input + Novo Fichário Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {showSearch && onSearchChange && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar fichário..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-36 sm:w-60 pl-8 pr-7 py-1.5 text-xs bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
                  title="Limpar busca"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={onOpenNewBinderModal}
            className="flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
            title="Criar novo fichário"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Fichário</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
