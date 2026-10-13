import { Binder } from '../types/binder';

const STORAGE_KEY = 'tcg_virtual_binders_data_v4';

export const SAMPLE_BINDERS: Binder[] = [
  {
    id: 'binder-pokemon-vintage',
    title: 'Pokémon Vintage - Base Set & Raras',
    game: 'pokemon',
    coverImageUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
    ringColor: 'silver',
    totalPages: 8,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 3600000 * 2,
    cards: {
      0: {
        id: 'pkmn-charizard',
        name: 'Charizard',
        game: 'pokemon',
        finish: 'holo',
        setName: 'Base Set',
        collectorNumber: '#4/102',
        rarity: 'Holo Rare',
        artist: 'Mitsuhiro Arita',
        imageUrl: 'https://images.pokemontcg.io/base1/4_hires.png',
        addedAt: Date.now() - 86400000 * 4,
      },
      1: {
        id: 'pkmn-blastoise',
        name: 'Blastoise',
        game: 'pokemon',
        finish: 'holo',
        setName: 'Base Set',
        collectorNumber: '#2/102',
        rarity: 'Holo Rare',
        artist: 'Ken Sugimori',
        imageUrl: 'https://images.pokemontcg.io/base1/2_hires.png',
        addedAt: Date.now() - 86400000 * 4,
      },
      2: {
        id: 'pkmn-venusaur',
        name: 'Venusaur',
        game: 'pokemon',
        finish: 'holo',
        setName: 'Base Set',
        collectorNumber: '#15/102',
        rarity: 'Holo Rare',
        artist: 'Ken Sugimori',
        imageUrl: 'https://images.pokemontcg.io/base1/15_hires.png',
        addedAt: Date.now() - 86400000 * 4,
      },
      3: {
        id: 'pkmn-pikachu',
        name: 'Pikachu (Red Cheeks)',
        game: 'pokemon',
        finish: 'normal',
        setName: 'Base Set',
        collectorNumber: '#58/102',
        rarity: 'Comum',
        artist: 'Mitsuhiro Arita',
        imageUrl: 'https://images.pokemontcg.io/base1/58_hires.png',
        addedAt: Date.now() - 86400000 * 3,
      },
      4: {
        id: 'pkmn-mewtwo',
        name: 'Mewtwo',
        game: 'pokemon',
        finish: 'holo',
        setName: 'Base Set',
        collectorNumber: '#10/102',
        rarity: 'Holo Rare',
        artist: 'Ken Sugimori',
        imageUrl: 'https://images.pokemontcg.io/base1/10_hires.png',
        addedAt: Date.now() - 86400000 * 3,
      },
      5: {
        id: 'pkmn-gengar',
        name: 'Gengar',
        game: 'pokemon',
        finish: 'holo',
        setName: 'Fossil',
        collectorNumber: '#5/62',
        rarity: 'Holo Rare',
        artist: 'Keiji Kinebuchi',
        imageUrl: 'https://images.pokemontcg.io/fo/5_hires.png',
        addedAt: Date.now() - 86400000 * 2,
      },
      9: {
        id: 'pkmn-lugia',
        name: 'Lugia',
        game: 'pokemon',
        finish: 'holo',
        setName: 'Neo Genesis',
        collectorNumber: '#9/111',
        rarity: 'Holo Rare',
        artist: 'Hironobu Yoshida',
        imageUrl: 'https://images.pokemontcg.io/neo1/9_hires.png',
        addedAt: Date.now() - 86400000 * 1,
      },
      10: {
        id: 'pkmn-umbreon',
        name: 'Umbreon',
        game: 'pokemon',
        finish: 'holo',
        setName: 'Neo Discovery',
        collectorNumber: '#13/75',
        rarity: 'Holo Rare',
        artist: 'Naoyo Kimura',
        imageUrl: 'https://images.pokemontcg.io/neo2/13_hires.png',
        addedAt: Date.now() - 86400000 * 1,
      },
    },
  },
  {
    id: 'binder-magic-commander',
    title: 'Magic: The Gathering - Staples & Comandantes',
    game: 'magic',
    coverImageUrl: 'https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
    ringColor: 'silver',
    totalPages: 8,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 2,
    cards: {
      0: {
        id: 'mtg-black-lotus',
        name: 'Black Lotus',
        game: 'magic',
        finish: 'foil',
        setName: 'Vintage Masters',
        collectorNumber: '#4',
        rarity: 'Mítica (Mythic Rare)',
        artist: 'Chris Rahn',
        imageUrl: 'https://cards.scryfall.io/large/front/b/d/bd8fa327-dd41-4737-8f19-2cf5eb1f7cdd.jpg',
        addedAt: Date.now() - 86400000 * 8,
      },
      1: {
        id: 'mtg-sol-ring',
        name: 'Sol Ring',
        game: 'magic',
        finish: 'foil',
        setName: 'Commander Collection',
        collectorNumber: '#2',
        rarity: 'Rara',
        artist: 'Mark Tedin',
        imageUrl: 'https://cards.scryfall.io/large/front/a/a/aa678358-095c-444f-94d3-097ea5ea183a.jpg',
        addedAt: Date.now() - 86400000 * 8,
      },
      2: {
        id: 'mtg-counterspell',
        name: 'Counterspell',
        game: 'magic',
        finish: 'foil',
        setName: 'Mystical Archive',
        collectorNumber: '#STA-015',
        rarity: 'Rara',
        artist: 'Rovina Cai',
        imageUrl: 'https://cards.scryfall.io/large/front/1/9/1920dae4-fb92-4f19-ae4b-eb3276b8dac0.jpg',
        addedAt: Date.now() - 86400000 * 7,
      },
      3: {
        id: 'mtg-cyclonic-rift',
        name: 'Cyclonic Rift',
        game: 'magic',
        finish: 'normal',
        setName: 'Double Masters',
        collectorNumber: '#2XM-047',
        rarity: 'Rara',
        artist: 'Chris Rahn',
        imageUrl: 'https://cards.scryfall.io/large/front/f/f/ff08e5ed-f47b-4d8e-8b8b-41675dccef8b.jpg',
        addedAt: Date.now() - 86400000 * 6,
      },
      4: {
        id: 'mtg-rhystic-study',
        name: 'Rhystic Study',
        game: 'magic',
        finish: 'foil',
        setName: 'Wilds of Eldraine',
        collectorNumber: '#WOT-025',
        rarity: 'Mítica (Mythic Rare)',
        artist: 'Fuzichoco',
        imageUrl: 'https://cards.scryfall.io/large/front/d/6/d6914dba-0d27-4055-ac34-b3ebf5802221.jpg',
        addedAt: Date.now() - 86400000 * 5,
      },
      9: {
        id: 'mtg-demonic-tutor',
        name: 'Demonic Tutor',
        game: 'magic',
        finish: 'foil',
        setName: 'Strixhaven Archive',
        collectorNumber: '#STA-027',
        rarity: 'Mítica (Mythic Rare)',
        artist: 'Dominik Mayer',
        imageUrl: 'https://cards.scryfall.io/large/front/9/1/9136ff56-14e2-4f62-8985-535ede0146e7.jpg',
        addedAt: Date.now() - 86400000 * 4,
      },
    },
  },
  {
    id: 'binder-yugioh-classics',
    title: 'Yu-Gi-Oh! Deck de Relíquias e Deuses',
    game: 'yugioh',
    coverImageUrl: 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
    ringColor: 'silver',
    totalPages: 8,
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 4,
    cards: {
      0: {
        id: 'ygo-blue-eyes',
        name: 'Blue-Eyes White Dragon',
        game: 'yugioh',
        finish: 'secret',
        setName: 'Legend of Blue Eyes White Dragon',
        collectorNumber: '#LOB-001',
        rarity: 'Ultra Rare',
        artist: 'Kazuki Takahashi / Studio Dice',
        imageUrl: 'https://images.ygoprodeck.com/images/cards/89631139.jpg',
        addedAt: Date.now() - 86400000 * 12,
      },
      1: {
        id: 'ygo-dark-magician',
        name: 'Dark Magician',
        game: 'yugioh',
        finish: 'holo',
        setName: 'Starter Deck Yugi',
        collectorNumber: '#SDY-006',
        rarity: 'Ultra Rare',
        artist: 'Kazuki Takahashi / Studio Dice',
        imageUrl: 'https://images.ygoprodeck.com/images/cards/46986414.jpg',
        addedAt: Date.now() - 86400000 * 11,
      },
      2: {
        id: 'ygo-red-eyes',
        name: 'Red-Eyes Black Dragon',
        game: 'yugioh',
        finish: 'holo',
        setName: 'Legend of Blue Eyes White Dragon',
        collectorNumber: '#LOB-070',
        rarity: 'Ultra Rare',
        artist: 'Kazuki Takahashi / Studio Dice',
        imageUrl: 'https://images.ygoprodeck.com/images/cards/74677422.jpg',
        addedAt: Date.now() - 86400000 * 10,
      },
      3: {
        id: 'ygo-exodia',
        name: 'Exodia the Forbidden One',
        game: 'yugioh',
        finish: 'secret',
        setName: 'Legend of Blue Eyes White Dragon',
        collectorNumber: '#LOB-124',
        rarity: 'Ultra Rare',
        artist: 'Kazuki Takahashi / Studio Dice',
        imageUrl: 'https://images.ygoprodeck.com/images/cards/33396948.jpg',
        addedAt: Date.now() - 86400000 * 9,
      },
      9: {
        id: 'ygo-slifer',
        name: 'Slifer the Sky Dragon',
        game: 'yugioh',
        finish: 'secret',
        setName: 'Shonen Jump Promo',
        collectorNumber: '#JUMP-EN061',
        rarity: 'Secret Rare',
        artist: 'Kazuki Takahashi / Studio Dice',
        imageUrl: 'https://images.ygoprodeck.com/images/cards/10000020.jpg',
        addedAt: Date.now() - 86400000 * 7,
      },
    },
  },
];

export function loadBindersFromStorage(): Binder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveBindersToStorage(SAMPLE_BINDERS);
      return SAMPLE_BINDERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveBindersToStorage(SAMPLE_BINDERS);
      return SAMPLE_BINDERS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load binders from storage:', err);
    return SAMPLE_BINDERS;
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
  downloadAnchor.setAttribute('download', `tcg_ficharios_backup_${new Date().toISOString().slice(0, 10)}.json`);
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
