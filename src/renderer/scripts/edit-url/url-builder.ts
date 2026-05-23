export interface UrlParts {
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
  hash: string;
  hashParams: Array<{ key: string; value: string }>;
  searchParams: Array<{ key: string; value: string }>;
}

/**
 * Parses the hash fragment of a URL into a base path and query params.
 *
 * Handles SPA-style hashes like `#/route?key=value` where the query string
 * lives inside the hash fragment.
 */
export function parseHashQueryParams(hash: string): {
  base: string;
  params: Array<{ key: string; value: string }>;
} {
  if (!hash) return { base: '', params: [] };
  const h = hash.startsWith('#') ? hash.slice(1) : hash;
  const qIndex = h.indexOf('?');
  if (qIndex === -1) return { base: h, params: [] };
  const base = h.slice(0, qIndex);
  const searchParams = new URLSearchParams(h.slice(qIndex + 1));
  return {
    base,
    params: Array.from(searchParams.entries()).map(([key, value]) => ({ key, value })),
  };
}

/**
 * Parses a full URL string into its structural parts.
 *
 * Extracts both standard search params and hash-based query params (for SPA
 * routes like `/#/path?key=value`).
 */
export function parseURL(url: string): UrlParts {
  const urlObj = new URL(url);
  const hashInfo = parseHashQueryParams(urlObj.hash);
  return {
    protocol: urlObj.protocol.replace(':', ''),
    hostname: urlObj.hostname,
    port: urlObj.port,
    pathname: urlObj.pathname,
    hash: hashInfo.base || urlObj.hash.replace('#', ''),
    hashParams: hashInfo.params,
    searchParams: Array.from(urlObj.searchParams.entries()).map(([k, v]) => ({
      key: k,
      value: v,
    })),
  };
}

/**
 * Builds a URL string from its parsed parts.
 *
 * When `useHashParams` is `true` the active params (`hashParams`) are serialised
 * as a query string inside the hash fragment (`#base?key=value`). Otherwise the
 * active params (`searchParams`) become the standard query string and `hash` is
 * a plain fragment.
 *
 * Entries where both key and value are empty are filtered out.
 */
export function buildURL(parts: UrlParts, useHashParams: boolean): string {
  let url = `${parts.protocol}://${parts.hostname}`;
  if (parts.port) url += `:${parts.port}`;

  const activeParams = useHashParams ? parts.hashParams : parts.searchParams;
  const filteredParams = activeParams.filter((p) => p.key !== '' || p.value !== '');
  let qs = '';
  if (filteredParams.length > 0) {
    const sp = new URLSearchParams();
    filteredParams.forEach((p) => sp.append(p.key, p.value));
    qs = '?' + sp.toString();
  }

  const hashStr = parts.hash ? (parts.hash.startsWith('#') ? parts.hash : '#' + parts.hash) : '';

  if (useHashParams) {
    return url + parts.pathname + hashStr + qs;
  }
  return url + parts.pathname + qs + hashStr;
}

/**
 * Replaces the active params (search or hash) in a URL string with a new set.
 *
 * Parses the URL, swaps out the relevant params, and rebuilds it. Useful for
 * syncing Option1 ↔ Option2 in the edit-url page.
 */
export function updateURLSearchParams(
  url: string,
  params: Array<{ key: string; value: string }>,
  useHashParams: boolean,
): string {
  const parts = parseURL(url);
  if (useHashParams) {
    parts.hashParams = params;
  } else {
    parts.searchParams = params;
  }
  return buildURL(parts, useHashParams);
}
