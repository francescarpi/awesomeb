export const DEFAULT_MAX_LENGTH = 40;

export function truncate(text: string, max: number = DEFAULT_MAX_LENGTH): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 3)}...`;
}
