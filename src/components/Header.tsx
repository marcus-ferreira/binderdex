import React from 'react';
import { BookOpen, Layers } from 'lucide-react';

export type AppNavTab = 'binders' | 'all-cards';

interface HeaderProps {
  onGoHome: () => void;
  activeTab: AppNavTab;
  onChangeTab: (tab: AppNavTab) => void;
  bindersCount: number;
  allCardsCount: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenNewBinderModal: () => void;
  showSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onGoHome,
  activeTab,
  onChangeTab,
  bindersCount,
  allCardsCount,
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
          onClick={() => {
            onChangeTab('binders');
            onGoHome();
          }}
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

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/90 text-xs font-medium">
          <button
            type="button"
            onClick={() => onChangeTab('binders')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'binders'
                ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Fichários</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab('all-cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'all-cards'
                ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Coleção Geral</span>
          </button>
        </nav>

        {/* Right empty placeholder to balance brand wordmark */}
        <div className="w-20" />
      </div>
    </header>
  );
};
