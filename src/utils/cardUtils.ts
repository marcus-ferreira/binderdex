import { BinderCard } from '../types/binder';

/**
 * Normalizes collector number by stripping leading hash and trimming.
 */
export function normalizeCardNumber(num?: string): string {
  if (!num) return '';
  return num.replace(/^#/, '').trim().toLowerCase();
}

/**
 * Generates a consistent grouping key for identical copies of a card.
 * Cards with the same game, name, set, number and finish are identical copies.
 */
export function getCardGroupKey(card: BinderCard): string {
  const normName = (card.name || '').trim().toLowerCase();
  const normGame = card.game || '';
  const normSet = (card.setName || '').trim().toLowerCase();
  const normNum = normalizeCardNumber(card.collectorNumber);
  const finish = card.finish || 'normal';

  if (normSet || normNum) {
    return `${normGame}::${normName}::${normSet}::${normNum}::${finish}`;
  }
  // Fallback if set and number are empty: use name + imageUrl
  return `${normGame}::${normName}::${card.imageUrl || ''}::${finish}`;
}
