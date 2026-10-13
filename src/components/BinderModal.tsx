import React, { useState, useEffect } from 'react';
import { X, BookPlus, Edit3, Upload, Trash2, ChevronDown } from 'lucide-react';
import { Binder, CardGame, SUPPORTED_GAMES } from '../types/binder';

interface BinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBinder: (binder: Binder) => void;
  onDeleteBinder?: (binderId: string) => void;
  initialBinder?: Binder | null;
}

export const BinderModal: React.FC<BinderModalProps> = ({
  isOpen,
  onClose,
  onSaveBinder,
  onDeleteBinder,
  initialBinder,
}) => {
  const isEditing = !!initialBinder;

  const [title, setTitle] = useState('');
  const [game, setGame] = useState<CardGame>('pokemon');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [totalSheets, setTotalSheets] = useState<number>(4);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (initialBinder) {
      setTitle(initialBinder.title);
      setGame(initialBinder.game || 'pokemon');
      setCoverImageUrl(initialBinder.coverImageUrl || '');
      setTotalSheets(Math.max(1, Math.round(initialBinder.totalPages / 2)));
      setShowDeleteConfirm(false);
    } else {
      setTitle('');
      setGame('pokemon');
      setCoverImageUrl('');
      setTotalSheets(4);
      setShowDeleteConfirm(false);
    }
  }, [initialBinder, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCoverImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const sheets = Math.max(1, Math.floor(Number(totalSheets) || 1));
    const totalPages = sheets * 2;

    const binderToSave: Binder = {
      id: initialBinder ? initialBinder.id : `binder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      game: game,
      coverImageUrl: coverImageUrl.trim() || undefined,
      ringColor: 'silver',
      totalPages,
      cards: initialBinder ? initialBinder.cards : {},
      createdAt: initialBinder ? initialBinder.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    onSaveBinder(binderToSave);
    onClose();
  };

  const handleConfirmDelete = () => {
    if (!initialBinder || !onDeleteBinder) return;
    onDeleteBinder(initialBinder.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#131724] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f131f]">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <Edit3 className="w-5 h-5 text-indigo-400" />
            ) : (
              <BookPlus className="w-5 h-5 text-indigo-400" />
            )}
            <h2 className="text-base font-bold text-white">
              {isEditing ? 'Editar Fichário' : 'Criar Novo Fichário'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Título *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Minhas Raras, Cartas Vintage, Commander..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Game Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Jogo *
            </label>
            <div className="relative">
              <select
                value={game}
                onChange={(e) => setGame(e.target.value as CardGame)}
                className="w-full appearance-none px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white font-medium focus:outline-none focus:border-indigo-500 cursor-pointer pr-10 hover:border-slate-600 transition-colors"
              >
                {SUPPORTED_GAMES.map((gameOption) => (
                  <option key={gameOption.id} value={gameOption.id} className="bg-slate-900 text-white py-1">
                    {gameOption.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Imagem da Capa
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Cole o link HTTPS da imagem ou carregue arquivo..."
                value={coverImageUrl}
                onChange={(e) => setCoverImageUrl(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white cursor-pointer transition-colors shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Arquivo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            {Boolean(coverImageUrl?.trim()) && (
              <div className="mt-2.5 flex items-center gap-3 p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                <img
                  src={coverImageUrl.trim()}
                  alt="Pré-visualização da capa"
                  className="w-12 h-14 object-cover rounded border border-slate-700 shrink-0 shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[11px] text-slate-300 truncate flex-1">
                  Imagem de capa configurada.
                </span>
                <button
                  type="button"
                  onClick={() => setCoverImageUrl('')}
                  className="text-xs text-rose-400 hover:underline cursor-pointer"
                >
                  Remover
                </button>
              </div>
            )}
          </div>

          {/* Custom Sheets (Folhas de 9 bolsos) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                Quantidade de Folhas (Frente e Verso)
              </label>
              <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                {totalSheets} {totalSheets === 1 ? 'folha' : 'folhas'} ({totalSheets * 18} bolsos)
              </span>
            </div>
            <input
              type="number"
              min={1}
              max={50}
              required
              value={totalSheets}
              onChange={(e) => setTotalSheets(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Delete Confirmation Box */}
          {showDeleteConfirm && initialBinder && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-xl space-y-2 animate-in fade-in duration-150">
              <p className="text-xs text-rose-200 leading-relaxed">
                Tem certeza que deseja excluir o fichário <strong className="text-white">&quot;{initialBinder.title}&quot;</strong> e todas as suas cartas? Esta ação é definitiva e não pode ser revertida.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="pt-3 flex items-center justify-between border-t border-slate-800">
            {isEditing && onDeleteBinder && !showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Fichário</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-transparent rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {isEditing ? 'Salvar Alterações' : 'Criar Fichário'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
