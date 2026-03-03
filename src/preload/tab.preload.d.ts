export {};

declare global {
  const awesomePublic: {
    showTabPreview(url: string): void;
    showLinkInfo(url: string | null): void;
  };
}
