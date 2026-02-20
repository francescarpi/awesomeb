import { TFindUrlResult } from './types';

/**
 * Returns the first element from `list` whose domain (without protocol)
 * starts with the `query`, together with the indices of the matched substring.
 *
 * Ignores the protocol (e.g., "http://", "https://") when matching.
 * If no element starts with the query, returns `null`.
 *
 * @param list  - Array of URL strings to search
 * @param query - Text used for matching (case-insensitive)
 *
 * @returns
 *   null, or an object:
 *     {
 *       value: string,          // the matched item from `list`
 *       range: [number, number] // [startIndex, endIndex] (inclusive, in the original string)
 *     }
 */
export function bestMatchWithRange(list: string[], query: string): TFindUrlResult {
  if (!Array.isArray(list) || typeof query !== 'string') return null;

  const q = query.toLowerCase();

  for (const item of list) {
    // Quitar el protocolo
    const withoutProtocol = item.replace(/^[a-z]+:\/\//i, '');
    const lowerWithoutProtocol = withoutProtocol.toLowerCase();

    // Buscar si empieza con la query
    if (lowerWithoutProtocol.startsWith(q)) {
      // El rango es el comienzo del dominio (sin protocolo)
      const protocolLength = item.length - withoutProtocol.length;
      const start = protocolLength;
      const end = start + q.length - 1; // inclusive

      return { value: item, range: [start, end] };
    }
  }

  return null;
}
