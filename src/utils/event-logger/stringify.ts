export function stringify(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function stringifyFunction(name: string, params: unknown[]): string {
  const p = !params ? [''] : params.map(stringify);
  return `${name}(${p.join(', ')})`;
}
