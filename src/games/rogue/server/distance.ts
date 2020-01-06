interface Point {
  x: number;
  y: number;
}

/**
 * Returns the euclidean distance between two points
 */
export function distance(a: Point, b: Point): number {
  const xx = (b.x - a.x) * (b.x - a.x);
  const yy = (b.y - a.y) * (b.y - a.y);

  return Math.sqrt(xx + yy);
}
