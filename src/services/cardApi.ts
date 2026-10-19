import { CardGame, CardFinish } from '../types/binder';
import battleScenesData from '../data/battleScenesCards.json';
import { getClassicSetRarity } from './pokemonRarity';

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
  chronologicalIndex?: number; // Higher number means more recent release/expansion
  condition?: string;
  edition?: string;
  language?: string;
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
    str.includes('hyper rare') ||
    str.includes('sec') ||
    str.includes('sir') ||
    str.includes('sar') ||
    str.includes('ace spec')
  ) {
    return 'secret';
  }
  if (
    str.includes('holo') ||
    str.includes('holographic') ||
    str.includes('illustration rare') ||
    str.includes('shiny') ||
    str.includes('super rare') ||
    str.includes('sr') ||
    str.includes('parallel') ||
    str.includes('ir')
  ) {
    return 'holo';
  }
  if (
    str.includes('foil') ||
    str.includes('mythic') ||
    str.includes('ultra rare') ||
    str.includes('rara') ||
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

// Comprehensive year lookup table for known Pokémon set codes
const POKEMON_SET_YEAR_MAP: Record<string, number> = {
  // 2026
  '30th': 2026,
  '30th-c': 2026,
  // 2025
  'me05': 2025,
  'me04': 2025,
  'me03': 2025,
  'me02.5': 2025,
  'me02': 2025,
  'B2a': 2025,
  'B2': 2025,
  'B1a': 2025,
  'B1': 2025,
  'me01': 2025,
  'mee': 2025,
  'mep': 2025,
  'A4a': 2025,
  'A4': 2025,
  'sv10.5w': 2025,
  'sv10.5b': 2025,
  'A3b': 2025,
  'sv10': 2025,
  'A3a': 2025,
  'A3': 2025,
  'sv09': 2025,
  'A2b': 2025,
  'A2a': 2025,
  'A2': 2025,
  'sv08.5': 2025,
  // 2024
  'A1a': 2024,
  '2024sv': 2024,
  'sv08': 2024,
  'A1': 2024,
  'P-A': 2024,
  'sv07': 2024,
  'sv06.5': 2024,
  'sv06': 2024,
  'sv05': 2024,
  'sv04.5': 2024,
  // 2023
  'sv04': 2023,
  'mfb': 2023,
  'sv03.5': 2023,
  'sv03': 2023,
  '2023sv': 2023,
  'sv02': 2023,
  'svp': 2023,
  'sve': 2023,
  'sv01': 2023,
  'swsh12.5gg': 2023,
  'swsh12.5': 2023,
  // 2022
  'swsh12': 2022,
  'swsh12tg': 2022,
  'swsh11': 2022,
  'swsh11tg': 2022,
  'pgo': 2022,
  'swsh10': 2022,
  'swsh10tg': 2022,
  'swsh09': 2022,
  'swsh09tg': 2022,
  // 2021
  'swsh08': 2021,
  'cel25': 2021,
  'cel25c': 2021,
  'swsh07': 2021,
  'swsh06': 2021,
  'swsh05': 2021,
  'swsh045': 2021,
  'swsh045sv': 2021,
  // 2020
  'swsh04': 2020,
  'swsh035': 2020,
  'swsh03': 2020,
  'swsh02': 2020,
  'swsh01': 2020,
  'swshp': 2020,
  // 2019
  'sm12': 2019,
  'sm115': 2019,
  'sm11': 2019,
  'sm10': 2019,
  'sm09': 2019,
  'det': 2019,
  // 2018
  'sm08': 2018,
  'sm075': 2018,
  'sm07': 2018,
  'sm06': 2018,
  'sm05': 2018,
  // 2017
  'sm04': 2017,
  'sm035': 2017,
  'sm03': 2017,
  'sm02': 2017,
  'sm01': 2017,
  'smp': 2017,
  // 2016
  'xy12': 2016,
  'xy11': 2016,
  'xy10': 2016,
  'g1': 2016,
  'xy09': 2016,
  // 2015
  'xy08': 2015,
  'xy07': 2015,
  'dc01': 2015,
  'xy06': 2015,
  'xy05': 2015,
  // 2014
  'xy04': 2014,
  'xy03': 2014,
  'xy02': 2014,
  'xy01': 2014,
  'xyp': 2014,
  // 2013
  'bw11': 2013,
  'bw10': 2013,
  'bw09': 2013,
  'bw08': 2013,
  // 2012
  'bw07': 2012,
  'bw06': 2012,
  'bw05': 2012,
  'bw04': 2012,
  // 2011
  'bw03': 2011,
  'bw02': 2011,
  'bw01': 2011,
  'bwp': 2011,
  'col1': 2011,
  // 2010
  'hgss4': 2010,
  'hgss3': 2010,
  'hgss2': 2010,
  'hgss1': 2010,
  'hgssp': 2010,
  // 2009
  'pl4': 2009,
  'pl3': 2009,
  'pl2': 2009,
  'pl1': 2009,
  // 2008
  'dp7': 2008,
  'dp6': 2008,
  'dp5': 2008,
  'dp4': 2008,
  // 2007
  'dp3': 2007,
  'dp2': 2007,
  'dp1': 2007,
  'dpp': 2007,
  'ex16': 2007,
  // 2006
  'ex15': 2006,
  'ex14': 2006,
  'ex13': 2006,
  'ex12': 2006,
  // 2005
  'ex11': 2005,
  'ex10': 2005,
  'ex09': 2005,
  'ex08': 2005,
  // 2004
  'ex07': 2004,
  'ex06': 2004,
  'ex05': 2004,
  'ex04': 2004,
  // 2003
  'ex03': 2003,
  'ex02': 2003,
  'ex01': 2003,
  'ecard3': 2003,
  'ecard2': 2003,
  // 2002
  'ecard1': 2002,
  'neo4': 2002,
  'lc': 2002,
  // 2001
  'neo3': 2001,
  'neo2': 2001,
  // 2000
  'neo1': 2000,
  'gym2': 2000,
  'gym1': 2000,
  'base5': 2000,
  'base4': 2000,
  // 1999
  'base3': 1999,
  'base2': 1999,
  'base1': 1999,
  'basep': 1999,
};

// Fallback name-to-year map for Pokémon sets
const POKEMON_NAME_YEAR_MAP: Record<string, number> = {
  'base set': 1999,
  'jungle': 1999,
  'fossil': 1999,
  'base set 2': 2000,
  'team rocket': 2000,
  'gym heroes': 2000,
  'gym challenge': 2000,
  'neo genesis': 2000,
  'neo discovery': 2001,
  'neo revelation': 2001,
  'neo destiny': 2002,
  'legendary collection': 2002,
  'expedition base set': 2002,
  'aquapolis': 2003,
  'skyridge': 2003,
  'ruby & sapphire': 2003,
  'sandstorm': 2003,
  'dragon': 2003,
  'team magma vs team aqua': 2004,
  'hidden legends': 2004,
  'firered & leafgreen': 2004,
  'team rocket returns': 2004,
  'deoxys': 2005,
  'emerald': 2005,
  'unseen forces': 2005,
  'delta species': 2005,
  'legend maker': 2006,
  'holon phantoms': 2006,
  'crystal guardians': 2006,
  'dragon frontiers': 2006,
  'power keepers': 2007,
  'diamond & pearl': 2007,
  'mysterious treasures': 2007,
  'secret wonders': 2007,
  'great encounters': 2008,
  'majestic dawn': 2008,
  'legends awakened': 2008,
  'stormfront': 2008,
  'platinum': 2009,
  'rising rivals': 2009,
  'supreme victors': 2009,
  'arceus': 2009,
  'heartgold & soulsilver': 2010,
  'unleashed': 2010,
  'undaunted': 2010,
  'triumphant': 2010,
  'call of legends': 2011,
  'black & white': 2011,
  'noble victories': 2011,
  'emerging powers': 2011,
  'next destinies': 2012,
  'dark explorers': 2012,
  'dragons exalted': 2012,
  'boundaries crossed': 2012,
  'plasma storm': 2013,
  'plasma freeze': 2013,
  'plasma blast': 2013,
  'legendary treasures': 2013,
  'xy': 2014,
  'flashfire': 2014,
  'furious fists': 2014,
  'phantom forces': 2014,
  'primal clash': 2015,
  'roaring skies': 2015,
  'ancient origins': 2015,
  'breakthrough': 2015,
  'breakpoint': 2016,
  'generations': 2016,
  'fates collide': 2016,
  'steam siege': 2016,
  'evolutions': 2016,
  'sun & moon': 2017,
  'guardians rising': 2017,
  'burning shadows': 2017,
  'shining legends': 2017,
  'crimson invasion': 2017,
  'ultra prism': 2018,
  'forbidden light': 2018,
  'celestial storm': 2018,
  'dragon majesty': 2018,
  'lost thunder': 2018,
  'team up': 2019,
  'unbroken bonds': 2019,
  'unified minds': 2019,
  'hidden fates': 2019,
  'cosmic eclipse': 2019,
  'sword & shield': 2020,
  'rebel clash': 2020,
  'darkness ablaze': 2020,
  'champion\'s path': 2020,
  'vivid voltage': 2020,
  'shining fates': 2021,
  'battle styles': 2021,
  'chilling reign': 2021,
  'evolving skies': 2021,
  'celebrations': 2021,
  'fusion strike': 2021,
  'brilliant stars': 2022,
  'astral radiance': 2022,
  'pokémon go': 2022,
  'lost origin': 2022,
  'silver tempest': 2022,
  'crown zenith': 2023,
  'scarlet & violet': 2023,
  'paldea evolved': 2023,
  'obsidian flames': 2023,
  '151': 2023,
  'paradox rift': 2023,
  'paldean fates': 2024,
  'temporal forces': 2024,
  'twilight masquerade': 2024,
  'shrouded fable': 2024,
  'stellar crown': 2024,
  'surging sparks': 2024,
  'prismatic evolutions': 2025,
};

export interface TcgdexSetItem {
  id: string;
  name: string;
  releaseDate?: string;
}

// In-memory cache for tcgdex sets
let tcgdexSetsCache: TcgdexSetItem[] | null = null;
export async function fetchTcgdexSets(): Promise<TcgdexSetItem[]> {
  if (tcgdexSetsCache && tcgdexSetsCache.length > 0) return tcgdexSetsCache;
  try {
    const res = await fetch('https://api.tcgdex.net/v2/en/sets');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        tcgdexSetsCache = data.map((s: any) => ({
          id: s.id,
          name: s.name,
          releaseDate: s.releaseDate,
        }));
        return tcgdexSetsCache;
      }
    }
  } catch (err) {
    console.warn('Could not prefetch tcgdex sets:', err);
  }
  return [];
}

