import fs from 'node:fs/promises';
import path from 'node:path';

interface ShortcutEntry {
  map: string;
  shortcut: string;
}

export async function getShortcutEntry(shortcutId: string): Promise<ShortcutEntry[]> {
  const mapsDir = path.resolve('../src/main/core/shortcuts/maps');
  const entries = await fs.readdir(mapsDir);
  const tsFiles = entries.filter((f) => f.endsWith('.ts') && f !== 'index.ts');

  const result: ShortcutEntry[] = [];

  for (const file of tsFiles) {
    const content = await fs.readFile(path.join(mapsDir, file), 'utf-8');

    const nameMatch = content.match(/name:\s*['"]([^'"]+)['"]/);
    if (!nameMatch) continue;

    const shortcutRegex = new RegExp(`\\b${shortcutId}:\\s*\\{\\s*\\n\\s*key:\\s*(['"])(.*?)\\1`, 'g');
    const match = shortcutRegex.exec(content);

    if (match) {
      result.push({ map: nameMatch[1], shortcut: match[2] });
    }
  }

  return result;
}
