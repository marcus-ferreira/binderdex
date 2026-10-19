import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Loader2,
  Check,
  ArrowUpDown,
  Sparkles,
  CheckSquare,
  Square,
} from 'lucide-react';
import { BinderCard, CardGame, SUPPORTED_GAMES, CardFinish, CARD_FINISHES, CARD_CONDITIONS, CARD_LANGUAGES } from '../types/binder';
import { searchCards, ApiCardResult, getPokemonSetOptions } from '../services/cardApi';

interface CardSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCards: (cards: BinderCard[]) => void;
  slotIndex: number | null;
  initialCard?: BinderCard;
  defaultGame: CardGame;
  lockGame?: boolean;
  currentTotalSlots?: number;
}

type SortOption =
  | 'recent-first'
  | 'oldest-first'
  | 'number-asc'
  | 'number-desc'
  | 'name-asc'
  | 'name-desc';

// Sets with release year in parentheses, strictly sorted in descending order (most recent at top)
const POKEMON_SETS_WITH_YEAR = [
  '30th Classic Collection (2026)',
  '30th Celebration (2026)',
  'Pitch Black (2025)',
  'Chaos Rising (2025)',
  'Perfect Order (2025)',
  'Paldean Wonders (2025)',
  'Ascended Heroes (2025)',
  'Fantastical Parade (2025)',
  'Crimson Blaze (2025)',
  'Phantasmal Flames (2025)',
  'Mega Rising (2025)',
  'MEP Black Star Promos (2025)',
  'Mega Evolution (2025)',
  'Mega Evolution Energy (2025)',
  'Secluded Springs (2025)',
  'Wisdom of Sea and Sky (2025)',
  'White Flare (2025)',
  'Black Bolt (2025)',
  'Eevee Grove (2025)',
  'Destined Rivals (2025)',
  'Extradimensional Crisis (2025)',
  'Celestial Guardians (2025)',
  'Journey Together (2025)',
  'Shining Revelry (2025)',
  'Triumphant Light (2025)',
  'Space-Time Smackdown (2025)',
  'Prismatic Evolutions (2025)',
  'Mythical Island (2024)',
  'McDonald\'s Collection 2024 (2024)',
  'Surging Sparks (2024)',
  'Genetic Apex (2024)',
  'Promos-A (2024)',
  'Stellar Crown (2024)',
  'Shrouded Fable (2024)',
  'Twilight Masquerade (2024)',
  'Temporal Forces (2024)',
  'Paldean Fates (2024)',
  'Paradox Rift (2023)',
  '151 (2023)',
  'Obsidian Flames (2023)',
  'Paldea Evolved (2023)',
  'Scarlet & Violet (2023)',
  'Crown Zenith (2023)',
  'Silver Tempest (2022)',
  'Lost Origin (2022)',
  'Pokémon GO (2022)',
  'Astral Radiance (2022)',
  'Brilliant Stars (2022)',
  'Fusion Strike (2021)',
  'Celebrations (2021)',
  'Evolving Skies (2021)',
  'Chilling Reign (2021)',
  'Battle Styles (2021)',
  'Shining Fates (2021)',
  'Vivid Voltage (2020)',
  'Champion\'s Path (2020)',
  'Darkness Ablaze (2020)',
  'Rebel Clash (2020)',
  'Sword & Shield (2020)',
  'Cosmic Eclipse (2019)',
  'Hidden Fates (2019)',
  'Unified Minds (2019)',
  'Unbroken Bonds (2019)',
  'Detective Pikachu (2019)',
  'Team Up (2019)',
  'Lost Thunder (2018)',
  'Dragon Majesty (2018)',
  'Celestial Storm (2018)',
  'Forbidden Light (2018)',
  'Ultra Prism (2018)',
  'Crimson Invasion (2017)',
  'Shining Legends (2017)',
  'Burning Shadows (2017)',
  'Guardians Rising (2017)',
  'Sun & Moon (2017)',
  'Evolutions (2016)',
  'Steam Siege (2016)',
  'Fates Collide (2016)',
  'Generations (2016)',
  'BREAKpoint (2016)',
  'BREAKthrough (2015)',
  'Ancient Origins (2015)',
  'Roaring Skies (2015)',
  'Double Crisis (2015)',
  'Primal Clash (2015)',
  'Phantom Forces (2014)',
  'Furious Fists (2014)',
  'Flashfire (2014)',
  'XY (2014)',
  'Legendary Treasures (2013)',
  'Plasma Blast (2013)',
  'Plasma Freeze (2013)',
  'Plasma Storm (2013)',
  'Boundaries Crossed (2012)',
  'Dragons Exalted (2012)',
  'Dark Explorers (2012)',
  'Next Destinies (2012)',
  'Noble Victories (2011)',
  'Emerging Powers (2011)',
  'Black & White (2011)',
  'Call of Legends (2011)',
  'Triumphant (2010)',
  'Undaunted (2010)',
  'Unleashed (2010)',
  'HeartGold & SoulSilver (2010)',
  'Arceus (2009)',
  'Supreme Victors (2009)',
  'Rising Rivals (2009)',
  'Platinum (2009)',
  'Stormfront (2008)',
  'Legends Awakened (2008)',
  'Majestic Dawn (2008)',
  'Great Encounters (2008)',
  'Secret Wonders (2007)',
  'Mysterious Treasures (2007)',
  'Diamond & Pearl (2007)',
  'Power Keepers (2007)',
  'Dragon Frontiers (2006)',
  'Crystal Guardians (2006)',
  'Holon Phantoms (2006)',
  'Legend Maker (2006)',
  'Delta Species (2005)',
  'Unseen Forces (2005)',
  'Emerald (2005)',
  'Deoxys (2005)',
  'Team Rocket Returns (2004)',
  'FireRed & LeafGreen (2004)',
  'Hidden Legends (2004)',
  'Team Magma vs Team Aqua (2004)',
  'Dragon (2003)',
  'Sandstorm (2003)',
  'Ruby & Sapphire (2003)',
  'Skyridge (2003)',
  'Aquapolis (2003)',
  'Expedition Base Set (2002)',
  'Legendary Collection (2002)',
  'Neo Destiny (2002)',
  'Neo Revelation (2001)',
  'Neo Discovery (2001)',
  'Neo Genesis (2000)',
  'Gym Challenge (2000)',
  'Gym Heroes (2000)',
  'Team Rocket (2000)',
  'Base Set 2 (2000)',
  'Fossil (1999)',
  'Jungle (1999)',
  'Base Set (1999)',
];

