# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **See also**: `AGENTS.md` is the canonical, tool-agnostic doc for any AI coding
> assistant working in this repo. It contains the full architecture overview and
> the mandatory `🤖 AI Agent Rules` (no auto-commit, PR title format). The
> shortcuts below are duplicated here so Claude Code has them at hand without
> loading the 1400-line AGENTS.md on every session.

## Commands

```bash
pnpm dev              # Start dev server (Astro renderer + Electron main + preloads, watch mode)
pnpm tscheck          # Type-check both main/preload (tsconfig.node.json) and renderer (tsconfig.renderer.json)
pnpm test             # Run vitest
pnpm test run -- src/main/core/browser/browser.test.ts   # Run a single test file
pnpm lint             # ESLint
pnpm format           # Prettier
```

Pre-commit hooks (husky + lint-staged) run astro check → tscheck → vitest → eslint → prettier on every commit.

## Architecture

Three isolated layers:

```
src/main/       — Electron main process (Node.js)
src/preload/    — Context-isolated IPC bridges
src/renderer/   — Astro/Tailwind UI (browser context)
src/shared/     — Types shared across all layers
```

### Model hierarchy

`Browser → Window → Desktop → TabContainer → Tab`

- **Browser** (`src/main/core/browser/`): root singleton. Owns windows, extensions, downloads. Entry point for commands and URL opening.
- **Window**: wraps `BrowserWindow`. Owns UI views (sidebar, urlbar, modals) and desktops.
- **Desktop**: workspace / tab group. Owns tab containers and theme.
- **TabContainer**: split-pane slot. Owns one or more Tabs.
- **Tab**: wraps a `WebContentsView`. Has URL, title, favicon, partition, findInPage, webauth, etc.

The IPC context tuple `IWinDesConTab` (from `src/shared/types/browser.ts`) carries the resolved Window + Desktop + TabContainer + Tab — handlers get this from checkers rather than resolving IDs themselves.

### IPC pattern

All IPC handlers are registered in `src/main/index.ts` and implemented in `src/main/core/*/ipc.ts` using `createHandler` from `src/main/utils/ipc.ts`:

```typescript
createHandler<{ event: IpcMainInvokeEvent; win: Window; tab: IWinDesConTab }>(
  'channel:name',
  'handle',   // or 'on' for fire-and-forget
  browser,
  [windowChecker, viewChecker.bind(null, ['sidebar']), tabChecker],
  async ({ win, tab }) => { ... }
)
```

`createHandler` spreads the raw IPC arg object and adds `event`, then runs checkers in order. Each checker resolves context and merges it into `args` (e.g. `windowChecker` adds `win: Window`, `tabChecker` adds `tab: IWinDesConTab`). A checker returning `null` aborts the handler. Checker groups (arrays) are OR-logic.

The renderer calls IPC via the `ab*` globals exposed by `browser.preload.ts` (e.g. `window.abTabs.create()`).

### Preloads

**`browser.preload.ts`** — injected into all UI views (sidebar, urlbar, modals). Exposes `window.abModal`, `abEntities`, `abCommands`, `abDesktops`, `abWindow`, `abTabs`, `abDownloads`, etc. via `contextBridge.exposeInMainWorld`.

**`tab.preload.ts`** — injected into web content (the actual browser tabs). Minimal by design:

- `iniAnchors()` — intercepts `<a>` link navigation
- `iniPrompts()` — intercepts `alert/confirm/prompt` → routes to main
- `iniWebAuth()` — intercepts `navigator.credentials` → routes to `electron-webauthn` via IPC

### Renderer (Astro)

Pages in `src/renderer/pages/` are loaded as Electron views. They import components from `src/renderer/components/` and communicate back to main via the `window.ab*` globals. There is no SPA routing — each page is a separate Astro build output loaded into a dedicated `WebContentsView`.

## TypeScript path aliases

| Alias | Resolves to      | Used in                 |
| ----- | ---------------- | ----------------------- |
| `@/*` | `src/main/*`     | main, preload           |
| `~/*` | `src/shared/*`   | main, preload, renderer |
| `#/*` | `src/renderer/*` | renderer only           |

## WebAuthn

`src/preload/tab/webauth.ts` intercepts `navigator.credentials` and serializes all `BufferSource` fields as **base64 strings** (not `Uint8Array`) before crossing the contextBridge + IPC boundary, because typed arrays lose their type in both hops. The main process (`src/main/core/webauth/webauth.ts`) deserializes them back to `ArrayBuffer` before passing to `electron-webauthn`.

Passkeys for arbitrary web domains require the `com.apple.developer.web-browser` entitlement (pending Apple approval). In development, signing the Electron binary with `codesign --sign - --entitlements ./build/entitlements.mac.plist --force` is needed even for the basic `application-identifier` check.
