export function sanitizeUserAgent(userAgent: string, _url: URL): string {
  // This method is not doing any actual sanitization for now, but it can be extended in the future to modify the user agent string based on the URL or other criteria.
  return userAgent;
}
