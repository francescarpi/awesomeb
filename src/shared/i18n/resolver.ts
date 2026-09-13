/**
 * Pure i18next-free resolution of a single `ns:dot.path` key against a
 * preloaded namespace bundle (loaded once per window by the preload script).
 *
 * It mirrors the subset of i18next behavior the renderer actually uses:
 * - Dotted-path lookups against nested namespace JSON.
 * - `{{param}}` interpolation with `escapeValue: false` (params are NOT
 *   escaped, so partners like `<i>{{url}}</i>` keep their HTML).
 * - Flattened plural keys (`key_one`, `key_other`) selected via
 *   `Intl.PluralRules` from the `count` param (en/es/ca only use one|other).
 *
 * Anything it cannot resolve returns `undefined` so the caller can fall back
 * to the real `i18n:t` IPC channel (covers other namespaces, runtime-added
 * keys, and any future syntax this resolver does not implement).
 */

export type I18nNamespaceBundle = Record<string, unknown>;
export type I18nBundle = Record<string, I18nNamespaceBundle>;

/** Replaces `{{name}}` / `{{ name }}`. Missing params keep the placeholder. */
export function interpolate(template: string, params?: Record<string, unknown>): string {
  if (!params) return template;
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/** Plural category for `count` in `locale` ('one' | 'other' for en/es/ca). */
export function pluralCategory(locale: string, count: unknown): string {
  if (typeof count !== 'number' || !Number.isFinite(count)) return 'other';
  try {
    return new Intl.PluralRules(locale.replace('_', '-')).select(count);
  } catch {
    return 'other';
  }
}

export function resolveBundleKey(
  bundle: I18nBundle,
  locale: string,
  key: string,
  params?: Record<string, unknown>,
): string | undefined {
  const sep = key.indexOf(':');
  // Short key (no namespace prefix) — default to the 'common' namespace,
  // matching i18next's defaultNS behavior. This covers bare keys like
  // 'ok', 'cancel', 'save', 'delete' used by confirm-btns, dialogs, etc.
  const namespace: string = sep === -1 ? 'common' : key.slice(0, sep);
  const path: string = sep === -1 ? key : key.slice(sep + 1);
  if (!path) return undefined;

  const ns = bundle[namespace];
  if (!ns) return undefined;

  const segments = path.split('.');
  const leaf = segments.pop();
  if (!leaf) return undefined;

  let node: unknown = ns;
  for (const segment of segments) {
    if (typeof node !== 'object' || node === null || !(segment in node)) {
      return undefined;
    }
    node = (node as I18nNamespaceBundle)[segment];
  }
  if (typeof node !== 'object' || node === null) return undefined;

  const holder = node as I18nNamespaceBundle;

  const exact = holder[leaf];
  if (typeof exact === 'string') return interpolate(exact, params);

  const category = pluralCategory(locale, params?.count);
  const plural = holder[`${leaf}_${category}`];
  if (typeof plural === 'string') return interpolate(plural, params);

  return undefined;
}
