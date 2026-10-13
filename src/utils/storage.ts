import { Binder } from '../types/binder';

const STORAGE_KEY = 'binderdex_data_v1';
const LEGACY_STORAGE_KEYS = [
  'tcg_virtual_binders_data_v4',
  'tcg_virtual_binders_data_v3',
  'tcg_virtual_binders_data_v2',
  'tcg_virtual_binders_data',
];

const DEFAULT_SAMPLE_IDS = new Set([
  'binder-pokemon-vintage',
  'binder-magic-commander',
  'binder-yugioh-classics',
]);

export const SAMPLE_BINDERS: Binder[] = [];

export function loadBindersFromStorage(): Binder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Remove any default sample binders if they somehow persisted
        const cleaned = parsed.filter((b: Binder) => !DEFAULT_SAMPLE_IDS.has(b.id));
        if (cleaned.length !== parsed.length) {
          saveBindersToStorage(cleaned);
        }
        return cleaned;
      }
    }

    // Check legacy storage keys and migrate any custom user binders, discarding default demo binders
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw) {
        try {
          const parsed = JSON.parse(legacyRaw);
          if (Array.isArray(parsed)) {
            const userBinders = parsed.filter((b: Binder) => !DEFAULT_SAMPLE_IDS.has(b.id));
            saveBindersToStorage(userBinders);
            localStorage.removeItem(legacyKey);
            return userBinders;
          }
        } catch {
          // ignore parsing error on legacy key
        }
      }
    }

    saveBindersToStorage([]);
    return [];
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

export function importBindersJson(jsonString: string): Binder[] {
  const parsed = JSON.parse(jsonString);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.binders)) {
    return parsed.binders;
  }
  throw new Error('Formato inválido. O arquivo precisa conter um backup válido de fichários.');
}
