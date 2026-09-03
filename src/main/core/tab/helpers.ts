export function isViewSourceUrl(url: string | null): boolean {
  if (!url) {
    return false;
  }
  return url.startsWith('view-source:');
}
