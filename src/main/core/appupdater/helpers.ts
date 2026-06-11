export function removeAllAnchors(text: string): string {
  return text.replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1');
}
