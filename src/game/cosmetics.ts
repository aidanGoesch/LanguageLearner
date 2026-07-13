import type { Cosmetic, CosmeticType, Creature } from '../types';

export const COSMETIC_CATALOG: Cosmetic[] = [
  // Skins
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
    id: 'skin-berry',
    name: 'Berry blush',
    type: 'skin',
    price: 55,
    description: 'Sweet pink with rosy cheeks.',
  },
  {
    id: 'skin-frost',
    name: 'Frost shimmer',
    type: 'skin',
    price: 65,
    description: 'Cool blue like morning dew.',
  },
  {
    id: 'skin-ash',
    name: 'Ash coat',
    type: 'skin',
    price: 70,
    description: 'Muted grey-brown, soft and calm.',
  },
  {
    id: 'skin-gold',
    name: 'Golden shell',
    type: 'skin',
    price: 90,
    description: 'Honey-bright plates that catch lamplight.',
  },
  {
    id: 'skin-dusk',
    name: 'Dusk shimmer',
    type: 'skin',
    price: 80,
    description: 'Twilight purple with a faint glow.',
  },
  {
    id: 'skin-ocean',
    name: 'Ocean tide',
    type: 'skin',
    price: 95,
    description: 'Deep teal like tide pools.',
  },
  {
    id: 'skin-rose',
    name: 'Rose petal',
    type: 'skin',
    price: 100,
    description: 'Warm coral pink, soft as petals.',
  },
  {
    id: 'skin-mint',
    name: 'Mint frost',
    type: 'skin',
    price: 110,
    description: 'Fresh pale green with a cool sheen.',
  },
  {
    id: 'skin-shadow',
    name: 'Shadow cloak',
    type: 'skin',
    price: 130,
    description: 'Deep violet-grey for night owls.',
  },
  {
    id: 'skin-cream',
    name: 'Cream puff',
    type: 'skin',
    price: 160,
    description: 'Ivory white, fluffy and bright.',
  },
  // Accessories
  {
    id: 'acc-hat',
    name: 'Party hat',
    type: 'accessory',
    price: 35,
    description: 'A pointy hat for celebration nights.',
  },
  {
    id: 'acc-crown',
    name: 'Golden crown',
    type: 'accessory',
    price: 75,
    description: 'Fit for a den royalty.',
  },
  {
    id: 'acc-bow',
    name: 'Ribbon bow',
    type: 'accessory',
    price: 30,
    description: 'A perky bow tied just so.',
  },
  {
    id: 'acc-flower',
    name: 'Den flower',
    type: 'accessory',
    price: 40,
    description: 'A tiny bloom tucked behind the ear.',
  },
  {
    id: 'acc-scarf',
    name: 'Knit scarf',
    type: 'accessory',
    price: 65,
    description: 'Hand-loomed, slightly too long.',
  },
  {
    id: 'acc-glasses',
    name: 'Round glasses',
    type: 'accessory',
    price: 50,
    description: 'Scholarly specs for serious study.',
  },
  {
    id: 'acc-halo',
    name: 'Soft halo',
    type: 'accessory',
    price: 85,
    description: 'A gentle golden ring above.',
  },
  {
    id: 'acc-horns',
    name: 'Little horns',
    type: 'accessory',
    price: 60,
    description: 'Tiny curved horns, very cute.',
  },
  {
    id: 'acc-antenna',
    name: 'Bug antenna',
    type: 'accessory',
    price: 45,
    description: 'Wobbly feelers that twitch.',
  },
  {
    id: 'acc-headphones',
    name: 'Den headphones',
    type: 'accessory',
    price: 70,
    description: 'For focus mode study sessions.',
  },
  {
    id: 'acc-wings',
    name: 'Tiny wings',
    type: 'accessory',
    price: 95,
    description: 'Fluttery wings — mostly decorative.',
  },
  {
    id: 'acc-star-pin',
    name: 'Star pin',
    type: 'accessory',
    price: 55,
    description: 'Tiny brass star for good recall nights.',
  },
  {
    id: 'acc-leaf-crown',
    name: 'Leaf crown',
    type: 'accessory',
    price: 35,
    description: 'A circlet of den ferns.',
  },
  // Backgrounds
  {
    id: 'bg-nest',
    name: 'Classic nest',
    type: 'background',
    price: 0,
    description: 'The cozy woven nest every hatchling starts in.',
  },
  {
    id: 'bg-lantern',
    name: 'Lantern nook',
    type: 'background',
    price: 90,
    description: 'A hanging lantern casting warm light.',
  },
  {
    id: 'bg-mushroom',
    name: 'Glow mushrooms',
    type: 'background',
    price: 70,
    description: 'Bioluminescent cluster — no watering.',
  },
  {
    id: 'bg-stars',
    name: 'Star field',
    type: 'background',
    price: 100,
    description: 'A twinkling night sky behind the den.',
  },
  {
    id: 'bg-aurora',
    name: 'Aurora bands',
    type: 'background',
    price: 120,
    description: 'Shifting ribbons of northern light.',
  },
  {
    id: 'bg-meadow',
    name: 'Meadow edge',
    type: 'background',
    price: 80,
    description: 'Soft grass and wildflowers at the den mouth.',
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

export function equipBackground(creature: Creature, backgroundId: string, owned: string[]): Creature | null {
  if (!owned.includes(backgroundId)) return null;
  return { ...creature, cosmetics: { ...creature.cosmetics, background: backgroundId } };
}

export type CosmeticCategory = 'skins' | 'accessories' | 'backgrounds';

export function categoryForType(type: CosmeticType): CosmeticCategory {
  switch (type) {
    case 'skin':
      return 'skins';
    case 'accessory':
      return 'accessories';
    case 'background':
      return 'backgrounds';
  }
}

export const CATEGORY_LABELS: Record<CosmeticCategory, string> = {
  skins: 'Coats',
  accessories: 'Trinkets',
  backgrounds: 'Den decor',
};
