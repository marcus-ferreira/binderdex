import { CardGame, CardFinish } from '../types/binder';

export interface ApiCardResult {
  apiId: string;
  name: string;
  game: CardGame;
  imageUrl: string;
  finish: CardFinish;
  setName: string;
  collectorNumber: string;
  rarity: string;
  artist: string;
  rawNumber: number; // For clean numerical sorting
  origin?: 'api' | 'standalone' | 'binder';
  originalCardId?: string;
  sourceBinderId?: string;
  sourceSlotIndex?: number;
  availableCopies?: number;
}

// Helper to auto-detect finish based on card rarity and attributes
export function detectFinish(rarity?: string, name?: string, variants?: any): CardFinish {
  if (variants) {
    if (variants.secret || variants.wPromo) return 'secret';
    if (variants.holo) return 'holo';
    if (variants.reverse) return 'reverse';
  }
  const str = `${rarity || ''} ${name || ''}`.toLowerCase();
  if (
    str.includes('secret') ||
    str.includes('ghost') ||
    str.includes('starlight') ||
    str.includes('quarter century') ||
    str.includes('collector\'s rare') ||
    str.includes('prismatic') ||
    str.includes('special illustration') ||
    str.includes('hyper rare')
  ) {
    return 'secret';
  }
  if (
    str.includes('holo') ||
    str.includes('holographic') ||
    str.includes('illustration rare') ||
    str.includes('shiny')
  ) {
    return 'holo';
  }
  if (
    str.includes('foil') ||
    str.includes('mythic') ||
    str.includes('ultra rare') ||
    str.includes('super rare') ||
    str.includes('masterpiece')
  ) {
    return 'foil';
  }
  if (str.includes('reverse')) {
    return 'reverse';
  }
  return 'normal';
}

function parseRawNumber(numStr?: string): number {
  if (!numStr) return 999999;
  const match = numStr.match(/\d+/);
  return match ? parseInt(match[0], 10) : 999999;
}

// In-memory cache for tcgdex sets
let tcgdexSetsCache: { id: string; name: string }[] | null = null;
async function fetchTcgdexSets(): Promise<{ id: string; name: string }[]> {
  if (tcgdexSetsCache && tcgdexSetsCache.length > 0) return tcgdexSetsCache;
  try {
    const res = await fetch('https://api.tcgdex.net/v2/en/sets');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        tcgdexSetsCache = data.map((s: any) => ({ id: s.id, name: s.name }));
        return tcgdexSetsCache;
      }
    }
  } catch (err) {
    console.warn('Could not prefetch tcgdex sets:', err);
  }
  return [];
}

