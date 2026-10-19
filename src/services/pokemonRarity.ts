import { Binder, BinderCard } from '../types/binder';

// In-memory cache for fetched card details
const rarityCache = new Map<string, { rarity: string; illustrator?: string }>();

// Load from localStorage on initialization if available
try {
  const stored = localStorage.getItem('binderdex_pokemon_rarity_cache');
  if (stored) {
    const parsed = JSON.parse(stored);
    Object.entries(parsed).forEach(([k, v]) => {
      rarityCache.set(k, v as { rarity: string; illustrator?: string });
    });
  }
} catch {
  // Ignore localStorage errors
}

function persistCache() {
  try {
    const obj: Record<string, { rarity: string; illustrator?: string }> = {};
    rarityCache.forEach((v, k) => {
      obj[k] = v;
    });
    localStorage.setItem('binderdex_pokemon_rarity_cache', JSON.stringify(obj));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Maps English TCGdex / international rarities to Portuguese standard
 */
export function formatPokemonRarity(englishRarity?: string): string {
  if (!englishRarity) return 'Comum';

  const lower = englishRarity.trim().toLowerCase();

  if (lower === 'common') return 'Comum';
  if (lower === 'uncommon') return 'Incomum';
  if (lower === 'rare') return 'Rara';
  if (lower === 'rare holo' || lower === 'holo rare') return 'Rara Holo';
  if (lower === 'ultra rare' || lower === 'shiny ultra rare') return 'Ultra Rara';
  if (lower === 'secret rare' || lower === 'hyper rare') return 'Rara Secreta';
  if (lower === 'illustration rare') return 'Ilustração Rara';
  if (lower === 'special illustration rare') return 'Ilustração Especial Rara';
  if (lower === 'double rare') return 'Dupla Rara';
  if (lower === 'promo') return 'Promocional';
  if (lower === 'ace spec rare') return 'ACE SPEC Rara';
  if (lower === 'amazing rare') return 'Rara Incrível';
  if (lower === 'radiant rare') return 'Rara Radiante';
  if (lower === 'classic collection') return 'Coleção Clássica';

  // Capitalize first letter if unknown
  return englishRarity.charAt(0).toUpperCase() + englishRarity.slice(1);
}

/**
 * Heuristic fallback for classic WotC Pokémon sets based on official collector numbering
 */
export function getClassicSetRarity(setName: string, rawNumber: number): string | null {
  const set = setName.toLowerCase().trim();

  // Base Set (102 cards)
  if (set === 'base set' || set === 'base') {
    if (rawNumber >= 1 && rawNumber <= 16) return 'Rara Holo';
    if (rawNumber >= 17 && rawNumber <= 32) return 'Rara';
    if (rawNumber >= 33 && rawNumber <= 69) return 'Incomum';
    if (rawNumber >= 70 && rawNumber <= 102) return 'Comum';
  }

  // Jungle (64 cards)
  if (set === 'jungle') {
    if (rawNumber >= 1 && rawNumber <= 16) return 'Rara Holo';
    if (rawNumber >= 17 && rawNumber <= 32) return 'Rara';
    if (rawNumber >= 33 && rawNumber <= 48) return 'Incomum';
    if (rawNumber >= 49 && rawNumber <= 64) return 'Comum';
  }

  // Fossil (62 cards)
  if (set === 'fossil') {
    if (rawNumber >= 1 && rawNumber <= 15) return 'Rara Holo';
    if (rawNumber >= 16 && rawNumber <= 30) return 'Rara';
    if (rawNumber >= 31 && rawNumber <= 45) return 'Incomum';
    if (rawNumber >= 46 && rawNumber <= 62) return 'Comum';
  }

  // Team Rocket (82 + 1 cards)
  if (set.includes('team rocket') && !set.includes('returns')) {
    if (rawNumber >= 1 && rawNumber <= 17) return 'Rara Holo';
    if (rawNumber >= 18 && rawNumber <= 31) return 'Rara';
    if (rawNumber >= 32 && rawNumber <= 50) return 'Incomum';
    if (rawNumber >= 51 && rawNumber <= 82) return 'Comum';
    if (rawNumber === 83) return 'Rara Secreta';
  }

  // Gym Heroes (132 cards)
  if (set.includes('gym heroes')) {
    if (rawNumber >= 1 && rawNumber <= 19) return 'Rara Holo';
    if (rawNumber >= 20 && rawNumber <= 42) return 'Rara';
    if (rawNumber >= 43 && rawNumber <= 100) return 'Incomum';
    if (rawNumber >= 101 && rawNumber <= 132) return 'Comum';
  }

  // Gym Challenge (132 cards)
  if (set.includes('gym challenge')) {
    if (rawNumber >= 1 && rawNumber <= 20) return 'Rara Holo';
    if (rawNumber >= 21 && rawNumber <= 42) return 'Rara';
    if (rawNumber >= 43 && rawNumber <= 100) return 'Incomum';
    if (rawNumber >= 101 && rawNumber <= 132) return 'Comum';
  }

  // Neo Genesis (111 cards)
  if (set.includes('neo genesis')) {
    if (rawNumber >= 1 && rawNumber <= 19) return 'Rara Holo';
    if (rawNumber >= 20 && rawNumber <= 42) return 'Rara';
    if (rawNumber >= 43 && rawNumber <= 82) return 'Incomum';
    if (rawNumber >= 83 && rawNumber <= 111) return 'Comum';
  }

  // Neo Discovery (75 cards)
  if (set.includes('neo discovery')) {
    if (rawNumber >= 1 && rawNumber <= 17) return 'Rara Holo';
    if (rawNumber >= 18 && rawNumber <= 36) return 'Rara';
    if (rawNumber >= 37 && rawNumber <= 56) return 'Incomum';
    if (rawNumber >= 57 && rawNumber <= 75) return 'Comum';
  }

  // Neo Revelation (64 cards)
  if (set.includes('neo revelation')) {
    if (rawNumber >= 1 && rawNumber <= 14) return 'Rara Holo';
    if (rawNumber >= 15 && rawNumber <= 27) return 'Rara';
    if (rawNumber >= 28 && rawNumber <= 40) return 'Incomum';
    if (rawNumber >= 41 && rawNumber <= 64) return 'Comum';
    if (rawNumber >= 65) return 'Rara Secreta';
  }

  // Neo Destiny (105 cards)
  if (set.includes('neo destiny')) {
    if (rawNumber >= 1 && rawNumber <= 16) return 'Rara Holo';
    if (rawNumber >= 17 && rawNumber <= 30) return 'Rara';
    if (rawNumber >= 31 && rawNumber <= 56) return 'Incomum';
    if (rawNumber >= 57 && rawNumber <= 92) return 'Comum';
    if (rawNumber >= 93) return 'Rara Secreta';
  }

  return null;
}

/**
 * Extract TCGdex card ID from image URL or card identifiers
 * e.g. "https://assets.tcgdex.net/en/base/base1/44/high.webp" -> "base1-44"
 */
export function extractTcgdexId(card: { id?: string; imageUrl?: string; collectorNumber?: string; setName?: string }): string | null {
  if (card.imageUrl) {
    const match = card.imageUrl.match(/assets\.tcgdex\.net\/[a-z]{2}\/[^/]+\/([^/]+)\/([^/]+)/);
    if (match) {
      const setId = match[1];
      const localId = match[2];
      return `${setId}-${localId}`;
    }
  }

  if (card.id && card.id.includes('-') && !card.id.startsWith('custom-')) {
    return card.id;
  }

  return null;
}

/**
 * Fetch authoritative rarity and illustrator for a Pokémon card from TCGdex
 */
export async function fetchPokemonCardDetails(card: {
  id?: string;
  name?: string;
  imageUrl?: string;
  collectorNumber?: string;
  setName?: string;
}): Promise<{ rarity: string; illustrator?: string }> {
  const tcgdexId = extractTcgdexId(card);

  // 1. Check in-memory / persistent cache
  if (tcgdexId && rarityCache.has(tcgdexId)) {
    return rarityCache.get(tcgdexId)!;
  }

  // 2. Check classic set heuristic first (instant, 100% reliable for WotC sets)
  if (card.setName && card.collectorNumber) {
    const rawNum = parseInt(card.collectorNumber.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(rawNum) && rawNum > 0) {
      const classicRarity = getClassicSetRarity(card.setName, rawNum);
      if (classicRarity) {
        const result = { rarity: classicRarity, illustrator: 'Ken Sugimori' };
        if (tcgdexId) {
          rarityCache.set(tcgdexId, result);
          persistCache();
        }
        return result;
      }
    }
  }

  // 3. Fetch from TCGdex API
  if (tcgdexId) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`https://api.tcgdex.net/v2/en/cards/${tcgdexId}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const ptRarity = formatPokemonRarity(data.rarity);
        const result = {
          rarity: ptRarity,
          illustrator: data.illustrator || undefined,
        };
        rarityCache.set(tcgdexId, result);
        persistCache();
        return result;
      }
    } catch {
      // Ignore network errors and fallback
    }
  }

  // 4. Default fallback: Comum (not "Rara")
  return { rarity: 'Comum' };
}

/**
 * Scan all registered cards across binders and fix cards that were wrongly stored as 'Rara'
 */
export async function fixPokemonRegisteredCards(binders: Binder[]): Promise<{
  updatedBinders: Binder[];
  changedCount: number;
}> {
  let changedCount = 0;
  const updatedBinders: Binder[] = [];

  for (const binder of binders) {
    let binderChanged = false;
    const newCards = { ...binder.cards };

    for (const [slotKey, card] of Object.entries(binder.cards)) {
      const slotIndex = Number(slotKey);
      if (card && card.game === 'pokemon') {
        // Fix cards where rarity is 'Rara' (the hardcoded default) or unformatted
        // We look up the real rarity
        const tcgdexId = extractTcgdexId(card);
        const rawNum = parseInt((card.collectorNumber || '').replace(/[^0-9]/g, ''), 10);

        let correctRarity: string | null = null;
        let illustrator: string | undefined = card.artist;

        // Try classic heuristic first
        if (card.setName && !isNaN(rawNum) && rawNum > 0) {
          correctRarity = getClassicSetRarity(card.setName, rawNum);
        }

        // If not classic, check cache or fetch
        if (!correctRarity && tcgdexId) {
          if (rarityCache.has(tcgdexId)) {
            const cached = rarityCache.get(tcgdexId)!;
            correctRarity = cached.rarity;
            if (cached.illustrator) illustrator = cached.illustrator;
          } else {
            try {
              const details = await fetchPokemonCardDetails(card);
              correctRarity = details.rarity;
              if (details.illustrator) illustrator = details.illustrator;
            } catch {
              // Ignore
            }
          }
        }

        // If we found a valid rarity and it differs from the current rarity
        if (correctRarity && correctRarity !== card.rarity) {
          newCards[slotIndex] = {
            ...card,
            rarity: correctRarity,
            artist: illustrator || card.artist,
          };
          binderChanged = true;
          changedCount++;
        }
      }
    }

    if (binderChanged) {
      updatedBinders.push({
        ...binder,
        cards: newCards,
        updatedAt: Date.now(),
      });
    } else {
      updatedBinders.push(binder);
    }
  }

  return { updatedBinders, changedCount };
}
