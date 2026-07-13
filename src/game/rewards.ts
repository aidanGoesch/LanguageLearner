import { BONUS_COIN_RANGE, VARIABLE_REWARD_CHANCE } from './constants';
import { getCosmeticById, getRandomUnownedCosmetic } from './cosmetics';

export type VariableReward =
  | { kind: 'coins'; amount: number; label: string }
  | { kind: 'cosmetic'; cosmeticId: string; label: string };

const COIN_FLAVOR = [
  'A glint in the den dust!',
  'Loose change behind the log.',
  'Shiny pebble find.',
  'Bonus berries tumble out.',
];

export function rollVariableReward(ownedCosmetics: string[]): VariableReward | null {
  if (Math.random() >= VARIABLE_REWARD_CHANCE) return null;

  const rollCosmetic = Math.random() < 0.08;
  if (rollCosmetic) {
    const item = getRandomUnownedCosmetic(ownedCosmetics);
    if (item) {
      return {
        kind: 'cosmetic',
        cosmeticId: item.id,
        label: `Rare drop: ${item.name}!`,
      };
    }
  }

  const amount =
    BONUS_COIN_RANGE[0] +
    Math.floor(Math.random() * (BONUS_COIN_RANGE[1] - BONUS_COIN_RANGE[0] + 1));
  const label = COIN_FLAVOR[Math.floor(Math.random() * COIN_FLAVOR.length)];
  return { kind: 'coins', amount, label };
}

export function applyVariableReward(
  reward: VariableReward,
  coins: number,
  ownedCosmetics: string[],
): { coins: number; ownedCosmetics: string[] } {
  if (reward.kind === 'coins') {
    return { coins: coins + reward.amount, ownedCosmetics };
  }
  if (ownedCosmetics.includes(reward.cosmeticId)) {
    return { coins: coins + 15, ownedCosmetics };
  }
  return { coins, ownedCosmetics: [...ownedCosmetics, reward.cosmeticId] };
}

export function rewardLabel(reward: VariableReward): string {
  if (reward.kind === 'cosmetic') {
    const item = getCosmeticById(reward.cosmeticId);
    return item ? `Found ${item.name}` : reward.label;
  }
  return `${reward.label} +${reward.amount} coins`;
}
