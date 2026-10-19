import { Binder, BinderCard, CardGame } from '../types/binder';
import pokemonSetCountsData from '../data/pokemonSetCounts.json';
import battleScenesCards from '../data/battleScenesCards.json';

// Battle Scenes set card totals
const BATTLE_SCENES_SET_COUNTS: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  battleScenesCards.forEach((c) => {
    if (c.setName) {
      map[c.setName.toLowerCase().trim()] = (map[c.setName.toLowerCase().trim()] || 0) + 1;
    }
  });
  return map;
})();

// Magic common set totals fallback
const MAGIC_SET_COUNTS: Record<string, number> = {
  'foundations': 261,
  'duskmourn: house of horror': 276,
  'bloomburrow': 261,
  'modern horizons 3': 261,
  'outlaws of thunder junction': 276,
  'murders at karlov manor': 276,
  'the lost caverns of ixalan': 291,
  'wilds of eldraine': 261,
  'commander masters': 436,
  'the lord of the rings: tales of middle-earth': 281,
  'march of the machine': 281,
  'phyrexia: all will be one': 271,
  'the brothers\' war': 287,
  'dominaria united': 281,
  'streets of new capenna': 281,
  'kamigawa: neon dynasty': 302,
  'innistrad: crimson vow': 277,
  'innistrad: midnight hunt': 277,
  'adventures in the forgotten realms': 281,
  'modern horizons 2': 303,
  'strixhaven: school of mages': 275,
  'kaldheim': 285,
  'commander legends': 361,
  'zendikar rising': 280,
  'core set 2021': 274,
  'ikoria: lair of behemoths': 274,
  'theros beyond death': 254,
  'throne of eldraine': 269,
  'modern horizons': 254,
  'war of the spark': 264,
  'ravnica allegiance': 259,
  'guilds of ravnica': 259,
  'core set 2019': 280,
  'dominaria': 269,
  'innistrad': 264,
  'zendikar': 249,
  'alpha': 295,
  'beta': 302,
  'unlimited': 302,
  'revised': 306,
  'fourth edition': 378,
};

// Yu-Gi-Oh! popular set totals fallback
const YUGIOH_SET_COUNTS: Record<string, number> = {
  'legend of blue eyes white dragon': 126,
  'metal raiders': 144,
  'magic ruler': 104,
  'spell ruler': 104,
  'pharaoh\'s servant': 105,
  'labyrinth of nightmare': 105,
  'legacy of darkness': 101,
  'pharaonic guardian': 100,
  'magician\'s force': 108,
  'dark crisis': 100,
  'invasion of chaos': 112,
  'ancient sanctuary': 112,
  'soul of the duelist': 60,
  'rise of destiny': 60,
  'flaming eternity': 60,
  'the lost art promotion': 50,
  '25th anniversary rarity collection': 79,
  '25th anniversary rarity collection ii': 79,
  'battles of legend: chapter 1': 143,
  'battles of legend: monstrous revenge': 102,
  'legacy of destruction': 101,
  'phantom nightmare': 101,
  'age of overlord': 101,
  'duelist nexus': 101,
  'cyberstorm access': 101,
  'photon hypernova': 101,
  'darkwing blast': 101,
  'power of the elements': 101,
  'dimension force': 101,
  'battle of chaos': 101,
  'burst of destiny': 101,
  'dawn of majesty': 101,
  'lightning overdrive': 101,
  'blazing vortex': 101,
  'phantom rage': 101,
  'rise of the duelist': 101,
  'eternity code': 101,
  'ignition assault': 101,
  'chaos impact': 101,
};

// Digimon popular sets fallback
const DIGIMON_SET_COUNTS: Record<string, number> = {
  'special release booster ver.1.0': 187,
  'special release booster ver.1.5': 152,
  'release special booster': 187,
  'bt-01': 115,
  'bt-02': 112,
  'bt-03': 112,
  'bt-04': 115,
  'bt-05': 112,
  'bt-06': 112,
  'bt-07': 112,
  'bt-08': 112,
  'bt-09': 112,
  'bt-10': 113,
  'bt-11': 112,
  'bt-12': 112,
  'bt-13': 112,
  'bt-14': 102,
  'bt-15': 102,
  'bt-16': 107,
  'bt-17': 107,
  'ex-01': 73,
  'ex-02': 74,
  'ex-03': 74,
  'ex-04': 74,
  'ex-05': 74,
  'ex-06': 77,
};

