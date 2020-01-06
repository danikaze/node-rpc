import { getRandomInt } from './random';

interface WeaponDefinition {
  minDamage: number;
  maxDamage: number;
  successRatio: number;
  range: number;
}

export const weapons = {
  HANDS: {
    minDamage: 5,
    maxDamage: 15,
    successRatio: 0.7,
    range: 1,
  } as WeaponDefinition,
  KNIFE: {
    minDamage: 15,
    maxDamage: 30,
    successRatio: 0.8,
    range: 1,
  } as WeaponDefinition,
  MAGIC_WAND: {
    minDamage: 30,
    maxDamage: 50,
    successRatio: 0.4,
    range: 10,
  } as WeaponDefinition,
  SWORD: {
    minDamage: 50,
    maxDamage: 80,
    successRatio: 0.6,
    range: 1,
  } as WeaponDefinition,
};

export function attackDamage(weapon: keyof typeof weapons): number {
  const w = weapons[weapon];
  return getRandomInt(w.minDamage, w.maxDamage);
}
