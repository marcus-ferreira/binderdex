import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { Binder } from '../types/binder';
import { exportBindersJson, importBindersJson } from '../utils/storage';

interface FooterProps {
  binders: Binder[];
  onImportSuccess: (data: { binders: Binder[] }) => void;
}

export const Footer: React.FC<FooterProps> = ({
  binders,
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportBindersJson(binders);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const importedData = importBindersJson(text);

        // Merge binders by ID or append
        const existingIds = new Set(binders.map((b) => b.id));
        const mergedBinders = [...binders];
        importedData.binders.forEach((b) => {
          if (existingIds.has(b.id)) {
            const idx = mergedBinders.findIndex((m) => m.id === b.id);
            mergedBinders[idx] = b;
          } else {
            mergedBinders.push(b);
          }
        });

        onImportSuccess({
          binders: mergedBinders,
        });
      } catch (err: unknown) {
        console.error('Falha ao importar backup JSON:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-[#0a0d14] py-6 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <p className="text-slate-500 text-xs">
            BinderDex &middot; Catalogador de Cartas em Fichários Virtuais
          </p>
          <span className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 rounded">
            v1.2.3
          </span>
        </div>

        {/* Export / Import Backup actions */}
        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Exportar backup completo de todos os fichários e cartas em JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Backup (JSON)</span>
          </button>

          <span className="text-slate-700">·</span>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Importar backup JSON previamente salvo"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restaurar / Importar</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </footer>
  );
};
