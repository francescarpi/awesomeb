## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

### Multilingual structure

This site is multilingual (Starlight). The default locale is `root` (English).

| Locale            | Path                      |
| ----------------- | ------------------------- |
| English (default) | `src/content/docs/...`    |
| Spanish           | `src/content/docs/es/...` |
| Catalan           | `src/content/docs/ca/...` |

**Every page must exist in all three locales.** If you add a page in only one language, it will either break the build or leave a dead link in the other locales. When you create or change a page, update the three translations at the same time. Do not leave empty stub files.

### File structure

Pages are `.mdx` files (not `.md`), because some pages use Starlight features such as the `splash` template.

Frontmatter is validated by `docsSchema()` in `src/content.config.ts`. Minimum required field:

```yaml
---
title: Page Title
---
```

Optional fields used in this repo: `description`, `template: splash`, `hero`.

### Sidebar

The sidebar is **not auto-generated**. It is configured manually in `astro.config.mjs` under `integrations.starlight.sidebar`. When you add a new page, you must also add a sidebar entry with translations for `ca` and `es`. If you forget, the page exists but does not appear in the navigation.

### Images

Images live in `src/assets/`. Naming convention: `<section>-<descriptor>-<N>.png` (e.g. `config-permissions-1.png`).

Relative path from a page at `src/content/docs/<lang>/config/<page>.mdx`:

```mdx
![Alt text](../../../../assets/your-image.png)
```

Four `../` because the page sits four directories below `src/`.

**Alt text must describe the image, not be copied from another page.** Past bug: the permissions page inherited `Configuració de temes` as alt text because it was copied from the themes page. Use the convention `Configuració de <secció>` (ca) / `Configuración de <sección>` (es) / `<Section> configuration` (en).

### Writing style

- Tone: informal but precise. Second person, future tense for capabilities: "podràs...", "veuràs...", "podrás...", "verás...", "you'll see..."
- Keep sentences short and direct. No filler.
- No emojis unless the user explicitly asks for them.
- **Catalan**: prefer `per a` + infinitive in formal contexts (`per a poder`, `per a utilitzar`). Do not mix `per` and `per a` in the same file.
- **Spanish**: `para` + infinitive consistently.
- **English**: straightforward infinitive (`to use`, `to operate`).
- Lists: `*` for unordered, `1.` for ordered.

### Starlight callouts

Use Starlight's `:::` syntax for asides. The most common in this repo is `:::note` for important caveats. Examples already in the codebase:

- `docs/src/content/docs/ca/config/general.mdx` — note about plain-text config files
- `docs/src/content/docs/ca/config/profiles.mdx` — note about restart requirement

Keep notes short and actionable. Do not use callouts for decorative content.

### Common pitfalls

Lessons learned from real edits to this repo:

- **Catalan spelling**: `Passar` (not `Paser`), `vídeo` with the IEC accent, `permís` with the accent on the `í`.
- **Catalan subjunctive of `fer`**: `faci` (not `fagi`).
- **Alt text copy-paste**: always re-check alt text when you copy a page structure.
- **Empty stub files**: do not commit a page in one locale while leaving the other two as a `title:`-only skeleton. Either translate all three or do not create the page.
- **Sidebar sync**: forgetting to update `astro.config.mjs` creates an orphan page reachable only by direct URL.