export interface CollectionProgressItem {
  game: CardGame;
  setName: string;
  cleanSetName: string;
  year?: number;
  totalInSet: number;
  ownedUniqueCount: number;
  totalCardsOwned: number; // includes duplicates
  missingCount: number;
  percentage: number;
  ownedCardNumbers: string[];
  ownedCardNames: string[];
  cards: BinderCard[];
}

/**
 * Clean set name by removing trailing year in parentheses: e.g. "Base Set (1999)" -> "Base Set"
 */
export function cleanSetName(setName: string): string {
  if (!setName) return '';
  return setName.replace(/\s*\(\d{4}\)$/, '').trim();
}

/**
 * Extract release year from set name if present: e.g. "Base Set (1999)" -> 1999
 */
export function extractYearFromSetName(setName: string): number | undefined {
  if (!setName) return undefined;
  const match = setName.match(/\((\d{4})\)$/);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Try to extract total set count from a collector number like "1/102", "024/064", "SWSH001/SWSH100"
 */
export function extractTotalFromCollectorNumber(collectorNumber: string): number | null {
  if (!collectorNumber) return null;
  const match = collectorNumber.match(/\/\s*([0-9]{1,4})\b/);
  if (match) {
    const val = parseInt(match[1], 10);
    if (!isNaN(val) && val > 0 && val < 5000) {
      return val;
    }
  }
  return null;
}

/**
 * Determine the official total cards in a set for any supported game.
 */
export function getSetTotalCards(
  game: CardGame,
  setName: string,
  sampleCollectorNumbers: string[] = []
): number {
  const cleaned = cleanSetName(setName).toLowerCase();

  // 1. Try sample collector numbers first if they have "X/Y" (most direct and accurate for the specific card edition)
  for (const num of sampleCollectorNumbers) {
    const extracted = extractTotalFromCollectorNumber(num);
    if (extracted && extracted > 0) {
      return extracted;
    }
  }

  // 2. Game-specific lookup maps
  if (game === 'pokemon') {
    const pkmCounts = pokemonSetCountsData as Record<string, number>;
    if (pkmCounts[cleaned]) {
      return pkmCounts[cleaned];
    }
    // Partial search for pokemon set names (e.g. "Base Set (1999)" -> "base set")
    const foundKey = Object.keys(pkmCounts).find(
      (k) => k === cleaned || cleaned.includes(k) || k.includes(cleaned)
    );
    if (foundKey && pkmCounts[foundKey]) {
      return pkmCounts[foundKey];
    }
  } else if (game === 'battlescenes') {
    if (BATTLE_SCENES_SET_COUNTS[cleaned]) {
      return BATTLE_SCENES_SET_COUNTS[cleaned];
    }
    const foundKey = Object.keys(BATTLE_SCENES_SET_COUNTS).find(
      (k) => k === cleaned || cleaned.includes(k)
    );
    if (foundKey) {
      return BATTLE_SCENES_SET_COUNTS[foundKey];
    }
  } else if (game === 'magic') {
    if (MAGIC_SET_COUNTS[cleaned]) {
      return MAGIC_SET_COUNTS[cleaned];
    }
    const foundKey = Object.keys(MAGIC_SET_COUNTS).find(
      (k) => k === cleaned || cleaned.includes(k)
    );
    if (foundKey) {
      return MAGIC_SET_COUNTS[foundKey];
    }
  } else if (game === 'yugioh') {
    if (YUGIOH_SET_COUNTS[cleaned]) {
      return YUGIOH_SET_COUNTS[cleaned];
    }
    const foundKey = Object.keys(YUGIOH_SET_COUNTS).find(
      (k) => k === cleaned || cleaned.includes(k)
    );
    if (foundKey) {
      return YUGIOH_SET_COUNTS[foundKey];
    }
  } else if (game === 'digimon') {
    if (DIGIMON_SET_COUNTS[cleaned]) {
      return DIGIMON_SET_COUNTS[cleaned];
    }
    const foundKey = Object.keys(DIGIMON_SET_COUNTS).find(
      (k) => k === cleaned || cleaned.includes(k)
    );
    if (foundKey) {
      return DIGIMON_SET_COUNTS[foundKey];
    }
  }

  // 3. Fallback: derive from highest integer number in sample numbers
  let maxNum = 0;
  for (const num of sampleCollectorNumbers) {
    const rawDigits = num.replace(/\D/g, '');
    const parsed = parseInt(rawDigits, 10);
    if (!isNaN(parsed) && parsed > maxNum && parsed < 2000) {
      maxNum = parsed;
    }
  }
  if (maxNum > 0) {
    return maxNum;
  }

  // 4. Ultimate fallback if set total is completely unknown: default to 100
  return 100;
}

/**
 * Calculates complete collection progress across all user binders.
 */
export function calculateAllCollectionsProgress(
  binders: Binder[],
  filterGame?: CardGame | 'all'
): CollectionProgressItem[] {
  // Group cards by game + cleanSetName
  const setGroups: Record<
    string,
    {
      game: CardGame;
      originalSetName: string;
      cleanName: string;
      cards: BinderCard[];
    }
  > = {};

  binders.forEach((binder) => {
    Object.values(binder.cards).forEach((card) => {
      if (!card.setName) return;
      if (filterGame && filterGame !== 'all' && card.game !== filterGame) return;

      const cleanName = cleanSetName(card.setName);
      const groupKey = `${card.game}:::${cleanName.toLowerCase()}`;

      if (!setGroups[groupKey]) {
        setGroups[groupKey] = {
          game: card.game,
          originalSetName: card.setName,
          cleanName,
          cards: [],
        };
      }
      setGroups[groupKey].cards.push(card);
    });
  });

  const results: CollectionProgressItem[] = [];

  Object.values(setGroups).forEach((group) => {
    const sampleNumbers = group.cards
      .map((c) => c.collectorNumber)
      .filter((n): n is string => Boolean(n));

    const totalInSet = getSetTotalCards(group.game, group.originalSetName, sampleNumbers);

    // Unique owned cards (identified by unique collector number, or fallback to card name)
    const uniqueIdentifiers = new Set<string>();
    const ownedCardNumbers: string[] = [];
    const ownedCardNames: string[] = [];

    group.cards.forEach((c) => {
      const identifier = c.collectorNumber?.trim()
        ? c.collectorNumber.trim().toLowerCase()
        : c.name.trim().toLowerCase();

      if (!uniqueIdentifiers.has(identifier)) {
        uniqueIdentifiers.add(identifier);
        if (c.collectorNumber) ownedCardNumbers.push(c.collectorNumber);
        if (c.name && !ownedCardNames.includes(c.name)) ownedCardNames.push(c.name);
      }
    });

    const ownedUniqueCount = uniqueIdentifiers.size;
    const missingCount = Math.max(0, totalInSet - ownedUniqueCount);
    const percentage = totalInSet > 0 ? Math.min(100, Math.round((ownedUniqueCount / totalInSet) * 100)) : 0;
    const year = extractYearFromSetName(group.originalSetName);

    results.push({
      game: group.game,
      setName: group.originalSetName,
      cleanSetName: group.cleanName,
      year,
      totalInSet,
      ownedUniqueCount,
      totalCardsOwned: group.cards.length,
      missingCount,
      percentage,
      ownedCardNumbers,
      ownedCardNames,
      cards: group.cards,
    });
  });

  // Sort by percentage descending, then by owned count descending
  results.sort((a, b) => b.percentage - a.percentage || b.ownedUniqueCount - a.ownedUniqueCount || a.setName.localeCompare(b.setName));

  return results;
}

/**
 * Get progress for a specific collection name
 */
export function getSingleCollectionProgress(
  binders: Binder[],
  setName: string,
  game?: CardGame
): CollectionProgressItem | null {
  if (!setName || setName === 'all') return null;

  const all = calculateAllCollectionsProgress(binders, game);
  const targetClean = cleanSetName(setName).toLowerCase();

  return (
    all.find(
      (item) =>
        item.cleanSetName.toLowerCase() === targetClean ||
        cleanSetName(item.setName).toLowerCase() === targetClean
    ) || null
  );
}
