# TRANSLATORS.md — Adding a New Language to AwesomeB

This guide covers adding a new language to **both** the application UI and the documentation.

---

## Prerequisites

- Node.js 18+
- pnpm 10.28.0
- Familiarity with JSON and Markdown/MDX

---

## Part 1 — Application Translations (`src/shared/i18n/`)

### Step 1: Add Locale to Constants

**File:** `src/shared/i18n/constants.ts`

```typescript
export const LOCALES = new Map([
  ['en', 'English'],
  ['es', 'Español'],
  ['ca', 'Català'],
  ['fr', 'Français'],  // ← add new line here
]);
```

- Use **ISO 639-1 two-letter code** as key (e.g., `fr`, `de`, `pt`, `it`, `ja`, `ko`, `zh`)
- Value = native language name (what users see in the language selector)

### Step 2: Create Locale Directory

```bash
mkdir -p src/shared/i18n/locales/fr
```

### Step 3: Create 5 Namespace Files

Copy from English and translate **values only** (keep keys identical):

```bash
cp src/shared/i18n/locales/en/*.json src/shared/i18n/locales/fr/
```

Then edit each file:

| File | Purpose | Example Keys |
|------|---------|--------------|
| `common.json` | Buttons, dialogs, generic UI | `ok`, `cancel`, `save`, `delete` |
| `menu.json` | Application menu items | `file.newWindow`, `edit.copy` |
| `commands.json` | Command palette names/descriptions | `tab-next.name`, `tab-next.description` |
| `pages.json` | Page-specific strings | `settings.title`, `bookmarks.empty` |
| `notifications.json` | Toast/notification messages | `download.complete`, `error.generic` |

**Important:**
- Keep JSON structure exactly the same
- Do not add/remove keys — the app expects all namespaces to have identical keys
- Use interpolation placeholders like `{{id}}`, `{{label}}` where present

### Step 4: Verify TypeScript

```bash
pnpm tscheck
```

This validates that `Locale` and `Namespace` types in `types.ts` include your new language.

---

## Part 2 — Documentation (`docs/`)

### Step 1: Add Locale to Starlight Config

**File:** `docs/astro.config.mjs`

```javascript
locales: {
  root: { label: 'English', lang: 'en' },
  es: { label: 'Español', lang: 'es' },
  ca: { label: 'Català', lang: 'ca' },
  fr: { label: 'Français', lang: 'fr' },  // ← add here
},
```

### Step 2: Create Locale Directory Structure

Mirror the `root` (English) structure exactly:

```bash
mkdir -p docs/src/content/docs/fr
# Then replicate all subdirectories:
mkdir -p docs/src/content/docs/fr/config
mkdir -p docs/src/content/docs/fr/desktops
mkdir -p docs/src/content/docs/fr/tabs
mkdir -p docs/src/content/docs/fr/windows
mkdir -p docs/src/content/docs/fr/extensions
```

### Step 3: Translate ALL Pages

**Every `.mdx` file in `docs/src/content/docs/` (root) must exist in `fr/`.**

```bash
# Example: copy and translate
cp docs/src/content/docs/index.mdx docs/src/content/docs/fr/index.mdx
cp docs/src/content/docs/overview.mdx docs/src/content/docs/fr/overview.mdx
# ... repeat for every file
```

**Rules:**
- **No stubs allowed** — Build fails if a page exists in one locale but not others
- Keep frontmatter identical (`title`, `description`, `template`, `hero`)
- Translate content only
- Preserve Starlight components (`CardGrid`, `Card`, `:::note`, etc.)

### Step 4: Update Sidebar Translations

**File:** `docs/astro.config.mjs` — every sidebar item needs a `translations` entry for the new locale:

```javascript
{
  label: 'Start here',
  translations: { 'ca': 'Comença aquí', 'es': 'Empieza aquí', 'fr': 'Commencez ici' },
  items: [
    { label: 'Overview', translations: { 'ca': 'Visió general', 'es': 'Visión general', 'fr': 'Aperçu' }, slug: 'overview' },
    // ... every item needs the new locale
  ]
}
```

**All sidebar items at all nesting levels require translations.**

### Step 4: Update Sidebar Translations

**File:** `docs/astro.config.mjs` — every sidebar item needs a `translations` entry for the new locale:

```javascript
{
  label: 'Start here',
  translations: { 'ca': 'Comença aquí', 'es': 'Empieza aquí', 'fr': 'Commencez ici' },
  items: [
    { label: 'Overview', translations: { 'ca': 'Visió general', 'es': 'Visión general', 'fr': 'Aperçu' }, slug: 'overview' },
    // ... every item needs the new locale
  ]
}
```

**All sidebar items at all nesting levels require translations.**

### Step 5: Update the `awesomeb-docs-check` Skill

**File:** `.opencode/skills/awesomeb-docs-check/SKILL.md`

The pre-commit docs check skill hardcodes the three locales in its **Three-Locale Requirement** table. If you add a new language and don't update it, the skill won't verify coverage for the new locale on future commits.

1. Open `SKILL.md` and find the **Three-Locale Requirement** table:

```markdown
| Locale | Path |
|---|---|
| English (root) | `docs/src/content/docs/<page>` |
| Spanish | `docs/src/content/docs/es/<page>` |
| Catalan | `docs/src/content/docs/ca/<page>` |
```

2. Add a row for the new locale:

```markdown
| French | `docs/src/content/docs/fr/<page>` |
```

3. `allowed-tools` already includes everything needed; no other changes required.

### Step 6: Verify Documentation Build

```bash
cd docs
pnpm dev
```

- Check language switcher appears with new language
- Navigate through all sections — no 404s
- Verify sidebar shows translated labels

---

## Part 3 — Final Verification

### 1. App Build

```bash
cd ..
pnpm build
```

- App should start with new language available in settings

### 2. Type Check

```bash
pnpm tscheck
```

- No TypeScript errors related to new locale

### 3. Test Language Switching

- Open app → Settings → Language → select new language
- UI should reload in new language
- Command palette, menus, notifications all translated

---

## Common Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| Build fails with "missing translation" | Key exists in `en` but not new locale | Add missing key to all 5 JSON files |
| Language not in selector | Forgot to add to `LOCALES` Map | Update `constants.ts` |
| Docs 404 in new language | Missing `.mdx` file | Create page in `docs/src/content/docs/fr/` |
| Sidebar shows English label | Missing `translations` entry | Add to `docs/astro.config.mjs` |
| TypeScript error on `Locale` type | `SUPPORTED_LOCALES` not updated | Run `pnpm tscheck` — it auto-derives from `LOCALES` |

---

## ISO 639-1 Reference

| Code | Language | Native Name |
|------|----------|-------------|
| `en` | English | English |
| `es` | Spanish | Español |
| `ca` | Catalan | Català |
| `fr` | French | Français |
| `de` | German | Deutsch |
| `pt` | Portuguese | Português |
| `it` | Italian | Italiano |
| `ja` | Japanese | 日本語 |
| `ko` | Korean | 한국어 |
| `zh` | Chinese | 中文 |
| `ru` | Russian | Русский |
| `pl` | Polish | Polski |
| `nl` | Dutch | Nederlands |
| `tr` | Turkish | Türkçe |

---

## Quick Reference Commands

```bash
# From repo root

# Check app translations compile
pnpm tscheck

# Test docs locally
cd docs && pnpm dev

# Full build (app + docs)
pnpm build
```

---

## Need Help?

- Check existing locales (`en`, `es`, `ca`) as reference
- App translation logic: `src/shared/i18n/i18n.ts`
- Docs config: `docs/astro.config.mjs`
- Open an issue if something is unclear