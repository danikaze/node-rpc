export function formatConstString(str: string): string {
  return `${str.toLowerCase()}`.replace(/(^\w)|([_ ](\w))/g, (a, b, c, d) =>
    (d ? ` ${d}` : a).toUpperCase()
  );
}
