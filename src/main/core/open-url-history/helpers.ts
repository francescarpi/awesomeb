import { TFindUrlResult } from './types';

export function bestMatchWithRange(
  urls: string[],
  query: string,
  limit: number = 10,
): TFindUrlResult[] {
  if (!query || query.trim() === '') {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  const results: TFindUrlResult[] = [];

  for (const url of urls) {
    if (results.length >= limit) {
      break;
    }

    const startIndex = url.toLowerCase().indexOf(lowerQuery);

    if (startIndex !== -1) {
      results.push({
        value: url,
        range: [startIndex, startIndex + query.length],
      });
    }
  }

  return results;
}
