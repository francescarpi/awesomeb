export function removeAllAnchors(text: string): string {
  return text.replace(/<a\b[^>]*>(.*?)<\/a>/gi, '$1');
}

const GENERATED_NOTES_COMMENT = /<!--[\s\S]*?-->/g;
const FULL_CHANGELOG_LINE = /<p>\s*<strong>\s*Full Changelog\s*<\/strong>[\s\S]*?<\/p>/gi;
const AUTHOR_SUFFIX = /\s+by\s+@[\w.-]+\s+in\s+(?:#\d+|https?:\/\/\S+)/gi;
const AUTHOR_SUFFIX_NO_URL = /\s+by\s+@[\w.-]+\s*$/i;

function cleanListItem(item: string): string {
  let cleaned = removeAllAnchors(item);
  cleaned = cleaned.replace(AUTHOR_SUFFIX, '');
  cleaned = cleaned.replace(AUTHOR_SUFFIX_NO_URL, '');
  return cleaned.trim();
}

export function cleanReleaseNotes(text: string): string {
  let cleaned = text.replace(GENERATED_NOTES_COMMENT, '');
  cleaned = cleaned.replace(FULL_CHANGELOG_LINE, '');
  cleaned = cleaned.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_match, content: string) => {
    return `<li>${cleanListItem(content)}</li>`;
  });
  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}