const MAGIC_SETS_WITH_YEAR = [
  'Tarkir: Dragonstorm (2025)',
  'Aetherdrift (2025)',
  'Innistrad Remastered (2025)',
  'Foundations (2024)',
  'Duskmourn: House of Horror (2024)',
  'Bloomburrow (2024)',
  'Modern Horizons 3 (2024)',
  'Outlaws of Thunder Junction (2024)',
  'Murders at Karlov Manor (2024)',
  'The Lost Caverns of Ixalan (2023)',
  'Wilds of Eldraine (2023)',
  'Commander Masters (2023)',
  'The Lord of the Rings: Tales of Middle-earth (2023)',
  'March of the Machine (2023)',
  'Phyrexia: All Will Be One (2023)',
  'Dominaria Remastered (2023)',
  'The Brothers\' War (2022)',
  'Dominaria United (2022)',
  'Double Masters 2022 (2022)',
  'Commander Legends: Battle for Baldur\'s Gate (2022)',
  'Streets of New Capenna (2022)',
  'Kamigawa: Neon Dynasty (2022)',
  'Innistrad: Crimson Vow (2021)',
  'Innistrad: Midnight Hunt (2021)',
  'Adventures in the Forgotten Realms (2021)',
  'Modern Horizons 2 (2021)',
  'Strixhaven: School of Mages (2021)',
  'Time Spiral Remastered (2021)',
  'Kaldheim (2021)',
  'Commander Legends (2020)',
  'Zendikar Rising (2020)',
  'Double Masters (2020)',
  'Core Set 2021 (2020)',
  'Ikoria: Lair of Behemoths (2020)',
  'Theros Beyond Death (2020)',
  'Throne of Eldraine (2019)',
  'Core Set 2020 (2019)',
  'Modern Horizons (2019)',
  'War of the Spark (2019)',
  'Ravnica Allegiance (2019)',
  'Ultimate Masters (2018)',
  'Guilds of Ravnica (2018)',
  'Core Set 2019 (2018)',
  'Dominaria (2018)',
  'Masters 25 (2018)',
  'Rivals of Ixalan (2018)',
  'Iconic Masters (2017)',
  'Ixalan (2017)',
  'Hour of Devastation (2017)',
  'Amonkhet (2017)',
  'Modern Masters 2017 (2017)',
  'Aether Revolt (2017)',
  'Kaladesh (2016)',
  'Eldritch Moon (2016)',
  'Shadows over Innistrad (2016)',
  'Battle for Zendikar (2015)',
  'Modern Masters 2015 (2015)',
  'Khans of Tarkir (2014)',
  'Vintage Masters (2014)',
  'Modern Masters (2013)',
  'Innistrad (2011)',
  'Zendikar (2009)',
  'Ravnica: City of Guilds (2005)',
  'Mirrodin (2003)',
  'Urza\'s Saga (1998)',
  'Mirage (1996)',
  'Unlimited (1993)',
  'Beta (1993)',
  'Alpha (1993)',
];

