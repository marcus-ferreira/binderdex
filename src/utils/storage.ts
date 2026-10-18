import { Binder } from '../types/binder';

const STORAGE_KEY = 'binderdex_data_v1';
const LEGACY_STORAGE_KEYS = [
  'tcg_virtual_binders_data_v4',
  'tcg_virtual_binders_data_v3',
  'tcg_virtual_binders_data_v2',
  'tcg_virtual_binders_data',
];

export function loadBindersFromStorage(): Binder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let binders: Binder[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        binders = parsed;
      }
    } else {
      // Try legacy keys if primary key is absent
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const legacyRaw = localStorage.getItem(legacyKey);
        if (legacyRaw) {
          try {
            const parsed = JSON.parse(legacyRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              binders = parsed;
              localStorage.setItem(STORAGE_KEY, JSON.stringify(binders));
              break;
            }
          } catch {
            // ignore error in legacy key
          }
        }
      }
    }

    // Ensure default condition ('NM') and language ('PT') for all cards
    binders.forEach((binder) => {
      if (binder.cards) {
        Object.values(binder.cards).forEach((card) => {
          if (!card.condition) card.condition = 'NM';
          if (!card.language) card.language = 'PT';
        });
      }
    });

    return binders;
  } catch (err) {
    console.error('Failed to load binders from storage:', err);
    return [];
  }
}

export function saveBindersToStorage(binders: Binder[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(binders));
  } catch (err) {
    console.error('Failed to save binders to storage:', err);
  }
}

export interface BindersBackup {
  version: 3;
  binders: Binder[];
  exportedAt: number;
}

export function exportBindersJson(binders: Binder[]): void {
  const payload: BindersBackup = {
    version: 3,
    binders,
    exportedAt: Date.now(),
  };
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `binderdex_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importBindersJson(jsonString: string): {
  binders: Binder[];
} {
  const parsed = JSON.parse(jsonString);
  let binders: Binder[] = [];
  if (Array.isArray(parsed)) {
    binders = parsed;
  } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.binders)) {
    binders = parsed.binders;
  } else {
    throw new Error('Formato inválido. O arquivo precisa conter um backup válido de fichários.');
  }

  binders.forEach((binder) => {
    if (binder.cards) {
      Object.values(binder.cards).forEach((card) => {
        if (!card.condition) card.condition = 'NM';
        if (!card.language) card.language = 'PT';
      });
    }
  });

  return { binders };
}
