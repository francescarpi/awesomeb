export {};

declare global {
  interface CSSStyleDeclaration {
    appRegion?: 'drag' | 'no-drag' | string;
  }
}
