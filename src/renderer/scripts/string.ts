export function highlightString(str: string, range: [number, number]): string {
  const [start, end] = range;
  return str.slice(0, start) + '<mark>' + str.slice(start, end) + '</mark>' + str.slice(end);
}