const YUGIOH_SETS_WITH_YEAR = [
  'Supreme Darkness (2025)',
  'Alliance Insight (2025)',
  'Quarter Century Trinity Box (2025)',
  '25th Anniversary Rarity Collection II (2024)',
  'Quarter Century Stampede (2024)',
  'Quarter Century Bonanza (2024)',
  'Structure Deck: Blue-Eyes White Destiny (2024)',
  'Battles of Legend: Terminal Revenge (2024)',
  'Legacy of Destruction (2024)',
  'Phantom Nightmare (2024)',
  '25th Anniversary Rarity Collection (2023)',
  'Battles of Legend: Monstrous Revenge (2023)',
  'Age of Overlord (2023)',
  'Duelist Nexus (2023)',
  'Cyberstorm Access (2023)',
  'Photon Hypernova (2023)',
  'Darkwing Blast (2022)',
  'Power of the Elements (2022)',
  'Dimension Force (2022)',
  'Battle of Chaos (2022)',
  'Burst of Destiny (2021)',
  'Maximum Gold: El Dorado (2021)',
  'Ghosts From the Past (2021)',
  'Legendary Duelists: Season 2 (2021)',
  'Maximum Gold (2020)',
  'Legendary Duelists: Season 1 (2020)',
  'Duel Power (2019)',
  'Duelist Alliance (2014)',
  'The Shining Darkness (2010)',
  'Absolute Powerforce (2010)',
  'Stardust Overdrive (2009)',
  'Ancient Prophecy (2009)',
  'Raging Battle (2009)',
  'Crimson Crisis (2009)',
  'Crossroads of Chaos (2008)',
  'The Duelist Genesis (2008)',
  'Light of Destruction (2008)',
  'Phantom Darkness (2008)',
  'Gladiator\'s Assault (2007)',
  'Tactical Evolution (2007)',
  'Force of the Breaker (2007)',
  'Strike of Neos (2007)',
  'Power of the Duelist (2006)',
  'Enemy of Justice (2006)',
  'Shadow of Infinity (2006)',
  'Elemental Energy (2005)',
  'Cybernetic Revolution (2005)',
  'The Lost Millennium (2005)',
  'Flaming Eternity (2005)',
  'Soul of the Duelist (2004)',
  'Ancient Sanctuary (2004)',
  'Invasion of Chaos (2004)',
  'Dark Crisis (2003)',
  'Magician\'s Force (2003)',
  'Pharaonic Guardian (2003)',
  'Legacy of Darkness (2003)',
  'Labyrinth of Nightmare (2003)',
  'Pharaoh\'s Servant (2002)',
  'Spell Ruler (2002)',
  'Metal Raiders (2002)',
  'Starter Deck: Kaiba (2002)',
  'Starter Deck: Yugi (2002)',
  'Legend of Blue Eyes White Dragon (2002)',
];

