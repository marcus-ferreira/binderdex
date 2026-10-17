export type CardGame = 'pokemon' | 'magic' | 'yugioh' | 'digimon' | 'battlescenes';

export interface GameOption {
  id: CardGame;
  label: string;
}

export const SUPPORTED_GAMES: GameOption[] = [
  { id: 'pokemon', label: 'Pokémon' },
  { id: 'magic', label: 'Magic: The Gathering' },
  { id: 'yugioh', label: 'Yu-Gi-Oh!' },
  { id: 'digimon', label: 'Digimon' },
  { id: 'battlescenes', label: 'Battle Scenes' },
];

export type CardFinish = 'normal' | 'foil' | 'holo' | 'reverse' | 'secret';

export interface BinderCard {
  id: string;
  name: string;
  game: CardGame;
  imageUrl: string;
  finish: CardFinish;
  setName: string;
  collectorNumber: string;
  rarity: string;
  artist: string;
  addedAt: number;
  condition?: string;
  notes?: string;
  customPrice?: number;
  language?: string;
  price?: number | null;
}

export interface LooseCard extends BinderCard {
  quantity: number;
}

export interface DeckCardItem {
  id: string;
  cardId: string;
  name: string;
  game: CardGame;
  imageUrl: string;
  finish: CardFinish;
  setName: string;
  collectorNumber: string;
  rarity: string;
  artist?: string;
  sourceType?: 'binder' | 'loose';
  count: number;
  category?: 'main' | 'extra' | 'side';
}

export interface Deck {
  id: string;
  name: string;
  game: CardGame;
  description?: string;
  coverImageUrl?: string;
  cards: DeckCardItem[];
  createdAt: number;
  updatedAt: number;
}

export interface Binder {
  id: string;
  title: string;
  game?: CardGame;
  coverImageUrl?: string;
  ringColor: 'silver';
  totalPages: number; // 1 folha = 2 páginas. totalPages = totalFolhas * 2
  cards: Record<number, BinderCard>; // Key is absolute slotIndex (0 to totalPages * 9 - 1)
  createdAt: number;
  updatedAt: number;
}

