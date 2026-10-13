import React, { useState, useEffect } from 'react';
import { X, Sparkles, User, Edit3, Trash2, Copy } from 'lucide-react';
import { BinderCard } from '../types/binder';

interface CardZoomModalProps {
  card: BinderCard | null;
  slotIndex: number | null;
  onClose: () => void;
  onChangeCard?: (slotIndex: number, card: BinderCard) => void;
  onDeleteCard?: (slotIndex: number) => void;
  onCloneCard?: (card: BinderCard, slotIndex: number) => void;
}

export const CardZoomModal: React.FC<CardZoomModalProps> = ({
  card,
  slotIndex,
  onClose,
  onChangeCard,
  onDeleteCard,
  onCloneCard,
}) => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [imageError, setImageError] = useState(false);
  const [imgSrc, setImgSrc] = useState(card?.imageUrl || '');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Reset state whenever a card is opened or changed
  useEffect(() => {
    setImageError(false);
    setImgSrc(card?.imageUrl || '');
    setRotate({ x: 0, y: 0 });
    setIsConfirmingDelete(false);
  }, [card?.id, card?.imageUrl, slotIndex]);

  if (!card) return null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateY = (x / (rect.width / 2)) * 14;
    const rotateX = -(y / (rect.height / 2)) * 14;
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  const handleImageError = () => {
    if (imgSrc && imgSrc.endsWith('/high.webp')) {
      setImgSrc(imgSrc.replace('/high.webp', '/high.png'));
    } else if (imgSrc && imgSrc.endsWith('/high.png')) {
      setImgSrc(imgSrc.replace('/high.png', '/low.webp'));
    } else {
      setImageError(true);
    }
  };

  const isFoil = card.finish === 'foil' || card.finish === 'holo' || card.finish === 'secret';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-2xl w-full bg-[#121624] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-200"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Card Presentation with Interactive 3D Perspective */}
          <div className="flex justify-center items-center perspective-1000 p-2">
            <div
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
                transition: 'transform 0.1s ease-out',
              }}
              className={`relative aspect-[5/7] w-64 max-w-full rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700/80 bg-slate-900 ${
                isFoil ? 'holo-foil' : ''
              }`}
            >
              {Boolean((imgSrc || card.imageUrl)?.trim()) && !imageError ? (
                <img
                  src={(imgSrc || card.imageUrl).trim()}
                  alt={card.name}
                  onError={handleImageError}
                  className="w-full h-full object-contain object-center pointer-events-none drop-shadow-md select-none"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col justify-between p-4 bg-gradient-to-b from-slate-800 to-slate-950 text-left">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                      {card.game}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">
                      {card.name}
                    </h3>
                    {card.setName && (
                      <p className="text-xs text-slate-400">{card.setName}</p>
                    )}
                  </div>
                  <div className="border-t border-slate-700 pt-2 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>{card.rarity}</span>
                    <span>{card.collectorNumber}</span>
                  </div>
                </div>
              )}

              {/* Sleeve Gloss Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none" />
            </div>
          </div>

          {/* Card Information Panel (Strictly required fields only) */}
          <div className="space-y-4 text-left">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase font-bold tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {card.game}
                </span>
                {isFoil && (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Sparkles className="w-3 h-3" />
                    FOIL / HOLO
                  </span>
                )}
                {slotIndex !== null && (
                  <span className="text-[10px] font-mono text-slate-500 ml-auto">
                    Bolso #{slotIndex + 1}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white leading-tight">
                {card.name}
              </h2>
            </div>

            {/* Grid of properties (Only allowed fields) */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">
                  Coleção
                </span>
                <span className="font-semibold text-slate-200">
                  {card.setName || 'Padrão'}
                </span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">
                  Número
                </span>
                <span className="font-semibold text-slate-200 font-mono">
                  {card.collectorNumber || '—'}
                </span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">
                  Raridade
                </span>
                <span className="font-semibold text-slate-200">
                  {card.rarity || 'Comum'}
                </span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">
                  Acabamento
                </span>
                <span className="font-semibold text-slate-200 capitalize">
                  {card.finish}
                </span>
              </div>
            </div>

            {/* Artist / Ilustrador */}
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">
                  Ilustrador
                </span>
                <span className="text-slate-200 font-medium">
                  {card.artist || 'Desconhecido'}
                </span>
              </div>
            </div>

            {/* Action buttons to Edit or Delete card from this modal */}
            {slotIndex !== null && (
              <div className="pt-2 flex flex-col gap-2 border-t border-slate-800">
                {isConfirmingDelete ? (
                  <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-in fade-in duration-150">
                    <span className="text-xs text-rose-200 font-medium">
                      Remover carta deste bolso?
                    </span>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onDeleteCard) {
                            onDeleteCard(slotIndex);
                          }
                          onClose();
                        }}
                        className="flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer shadow-sm"
                      >
                        Confirmar Remoção
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {onCloneCard && (
                      <button
                        type="button"
                        onClick={() => {
                          onCloneCard(card, slotIndex);
                          onClose();
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-200 hover:text-white bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/60 rounded-lg transition-colors cursor-pointer shadow-sm"
                        title="Duplicar carta no próximo bolso vazio do fichário"
                      >
                        <Copy className="w-3.5 h-3.5 text-purple-400" />
                        <span>Clonar Carta</span>
                      </button>
                    )}

                    {onChangeCard && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onChangeCard(slotIndex, card);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Trocar Carta</span>
                      </button>
                    )}

                    {onDeleteCard && (
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover Carta</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