export async function searchCards(
  game: CardGame,
  nameQuery: string,
  rawSetQuery: string
): Promise<ApiCardResult[]> {
  const nameTrimmed = nameQuery.trim();
  // Strip year in parenthesis, e.g., "Base Set (1999)" -> "Base Set"
  const setClean = rawSetQuery.replace(/\s*\(\d{4}\)$/, '').trim();

  if (!nameTrimmed && !setClean) return [];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    // MAGIC: THE GATHERING (Scryfall)
    if (game === 'magic') {
      let queryParam = '';
      if (nameTrimmed && setClean) {
        queryParam = `!"${nameTrimmed}" (set:"${setClean}" or e:"${setClean}")`;
      } else if (nameTrimmed) {
        queryParam = nameTrimmed;
      } else {
        queryParam = `(set:"${setClean}" or e:"${setClean}")`;
      }

      let res = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(queryParam)}&order=name`,
        { signal: controller.signal }
      );

      // If strict quote search returned 404, fall back to soft search
      if (!res.ok && res.status === 404 && nameTrimmed && setClean) {
        const fallbackQuery = `${nameTrimmed} (set:"${setClean}" or e:"${setClean}")`;
        res = await fetch(
          `https://api.scryfall.com/cards/search?q=${encodeURIComponent(fallbackQuery)}&order=name`,
          { signal: controller.signal }
        );
      }

      clearTimeout(timeoutId);

      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error('Falha ao consultar a API da Scryfall.');
      }

      const data = await res.json();
      if (!data.data || !Array.isArray(data.data)) return [];

      let list = data.data.slice(0, 40).map((c: any) => {
        const image =
          c.image_uris?.normal ||
          c.image_uris?.large ||
          c.card_faces?.[0]?.image_uris?.normal ||
          '';

        const cardRarity = formatRarity(c.rarity);
        const cardFinish = detectFinish(cardRarity, c.name);

        return {
          apiId: c.id,
          name: c.name,
          game: 'magic' as CardGame,
          imageUrl: image,
          finish: cardFinish,
          setName: c.set_name || '',
          collectorNumber: c.collector_number ? `#${c.collector_number}` : '',
          rarity: cardRarity,
          artist: c.artist || 'Desconhecido',
          rawNumber: parseRawNumber(c.collector_number),
        };
      });

      // If user specified setClean, filter strictly so only cards from this set are returned
      if (setClean) {
        const filtered = list.filter((c: ApiCardResult) =>
          c.setName.toLowerCase().includes(setClean.toLowerCase())
        );
        if (filtered.length > 0) list = filtered;
      }

      return list;
    }

    // YU-GI-OH! (YGOPRODeck)
    if (game === 'yugioh') {
      let url = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?num=100&offset=0';
      if (nameTrimmed && setClean) {
        url += `&fname=${encodeURIComponent(nameTrimmed)}&cardset=${encodeURIComponent(setClean)}`;
      } else if (nameTrimmed) {
        url += `&fname=${encodeURIComponent(nameTrimmed)}`;
      } else if (setClean) {
        url += `&cardset=${encodeURIComponent(setClean)}`;
      }

      let res = await fetch(url, { signal: controller.signal });

      // If strict cardset+fname failed, try fname only and filter client-side
      if (!res.ok && nameTrimmed && setClean) {
        res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(nameTrimmed)}`, {
          signal: controller.signal,
        });
      }

      clearTimeout(timeoutId);

      if (!res.ok) {
        if (res.status === 400 || res.status === 404) return [];
        throw new Error('Falha ao consultar a API do YGOPRODeck.');
      }

      const data = await res.json();
      if (!data.data || !Array.isArray(data.data)) return [];

      let list: ApiCardResult[] = [];

      data.data.forEach((c: any) => {
        let matchedSet = c.card_sets?.[0];
        if (setClean) {
          matchedSet = c.card_sets?.find((s: any) =>
            s.set_name?.toLowerCase().includes(setClean.toLowerCase())
          );
          if (!matchedSet) return; // Skip cards not from the chosen set
        }

        const rarity = matchedSet?.set_rarity || 'Ultra Rare';
        const cardFinish = detectFinish(rarity, c.name);

        list.push({
          apiId: String(c.id),
          name: c.name,
          game: 'yugioh' as CardGame,
          imageUrl: c.card_images?.[0]?.image_url || '',
          finish: cardFinish,
          setName: matchedSet?.set_name || c.archetype || 'Yu-Gi-Oh! TCG',
          collectorNumber: matchedSet?.set_code || `#${c.id}`,
          rarity,
          artist: 'Kazuki Takahashi / Studio Dice',
          rawNumber: parseRawNumber(matchedSet?.set_code || String(c.id)),
        });
      });

      return list;
    }

    // POKÉMON (TCGdex - fast, reliable, comprehensive)
    if (game === 'pokemon') {
      const tcgdexSets = await fetchTcgdexSets();
      const setMap = new Map<string, string>();
      tcgdexSets.forEach((s) => setMap.set(s.id, s.name));

      const resolveSetName = (cardId: string, fallbackName?: string): string => {
        if (fallbackName) return fallbackName;
        const lastDash = cardId.lastIndexOf('-');
        if (lastDash !== -1) {
          const prefix = cardId.substring(0, lastDash);
          if (setMap.has(prefix)) return setMap.get(prefix)!;
        }
        const firstDash = cardId.indexOf('-');
        if (firstDash !== -1) {
          const prefix = cardId.substring(0, firstDash);
          if (setMap.has(prefix)) return setMap.get(prefix)!;
        }
        return 'Expansão Pokémon';
      };

      // Find matched set in tcgdex if setClean is provided
      let matchedTcgdexSet: { id: string; name: string } | undefined;
      if (setClean) {
        const lowerTarget = setClean.toLowerCase();
        matchedTcgdexSet = tcgdexSets.find((s) => {
          const sLower = s.name.toLowerCase();
          return sLower === lowerTarget || sLower.includes(lowerTarget);
        });
      }

      // 1) User selected a specific Set
      if (matchedTcgdexSet) {
        const setRes = await fetch(`https://api.tcgdex.net/v2/en/sets/${matchedTcgdexSet.id}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (setRes.ok) {
          const setData = await setRes.json();
          let cardsInSet: any[] = setData.cards || [];

          // If user also provided a name, filter strictly
          if (nameTrimmed) {
            const lowerName = nameTrimmed.toLowerCase();
            cardsInSet = cardsInSet.filter((c: any) =>
              c.name.toLowerCase().includes(lowerName)
            );
          }

          // Return all matching cards in this set
          const setName = setData.name || matchedTcgdexSet.name;
          const allCards: ApiCardResult[] = cardsInSet.map((cardSummary: any) => {
            const img = cardSummary.image ? `${cardSummary.image}/high.webp` : '';
            return {
              apiId: cardSummary.id,
              name: cardSummary.name,
              game: 'pokemon' as CardGame,
              imageUrl: img,
              finish: detectFinish('Rare', cardSummary.name),
              setName,
              collectorNumber: cardSummary.localId ? `#${cardSummary.localId}` : '',
              rarity: 'Rara',
              artist: 'Ken Sugimori',
              rawNumber: parseRawNumber(cardSummary.localId),
            };
          });

          return allCards;
        }
      }

      // 2) User searched by name (no specific set matched or cross-set search)
      if (nameTrimmed) {
        const searchRes = await fetch(`https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(nameTrimmed)}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (searchRes.ok) {
          const cardsList = await searchRes.json();
          if (Array.isArray(cardsList) && cardsList.length > 0) {
            // Keep cards that have an image and map all of them without cutoff
            const validCards = cardsList.filter((c: any) => !!c.image);
            const sourceList = validCards.length > 0 ? validCards : cardsList;

            const allResults: ApiCardResult[] = sourceList.map((cardSummary: any) => {
              const img = cardSummary.image ? `${cardSummary.image}/high.webp` : '';
              const setName = resolveSetName(cardSummary.id);

              return {
                apiId: cardSummary.id,
                name: cardSummary.name,
                game: 'pokemon' as CardGame,
                imageUrl: img,
                finish: detectFinish('Rare', cardSummary.name),
                setName,
                collectorNumber: cardSummary.localId ? `#${cardSummary.localId}` : '',
                rarity: 'Rara',
                artist: 'Ken Sugimori',
                rawNumber: parseRawNumber(cardSummary.localId),
              };
            });

            return allResults;
          }
        }
      }

      return [];
    }

    return [];
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    console.error('API search error:', err);
    return [];
  }
}

function formatRarity(r?: string): string {
  if (!r) return 'Comum';
  switch (r.toLowerCase()) {
    case 'mythic':
    case 'mythic rare':
      return 'Mítica (Mythic Rare)';
    case 'rare':
      return 'Rara';
    case 'uncommon':
      return 'Incomum';
    case 'common':
      return 'Comum';
    case 'special':
      return 'Especial';
    default:
      return r;
  }
}
