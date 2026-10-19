import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, Copy, Trash2 } from 'lucide-react';
import { BinderCard } from '../types/binder';

interface BinderCardPocketProps {
  slotIndex: number;
  displayNumber: number;
  card?: BinderCard;
  onAddCard: (slotIndex: number) => void;
  onViewCard: (card: BinderCard, slotIndex: number) => void;
  onDropCard: (sourceIndex: number, targetIndex: number, isCloneIntent?: boolean) => void;
  onDeleteCard?: (slotIndex: number) => void;
  onDragStartCard?: (slotIndex: number) => void;
  onDragEndCard?: () => void;
}

export const BinderCardPocket: React.FC<BinderCardPocketProps> = ({
  slotIndex,
  displayNumber,
  card,
  onAddCard,
  onViewCard,
  onDropCard,
  onDeleteCard,
  onDragStartCard,
  onDragEndCard,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imgSrc, setImgSrc] = useState(card?.imageUrl || '');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCloneIntent, setIsCloneIntent] = useState(false);

  useEffect(() => {
    setImageError(false);
    setImgSrc(card?.imageUrl || '');
  }, [card?.id, card?.imageUrl]);

  const handleImageError = () => {
    if (imgSrc && imgSrc.endsWith('/high.webp')) {
      setImgSrc(imgSrc.replace('/high.webp', '/high.png'));
    } else if (imgSrc && imgSrc.endsWith('/high.png')) {
      setImgSrc(imgSrc.replace('/high.png', '/low.webp'));
    } else {
      setImageError(true);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', slotIndex.toString());
    e.dataTransfer.effectAllowed = 'copyMove';
    onDragStartCard?.(slotIndex);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const isClone = Boolean(e.altKey || e.ctrlKey || e.metaKey);
    // If pocket is occupied, cannot clone onto it
    if (isClone && card) {
      e.dataTransfer.dropEffect = 'none';
    } else {
      e.dataTransfer.dropEffect = isClone ? 'copy' : 'move';
    }
    if (!isDragOver) setIsDragOver(true);
    setIsCloneIntent(isClone);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    const isClone = Boolean(e.altKey || e.ctrlKey || e.metaKey);
    setIsDragOver(true);
    setIsCloneIntent(isClone);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const currentTarget = e.currentTarget as HTMLElement;
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setIsDragOver(false);
      setIsCloneIntent(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setIsCloneIntent(false);
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (sourceIndexStr !== '') {
      const sourceIndex = parseInt(sourceIndexStr, 10);
      if (!isNaN(sourceIndex) && sourceIndex !== slotIndex) {
        const isClone = Boolean(e.altKey || e.ctrlKey || e.metaKey);
        onDropCard(sourceIndex, slotIndex, isClone);
      }
    }
  };

  const finishClass =
    card?.finish === 'foil'
      ? 'finish-foil'
      : card?.finish === 'holo'
      ? 'finish-holo'
      : card?.finish === 'reverse'
      ? 'finish-reverse'
      : card?.finish === 'secret'
      ? 'finish-secret'
      : '';
  const isFoil = Boolean(card && card.finish && card.finish !== 'normal');

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative aspect-[5/7] w-full rounded-md transition-all duration-200 select-none ${
        isDragOver
          ? isCloneIntent && !card
            ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900 scale-[1.02]'
            : 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900 scale-[1.02]'
          : ''
      }`}
    >
      {/* Polypropylene card page pocket frame - exact identical container for both empty and filled pockets */}
      <div className="w-full h-full rounded-md border border-slate-700/60 bg-[#161a26]/90 shadow-inner overflow-hidden pocket-sleeve p-1.5 flex flex-col justify-between relative">
        {/* Top-loading sleeve edge simulation */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-white/20 z-10 pointer-events-none" />

        {card ? (
          // OCCUPIED POCKET - Exact same inner box size, click to open full details/edit modal
          <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={() => onDragEndCard?.()}
            onClick={() => onViewCard(card, slotIndex)}
            className={`relative w-full h-full flex flex-col cursor-pointer overflow-hidden rounded-[3px] border border-slate-800 bg-slate-900 group hover:ring-2 hover:ring-indigo-500/70 transition-all ${finishClass}`}
            title="Clique para ver detalhes"
          >
            {Boolean((imgSrc || card.imageUrl)?.trim()) && !imageError ? (
              <img
                src={(imgSrc || card.imageUrl).trim()}
                alt={card.name}
                onError={handleImageError}
                className="w-full h-full object-cover object-center pointer-events-none transition-transform duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col justify-between p-2 bg-gradient-to-b from-slate-800 to-slate-950 text-left">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      {card.game}
                    </span>
                    {isFoil && <Sparkles className="w-3 h-3 text-amber-300" />}
                  </div>
                  <p className="text-xs font-bold text-slate-100 line-clamp-2 leading-tight">
                    {card.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {card.setName}
                  </p>
                </div>

                <div className="pt-1.5 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="truncate">{card.rarity}</span>
                  <span>{card.collectorNumber}</span>
                </div>
              </div>
            )}

            {/* Condition/Language Overlay */}
            <div className="absolute bottom-1 right-1 z-20 pointer-events-none">
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-black/80 text-white rounded shadow-sm border border-slate-700/80">
                {[card.condition || 'NM', card.language || 'PT'].join(' • ')}
              </span>
            </div>

            {/* Foil indicator */}
            {isFoil && (
              <div className="absolute bottom-1.5 left-1.5 z-20 pointer-events-none">
                <span className="px-1.5 py-0.5 text-[8px] font-mono uppercase bg-amber-400 text-black font-extrabold rounded shadow-sm">
                  {card.finish === 'reverse' ? 'REV' : card.finish}
                </span>
              </div>
            )}

            {/* Quick delete button on hover (no confirmation needed) */}
            {onDeleteCard && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCard(slotIndex);
                }}
                className="absolute top-1 left-1 z-30 p-1 rounded-md bg-black/80 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500 opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer shadow-md"
                title="Excluir carta do bolso"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Card slot number mark */}
            <div className="absolute top-1 right-1 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="px-1 py-0.2 text-[8px] font-mono text-slate-400 bg-black/60 rounded">
                #{displayNumber}
              </span>
            </div>
          </div>
        ) : (
          // EMPTY POCKET - Exact same inner box size (p-1.5 border area matches occupied inner card)
          <button
            type="button"
            onClick={() => onAddCard(slotIndex)}
            className={`w-full h-full rounded-[3px] border border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group/btn ${
              isDragOver
                ? isCloneIntent
                  ? 'border-purple-400 bg-purple-950/40 text-purple-200'
                  : 'border-indigo-400 bg-indigo-950/40 text-indigo-200'
                : 'border-slate-700/70 hover:border-indigo-400/80 bg-slate-900/40 hover:bg-slate-800/60 text-slate-500 hover:text-slate-200'
            }`}
            title={`Adicionar carta no bolso #${displayNumber}`}
          >
            {isDragOver ? (
              <div className="flex flex-col items-center justify-center p-1 text-center animate-pulse">
                {isCloneIntent ? (
                  <>
                    <Copy className="w-5 h-5 text-purple-400 mb-1" />
                    <span className="text-[10px] font-bold text-purple-300">Clonar</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-indigo-400 mb-1" />
                    <span className="text-[10px] font-bold text-indigo-300">Mover</span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-1 text-center group-hover/btn:scale-110 transition-transform">
                <Plus className="w-4 h-4 text-slate-600 group-hover/btn:text-indigo-400 mb-0.5 transition-colors" />
                <span className="text-[9px] font-mono text-slate-600 group-hover/btn:text-slate-300 transition-colors">
                  #{displayNumber}
                </span>
              </div>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
