import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Edit3,
  BookOpen,
  Copy,
} from 'lucide-react';
import { Binder, BinderCard, SUPPORTED_GAMES } from '../types/binder';
import { BinderCardPocket } from './BinderCardPocket';

interface BinderSpreadProps {
  binder: Binder;
  onBack: () => void;
  onUpdateBinder: (updated: Binder) => void;
  onEditBinderDetails: (binder: Binder) => void;
  onDeleteBinder?: (binderId: string) => void;
  onAddCardToSlot: (slotIndex: number) => void;
  onViewCard: (card: BinderCard, slotIndex: number) => void;
  onDeleteCard?: (slotIndex: number) => void;
}

export const BinderSpread: React.FC<BinderSpreadProps> = ({
  binder,
  onBack,
  onUpdateBinder,
  onEditBinderDetails,
  onAddCardToSlot,
  onViewCard,
  onDeleteCard,
}) => {
  const [spreadIndex, setSpreadIndex] = useState(0);

  // Clone card mode state (duplicate cards when dragged to empty pocket)
  const [cloneMode, setCloneMode] = useState(false);

  // Drag-and-drop auto-flip state
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const [dragHoverButton, setDragHoverButton] = useState<'prev' | 'next' | null>(null);

  const autoFlipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoFlipIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1 folha = 2 páginas. Number of sheets:
  const sheets = Math.max(1, Math.floor(binder.totalPages / 2));
  const maxSpreadIndex = sheets;

  const spreadIndexRef = useRef(spreadIndex);
  spreadIndexRef.current = spreadIndex;

  const maxSpreadIndexRef = useRef(maxSpreadIndex);
  maxSpreadIndexRef.current = maxSpreadIndex;

  // Ensure spreadIndex is in valid range if sheets change
  useEffect(() => {
    if (spreadIndex > maxSpreadIndex) {
      setSpreadIndex(maxSpreadIndex);
    }
  }, [spreadIndex, maxSpreadIndex]);

  const clearAutoFlip = () => {
    if (autoFlipTimerRef.current) {
      clearTimeout(autoFlipTimerRef.current);
      autoFlipTimerRef.current = null;
    }
    if (autoFlipIntervalRef.current) {
      clearInterval(autoFlipIntervalRef.current);
      autoFlipIntervalRef.current = null;
    }
    setDragHoverButton(null);
  };

  // Cleanup auto-flip timers on unmount
  useEffect(() => {
    return () => {
      clearAutoFlip();
    };
  }, []);

  const handlePrevSpread = () => {
    setSpreadIndex((prev) => {
      if (prev > 0) return prev - 1;
      return prev;
    });
  };

  const handleNextSpread = () => {
    setSpreadIndex((prev) => {
      if (prev < maxSpreadIndexRef.current) return prev + 1;
      return prev;
    });
  };

  // Auto-flip handler when dragging over the NEXT arrow
  const handleNextDragEnterOrOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (dragHoverButton === 'next') return; // Timer is already running

    clearAutoFlip();
    setDragHoverButton('next');

    if (spreadIndexRef.current >= maxSpreadIndexRef.current) return;

    // Flip after 300ms hover
    autoFlipTimerRef.current = setTimeout(() => {
      if (spreadIndexRef.current < maxSpreadIndexRef.current) {
        handleNextSpread();
      }

      // If user keeps holding over the button, flip every 750ms
      autoFlipIntervalRef.current = setInterval(() => {
        if (spreadIndexRef.current < maxSpreadIndexRef.current) {
          handleNextSpread();
        } else {
          clearAutoFlip();
        }
      }, 750);
    }, 300);
  };

  // Auto-flip handler when dragging over the PREV arrow
  const handlePrevDragEnterOrOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (dragHoverButton === 'prev') return; // Timer is already running

    clearAutoFlip();
    setDragHoverButton('prev');

    if (spreadIndexRef.current <= 0) return;

    // Flip after 300ms hover
    autoFlipTimerRef.current = setTimeout(() => {
      if (spreadIndexRef.current > 0) {
        handlePrevSpread();
      }

      // If user keeps holding over the button, flip every 750ms
      autoFlipIntervalRef.current = setInterval(() => {
        if (spreadIndexRef.current > 0) {
          handlePrevSpread();
        } else {
          clearAutoFlip();
        }
      }, 750);
    }, 300);
  };

  const handleButtonDragLeave = (e: React.DragEvent) => {
    const currentTarget = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      clearAutoFlip();
    }
  };

  const handleButtonDrop = (e: React.DragEvent) => {
    e.preventDefault();
    clearAutoFlip();
    // Prevent discarding the card if dropped on the navigation arrow
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevSpread();
      } else if (e.key === 'ArrowRight') {
        handleNextSpread();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDropCard = (sourceIndex: number, targetIndex: number, isCloneIntent = false) => {
    if (sourceIndex === targetIndex) return;
    const newCards = { ...binder.cards };
    const sourceCard = newCards[sourceIndex];
    const targetCard = newCards[targetIndex];

    if (!sourceCard) return;

    const shouldClone = cloneMode || isCloneIntent;

    // CLONE: duplicate the card into the empty pocket!
    if (shouldClone && !targetCard) {
      const clonedCard: BinderCard = {
        ...sourceCard,
        id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        addedAt: Date.now(),
      };
      newCards[targetIndex] = clonedCard;
      onUpdateBinder({
        ...binder,
        cards: newCards,
        updatedAt: Date.now(),
      });
      return;
    }

    if (targetCard) {
      newCards[sourceIndex] = targetCard;
      newCards[targetIndex] = sourceCard;
    } else {
      delete newCards[sourceIndex];
      newCards[targetIndex] = sourceCard;
    }
    onUpdateBinder({
      ...binder,
      cards: newCards,
      updatedAt: Date.now(),
    });
  };

  const totalFilledCards = Object.keys(binder.cards).length;
  const capacity = binder.totalPages * 9;

  return (
    <div
      className="flex flex-col min-h-[calc(100vh-4rem)] bg-[#0b0e17] py-6 px-2 sm:px-6"
      onDragStart={() => setIsDraggingCard(true)}
      onDragEnd={() => {
        setIsDraggingCard(false);
        clearAutoFlip();
      }}
    >
      {/* SPREAD CONTAINER WITH LATERAL < AND > BUTTONS */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col items-center justify-center relative">
        {/* Top Header Bar: Back Button, Edit Binder Button & Page Selector */}
        <div className="w-full flex items-center justify-between mb-3 px-1 gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Voltar para todos os fichários"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar aos Fichários</span>
          </button>

          {/* Right: Clone toggle, Edit Binder button next to Page Selector */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Clone mode toggle */}
            <button
              type="button"
              onClick={() => setCloneMode((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer shadow-sm ${
                cloneMode
                  ? 'bg-purple-950/80 border-purple-500 text-purple-200 ring-2 ring-purple-500/30 font-semibold'
                  : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Modo Clonar: arraste uma carta para um bolso vazio para duplicá-la (ou segure Ctrl/Alt ao arrastar)"
            >
              <Copy className={`w-3.5 h-3.5 ${cloneMode ? 'text-purple-400' : 'text-slate-400'}`} />
              <span>{cloneMode ? 'Modo Clonar: Ativo' : 'Clonar Carta'}</span>
            </button>

            <button
              type="button"
              onClick={() => onEditBinderDetails(binder)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors cursor-pointer shadow-sm"
              title="Editar título, capa e quantidade de folhas do fichário"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Editar Fichário</span>
            </button>

            {/* Quick Page Jump Selector */}
            <select
              value={spreadIndex}
              onChange={(e) => setSpreadIndex(Number(e.target.value))}
              className="bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:border-indigo-500"
            >
              {Array.from({ length: maxSpreadIndex + 1 }).map((_, idx) => {
                if (idx === 0) {
                  return (
                    <option key={idx} value={idx}>
                      Capa Interna | Página 1
                    </option>
                  );
                }
                if (idx === maxSpreadIndex) {
                  return (
                    <option key={idx} value={idx}>
                      Página {binder.totalPages} | Contracapa
                    </option>
                  );
                }
                const pLeft = idx * 2;
                const pRight = idx * 2 + 1;
                return (
                  <option key={idx} value={idx}>
                    Página {pLeft} | Página {pRight}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* LATERAL LEFT BUTTON (<): Click to change or drag card over it to auto-flip */}
        <button
          type="button"
          onClick={handlePrevSpread}
          onDragOver={handlePrevDragEnterOrOver}
          onDragEnter={handlePrevDragEnterOrOver}
          onDragLeave={handleButtonDragLeave}
          onDrop={handleButtonDrop}
          aria-label="Página anterior"
          aria-disabled={spreadIndex === 0}
          className={`absolute -left-2 sm:-left-5 lg:-left-7 top-1/2 -translate-y-1/2 z-30 transition-all flex items-center justify-center shadow-2xl rounded-l-xl ${
            isDraggingCard
              ? 'w-12 h-20 sm:w-14 sm:h-28'
              : 'w-10 h-16 sm:w-12 sm:h-24'
          } ${
            dragHoverButton === 'prev'
              ? 'bg-indigo-600 text-white ring-4 ring-indigo-400 shadow-indigo-600/50 scale-110'
              : isDraggingCard && spreadIndex > 0
              ? 'bg-slate-900 text-indigo-300 ring-2 ring-indigo-500/50 hover:bg-indigo-600 hover:text-white cursor-pointer'
              : 'bg-slate-900/90 text-slate-200 hover:bg-indigo-600 hover:text-white border border-slate-700/80 cursor-pointer'
          } ${
            spreadIndex === 0
              ? 'opacity-20 cursor-not-allowed hover:bg-slate-900/90 hover:text-slate-200'
              : 'group'
          }`}
          title="Página anterior (Tecla ← ou arraste uma carta até aqui)"
        >
          {dragHoverButton === 'prev' && (
            <span className="absolute -top-8 left-0 text-[11px] font-bold text-white bg-indigo-600 px-2.5 py-1 rounded-full shadow-lg border border-indigo-400/50 whitespace-nowrap animate-bounce pointer-events-none">
              Virando página...
            </span>
          )}
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
        </button>

        {/* LATERAL RIGHT BUTTON (>): Click to change or drag card over it to auto-flip */}
        <button
          type="button"
          onClick={handleNextSpread}
          onDragOver={handleNextDragEnterOrOver}
          onDragEnter={handleNextDragEnterOrOver}
          onDragLeave={handleButtonDragLeave}
          onDrop={handleButtonDrop}
          aria-label="Próxima página"
          aria-disabled={spreadIndex >= maxSpreadIndex}
          className={`absolute -right-2 sm:-right-5 lg:-right-7 top-1/2 -translate-y-1/2 z-30 transition-all flex items-center justify-center shadow-2xl rounded-r-xl ${
            isDraggingCard
              ? 'w-12 h-20 sm:w-14 sm:h-28'
              : 'w-10 h-16 sm:w-12 sm:h-24'
          } ${
            dragHoverButton === 'next'
              ? 'bg-indigo-600 text-white ring-4 ring-indigo-400 shadow-indigo-600/50 scale-110'
              : isDraggingCard && spreadIndex < maxSpreadIndex
              ? 'bg-slate-900 text-indigo-300 ring-2 ring-indigo-500/50 hover:bg-indigo-600 hover:text-white cursor-pointer'
              : 'bg-slate-900/90 text-slate-200 hover:bg-indigo-600 hover:text-white border border-slate-700/80 cursor-pointer'
          } ${
            spreadIndex >= maxSpreadIndex
              ? 'opacity-20 cursor-not-allowed hover:bg-slate-900/90 hover:text-slate-200'
              : 'group'
          }`}
          title="Próxima página (Tecla → ou arraste uma carta até aqui)"
        >
          {dragHoverButton === 'next' && (
            <span className="absolute -top-8 right-0 text-[11px] font-bold text-white bg-indigo-600 px-2.5 py-1 rounded-full shadow-lg border border-indigo-400/50 whitespace-nowrap animate-bounce pointer-events-none">
              Virando página...
            </span>
          )}
          <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* THE VIRTUAL BINDER CASING */}
        <div className="w-full rounded-2xl bg-[#141824] p-3 sm:p-5 shadow-2xl border border-slate-700/80 transition-all duration-300 relative">
          {/* Subtle perimeter stitching */}
          <div className="absolute inset-1.5 rounded-xl border border-dashed border-white/10 pointer-events-none" />

          {/* ALL SPREADS ARE MOUNTED IN THE DOM:
              Inactive spreads are positioned offscreen so that dragging a card across pages
              NEVER unmounts the source card element, preserving the browser drag session! */}
          {Array.from({ length: maxSpreadIndex + 1 }).map((_, sIdx) => {
            const isSpreadFirst = sIdx === 0;
            const isSpreadLast = sIdx === maxSpreadIndex;

            const leftPageNumber = isSpreadFirst ? null : sIdx * 2;
            const rightPageNumber = isSpreadLast ? null : sIdx === 0 ? 1 : sIdx * 2 + 1;

            const leftSlotOffset = leftPageNumber ? (leftPageNumber - 1) * 9 : null;
            const rightSlotOffset = rightPageNumber ? (rightPageNumber - 1) * 9 : null;

            const isActive = sIdx === spreadIndex;

            return (
              <div
                key={sIdx}
                className={
                  isActive
                    ? 'relative flex flex-col md:flex-row items-stretch justify-center rounded-xl overflow-hidden bg-[#0a0d15] shadow-2xl border border-black/40 min-h-[600px] w-full transition-opacity duration-200'
                    : 'absolute top-0 -left-[99999px] flex flex-col md:flex-row items-stretch justify-center rounded-xl overflow-hidden bg-[#0a0d15] min-h-[600px] w-full opacity-0 pointer-events-none -z-50'
                }
              >
                {/* LEFT SIDE: Exactly 50% width on md+ screens */}
                {isSpreadFirst ? (
                  // INSIDE FRONT COVER: Mesmas dimensões e estrutura das demais páginas
                  <div className="w-full md:w-1/2 flex-1 basis-0 min-w-0 binder-page-texture p-3 sm:p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-950 relative select-none">
                    {/* 3 Punched Ring Holes on the right edge */}
                    <div className="hidden md:flex absolute right-1 inset-y-0 flex-col justify-around items-center pointer-events-none py-12">
                      <div className="w-2.5 h-4 rounded-full bg-slate-950 border border-slate-700/80 shadow-inner" />
                      <div className="w-2.5 h-4 rounded-full bg-slate-950 border border-slate-700/80 shadow-inner" />
                      <div className="w-2.5 h-4 rounded-full bg-slate-950 border border-slate-700/80 shadow-inner" />
                    </div>

                    {/* Header idêntico às demais páginas */}
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80 text-xs">
                      <span className="font-semibold text-slate-300">
                        Capa Interna
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {totalFilledCards} / {capacity}
                      </span>
                    </div>

                    {/* Área central com visual proporcional à grade 3x3 */}
                    <div className="flex-1 flex flex-col items-center justify-center py-6 px-2 text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
                        <BookOpen className="w-8 h-8 sm:w-10 sm:h-10" />
                      </div>
                      <h2 className="text-base sm:text-xl font-bold text-white max-w-xs line-clamp-2 mb-2">
                        {binder.title}
                      </h2>
                      {binder.game && (
                        <div className="mb-4">
                          <span className="text-[11px] uppercase font-bold tracking-wider text-indigo-300 bg-indigo-950/80 border border-indigo-700/80 px-2.5 py-0.5 rounded-full shadow-sm">
                            {SUPPORTED_GAMES.find((g) => g.id === binder.game)?.label || binder.game}
                          </span>
                        </div>
                      )}

                      {/* Informações de Quantidade de Cartas e Folhas */}
                      <div className="w-full max-w-sm grid grid-cols-2 gap-3 text-left my-2 sm:my-3">
                        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-inner">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-0.5">
                            Cartas Catalogadas
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-white font-mono tabular-nums">
                              {totalFilledCards}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              / {capacity}
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${
                                  capacity > 0
                                    ? Math.min(
                                        100,
                                        Math.round(
                                          (totalFilledCards / capacity) * 100
                                        )
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-inner">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-0.5">
                            Capacidade
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-white font-mono tabular-nums">
                              {sheets}
                            </span>
                            <span className="text-xs text-slate-400">
                              {sheets === 1 ? 'folha' : 'folhas'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-2 font-mono">
                            {binder.totalPages} páginas no total
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // LEFT 9-POCKET PAGE (Página 2, 4, 6...)
                  <div className="w-full md:w-1/2 flex-1 basis-0 min-w-0 binder-page-texture p-3 sm:p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-950 relative">
                    {/* 3 Punched Ring Holes on the right edge */}
                    <div className="hidden md:flex absolute right-1 inset-y-0 flex-col justify-around items-center pointer-events-none py-12">
                      <div className="w-2.5 h-4 rounded-full bg-slate-950 border border-slate-700/80 shadow-inner" />
                      <div className="w-2.5 h-4 rounded-full bg-slate-950 border border-slate-700/80 shadow-inner" />
                      <div className="w-2.5 h-4 rounded-full bg-slate-950 border border-slate-700/80 shadow-inner" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80 text-xs">
                      <span className="font-semibold text-slate-300">
                        Página {leftPageNumber}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {leftSlotOffset !== null
                          ? Object.keys(binder.cards).filter(
                              (idx) =>
                                Number(idx) >= leftSlotOffset &&
                                Number(idx) < leftSlotOffset + 9
                            ).length
                          : 0}{' '}
                        / 9
                      </span>
                    </div>

                    {/* 3x3 Grid */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-1">
                      {Array.from({ length: 9 }).map((_, pIdx) => {
                        const absoluteSlot = (leftSlotOffset ?? 0) + pIdx;
                        return (
                          <BinderCardPocket
                            key={absoluteSlot}
                            slotIndex={absoluteSlot}
                            displayNumber={absoluteSlot + 1}
                            card={binder.cards[absoluteSlot]}
                            cloneMode={cloneMode}
                            onAddCard={onAddCardToSlot}
                            onViewCard={onViewCard}
                            onDropCard={handleDropCard}
                            onDeleteCard={onDeleteCard}
                            onDragStartCard={() => setIsDraggingCard(true)}
                            onDragEndCard={() => {
                              setIsDraggingCard(false);
                              clearAutoFlip();
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CENTRAL BINDER RING SPINE: Prata Metálica Fixa */}
                <div className="hidden md:flex w-7 bg-gradient-to-r from-neutral-950 via-slate-900 to-neutral-950 border-x border-slate-950 flex-col justify-around items-center py-12 relative shadow-2xl z-20 shrink-0">
                  {[1, 2, 3].map((ringNum) => (
                    <div
                      key={ringNum}
                      className="relative w-8 h-12 flex items-center justify-center"
                    >
                      <div className="w-6 h-10 rounded-full border-4 border-slate-300 bg-slate-800/40 shadow-slate-900 shadow-xl" />
                    </div>
                  ))}
                </div>

                {/* RIGHT SIDE: Exactly 50% width on md+ screens */}
                {isSpreadLast ? (
                  // INSIDE BACK COVER: Contracapa com mesmas dimensões e estrutura
                  <div className="w-full md:w-1/2 flex-1 basis-0 min-w-0 binder-page-texture p-3 sm:p-5 flex flex-col justify-between relative select-none">
                    {/* 3 Punched Ring Holes on the left edge */}
                    <div className="hidden md:flex absolute left-1 inset-y-0 flex-col justify-around items-center pointer-events-none py-12">
                      <div className="w-2.5 h-4 rounded-full bg-slate-950 border border-slate-700/80 shadow-inner" />
                      <div className="w-2.5 h-4 rounded-full bg-slate-950 border border-slate-700/80 shadow-inner" />
                      <div className="w-2.5 h-4 rounded-full bg-slate-950 border border-slate-700/80 shadow-inner" />
                    </div>

                    {/* Header idêntico */}
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80 text-xs">
                      <span className="font-semibold text-slate-300">
                        Contracapa
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Fim do Fichário
                      </span>
                    </div>

                    {/* Área central proporcional */}
                    <div className="flex-1 flex flex-col items-center justify-center py-8 px-2 text-center">
                      <div className="flex flex-col items-center max-w-xs">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                          <BookOpen className="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                          Fim do Fichário
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                          A última página está à esquerda. Para adicionar mais
                          folhas ou alterar o fichário, utilize a opção
                          &quot;Editar Fichário&quot; no topo.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // RIGHT 9-POCKET PAGE (Página 1, 3, 5...)
                  <div className="w-full md:w-1/2 flex-1 basis-0 min-w-0 binder-page-texture p-3 sm:p-5 flex flex-col justify-between relative">
                    {/* 3 Punched Ring Holes on the left edge */}
                    <div className="hidden md:flex absolute left-1 inset-y-0 flex-col justify-around items-center pointer-events-none py-12">
                      <div className="w-2.5 h-4 rounded-full bg-slate-950 border border-slate-700/80 shadow-inner" />
                      <div className="w-2.5 h-4 rounded-full bg-slate-950 border border-slate-700/80 shadow-inner" />
                      <div className="w-2.5 h-4 rounded-full bg-slate-950 border border-slate-700/80 shadow-inner" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800/80 text-xs">
                      <span className="font-semibold text-slate-300">
                        Página {rightPageNumber}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {rightSlotOffset !== null
                          ? Object.keys(binder.cards).filter(
                              (idx) =>
                                Number(idx) >= rightSlotOffset &&
                                Number(idx) < rightSlotOffset + 9
                            ).length
                          : 0}{' '}
                        / 9
                      </span>
                    </div>

                    {/* 3x3 Grid */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-1">
                      {Array.from({ length: 9 }).map((_, pIdx) => {
                        const absoluteSlot = (rightSlotOffset ?? 0) + pIdx;
                        return (
                          <BinderCardPocket
                            key={absoluteSlot}
                            slotIndex={absoluteSlot}
                            displayNumber={absoluteSlot + 1}
                            card={binder.cards[absoluteSlot]}
                            cloneMode={cloneMode}
                            onAddCard={onAddCardToSlot}
                            onViewCard={onViewCard}
                            onDropCard={handleDropCard}
                            onDeleteCard={onDeleteCard}
                            onDragStartCard={() => setIsDraggingCard(true)}
                            onDragEndCard={() => {
                              setIsDraggingCard(false);
                              clearAutoFlip();
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
