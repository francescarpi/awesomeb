import { TFindUrlResult } from './types';

/**
 * Returns the best‑matching element from `list` together with the
 * indices of the matched substring.
 *
 * If no element shares any consecutive characters with `query`,
 * the function returns `null`.
 *
 * @param list  - Array of strings to search
 * @param query - Text used for matching
 *
 * @returns
 *   null, or an object:
 *     {
 *       value: string,          // the matched item from `list`
 *       range: [number, number] // [startIndex, endIndex] (inclusive)
 *     }
 */
export function bestMatchWithRange(list: string[], query: string): TFindUrlResult {
  if (!Array.isArray(list) || typeof query !== 'string') return null;

  const q = query.toLowerCase();

  // ------------------------------------------------------------------
  // Find the longest consecutive match between `a` and `b`.
  // Returns an object with:
  //   score: length of the match
  //   startA, endA: indices in `a` where the match occurs
  // ------------------------------------------------------------------
  const longestConsecutiveMatch = (
    a: string,
    b: string,
  ): { score: number; startA: number; endA: number } => {
    let bestScore = 0;
    let bestStartA = -1; // -1 means no match yet

    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        let k = 0;
        while (i + k < a.length && j + k < b.length && a[i + k] === b[j + k]) {
          k++;
        }
        if (k > bestScore) {
          bestScore = k;
          bestStartA = i; // starting index in `a`
        }
      }
    }

    return {
      score: bestScore,
      startA: bestStartA,
      endA: bestStartA + bestScore - 1, // inclusive
    };
  };

  let bestItem: string | null = null;
  let bestStart = -1;
  let bestEnd = -1;
  let bestScore = 0;

  for (const item of list) {
    const { score, startA, endA } = longestConsecutiveMatch(item.toLowerCase(), q);

    if (score > bestScore) {
      bestScore = score;
      bestItem = item; // original string
      bestStart = startA;
      bestEnd = endA;
    }
  }

  if (bestScore === 0 || bestItem === null) {
    return null; // no match found
  }

  if (bestItem.indexOf(query) === -1) {
    return null;
  }

  return { value: bestItem, range: [bestStart, bestEnd] };
}