// Dynamically generate the full list of Pokémon sets formatted with year in descending order
export async function getPokemonSetOptions(): Promise<string[]> {
  const sets = await fetchTcgdexSets();
  if (!sets || sets.length === 0) return [];

  // /sets endpoint provides sets in chronological order (oldest to newest)
  // Reversing gives the most recent at the top
  const reversed = [...sets].reverse();
  const seen = new Set<string>();
  const list: string[] = [];

  for (const s of reversed) {
    // 1. Check releaseDate string (e.g. "2024-03-22")
    const dateMatch = s.releaseDate ? s.releaseDate.match(/\d{4}/) : null;
    let yr: number | string | undefined = dateMatch ? dateMatch[0] : undefined;

    // 2. Check set ID code map
    if (!yr) {
      yr = POKEMON_SET_YEAR_MAP[s.id] || POKEMON_SET_YEAR_MAP[s.id.toLowerCase()];
    }

    // 3. Check normalized name map
    if (!yr) {
      const lowerName = s.name.toLowerCase().trim();
      yr = POKEMON_NAME_YEAR_MAP[lowerName];
    }

    const label = yr ? `${s.name} (${yr})` : s.name;
    if (!seen.has(label)) {
      seen.add(label);
      list.push(label);
    }
  }

  return list;
}

