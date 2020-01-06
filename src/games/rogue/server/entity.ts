import { getRandomInt } from './random';

// list of valid generated-not-expired IDs
const ids: number[] = [];

/**
 * Generate an ID to use for Entities
 */
export function generateEntityId(): number {
  let id: number;

  do {
    id = getRandomInt();
  } while (ids.indexOf(id) !== -1);
  ids.push(id);

  return id;
}

/**
 * Check if an ID is valid (has been generated here)
 */
export function isValidId(id: number): boolean {
  return ids.indexOf(id) !== -1;
}

/**
 * Invalidate an ID so it cannot be used anymore
 */
export function removeId(id: number): void {
  const i = ids.indexOf(id);
  if (i !== -1) {
    ids.splice(i, 1);
  }
}
