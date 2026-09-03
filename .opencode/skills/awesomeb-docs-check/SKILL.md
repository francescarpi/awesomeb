---
name: awesomeb-docs-check
description: >
  Checks if staged/committed code changes affect user-visible documentation
  and creates/updates pages in docs/ for all languages (en, es, ca).
  Trigger: Automatically before every commit as a mandatory agent workflow step.
license: Apache-2.0
metadata:
  author: francescarpi
  version: "1.0"
allowed-tools: Read, Glob, Grep, Bash, Edit, Write, question
---

## When to Use

- **Before every commit** — mandatory, automatic step in the agent workflow
- After code changes that affect user-visible features, commands, UI, or behavior

## Critical Patterns

### File → Documentation Mapping

| Code Path | Documentation Page |
|---|---|
| `src/main/core/commands/*.ts` | `commands.mdx` (all commands on one page) |
| `src/main/core/tabs/*.ts` | `tabs/*.mdx` (one page per tab feature) |
| `src/main/core/desktops/*.ts` | `desktops/*.mdx` |
| `src/main/core/windows/*.ts` | `windows/*.mdx` |
| `src/main/core/bookmarks/*.ts` | `bookmarks.mdx` |
| `src/main/core/history/*.ts` | `history.mdx` |
| `src/main/core/extensions/*.ts` | `extensions/*.mdx` |
| `src/renderer/pages/*.astro` | Corresponding page |
| New module without mapping | Ask user which page to update |

### Three-Locale Requirement

Every page MUST exist in all three locales. Never create a page in only one language.

| Locale | Path |
|---|---|
| English (root) | `docs/src/content/docs/<page>` |
| Spanish | `docs/src/content/docs/es/<page>` |
| Catalan | `docs/src/content/docs/ca/<page>` |

### Changes That Do NOT Require Doc Updates

- Internal refactors (variable renames, code reorganization)
- Bug fixes that don't change visible behavior
- Test files, build configs, CI pipelines
- Type-only changes in `src/shared/types/` without API surface changes
- Dependency bumps

### Sidebar Entry for New Pages

When creating a new page, add entry in `docs/astro.config.mjs` with translations:

```js
{ label: 'New Feature', translations: { 'ca': 'Nova característica', 'es': 'Nueva funcionalidad' }, slug: 'section/new-feature' }
```

### Writing Rules

**DO NOT duplicate writing rules here.** Refer to `docs/AGENTS.md` as the source of truth for:

- Tone (informal but precise, second person, future tense)
- Catalan: `per a` + infinitive; do not mix `per` and `per a` in the same file
- Spanish: `para` + infinitive consistently
- English: straightforward infinitive
- Alt text: descriptive, not copied from other pages
- Callouts: `:::note` for important caveats, never decorative
- Files: `.mdx` format, never `.md`
- Empty stubs: never commit a page in one locale while leaving others as title-only skeletons

## Workflow

### Step 1: Detect Changed Files

```bash
# Files staged for commit
git diff --cached --name-only

# If no staged files, check last commit
git diff --name-only HEAD~1
```

### Step 2: Classify Impact

For each changed file, determine:

1. **Does it map to a docs page?** Use the file mapping table above.
2. **Is the change user-visible?** Check if it affects:
   - New commands or command behavior
   - New UI pages or components
   - Changes to existing features (tabs, desktops, windows, bookmarks, etc.)
   - New configuration options
   - New keyboard shortcuts
   - New IPC APIs exposed to renderer
3. **Internal-only?** If the change is purely internal (refactor, bug fix without behavior change, tests, CI), report no docs needed and stop.

### Step 3: Report Classification

```
[docs-check] Analyzing changed files...
[docs-check] Files analyzed: X
[docs-check] Documentation impact: Y pages affected
```

If no impact:

```
[docs-check] No documentation changes needed. All changes are internal.
```

Stop here. Do not create or modify any docs files.

### Step 4: Verify Three-Locale Coverage

For each affected page:

```bash
# Check all 3 locales exist
ls docs/src/content/docs/<page>
ls docs/src/content/docs/es/<page>
ls docs/src/content/docs/ca/<page>
```

If any locale is missing → create it (full translation, not stub).

### Step 5: Read Reference Page

Read the English version (root) first to understand the current content. Then read `es` and `ca` versions to see what needs updating.

### Step 6: Update or Create Pages

- **Existing page**: Update the relevant sections in all 3 languages.
- **New page**: Create in all 3 languages with proper content.

For the English page, use this minimal frontmatter:

```mdx
---
title: Page Title
---
```

### Step 7: Update Sidebar (if new page created)

Add entry to `docs/astro.config.mjs` sidebar array:

```js
{ label: 'English Label', translations: { 'ca': 'Etiqueta en català', 'es': 'Etiqueta en español' }, slug: 'section/page-slug' }
```

### Step 8: Final Report

```
[docs-check] Pages created: section/page.mdx (en, es, ca)
[docs-check] Pages updated: section/page.mdx (en, es, ca)
[docs-check] Sidebar updated: 1 new entry added
[docs-check] Done.
```

Or:

```
[docs-check] No documentation changes needed.
```

## Commands

```bash
# Detect changed files
git diff --cached --name-only
git diff --name-only HEAD~1

# Verify locale coverage for a page
for f in docs/src/content/docs/<page> docs/src/content/docs/es/<page> docs/src/content/docs/ca/<page>; do
  [ -f "$f" ] && echo "OK: $f" || echo "MISSING: $f"
done

# Check if page exists in sidebar
grep -c "slug: '<page-slug>'" docs/astro.config.mjs

# List all docs pages for a section
ls docs/src/content/docs/tabs/
ls docs/src/content/docs/es/tabs/
ls docs/src/content/docs/ca/tabs/
```

## Resources

- **docs/AGENTS.md** — source of truth for writing rules, alt text conventions, callout usage, and common pitfalls
- **docs/astro.config.mjs** — sidebar configuration with locale translations
- **docs/src/content/docs/** — English documentation (root locale)
- **docs/src/content/docs/es/** — Spanish documentation
- **docs/src/content/docs/ca/** — Catalan documentation
- **docs/src/content.config.ts** — frontmatter schema validation

## Common Pitfalls

Lessons from `docs/AGENTS.md`:

- Catalan spelling: `Passar` not `Paser`, `vídeo` with IEC accent, `permís` with accent on `í`
- Catalan subjunctive of `fer`: `faci` not `fagi`
- Alt text copy-paste: always re-check alt text when copying page structure
- Empty stubs: never commit a page in one locale with only `title:` in others
- Sidebar sync: forgetting `astro.config.mjs` creates orphan pages reachable only by direct URL