const DIGIMON_SETS_WITH_YEAR = [
  'BT-20: Over the X (2025)',
  'EX-08: Chain of Liberation (2025)',
  'BT-19: Xros Evolution (2024)',
  'BT-18: Element Successor (2024)',
  'EX-07: Digimon Liberator (2024)',
  'BT-17: Secret Crisis (2024)',
  'EX-06: Infernal Ascension (2024)',
  'BT-16: Beginning Observer (2024)',
  'BT-15: Exceed Apocalypse (2024)',
  'ST-19: Starter Deck Fable Waltz (2024)',
  'ST-18: Starter Deck Vortex Warrior (2024)',
  'ST-17: Advanced Deck Double Typhoon (2024)',
  'BT-14: Blast Ace (2023)',
  'EX-05: Animal Colosseum (2023)',
  'BT-13: Versus Royal Knights (2023)',
  'BT-12: Across Time (2023)',
  'EX-04: Alternative Being (2023)',
  'ST-14: Advanced Deck Beelzemon (2023)',
  'BT-11: Dimensional Phase (2023)',
  'BT-10: Xros Encounter (2022)',
  'EX-03: Draconic Roar (2022)',
  'BT-09: X Record (2022)',
  'EX-02: Digital Hazard (2022)',
  'BT-08: New Awakening (2022)',
  'BT-07: Next Adventure (2022)',
  'EX-01: Classic Collection (2021)',
  'BT-06: Double Diamond (2021)',
  'BT-05: Battle of Omni (2021)',
  'BT-04: Great Legend (2021)',
  'BT01-03: Release Special Booster Ver.1.0 (2021)',
  'ST-01: Gaia Red (2020)',
];

const BATTLE_SCENES_SETS_WITH_YEAR = [
  'Guerra Civil - Illuminati (2015)',
  'Guerra Civil (2015)',
  'Ofensiva Surpresa (2015)',
  'Iniciativa Vingadores (2015)',
  'Invasão Cósmica (2014)',
  'Múltiplas Identidades - Decks (2014)',
  'Múltiplas Identidades (2014)',
  'Poderes Ocultos (2014)',
  'Evolução Tática (2013)',
  'Universo Marvel (2013)',
];

