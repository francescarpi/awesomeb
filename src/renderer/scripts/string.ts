export function highlightString(str: string, ranges: Array<[number, number]>): string {
  const sortedRanges = [...ranges].sort((a, b) => a[0] - b[0]);
  let result = str;
  let offset = 0;

  for (const [start, end] of sortedRanges) {
    const adjustedStart = start + offset;
    const adjustedEnd = end + offset;
    const tag = '<mark>';
    const closeTag = '</mark>';
    result =
      result.slice(0, adjustedStart) +
      tag +
      result.slice(adjustedStart, adjustedEnd) +
      closeTag +
      result.slice(adjustedEnd);
    offset += tag.length + closeTag.length;
  }

  return result;
}