export async function searchCards(
  game: CardGame,
  nameQuery: string,
  rawSetQuery: string
): Promise<ApiCardResult[]> {
  const nameTrimmed = nameQuery.trim();
  // Strip year in parenthesis, e.g., "Prismatic Evolutions (2025)" -> "Prismatic Evolutions"
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

      let res: Response;
      try {
        res = await fetch(
          `https://api.scryfall.com/cards/search?q=${encodeURIComponent(queryParam)}&order=released&dir=desc`,
          { signal: controller.signal }
        );

        // If strict quote search returned 404, fall back to soft search
        if (!res.ok && res.status === 404 && nameTrimmed && setClean) {
          const fallbackQuery = `${nameTrimmed} (set:"${setClean}" or e:"${setClean}")`;
          res = await fetch(
            `https://api.scryfall.com/cards/search?q=${encodeURIComponent(fallbackQuery)}&order=released&dir=desc`,
            { signal: controller.signal }
          );
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        console.warn('Scryfall fetch warning:', fetchErr);
        return [];
      }

      clearTimeout(timeoutId);

      if (!res.ok) {
        if (res.status === 404) return [];
        return [];
      }

      const data = await res.json();
      if (!data.data || !Array.isArray(data.data)) return [];

      let list: ApiCardResult[] = data.data.map((c: any) => {
        let img = '';
        if (c.image_uris && c.image_uris.normal) {
          img = c.image_uris.normal;
        } else if (c.card_faces && c.card_faces[0]?.image_uris?.normal) {
          img = c.card_faces[0].image_uris.normal;
        }

        const rarity = formatRarity(c.rarity);
        const cardFinish = detectFinish(c.rarity, c.name);

        let chrono = 0;
        if (c.released_at) {
          const t = new Date(c.released_at).getTime();
          if (!isNaN(t)) chrono = Math.floor(t / 1000);
        }

        return {
          apiId: c.id,
          name: c.name,
          game: 'magic' as CardGame,
          imageUrl: img,
          finish: 'normal',
          setName: c.set_name,
          collectorNumber: `#${c.collector_number}`,
          rarity,
          artist: c.artist || 'Artista MTG',
          rawNumber: parseRawNumber(c.collector_number),
          chronologicalIndex: chrono,
          condition: 'NM',
          edition: 'unlimited',
          language: 'PT',
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

      let res: Response;
      try {
        res = await fetch(url, { signal: controller.signal });

        // If strict cardset+fname failed, try fname only and filter client-side
        if (!res.ok && nameTrimmed && setClean) {
          res = await fetch(
            `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(nameTrimmed)}`,
            { signal: controller.signal }
          );
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        console.warn('YGOPRODeck fetch warning:', fetchErr);
        return [];
      }

      clearTimeout(timeoutId);

      if (!res.ok) {
        return [];
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
          finish: 'normal',
          setName: matchedSet?.set_name || c.archetype || 'Yu-Gi-Oh! TCG',
          collectorNumber: matchedSet?.set_code || `#${c.id}`,
          rarity,
          artist: 'Kazuki Takahashi / Studio Dice',
          rawNumber: parseRawNumber(matchedSet?.set_code || String(c.id)),
          chronologicalIndex: Number(c.id) || 0,
          condition: 'NM',
          edition: 'unlimited',
          language: 'PT',
        });
      });

      return list;
    }

    // DIGIMON CARD GAME (digimoncard.io API)
    if (game === 'digimon') {
      let queryUrl = '';
      const packCode = setClean.includes(':') ? setClean.split(':')[0].trim() : setClean;

      if (nameTrimmed && packCode) {
        queryUrl = `https://digimoncard.io/api-public/search.php?n=${encodeURIComponent(nameTrimmed)}&pack=${encodeURIComponent(packCode)}`;
      } else if (nameTrimmed) {
        queryUrl = `https://digimoncard.io/api-public/search.php?n=${encodeURIComponent(nameTrimmed)}`;
      } else if (packCode) {
        queryUrl = `https://digimoncard.io/api-public/search.php?pack=${encodeURIComponent(packCode)}`;
      }

      if (!queryUrl) return [];

      let res: Response;
      try {
        res = await fetch(queryUrl, { signal: controller.signal });

        // Fallback if combined query failed: search by name
        if (!res.ok && nameTrimmed && packCode) {
          res = await fetch(
            `https://digimoncard.io/api-public/search.php?n=${encodeURIComponent(nameTrimmed)}`,
            { signal: controller.signal }
          );
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        console.warn('Digimon fetch warning:', fetchErr);
        return [];
      }

      clearTimeout(timeoutId);

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      if (!Array.isArray(data)) return [];

      let list: ApiCardResult[] = data.map((c: any) => {
        const setName = Array.isArray(c.set_name) ? c.set_name[0] : (c.set_name || 'Digimon Booster');
        const rarityCode = (c.rarity || 'C').toUpperCase();

        return {
          apiId: c.id,
          name: c.name,
          game: 'digimon' as CardGame,
          imageUrl: `https://images.digimoncard.io/images/cards/${c.id}.webp`,
          finish: 'normal',
          setName,
          collectorNumber: `#${c.id}`,
          rarity: rarityCode === 'SEC' ? 'Secret Rare' : rarityCode === 'SR' ? 'Super Rare' : rarityCode === 'R' ? 'Rare' : rarityCode === 'U' ? 'Uncommon' : rarityCode === 'P' ? 'Promo' : 'Common',
          artist: c.artist || 'Bandai',
          rawNumber: parseRawNumber(c.id),
          chronologicalIndex: parseRawNumber(c.id),
          condition: 'NM',
          edition: 'unlimited',
          language: 'PT',
        };
      });

      if (setClean) {
        const lowerSet = setClean.toLowerCase();
        const filtered = list.filter((c) => c.setName.toLowerCase().includes(lowerSet) || c.collectorNumber.toLowerCase().includes(packCode.toLowerCase()));
        if (filtered.length > 0) list = filtered;
      }

      return list;
    }

    // BATTLE SCENES (Copag / Marvel - Comprehensive 810 cards curated DB)
    if (game === 'battlescenes') {
      clearTimeout(timeoutId);

      let cards = (battleScenesData as any[]) || [];

      if (nameTrimmed) {
        const lower = nameTrimmed.toLowerCase();
        cards = cards.filter(
          (c) =>
            c.name.toLowerCase().includes(lower) ||
            c.subName?.toLowerCase().includes(lower) ||
            c.type?.toLowerCase().includes(lower) ||
            c.alignment?.toLowerCase().includes(lower)
        );
      }

      if (setClean) {
        const lowerSet = setClean.toLowerCase();
        cards = cards.filter(
          (c) =>
            c.setName.toLowerCase().includes(lowerSet) ||
            c.collectionCode?.toLowerCase().includes(lowerSet)
        );
      }

      const list: ApiCardResult[] = cards.map((c) => {
        return {
          apiId: c.id,
          name: c.name,
          game: 'battlescenes' as CardGame,
          imageUrl: c.imageUrl,
          finish: 'normal',
          setName: c.setName,
          collectorNumber: c.collectorNumber,
          rarity: c.rarity || 'Personagem',
          artist: 'Copag / Marvel',
          rawNumber: parseRawNumber(c.collectorNumber),
          chronologicalIndex: parseRawNumber(c.collectorNumber),
          condition: 'NM',
          edition: 'unlimited',
          language: 'PT',
        };
      });

      return list;
    }

    // POKÉMON (TCGdex - fast, reliable, comprehensive with all expansions up to the newest)
    if (game === 'pokemon') {
      const tcgdexSets = await fetchTcgdexSets();
      const setMap = new Map<string, string>();
      const setOrderMap = new Map<string, number>();

      tcgdexSets.forEach((s, idx) => {
        setMap.set(s.id.toLowerCase(), s.name);
        setOrderMap.set(s.id.toLowerCase(), idx);
      });

      const resolveSetName = (cardId: string, fallbackName?: string): string => {
        if (fallbackName) return fallbackName;
        const lastDash = cardId.lastIndexOf('-');
        if (lastDash !== -1) {
          const prefix = cardId.substring(0, lastDash).toLowerCase();
          if (setMap.has(prefix)) return setMap.get(prefix)!;
        }
        const firstDash = cardId.indexOf('-');
        if (firstDash !== -1) {
          const prefix = cardId.substring(0, firstDash).toLowerCase();
          if (setMap.has(prefix)) return setMap.get(prefix)!;
        }
        return 'Expansão Pokémon';
      };

      const getCardChronologicalIndex = (cardId: string): number => {
        const lastDash = cardId.lastIndexOf('-');
        if (lastDash !== -1) {
          const prefix = cardId.substring(0, lastDash).toLowerCase();
          if (setOrderMap.has(prefix)) return setOrderMap.get(prefix)!;
        }
        const firstDash = cardId.indexOf('-');
        if (firstDash !== -1) {
          const prefix = cardId.substring(0, firstDash).toLowerCase();
          if (setOrderMap.has(prefix)) return setOrderMap.get(prefix)!;
        }
        return 0;
      };

      // Find matched set in tcgdex if setClean is provided (exact match first, then partial)
      let matchedTcgdexSet: { id: string; name: string } | undefined;
      if (setClean) {
        const lowerTarget = setClean.toLowerCase();
        matchedTcgdexSet =
          tcgdexSets.find((s) => s.name.toLowerCase() === lowerTarget) ||
          tcgdexSets.find((s) => s.name.toLowerCase().includes(lowerTarget));
      }

      // 1) User selected a specific Set
      if (matchedTcgdexSet) {
        try {
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
            const chronoIndex = setOrderMap.get(matchedTcgdexSet.id.toLowerCase()) ?? 999;

            const allCards: ApiCardResult[] = cardsInSet.map((cardSummary: any) => {
              const img = cardSummary.image
                ? cardSummary.image.endsWith('.webp') || cardSummary.image.endsWith('.png')
                  ? cardSummary.image
                  : `${cardSummary.image}/high.webp`
                : '';
              const rawNum = parseRawNumber(cardSummary.localId);
              const calculatedRarity = getClassicSetRarity(setName, rawNum) || 'Comum';

              return {
                apiId: cardSummary.id,
                name: cardSummary.name,
                game: 'pokemon' as CardGame,
                imageUrl: img,
                finish: 'normal',
                setName,
                collectorNumber: cardSummary.localId ? `#${cardSummary.localId}` : '',
                rarity: calculatedRarity,
                artist: 'Ken Sugimori',
                rawNumber: rawNum,
                chronologicalIndex: chronoIndex,
                condition: 'NM',
                edition: 'unlimited',
                language: 'PT',
              };
            });

            return allCards;
          }
        } catch (setErr) {
          clearTimeout(timeoutId);
          console.warn('Tcgdex set fetch warning:', setErr);
          return [];
        }
      }

      // 2) User searched by name (no specific set matched or cross-set search)
      if (nameTrimmed) {
        try {
          const searchRes = await fetch(`https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(nameTrimmed)}`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (searchRes.ok) {
            const cardsList = await searchRes.json();
            if (Array.isArray(cardsList) && cardsList.length > 0) {
              const sourceList = cardsList;

              const allResults: ApiCardResult[] = sourceList.map((cardSummary: any) => {
                const img = cardSummary.image
                  ? cardSummary.image.endsWith('.webp') || cardSummary.image.endsWith('.png')
                    ? cardSummary.image
                    : `${cardSummary.image}/high.webp`
                  : '';
                const setName = resolveSetName(cardSummary.id);
                const chronoIndex = getCardChronologicalIndex(cardSummary.id);
                const rawNum = parseRawNumber(cardSummary.localId);
                const calculatedRarity = getClassicSetRarity(setName, rawNum) || 'Comum';

                return {
                  apiId: cardSummary.id,
                  name: cardSummary.name,
                  game: 'pokemon' as CardGame,
                  imageUrl: img,
                  finish: 'normal',
                  setName,
                  collectorNumber: cardSummary.localId ? `#${cardSummary.localId}` : '',
                  rarity: calculatedRarity,
                  artist: 'Ken Sugimori',
                  rawNumber: rawNum,
                  chronologicalIndex: chronoIndex,
                  condition: 'NM',
                  edition: 'unlimited',
                  language: 'PT',
                };
              });

              // Default cross-set results to sort with newest releases at top
              allResults.sort((a, b) => (b.chronologicalIndex ?? 0) - (a.chronologicalIndex ?? 0));

              return allResults;
            }
          }
        } catch (searchErr) {
          clearTimeout(timeoutId);
          console.warn('Tcgdex cards search warning:', searchErr);
          return [];
        }
      }

      return [];
    }

    return [];
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    console.warn('API search warning:', err);
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