export const CardSearchModal: React.FC<CardSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCards,
  slotIndex,
  initialCard,
  defaultGame,
  lockGame = false,
  currentTotalSlots = 72,
}) => {
  const [game, setGame] = useState<CardGame>(defaultGame);
  const [nameQuery, setNameQuery] = useState('');
  const [setQuery, setSetQuery] = useState('');
  const [results, setResults] = useState<ApiCardResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedCards, setSelectedCards] = useState<ApiCardResult[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recent-first');
  const [dynamicPokemonSets, setDynamicPokemonSets] = useState<string[]>([]);

  // Dynamically load the latest sets from TCGdex API when Pokémon is selected
  useEffect(() => {
    if (isOpen && game === 'pokemon') {
      getPokemonSetOptions()
        .then((sets) => {
          if (sets && sets.length > 0) {
            setDynamicPokemonSets(sets);
          }
        })
        .catch((err) => console.warn('Could not load dynamic sets:', err));
    }
  }, [isOpen, game]);

  useEffect(() => {
    if (isOpen) {
      const activeGame = initialCard ? initialCard.game : defaultGame;
      setGame(activeGame);
      setSortBy('recent-first');
      if (initialCard) {
        setNameQuery(initialCard.name);
        setSetQuery('');
        setSelectedCards([
          {
            apiId: initialCard.id,
            name: initialCard.name,
            game: initialCard.game,
            imageUrl: initialCard.imageUrl,
            finish: initialCard.finish,
            setName: initialCard.setName,
            collectorNumber: initialCard.collectorNumber,
            rarity: initialCard.rarity,
            artist: initialCard.artist,
            condition: initialCard.condition || 'NM',
            language: initialCard.language || 'PT',
            rawNumber: 0,
          },
        ]);
      } else {
        setNameQuery('');
        setSetQuery('');
        setResults([]);
        setSelectedCards([]);
        setErrorMsg('');
      }
    }
  }, [isOpen, initialCard, defaultGame]);

  const getSetOptions = () => {
    switch (game) {
      case 'pokemon':
        return dynamicPokemonSets.length > 0 ? dynamicPokemonSets : POKEMON_SETS_WITH_YEAR;
      case 'magic':
        return MAGIC_SETS_WITH_YEAR;
      case 'yugioh':
        return YUGIOH_SETS_WITH_YEAR;
      case 'digimon':
        return DIGIMON_SETS_WITH_YEAR;
      case 'battlescenes':
        return BATTLE_SCENES_SETS_WITH_YEAR;
      default:
        return [];
    }
  };

  // Search cards via API
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedName = nameQuery.trim();
    const trimmedSet = setQuery.trim();

    if (!trimmedName && !trimmedSet) {
      setErrorMsg('Informe o nome da carta ou escolha uma coleção e clique em Buscar.');
      setResults([]);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSelectedCards([]);

    try {
      const cards = await searchCards(game, trimmedName, trimmedSet);
      setResults(cards);
      // If user selected a specific set, number-asc is the most convenient
      // If user did a cross-set search, recent-first shows the latest cards first
      if (trimmedSet) {
        setSortBy('number-asc');
      } else {
        setSortBy('recent-first');
      }
      if (cards.length === 0) {
        setErrorMsg('Nenhuma carta encontrada com esses filtros. Verifique o nome ou selecione outra coleção.');
      }
    } catch {
      setErrorMsg('Erro na consulta com a API de cartas.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sort results by Recency, Number or Name
  const sortedResults = [...results].sort((a, b) => {
    if (sortBy === 'recent-first') {
      return (
        (b.chronologicalIndex ?? 0) - (a.chronologicalIndex ?? 0) ||
        a.rawNumber - b.rawNumber ||
        a.name.localeCompare(b.name)
      );
    }
    if (sortBy === 'oldest-first') {
      return (
        (a.chronologicalIndex ?? 0) - (b.chronologicalIndex ?? 0) ||
        a.rawNumber - b.rawNumber ||
        a.name.localeCompare(b.name)
      );
    }
    if (sortBy === 'number-asc') {
      return a.rawNumber - b.rawNumber || a.name.localeCompare(b.name);
    }
    if (sortBy === 'number-desc') {
      return b.rawNumber - a.rawNumber || b.name.localeCompare(a.name);
    }
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'name-desc') {
      return b.name.localeCompare(a.name);
    }
    return 0;
  });

  // Change finish for a card in results and selectedCards
  const handleFinishChange = (cardApiId: string, newFinish: CardFinish) => {
    setResults((prev) =>
      prev.map((c) => (c.apiId === cardApiId ? { ...c, finish: newFinish } : c))
    );
    setSelectedCards((prev) =>
      prev.map((c) => (c.apiId === cardApiId ? { ...c, finish: newFinish } : c))
    );
  };

  // Change condition for a card in results and selectedCards
  const handleConditionChange = (cardApiId: string, newCondition: string) => {
    setResults((prev) =>
      prev.map((c) => (c.apiId === cardApiId ? { ...c, condition: newCondition } : c))
    );
    setSelectedCards((prev) =>
      prev.map((c) => (c.apiId === cardApiId ? { ...c, condition: newCondition } : c))
    );
  };

  // Change language for a card in results and selectedCards
  const handleLanguageChange = (cardApiId: string, newLanguage: string) => {
    setResults((prev) =>
      prev.map((c) => (c.apiId === cardApiId ? { ...c, language: newLanguage } : c))
    );
    setSelectedCards((prev) =>
      prev.map((c) => (c.apiId === cardApiId ? { ...c, language: newLanguage } : c))
    );
  };

  // Toggle individual card selection
  const handleToggleCard = (card: ApiCardResult) => {
    setSelectedCards((prev) => {
      const existsIndex = prev.findIndex((c) => c.apiId === card.apiId);
      if (existsIndex >= 0) {
        return prev.filter((_, idx) => idx !== existsIndex);
      } else {
        return [...prev, card];
      }
    });
  };

  // Check if all cards in search results are selected
  const isAllSelected =
    sortedResults.length > 0 &&
    sortedResults.every((c) => selectedCards.some((s) => s.apiId === c.apiId));

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedCards((prev) =>
        prev.filter((s) => !sortedResults.some((c) => c.apiId === s.apiId))
      );
    } else {
      setSelectedCards((prev) => {
        const toAdd = sortedResults.filter(
          (c) => !prev.some((s) => s.apiId === c.apiId)
        );
        return [...prev, ...toAdd];
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedCards([]);
  };

  // Calculation of automatic sheets addition
  const effectiveSlot = slotIndex !== null && slotIndex !== undefined ? slotIndex : 0;
  const count = selectedCards.length;
  const lastSlotIndex = count > 0 ? effectiveSlot + count - 1 : effectiveSlot;
  const currentSheets = Math.floor(currentTotalSlots / 18);
  const neededPages = Math.ceil((lastSlotIndex + 1) / 9);
  const neededSheets = Math.ceil(neededPages / 2);
  const sheetsToAdd =
    count > 0 && lastSlotIndex >= currentTotalSlots
      ? Math.max(0, neededSheets - currentSheets)
      : 0;

  const handleConfirm = () => {
    if (selectedCards.length === 0) return;

    const newBinderCards: BinderCard[] = selectedCards.map((c, index) => {
      const generatedId = `card-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`;
      return {
        id: generatedId,
        name: c.name,
        game: c.game,
        imageUrl: c.imageUrl,
        finish: c.finish || 'normal',
        setName: c.setName,
        collectorNumber: c.collectorNumber,
        rarity: c.rarity,
        artist: c.artist,
        condition: c.condition || 'NM',
        language: c.language || 'PT',
        addedAt: Date.now() + index,
      };
    });

    onSelectCards(newBinderCards);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-x-hidden animate-in fade-in duration-150">
      <div className="relative w-full max-w-[95vw] lg:max-w-6xl bg-[#131724] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200 flex flex-col max-h-[92vh] overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f131f] shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">
              {initialCard ? 'Trocar Carta no Fichário' : 'Consultar e Inserir Carta no Fichário'}
            </h2>
            <p className="text-xs text-slate-400">
              {slotIndex !== null ? `Bolso #${slotIndex + 1}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Structured Search Form */}
        <form onSubmit={handleSearchSubmit} className="p-4 sm:p-6 border-b border-slate-800 bg-[#121624] space-y-3.5 shrink-0">
          {/* Game Selection Row (Interactive when not locked) */}
          {!lockGame && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-[11px] font-semibold text-slate-400 mr-1 shrink-0">Jogo:</span>
              {SUPPORTED_GAMES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setGame(g.id);
                    setSetQuery('');
                    setResults([]);
                    setSelectedCards([]);
                  }}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer shrink-0 font-medium ${
                    game === g.id
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Card Name Field */}
            <div className="sm:col-span-6">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Nome da Carta
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Ex: Charizard, Black Lotus, Blue-Eyes..."
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Set Dropdown List with Years */}
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Coleção / Expansão
              </label>
              <select
                value={setQuery}
                onChange={(e) => setSetQuery(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="">Todas as Coleções</option>
                {getSetOptions().map((setOption) => (
                  <option key={setOption} value={setOption}>
                    {setOption}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                disabled={isLoading || (!nameQuery.trim() && !setQuery.trim())}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 rounded-lg shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>Buscar</span>
              </button>
            </div>
          </div>

          {/* Sort & Multi-selection bar when results exist */}
          {results.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500" />
                  )}
                  <span>
                    {isAllSelected
                      ? 'Desmarcar todas'
                      : `Selecionar todas (${sortedResults.length})`}
                  </span>
                </button>

                {selectedCards.length > 0 && (
                  <span className="text-indigo-400 font-semibold font-mono text-xs">
                    ({selectedCards.length} selecionada{selectedCards.length > 1 ? 's' : ''})
                  </span>
                )}
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 self-end sm:self-auto">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px]">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="recent-first">Mais Recentes (Novas Primeiro)</option>
                  <option value="oldest-first">Mais Antigas (Clássicas Primeiro)</option>
                  <option value="number-asc">Número (Crescente)</option>
                  <option value="number-desc">Número (Decrescente)</option>
                  <option value="name-asc">Nome (A - Z)</option>
                  <option value="name-desc">Nome (Z - A)</option>
                </select>
              </div>
            </div>
          )}
        </form>

        {/* Results Area */}
        <div className="p-3 sm:p-5 overflow-y-auto overflow-x-hidden flex-1 min-h-[300px]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-xs">Buscando cartas na base de dados oficial...</p>
            </div>
          )}

          {!isLoading && errorMsg && (
            <div className="text-center py-14 px-4 text-slate-400 text-xs">
              <p className="text-slate-300 font-medium mb-1">{errorMsg}</p>
            </div>
          )}

          {!isLoading && !errorMsg && results.length === 0 && (
            <div className="text-center py-14 px-4 text-slate-500 text-xs">
              Digite o nome de uma carta ou escolha uma coleção e clique em &quot;Buscar&quot;.
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <div>
              <div className="flex items-center justify-between pb-3 text-xs text-slate-400 border-b border-slate-800/80 mb-3.5">
                <span>
                  Mostrando todas as <strong className="text-white">{sortedResults.length}</strong> cartas encontradas
                </span>
                {selectedCards.length > 0 && (
                  <span className="text-indigo-400 font-medium">
                    {selectedCards.length} selecionada{selectedCards.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
                {sortedResults.map((card) => {
                  const selectedIndex = selectedCards.findIndex((s) => s.apiId === card.apiId);
                  const isSelected = selectedIndex !== -1;
                  const isFoil = card.finish !== 'normal';
                  const finishClass =
                    card.finish === 'foil'
                      ? 'finish-foil'
                      : card.finish === 'holo'
                      ? 'finish-holo'
                      : card.finish === 'reverse'
                      ? 'finish-reverse'
                      : card.finish === 'secret'
                      ? 'finish-secret'
                      : '';
                  const targetSlotNumber = isSelected ? effectiveSlot + selectedIndex + 1 : null;

                  return (
                    <div
                      key={card.apiId}
                      onClick={() => handleToggleCard(card)}
                      className={`group relative rounded-xl border p-2 flex flex-col justify-between transition-all cursor-pointer select-none min-w-0 ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-950/40'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      {/* Selection order badge */}
                      {isSelected ? (
                        <div
                          className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-lg border-2 border-indigo-300 ring-2 ring-indigo-500/40"
                          title={`Carta #${selectedIndex + 1} selecionada`}
                        >
                          {selectedIndex + 1}
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full border border-slate-600/80 bg-slate-950/60 opacity-50 group-hover:opacity-100 group-hover:border-indigo-400 group-hover:bg-slate-900 transition-all flex items-center justify-center text-slate-400">
                          <Check className="w-3.5 h-3.5 opacity-0 group-hover:opacity-70 transition-opacity" />
                        </div>
                      )}

                      {/* Card Image */}
                      <div className={`aspect-[5/7] rounded-md overflow-hidden bg-black/60 mb-2 relative ${finishClass}`}>
                        {card.imageUrl && card.imageUrl.trim() !== '' ? (
                          <img
                            src={card.imageUrl}
                            alt={card.name}
                            loading="lazy"
                            className="w-full h-full object-contain pointer-events-none"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-slate-900 text-slate-400">
                            <span className="text-[11px] font-bold text-slate-200 line-clamp-2">{card.name}</span>
                            <span className="text-[9px] text-slate-500 mt-1">{card.setName}</span>
                          </div>
                        )}

                        {isFoil && (
                          <div className="absolute bottom-1 left-1 pointer-events-none">
                            <span className="px-1.5 py-0.5 text-[8px] font-mono font-extrabold uppercase bg-amber-500/90 text-black rounded shadow">
                              {card.finish === 'reverse' ? 'REV' : card.finish}
                            </span>
                          </div>
                        )}

                        {/* Condition & Language Overlay Badge */}
                        <div className="absolute bottom-1 right-1 pointer-events-none">
                          <span className="px-1.5 py-0.5 text-[8px] font-mono font-medium bg-black/80 text-white rounded border border-slate-700/80 shadow">
                            {[card.condition || 'NM', card.language || 'PT'].join(' • ')}
                          </span>
                        </div>
                      </div>

                      {/* Info & Slot Target */}
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate leading-tight">
                          {card.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">
                          {card.setName}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800">
                          <span className="truncate max-w-[65%]">{card.rarity}</span>
                          <span>{card.collectorNumber}</span>
                        </div>

                        {/* Editable Acabamento, Conservação e Idioma (mesmo tamanho e estilo) */}
                        <div
                          className="pt-1.5 mt-1 border-t border-slate-800/80 grid grid-cols-3 gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Acabamento */}
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider truncate">
                              Acabamento
                            </span>
                            <select
                              value={card.finish || 'normal'}
                              onChange={(e) => handleFinishChange(card.apiId, e.target.value as CardFinish)}
                              className="w-full h-7 bg-slate-950 border border-slate-700/80 rounded px-1 text-[10px] font-medium text-slate-200 hover:border-slate-600 focus:outline-none focus:border-indigo-500 cursor-pointer truncate shadow-xs transition-colors"
                              title={`Acabamento: ${card.finish || 'normal'}`}
                            >
                              {CARD_FINISHES.map((f) => (
                                <option key={f.value} value={f.value} className="bg-slate-900 text-slate-200">
                                  {f.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Estado */}
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider truncate">
                              Estado
                            </span>
                            <select
                              value={card.condition || 'NM'}
                              onChange={(e) => handleConditionChange(card.apiId, e.target.value)}
                              className="w-full h-7 bg-slate-950 border border-slate-700/80 rounded px-1 text-[10px] font-medium text-slate-200 hover:border-slate-600 focus:outline-none focus:border-indigo-500 cursor-pointer truncate shadow-xs transition-colors"
                              title={`Estado: ${card.condition || 'NM'}`}
                            >
                              {CARD_CONDITIONS.map((c) => (
                                <option key={c.value} value={c.value} className="bg-slate-900 text-slate-200">
                                  {c.value} ({c.label.split('(')[1]?.replace(')', '') || c.value})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Idioma */}
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider truncate">
                              Idioma
                            </span>
                            <select
                              value={card.language || 'PT'}
                              onChange={(e) => handleLanguageChange(card.apiId, e.target.value)}
                              className="w-full h-7 bg-slate-950 border border-slate-700/80 rounded px-1 text-[10px] font-medium text-slate-200 hover:border-slate-600 focus:outline-none focus:border-indigo-500 cursor-pointer truncate shadow-xs transition-colors"
                              title={`Idioma: ${card.language || 'PT'}`}
                            >
                              {CARD_LANGUAGES.map((l) => (
                                <option key={l.value} value={l.value} className="bg-slate-900 text-slate-200">
                                  {l.value} ({l.label.split('(')[1]?.replace(')', '') || l.value})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="pt-1 flex items-center justify-between border-t border-indigo-500/20 mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold border border-indigo-500/30">
                              Bolso #{targetSlotNumber}
                            </span>
                            <span className="text-[9px] text-indigo-400 font-mono">
                              #{selectedIndex + 1} na ordem
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#10141f] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {selectedCards.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-white">
                  {selectedCards.length} {selectedCards.length === 1 ? 'carta selecionada' : 'cartas selecionadas'}
                </span>
                <span className="text-slate-400 text-[11px] font-mono">
                  (Bolso{selectedCards.length > 1 ? 's' : ''} #{effectiveSlot + 1}
                  {selectedCards.length > 1 ? ` a #${effectiveSlot + selectedCards.length}` : ''})
                </span>
                {sheetsToAdd > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-950/70 border border-amber-700/60 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    +{sheetsToAdd} {sheetsToAdd === 1 ? 'folha nova será adicionada' : 'folhas novas serão adicionadas'}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-500 text-xs">
                Clique nas cartas para selecionar uma ou mais em sequência
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {selectedCards.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Limpar seleção
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={selectedCards.length === 0}
              onClick={handleConfirm}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 rounded-lg shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {selectedCards.length === 0
                ? 'Selecione ao menos 1 carta'
                : selectedCards.length === 1
                ? initialCard
                  ? `Substituir no Bolso #${effectiveSlot + 1}`
                  : `Inserir no Bolso #${effectiveSlot + 1}`
                : `Alocar ${selectedCards.length} Cartas no Fichário`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
