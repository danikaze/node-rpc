/**
 * Get an integer between [min, max]
 *
 * Really biased and bad implementation of random :P
 * Remember kids, don't use this in the real world!
 */
export function getRandomInt(min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number {
  return min + (Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) % (max - min + 1));
}
