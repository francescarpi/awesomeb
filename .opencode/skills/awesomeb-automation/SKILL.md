---
name: awesomeb-automation
description: >
  Drives the AwesomeB browser app with an AI agent over the Chrome DevTools Protocol
  (chrome-devtools-mcp). Covers finding the app's own window page, creating and waking
  tabs, navigating, reading page content and taking screenshots.
  Trigger: When the user wants an AI to control AwesomeB, browse with it, automate it,
  inspect it with DevTools MCP, "controla awesomeb con una IA", "automátiza el navegador".
license: Apache-2.0
metadata:
  author: francescarpi
  version: "1.0"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, Task, question
---

## When to Use

- The user asks an AI to control AwesomeB: "controla AwesomeB con una IA", "navega con AwesomeB"
- The user asks to automate tabs, desktops or browsing in AwesomeB
- The user wants to inspect AwesomeB's UI or a page it has open via DevTools

## Prerequisites

AwesomeB must be running with remote debugging enabled:

```bash
pnpm dev:mcp    # dev build, remote debugging on http://127.0.0.1:9222
```

For a packaged build, pass the flag to the binary:

```bash
/Applications/AwesomeB.app/Contents/MacOS/AwesomeB --remote-debugging-port=9222
```

The MCP server connects to that port:

```json
{
  "mcp": {
    "chrome-devtools": {
      "type": "local",
      "command": ["npx", "chrome-devtools-mcp@1.13.0", "--browserUrl", "http://127.0.0.1:9222"],
      "enabled": true
    }
  }
}
```

## Critical Patterns

### 1. Never hardcode `pageId`

`pageId` is **positional and unstable**. Creating a tab reorders the list, so a `pageId`
captured earlier now points at a different page.

```bash
# WRONG
evaluate_script(pageId: 1, ...)

# RIGHT - locate the page by its path, then use that id
list_pages
#   1: /window?theme=...   <- the app's own window page
#   2: https://example.com  <- a real web tab
```

The app's window page is the one whose URL path is `/window`. It is the only page that
exposes the `ab*` preload bridges.

### 2. `pageId` is a number, never a string

Every tool that takes a `pageId` (`select_page`, `take_snapshot`, `take_screenshot`,
`navigate_page`, `evaluate_script`) expects a number. Passing `"2"` fails with
`expected number, received string`.

### 3. `new_page` and `close_page` do not work

Electron does not implement `Target.createTarget` / `Target.closeTarget`, so the MCP's
`new_page` fails with `Protocol error (Target.createTarget): Not supported`.

Use AwesomeB's own API instead.

### 4. Creating a tab

From the `/window` page, via `evaluate_script`:

```js
async () => {
  await window.abCommands.perform(WIN_ID, 'new-tab', { query: 'https://example.com' });
  return 'ok';
}
```

- The parameter is `query`, **not** `url`.
- This creates the tab directly; it does not open the `new-tab` modal. The modal branch
  in `commands/ipc.ts` only triggers for senders whose URL contains `perform-command`.

### 5. Waking a suspended tab

Suspended tabs have no live WebContents, so they appear in CDP with an empty URL and
title and cannot be controlled yet. Wake them first:

```js
async () => {
  await window.abCommands.perform(WIN_ID, 'select-tab', { tabId: TAB_ID });
  return 'ok';
}
```

- The parameter is `tabId`, **not** `targetId`.
- After waking, the tab's real URL shows up in `list_pages` and becomes controllable.

### 6. Reading app state

```js
async () => {
  const containers = await window.abTabs.getTabContainers(WIN_ID);
  return JSON.stringify(
    containers.flatMap((c) => c.tabs || []).map((t) => ({
      id: t.id,
      url: t.url,
      title: t.title,
      suspended: t.suspended,
      isInternal: t.isInternal,
    })),
  );
}
```

`isInternal` marks AwesomeB's own pages (`/window`, `/tab-switcher`, `/tab-marks`) as
opposed to real web content. Use it to tell them apart.

## Workflow

### Step 1: Locate the window page

Call `list_pages` and find the entry whose URL contains `/window`. Keep its numeric id.

### Step 2: Inspect current tabs

Run the "reading app state" script above on that page. You now know every tab, its URL
and whether it is suspended.

### Step 3: Make the target tab controllable

- Tab missing → create it with `new-tab` (step 4 above).
- Tab suspended → wake it with `select-tab`.

Both leave a live page that `list_pages` reports with its real URL.

### Step 4: Interact

Re-run `list_pages` to get the fresh `pageId` of the web tab, then use the normal
MCP tools: `navigate_page`, `take_snapshot`, `take_screenshot`, `evaluate_script`,
`click`, `fill`, `type_text`, `list_console_messages`, `list_network_requests`.

### Step 5: Report

Summarise what was done and which AwesomeB tabs are open.

## Traps

| Symptom | Cause | Fix |
|---|---|---|
| `window.abTabs is undefined` | Wrong page (usually a stale `pageId`) | Re-run `list_pages`, pick the `/window` entry |
| `expected number, received string` | `pageId` passed as a string | Pass a number |
| `Target.createTarget: Not supported` | Used `new_page` | Use `abCommands.perform(..., 'new-tab', { query })` |
| Tab listed with empty URL | Tab is suspended | Wake it with `select-tab` |
| Tab not in `list_pages` after creation | Wrong param name | Use `query`, not `url` |
| `select-tab` does nothing | Wrong param name | Use `tabId`, not `targetId` |

## Other Capabilities

AwesomeB exposes the full command set to automation, all via
`window.abCommands.perform(WIN_ID, trigger, params)`:

| Trigger | Params | Effect |
|---|---|---|
| `new-tab` | `{ query }` | Open a tab |
| `select-tab` | `{ tabId }` | Select and wake a tab |
| `close-tab` | — | Close the current tab |
| `next-tab` / `previous-tab` | — | Cycle tabs |
| `add-desktop` | — | Create a desktop |
| `select-desktop` | `{ desktopId }` | Switch desktop |
| `go-back` / `go-forward` | — | History navigation |
| `reload-tab` | — | Reload |

Full list: `src/main/core/commands/`.
