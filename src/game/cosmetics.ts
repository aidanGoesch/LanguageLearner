import type { Cosmetic, CosmeticType, Creature } from '../types';

export const COSMETIC_CATALOG: Cosmetic[] = [
  {
    id: 'skin-default',
    name: 'Ember coat',
    type: 'skin',
    price: 0,
    description: 'The classic warm fuzz every hatchling starts with.',
  },
  {
    id: 'skin-moss',
    name: 'Moss blanket',
    type: 'skin',
    price: 45,
    description: 'Soft forest green — smells like rain.',
  },
  {
    id: 'skin-dusk',
    name: 'Dusk shimmer',
    type: 'skin',
    price: 80,
    description: 'Twilight purple with a faint glow.',
  },
  {
    id: 'skin-amber',
    name: 'Amber shell',
    type: 'skin',
    price: 120,
    description: 'Honey-bright plates that catch lamplight.',
  },
  {
    id: 'acc-leaf-crown',
    name: 'Leaf crown',
    type: 'accessory',
    price: 35,
    description: 'A circlet of den ferns.',
  },
  {
    id: 'acc-star-pin',
    name: 'Star pin',
    type: 'accessory',
    price: 55,
    description: 'Tiny brass star for good recall nights.',
  },
  {
    id: 'acc-scarf',
    name: 'Knit scarf',
    type: 'accessory',
    price: 65,
    description: 'Hand-loomed, slightly too long.',
  },
  {
    id: 'habit-lantern',
    name: 'Lantern nook',
    type: 'habitat',
    price: 90,
    description: 'A hanging lantern for the home den.',
  },
  {
    id: 'habit-mushroom',
    name: 'Glow mushrooms',
    type: 'habitat',
    price: 70,
    description: 'Bioluminescent cluster — no watering.',
  },
  {
    id: 'back-ember',
    name: 'Ember backs',
    type: 'cardback',
    price: 40,
    description: 'Warm gradient card reverse.',
  },
  {
    id: 'back-fern',
    name: 'Fern backs',
    type: 'cardback',
    price: 40,
    description: 'Leafy pattern for study cards.',
  },
  {
    id: 'feed-sparkle',
    name: 'Sparkle feed',
    type: 'feedAnim',
    price: 50,
    description: 'Golden crumbs when your companion eats.',
  },
  {
    id: 'feed-bubbles',
    name: 'Bubble feed',
    type: 'feedAnim',
    price: 50,
    description: 'Playful bubbles on feed day.',
  },
];

export function getCosmeticById(id: string): Cosmetic | undefined {
  return COSMETIC_CATALOG.find((c) => c.id === id);
}

export function getCosmeticsByType(type: CosmeticType): Cosmetic[] {
  return COSMETIC_CATALOG.filter((c) => c.type === type);
}

export function getRandomUnownedCosmetic(owned: string[]): Cosmetic | undefined {
  const pool = COSMETIC_CATALOG.filter((c) => c.price > 0 && !owned.includes(c.id));
  if (pool.length === 0) return undefined;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function canAfford(coins: number, cosmetic: Cosmetic): boolean {
  return coins >= cosmetic.price;
}

export function purchaseCosmetic(
  coins: number,
  owned: string[],
  cosmeticId: string,
): { ok: true; coins: number; owned: string[] } | { ok: false; reason: string } {
  const item = getCosmeticById(cosmeticId);
  if (!item) return { ok: false, reason: 'Unknown item.' };
  if (owned.includes(cosmeticId)) return { ok: false, reason: 'Already owned.' };
  if (coins < item.price) return { ok: false, reason: 'Not enough coins.' };
  return {
    ok: true,
    coins: coins - item.price,
    owned: [...owned, cosmeticId],
  };
}

export function equipSkin(creature: Creature, skinId: string, owned: string[]): Creature | null {
  if (!owned.includes(skinId)) return null;
  return { ...creature, cosmetics: { ...creature.cosmetics, skin: skinId } };
}

export function toggleAccessory(creature: Creature, accessoryId: string, owned: string[]): Creature | null {
  if (!owned.includes(accessoryId)) return null;
  const current = creature.cosmetics.accessories;
  const has = current.includes(accessoryId);
  const accessories = has ? current.filter((id) => id !== accessoryId) : [...current, accessoryId];
  return { ...creature, cosmetics: { ...creature.cosmetics, accessories } };
}

export type CosmeticCategory = 'skins' | 'accessories' | 'habitat' | 'cardbacks' | 'feed';

export function categoryForType(type: CosmeticType): CosmeticCategory {
  switch (type) {
    case 'skin':
      return 'skins';
    case 'accessory':
      return 'accessories';
    case 'habitat':
      return 'habitat';
    case 'cardback':
      return 'cardbacks';
    case 'feedAnim':
      return 'feed';
  }
}

export const CATEGORY_LABELS: Record<CosmeticCategory, string> = {
  skins: 'Coats',
  accessories: 'Trinkets',
  habitat: 'Den decor',
  cardbacks: 'Card backs',
  feed: 'Feed flair',
};
