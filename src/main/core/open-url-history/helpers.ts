import { TFindUrlResult } from './types';

function globMatch(text: string, pattern: string): boolean {
  if (!pattern.includes('*')) {
    return text.includes(pattern);
  }
  const parts = pattern.split('*');
  let pos = 0;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === '') continue;
    const idx = text.indexOf(part, pos);
    if (idx === -1) return false;
    pos = idx + part.length;
  }
  return true;
}

function findRanges(text: string, pattern: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const parts = pattern.split('*');
  let pos = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === '') continue;

    const idx = text.indexOf(part, pos);
    if (idx === -1) break;

    ranges.push([idx, idx + part.length]);
    pos = idx + part.length;
  }

  return ranges;
}

export function bestMatchWithRange(
  urls: string[],
  query: string,
  limit: number = 10,
): TFindUrlResult[] {
  if (!query || query.trim() === '') {
    return [];
  }

  const results: TFindUrlResult[] = [];
  const lowerQuery = query.toLowerCase();

  for (const url of urls) {
    if (results.length >= limit) {
      break;
    }

    const lowerUrl = url.toLowerCase();

    if (lowerQuery.includes('*')) {
      if (globMatch(lowerUrl, lowerQuery)) {
        const ranges = findRanges(lowerUrl, lowerQuery);
        if (ranges.length > 0) {
          results.push({ value: url, range: ranges });
        }
      }
    } else {
      const startIndex = lowerUrl.indexOf(lowerQuery);

      if (startIndex !== -1) {
        results.push({
          value: url,
          range: [[startIndex, startIndex + query.length]],
        });
      }
    }
  }

  return results;
}
