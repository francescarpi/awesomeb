# AGENTS.md - AwesomeB Astro Project

## 🤖 AI Agent Rules

These rules apply to any AI coding assistant operating in this repository. Tool-specific entry points (`CLAUDE.md` for Claude Code, etc.) should point back here — this file is the source of truth.

### Never auto-commit

Do **not** stage, commit, or push changes unless the user explicitly asks you to. The user reviews every commit manually before it lands in history. When the user asks for a code change, do the work, summarize it, and stop — wait for an explicit "commit" or "haz commit" before running `git add` / `git commit`. Pushing is never implicit; the user always says so.

### Never bypass git hooks

Do **not** pass `--no-verify` (or any equivalent hook-bypass flag) to `git commit`, `git push`, or any other git command unless the user explicitly asks for it on that specific invocation. Pre-commit hooks (husky + commitlint + lint-staged) are the user's safety net — they exist to catch things the agent might miss, and bypassing them is never the agent's call to make. If hooks fail, fix the underlying problem (e.g. shorten a commit body line that exceeds commitlint's `body-max-line-length`) and retry with hooks enabled. If a hook is genuinely broken or unreasonably slow, **stop and ask the user** — do not decide unilaterally.

### Pull Request title format

This repo validates PR titles in `.github/workflows/pr-checks.yml` (`lint-pr-title` job). The title ends up in the user-facing changelog, so it must be a plain-English description a human can understand.

Rules enforced by CI (the PR will be rejected if violated):

- Must start with an **uppercase** letter.
- Must **not** use the Conventional Commits prefix (`feat:`, `fix:`, `chore:`, `refactor:`, etc. with or without a scope). The `fix(menu): ...` style is reserved for **commit** messages, validated separately by commitlint — do not confuse the two.

Recommended style:

- Use an imperative-mood sentence that describes the user-visible change.
- Keep it short (one line, ideally under ~80 chars).
- Reference the issue number in the description body if you want, but the **title** stays human-readable.

Good examples:

- `Preserve source tab partition when duplicating from the context menu`
- `Add lower retention options to history cleanup`
- `Improve sidebar update button contrast in dark themes`

Bad examples (will fail CI):

- `fix(menu): preserve source tab partition when duplicating`
- `Feat: add new command palette shortcut`
- `chore: bump electron version`

### Pull Request template

Before opening a PR, **read `.github/PULL_REQUEST_TEMPLATE.md` in full** and follow every section. The template is the source of truth for the PR body — do not invent your own section names, do not drop sections, and do not skip required fields.

Required structure (every PR):

- `## Summary` — 1–3 bullets describing the user-visible change. This feeds the changelog.
- `## Linked issue` — MUST include a `Closes #NNN` line. PRs without a linked issue will not be merged.
- `## Screenshots / recordings` — required for any UI change. For non-UI changes, delete the section entirely (do not leave a placeholder).
- `## Checklist` — copy verbatim from the template and mark each box. Leave "Manually tested the change" unchecked if you did not test it yourself; the user ticks it.

Common mistakes to avoid:

- Renaming template sections (e.g. `## Fixes` instead of `## Linked issue`).
- Writing `Fixes #NNN` instead of `Closes #NNN` — the latter is what the merge workflow expects.
- Forgetting screenshots on a UI change.

## 🎯 Project Overview

**AwesomeB** is a custom desktop browser/navigator application built with **Electron** and **Astro**. It provides advanced tab organization through customizable "desktops", sophisticated session management, and a powerful command system for enhanced browsing workflows.

### Key Features

- **Desktop-based tab organization** - Group tabs into customizable workspaces
- **Session persistence** - Save and restore browsing sessions
- **Advanced tab management** - Maximizable work areas and profile-based isolation
- **Command palette** - 40+ built-in commands for browser control
- **Partition system** - Isolated browsing contexts with separate cookies/sessions
- **Extensible architecture** - Modular design for easy feature additions

### Technical Stack

- **Electron 41.0.3** - Desktop application framework
- **Astro 5.18.0** - Modern web framework for UI
- **TypeScript 6.0.2** - Type-safe development
- **Tailwind CSS + DaisyUI** - Utility-first styling with component library
- **Vite 8.0.2** - Build tool and bundler
- **pnpm 10.28.0** - Package manager

---

## 🏗️ Architecture Overview

AwesomeB follows Electron's **multi-process architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON APPLICATION                     │
├─────────────────────────────────────────────────────────────┤
│  MAIN PROCESS (Node.js)                                     │
│  ├── Browser Management                                     │
│  ├── Window & Desktop Control                               │
│  ├── Tab Management                                         │
│  ├── Command System                                         │
│  ├── Session Persistence                                    │
│  └── Partition Management                                   │
├─────────────────────────────────────────────────────────────┤
│  PRELOAD SCRIPTS (Secure Bridge)                            │
│  ├── IPC Communication Handlers                             │
│  ├── Type-safe API Exposure                                 │
│  └── Security Context Isolation                             │
├─────────────────────────────────────────────────────────────┤
│  RENDERER PROCESS (Browser)                                 │
│  ├── Astro Frontend (35+ pages)                             │
│  ├── UI Components & Layouts                                │
│  ├── Tailwind + DaisyUI Styling                             │
│  └── Client-side State Management                           │
└─────────────────────────────────────────────────────────────┘
```

### Core Architecture Principles

1. **Process Isolation** - Main, preload, and renderer run in separate contexts
2. **Type Safety** - Shared TypeScript interfaces across all processes
3. **Event-Driven** - Extensive use of EventEmitter for internal communication
4. **Modular Design** - Each feature as an independent module
5. **Security-First** - Context isolation and secure IPC patterns

---

## 📂 Project Structure

```
/
├── src/
│   ├── main/                  # Electron Main Process
│   │   ├── core/              # Core functionality modules
│   │   │   ├── browser/       # Browser class & window management
│   │   │   ├── desktop/       # Desktop workspace system
│   │   │   ├── tab/           # Individual tab management
│   │   │   ├── commands/      # Command system (40+ commands)
│   │   │   ├── session/       # Session persistence
│   │   │   ├── partitions/    # Partition & profile management
│   │   │   ├── bookmarks/     # Bookmark management
│   │   │   ├── downloads/     # Download handling
│   │   │   ├── certificates/  # SSL certificate management
│   │   │   └── config/        # Application configuration
│   │   ├── ipc/               # IPC handlers per module
│   │   └── main.ts            # Application entry point
│   │
│   ├── preload/               # Preload Scripts (Secure Bridge)
│   │   ├── index.ts           # Main preload script
│   │   └── types.ts           # Exposed API types
│   │
│   ├── renderer/              # Astro Frontend Application
│   │   ├── pages/             # Astro pages (35+ pages)
│   │   │   ├── window.astro   # Main browser window
│   │   │   ├── settings.astro # Configuration interface
│   │   │   ├── bookmarks.astro# Bookmark management UI
│   │   │   ├── downloads.astro# Download manager UI
│   │   │   ├── tab-*.astro    # Tab-related dialogs & modals
│   │   │   └── sidebar.astro  # Navigation sidebar
│   │   ├── components/        # Reusable UI components
│   │   │   ├── common/        # Shared components
│   │   │   ├── settings/      # Settings-specific components
│   │   │   ├── sidebar/       # Sidebar components
│   │   │   └── urlbar/        # URL bar components
│   │   ├── layouts/           # Page layouts
│   │   │   └── Base.astro     # Main layout template
│   │   └── assets/            # Static assets & global CSS
│   │
│   └── shared/                # Shared Types & Utilities
│       ├── types/             # TypeScript interfaces
│       └── utils/             # Common utilities
│
├── dist-electron/             # Build Output
│   ├── main/                  # Compiled main process
│   ├── preload/               # Compiled preload scripts
│   └── renderer/              # Compiled Astro app
│
├── build/                     # Build configuration files
├── release/                   # Distribution binaries
└── docs/                      # Project documentation
```

### Module Organization Patterns

- **IPC Separation** - Each core module has dedicated `ipc.ts` files
- **Type Centralization** - All interfaces in `/src/shared/types/`
- **Component Co-location** - UI components grouped by feature
- **Build Isolation** - Separate compilation targets for each process

### Core Architectural Concepts

#### Tab vs TabContainer Architecture

AwesomeB implements a **hierarchical tab organization system** designed for future extensibility:

```
┌─────────────────────────────────────────────────────────────┐
│                    TAB ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────┤
│  TabContainer                                               │
│  ├── Layout Configuration (single, split, grid)             │
│  ├── Rendering Properties                                   │
│  └── Contains Multiple Tabs                                 │
│       ├── Tab 1 (Individual browser instance)               │
│       ├── Tab 2 (Individual browser instance)               │
│       ├── Tab 3 (Individual browser instance)               │
│       └── Tab N (Individual browser instance)               │
└─────────────────────────────────────────────────────────────┘
```

**Key Concepts:**

1. **TabContainer** - The organizational unit that:
   - Contains one or more `Tab` instances
   - Defines the **layout** for rendering tabs (single, split-view, grid)
   - Manages the visual arrangement and space allocation
   - Prepared for future **split-tab functionality** (2, 3, or 4 tabs simultaneously)

2. **Tab** - The individual browser instance that:
   - Represents a single web page/URL
   - Manages its own navigation, state, and content
   - Can be arranged within a TabContainer's layout
   - Maintains independent session data and history

**Current Implementation:**

- **1:1 Relationship** - Each TabContainer currently contains exactly one Tab
- **Future-Ready Design** - Architecture supports 1:N relationship for split-tab features

**Benefits of This Architecture:**

- **Scalable Design** - Easy to implement split-screen browsing in the future
- **Layout Flexibility** - TabContainer can define different rendering modes
- **Clean Separation** - Tab handles content, TabContainer handles presentation
- **Independent State** - Each Tab maintains its own browsing context

**Example Usage:**

```typescript
// Current: One tab per container
const tabContainer = new TabContainer({ layout: 'single' });
const tab = new Tab({ url: 'https://example.com' });
tabContainer.addTab(tab);

// Future: Multiple tabs in split layout
const tabContainer = new TabContainer({ layout: 'split-horizontal' });
const tab1 = new Tab({ url: 'https://github.com' });
const tab2 = new Tab({ url: 'https://docs.github.com' });
tabContainer.addTab(tab1);
tabContainer.addTab(tab2);
```

---

## 🔧 Development Setup

### Prerequisites

- **Node.js 18+** - Runtime environment
- **pnpm 10.28.0** - Package manager (required, not npm/yarn)
- **Git** - Version control

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd awesomeb-astro

# Install dependencies
pnpm install

# Start development environment
pnpm dev
```

### Available Scripts

```json
{
  "dev": "pnpm astro dev", // Development with hot reload
  "build": "astro build && electron-builder", // Full production build
  "build:mac": "astro build && electron-builder --mac", // macOS build
  "build:win": "astro build && electron-builder --win", // Windows build
  "build:linux": "astro build && electron-builder --linux", // Linux build
  "start": "electron .", // Run built application
  "test": "vitest", // Run test suite
  "lint": "eslint .", // Code linting
  "format": "prettier --write .", // Code formatting
  "tscheck": "npm run tscheck:node && npm run tscheck:renderer" // Type checking
}
```

### TypeScript Configuration

The project uses a **multi-project TypeScript setup** with references:

```typescript
// tsconfig.json - Root configuration with project references
{
  "references": [
    { "path": "./tsconfig.node.json" },      // Main + Preload
    { "path": "./tsconfig.renderer.json" }   // Renderer (Astro)
  ]
}

// tsconfig.node.json - Main Process & Preload (Node.js environment)
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/main/*"],        // Main process modules
      "~/*": ["src/shared/*"]       // Shared utilities & types
    }
  }
}

// tsconfig.renderer.json - Renderer Process (Browser environment)
{
  "compilerOptions": {
    "paths": {
      "#/*": ["src/renderer/*"],    // Renderer components
      "@preload": ["./src/preload"],
      "@renderer": ["./src/renderer"]
    }
  }
}
```

### Development Tools Configuration

#### ESLint (eslint.config.ts)

```typescript
import eslint from '@eslint/js';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      'prefer-const': 'error',
    },
  },
];
```

#### Prettier Configuration

```json
{
  "tabWidth": 2,
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "plugins": ["prettier-plugin-astro"]
}
```

#### Pre-commit Hooks (.pre-commit-config.yaml)

```yaml
repos:
  - repo: https://github.com/pre-commit/mirrors-prettier
    hooks:
      - id: prettier
        additional_dependencies: [prettier-plugin-astro]
  - repo: https://github.com/pre-commit/mirrors-eslint
    hooks:
      - id: eslint
        args: [--fix]
```

---

## 🔌 IPC Communication Patterns

Inter-Process Communication (IPC) is the backbone of the Electron architecture. AwesomeB implements type-safe, event-driven IPC patterns.

### IPC Architecture Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RENDERER      │    │    PRELOAD      │    │   MAIN PROCESS  │
│                 │    │                 │    │                 │
│ UI Components   │◄──►│ Secure Bridge   │◄──►│ Core Modules    │
│ Event Handlers  │    │ Type Safety     │    │ Business Logic  │
│ State Updates   │    │ API Exposure    │    │ System APIs     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Type-Safe IPC Implementation

#### Main Process Handler Example

```typescript
// src/main/core/tab/ipc.ts
import { ipcMain } from 'electron';
import { TabController } from './TabController';

export function setupTabIPC(tabController: TabController) {
  // Handle tab creation
  ipcMain.handle('tab:create', async (event, options: TabCreateOptions) => {
    try {
      const tab = await tabController.createTab(options);
      return { success: true, tab: tab.toJSON() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Handle tab navigation
  ipcMain.handle('tab:navigate', async (event, tabId: string, url: string) => {
    const tab = tabController.getTab(tabId);
    if (!tab) throw new Error(`Tab ${tabId} not found`);

    await tab.loadURL(url);
    return { success: true };
  });
}
```

#### Preload Script Bridge

```typescript
// src/preload/browser.preload.ts
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { TWindowId, ITabContainer, TTabId, ITab } from '~/types';

// AwesomeB uses grouped functions with "ab" prefix for organization
const abTabs = {
  getTabContainers: (winId: TWindowId) => {
    return ipcRenderer.invoke('tabs:get-tab-containers', winId);
  },
  onRefreshTabContainers: (
    callback: (event: IpcRendererEvent, tabContainers: ITabContainer[]) => void,
  ) => {
    ipcRenderer.on('tabs:refresh', callback);
  },
  onRefreshOne: (callback: (event: IpcRendererEvent, tab: ITab) => void) => {
    ipcRenderer.on('tabs:refresh-one', callback);
  },
  retryFailed: (tabId: TTabId) => {
    ipcRenderer.send('tabs:retry-failed', tabId);
  },
};

const abCommands = {
  perform: async (winId: TWindowId, trigger: string, params?: Record<string, unknown>) => {
    await ipcRenderer.invoke('commands:perform', winId, trigger, params);
  },
};

const abDesktops = {
  onRefresh: (callback: (event: IpcRendererEvent, desktops: IDesktopEntity[]) => void) => {
    ipcRenderer.on('desktops:refresh', callback);
  },
  select: (winId: TWindowId, desktopId: string) => {
    ipcRenderer.send('desktops:select', winId, desktopId);
  },
  getTheme: async (winId: TWindowId) => {
    return await ipcRenderer.invoke('desktops:get-theme', winId);
  },
};

// Expose grouped APIs to renderer process
contextBridge.exposeInMainWorld('abTabs', abTabs);
contextBridge.exposeInMainWorld('abCommands', abCommands);
contextBridge.exposeInMainWorld('abDesktops', abDesktops);

// Type definitions for renderer are in browser.preload.d.ts
declare global {
  const abTabs: typeof abTabs;
  const abCommands: typeof abCommands;
  const abDesktops: typeof abDesktops;
}
```

#### Renderer Usage

```typescript
// src/renderer/components/TabManager.astro
<script>
  // Type-safe access to main process functionality using "ab" prefixed APIs
  const refreshTabContainers = async () => {
    const winId = 'window-1'; // Get current window ID
    const containers = await abTabs.getTabContainers(winId);
    console.log('Tab containers:', containers);
  };

  // Execute commands through the command system
  const executeCommand = async () => {
    const winId = 'window-1';
    await abCommands.perform(winId, 'tab-next');
  };

  // Listen for tab updates
  abTabs.onRefreshOne((event, tab) => {
    console.log('Tab updated:', tab);
  });

  // Listen for desktop changes
  abDesktops.onRefresh((event, desktops) => {
    console.log('Desktops updated:', desktops);
  });

  // Switch to a different desktop
  const switchDesktop = () => {
    const winId = 'window-1';
    const desktopId = 'desktop-2';
    abDesktops.select(winId, desktopId);
  };
</script>
```

### IPC Event Naming Conventions

- **Module prefixes** - `tab:`, `window:`, `desktop:`, `command:`
- **Action types** - `create`, `update`, `delete`, `list`, `get`
- **Event directions** - Commands to main, notifications from main
- **Error handling** - Consistent response objects with `{ success, data?, error? }`

---

## ⚡ Command System

AwesomeB features a comprehensive command system with **40+ built-in commands** accessible via command palette and keyboard shortcuts.

### Command Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    COMMAND SYSTEM                           │
├─────────────────────────────────────────────────────────────┤
│  Command Registry                                           │
│  ├── Tab Commands (tab-next, tab-prev, tab-close, etc.)     │
│  ├── Window Commands (window-minimize, window-maximize)     │
│  ├── Desktop Commands (desktop-next, desktop-rename)        │
│  ├── Navigation Commands (url-edit, find-in-page)           │
│  └── Development Commands (devtools, reload)                │
├─────────────────────────────────────────────────────────────┤
│  Command Execution Engine                                   │
│  ├── Command Validation                                     │
│  ├── Parameter Handling                                     │
│  ├── Async Execution                                        │
│  └── Error Handling                                         │
├─────────────────────────────────────────────────────────────┤
│  Command Interfaces                                         │
│  ├── Command Palette (GUI)                                  │
│  ├── Keyboard Shortcuts                                     │
│  └── IPC API (Programmatic)                                 │
└─────────────────────────────────────────────────────────────┘
```

### Command Categories

#### Tab Management Commands

- `tab-next` / `tab-prev` - Navigate between tabs
- `tab-close` / `tab-new` - Close/create tabs
- `tab-duplicate` - Clone current tab
- `tab-pin` / `tab-unpin` - Pin/unpin tabs
- `tab-mute` / `tab-unmute` - Audio control
- `tab-select` - Jump to specific tab by index

#### Window & Desktop Commands

- `window-minimize` / `window-maximize` - Window controls
- `window-fullscreen` - Toggle fullscreen mode
- `desktop-next` / `desktop-prev` - Switch desktops
- `desktop-rename` - Rename current desktop
- `desktop-create` - Create new desktop workspace

#### Navigation & Utility Commands

- `url-edit` - Focus and edit current URL
- `find-in-page` - Search within page content
- `devtools` - Open developer tools
- `reload` / `hard-reload` - Refresh page
- `go-back` / `go-forward` - Browser navigation
- `zoom-in` / `zoom-out` / `zoom-reset` - Page zoom controls

### Command Implementation Example

```typescript
// src/main/core/commands/CommandRegistry.ts
export interface Command {
  id: string;
  name: string;
  description: string;
  category: CommandCategory;
  shortcut?: string;
  execute: (params?: any) => Promise<void>;
}

export class CommandRegistry {
  private commands = new Map<string, Command>();

  register(command: Command) {
    this.commands.set(command.id, command);
  }

  async execute(commandId: string, params?: any) {
    const command = this.commands.get(commandId);
    if (!command) throw new Error(`Command ${commandId} not found`);

    await command.execute(params);
  }
}

// Example command registration
commandRegistry.register({
  id: 'tab-next',
  name: 'Next Tab',
  description: 'Switch to the next tab',
  category: 'tab',
  shortcut: 'Ctrl+Tab',
  execute: async () => {
    const browser = BrowserManager.getInstance();
    await browser.getActiveWindow()?.nextTab();
  },
});
```

---

## 🔒 Partition System

AwesomeB implements Electron's **session partitioning** to create isolated browsing contexts. This enables separate cookie storage, cache, and session data for different tab groups or user profiles.

### Partition Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   PARTITION SYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│  Default Partition                                          │
│  ├── Shared cookies & session data                          │
│  ├── Default browsing context                               │
│  └── Most tabs use this partition                           │
├─────────────────────────────────────────────────────────────┤
│  Named Partitions (e.g., "work", "personal")                │
│  ├── Isolated cookie storage                                │
│  ├── Separate cache                                         │
│  ├── Independent session data                               │
│  └── Custom security policies                               │
├─────────────────────────────────────────────────────────────┤
│  Incognito/Private Partitions                               │
│  ├── In-memory only storage                                 │
│  ├── No persistent data                                     │
│  └── Enhanced privacy protection                            │
└─────────────────────────────────────────────────────────────┘
```

### Partition Use Cases

1. **Profile Separation** - Work vs personal browsing contexts
2. **Multi-account Support** - Multiple logins to the same service
3. **Privacy Modes** - Temporary/incognito browsing sessions
4. **Testing Environments** - Isolated contexts for development
5. **Security Isolation** - Separate sensitive workflows

### Implementation Example

```typescript
// src/main/core/partitions/PartitionManager.ts
import { session } from 'electron';

export class PartitionManager {
  private partitions = new Map<string, Electron.Session>();

  getOrCreatePartition(partitionId: string, persistent = true): Electron.Session {
    if (this.partitions.has(partitionId)) {
      return this.partitions.get(partitionId)!;
    }

    const partitionName = persistent ? `persist:${partitionId}` : partitionId;
    const electronSession = session.fromPartition(partitionName);

    // Configure partition-specific settings
    this.configurePartition(electronSession, partitionId);

    this.partitions.set(partitionId, electronSession);
    return electronSession;
  }

  private configurePartition(session: Electron.Session, partitionId: string) {
    // Set custom user agent, security policies, etc.
    session.setUserAgent(this.getUserAgent(partitionId));

    // Configure security settings
    session.setPermissionRequestHandler((webContents, permission, callback) => {
      // Handle permission requests based on partition policy
      callback(this.shouldAllowPermission(partitionId, permission));
    });
  }
}

// Tab creation with partition specification
const createTabWithPartition = (url: string, partitionId: string) => {
  const partition = partitionManager.getOrCreatePartition(partitionId);

  const webContents = new BrowserWindow({
    webPreferences: {
      partition: partitionId,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  webContents.loadURL(url);
  return webContents;
};
```

---

## 🎨 UI Architecture (Astro Frontend)

The renderer process is built with **Astro 5.18.0**, providing a fast, component-based UI with **35+ specialized pages**.

### Astro Configuration

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import icon from 'astro-icon';

export default defineConfig({
  output: 'static', // Static generation for Electron
  integrations: [tailwind(), icon()],
  build: {
    assets: '_astro', // Asset prefix for Electron
  },
  vite: {
    build: {
      outDir: 'dist-electron/renderer', // Output to Electron build dir
    },
  },
});
```

### Page Organization (35+ Pages)

#### Core Browser Pages

```
window.astro         # Main browser window interface
urlbar.astro         # URL bar and navigation controls
sidebar.astro        # Desktop navigation sidebar
settings.astro       # Application configuration
```

#### Feature-Specific Pages

```
bookmarks.astro      # Bookmark management interface
downloads.astro      # Download manager
certificates.astro   # SSL certificate viewer
```

#### Tab Management Modals

```
tab-switcher.astro   # Quick tab switching interface
tab-reorder.astro    # Drag-and-drop tab reordering
tab-bookmarks.astro  # Add tab to bookmarks
tab-share.astro      # Tab sharing functionality
```

#### Dialog & Modal Pages

```
desktop-rename.astro     # Rename desktop workspace
url-edit.astro           # URL editing dialog
find-in-page.astro       # In-page search interface
color-picker.astro       # Theme color selection
```

### Component Architecture

```typescript
// Component structure follows feature-based organization
src/renderer/components/
├── common/                    # Shared UI components
│   ├── ButtonIcon.astro       # Icon button component
│   ├── ListWithSearch.astro   # Searchable list component
│   └── Modal.astro            # Base modal component
├── settings/                  # Settings-specific components
│   ├── SettingsSection.astro
│   └── ToggleOption.astro
├── sidebar/                   # Sidebar components
│   ├── DesktopList.astro
│   └── NavigationItem.astro
└── urlbar/                    # URL bar components
    ├── UrlInput.astro
    └── NavigationButtons.astro
```

### Layout System

```astro
---
export interface Props {
  title: string;
  theme?: string;
}

const { title, theme = 'light' } = Astro.props;
---

<!-- src/renderer/layouts/Base.astro --><!doctype html>
<html lang="en" data-theme={theme}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>

    <!-- Content Security Policy for Electron -->
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; style-src 'self' 'unsafe-inline';"
    />
  </head>
  <body>
    <div id="app" class="min-h-screen">
      <slot />
    </div>
  </body>
</html>
```

### Styling with Tailwind + DaisyUI

#### Configuration

```css
/* src/renderer/assets/app.css */
@import 'tailwindcss';

@theme {
  --breakpoint-sidebar: 100px;
}

@plugin "daisyui" {
  themes:
    light --default,
    dark --prefersdark,
    corporate;
}
```

#### Component Styling Patterns

```astro
<!-- Modern Tailwind patterns used throughout -->
<div class="flex items-center gap-3 p-4 rounded-lg bg-base-100 shadow-sm">
  <button class="btn btn-primary btn-sm"> Primary Action </button>
  <div class="divider divider-horizontal"></div>
  <span class="text-base-content/70">Status Text</span>
</div>
```

---

## 🚀 Build & Deployment

### Build Process Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    BUILD PIPELINE                           │
├─────────────────────────────────────────────────────────────┤
│  1. Astro Build (Renderer)                                  │
│     ├── Static site generation                              │
│     ├── Asset optimization                                  │
│     └── Output: dist-electron/renderer/                     │
├─────────────────────────────────────────────────────────────┤
│  2. TypeScript Compilation                                  │
│     ├── Main Process → dist-electron/main/                  │
│     ├── Preload Scripts → dist-electron/preload/            │
│     └── Type checking across all targets                    │
├─────────────────────────────────────────────────────────────┤
│  3. Electron Builder Packaging                              │
│     ├── Platform-specific binaries                          │
│     ├── Code signing (if configured)                        │
│     └── Distribution packages                               │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Platform Configuration

#### Electron Builder Settings

```json
{
  "appId": "com.awesomeb.browser",
  "productName": "AwesomeB Browser",
  "directories": {
    "output": "release/"
  },
  "files": ["dist-electron/**/*", "package.json"],
  "mac": {
    "target": "dmg",
    "icon": "build/icon.icns",
    "entitlements": "build/entitlements.mac.plist",
    "hardenedRuntime": true
  },
  "win": {
    "target": "nsis",
    "icon": "build/icon.ico"
  },
  "linux": {
    "target": "AppImage",
    "icon": "build/icon.png",
    "category": "Network"
  },
  "protocols": [
    {
      "name": "HTTP/HTTPS",
      "schemes": ["http", "https"]
    }
  ]
}
```

#### Platform-Specific Build Commands

```bash
# Development builds
pnpm run build:mac      # macOS DMG
pnpm run build:win      # Windows NSIS installer
pnpm run build:linux    # Linux AppImage

# Production builds with code signing
pnpm run build:mac --publish=never
pnpm run build:win --publish=never
pnpm run build:linux --publish=never
```

### Testing with Vitest

#### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': './src/main',
      '~': './src/shared',
      '#': './src/renderer',
    },
  },
});
```

#### Test Patterns

```typescript
// src/main/core/tab/TabController.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TabController } from './TabController';

describe('TabController', () => {
  let controller: TabController;

  beforeEach(() => {
    controller = new TabController();
  });

  it('should create a new tab', async () => {
    const tab = await controller.createTab({
      url: 'https://example.com',
      partition: 'default',
    });

    expect(tab.url).toBe('https://example.com');
    expect(tab.partition).toBe('default');
  });
});
```

---

## 🐛 Debugging & Troubleshooting

### Electron-Specific Debugging

#### Main Process Debugging

```bash
# Debug main process with Node.js debugger
npx electron --inspect=5858 .

# Or use VSCode launch configuration
{
  "type": "node",
  "request": "launch",
  "name": "Debug Main Process",
  "program": "${workspaceFolder}/node_modules/.bin/electron",
  "args": [".", "--inspect=5858"],
  "console": "integratedTerminal"
}
```

#### Renderer Process Debugging

```javascript
// Access DevTools in any renderer window
webContents.openDevTools();

// Or via command palette: 'devtools' command
// Keyboard shortcut: Ctrl+Shift+I / Cmd+Opt+I
```

#### IPC Communication Debugging

```typescript
// Main process - log all IPC messages
import { ipcMain } from 'electron';

ipcMain.on('*', (event, ...args) => {
  console.log('IPC received:', event.channel, args);
});

// Renderer process - log outgoing messages
const originalInvoke = window.electronAPI.invoke;
window.electronAPI.invoke = (...args) => {
  console.log('IPC sending:', args);
  return originalInvoke(...args);
};
```

### Common Issues & Solutions

#### Issue: Astro Build Fails with Electron

```bash
Error: Cannot use import statement outside a module
```

**Solution**: Ensure `package.json` has correct module type and build targets are properly separated:

```json
{
  "type": "module",
  "main": "dist-electron/main/main.js"
}
```

#### Issue: IPC Communication Not Working

```bash
TypeError: Cannot read properties of undefined (reading 'invoke')
```

**Solution**: Verify preload script is loaded and context bridge is properly exposed:

```typescript
// Check in renderer console
console.log(window.electronAPI); // Should be defined

// Verify preload script in main process
new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
  },
});
```

#### Issue: Build Performance Problems

**Symptoms**: Slow build times, high memory usage during compilation
**Solutions**:

1. **Incremental builds**: Use `--incremental` flag for TypeScript
2. **Memory optimization**: Increase Node.js heap size `--max-old-space-size=4096`
3. **Exclude files**: Add build directories to `.gitignore` and exclude from TypeScript compilation

#### Issue: Hot Reload Not Working in Development

**Solution**: Ensure development server is properly configured:

```javascript
// astro.config.mjs
export default defineConfig({
  server: {
    port: 3000,
    host: true,
  },
});
```

#### Issue: "Electron uninstall" al hacer `pnpm dev` (especialmente tras upgrade de Electron)

```bash
error during start dev server and electron app:
Error: Electron uninstall
    at getElectronPath (.../electron-vite/dist/chunks/lib-...js:155:19)
```

**Causa**: `electron-vite` busca `node_modules/electron/path.txt` para localizar el
binario. Ese archivo lo escribe `install.js` del paquete `electron` (línea 94 de
`node_modules/electron/install.js`). **Pnpm 10 NO auto-ejecuta `install.js`** (rompió
la convención de npm), y `electron` no define `scripts.postinstall` en su
`package.json`, así que el binario nunca se descarga durante `pnpm install`.

**Solución permanente** (ya aplicada en este repo): `package.json` declara un
`postinstall` explícito y `.npmrc` (raíz del proyecto, NO el global) tiene
`ignore-scripts=false`:

```json
// package.json
"scripts": {
  "postinstall": "node node_modules/electron/install.js"
}
```

```ini
# .npmrc (raíz del proyecto, NO el global)
ignore-scripts=false
```

**Por qué el `.npmrc` global no alcanza**: muchos setups (incluido el autor de este
proyecto) tienen `ignore-scripts=true` en `~/.npmrc` por seguridad. Eso bloquea
TODOS los scripts, incluido el `postinstall` que acabamos de declarar. El
`.npmrc` local del proyecto sobreescribe el global para este repo específicamente
— pnpm lee la config en orden: proyecto > workspace > user > global.

**Workaround manual** si el binario falta por algún motivo:

```bash
node node_modules/electron/install.js
```

**Cómo verificar si el postinstall corrió** (en macOS):

```bash
ls ~/Library/Caches/electron/ | grep "<version>"
# Debe aparecer electron-v<version>-darwin-arm64.zip
```

Si la versión objetivo (ej. `electron-v42.5.1-darwin-arm64.zip`) NO está en la
caché, el postinstall no corrió y vas a ver el error "Electron uninstall" al
arrancar.

### Performance Optimization

#### Main Process Optimization

```typescript
// Lazy load heavy modules
const loadHeavyModule = async () => {
  const { HeavyModule } = await import('./heavy-module');
  return new HeavyModule();
};

// Use worker threads for CPU-intensive tasks
import { Worker } from 'worker_threads';

const worker = new Worker('./cpu-intensive-worker.js');
worker.postMessage(data);
```

#### Renderer Process Optimization

```astro
<!-- Lazy load components -->
<div class="tab-content">
  {isVisible && <HeavyComponent />}
</div>

<!-- Optimize images -->
<img src="/images/icon.webp" loading="lazy" alt="Icon" />
```

#### Memory Management

```typescript
// Clean up event listeners
class TabController {
  private cleanup() {
    this.removeAllListeners();
    this.tabs.forEach((tab) => tab.dispose());
    this.tabs.clear();
  }
}

// Monitor memory usage
process.memoryUsage(); // Main process
performance.memory; // Renderer process
```

### Logging System

#### Electron Log Configuration

```typescript
// src/main/core/logger.ts
import log from 'electron-log';

log.transports.file.level = 'info';
log.transports.console.level = 'debug';
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB

export const logger = {
  info: (message: string, ...args: any[]) => log.info(message, ...args),
  error: (message: string, error?: Error) => log.error(message, error),
  debug: (message: string, ...args: any[]) => log.debug(message, ...args),
};
```

#### Structured Logging Patterns

```typescript
// Log with context
logger.info('Tab created', {
  tabId: tab.id,
  url: tab.url,
  partition: tab.partition,
});

// Log errors with stack traces
try {
  await tab.navigate(url);
} catch (error) {
  logger.error('Navigation failed', {
    tabId: tab.id,
    url,
    error: error.message,
    stack: error.stack,
  });
}
```

---

## 📚 Quick Reference

### Essential Development Commands

```bash
# Development
pnpm dev              # Start development server with hot reload
pnpm start            # Run built application locally
pnpm test             # Run test suite with Vitest
pnpm lint             # Lint all TypeScript/Astro files
pnpm format           # Format code with Prettier

# Building
pnpm build            # Full production build for current platform
pnpm build:mac        # Build for macOS (DMG)
pnpm build:win        # Build for Windows (NSIS)
pnpm build:linux      # Build for Linux (AppImage)

# Type Checking
pnpm tscheck          # Check types across all projects
pnpm tscheck:node     # Check main process + preload types
pnpm tscheck:renderer # Check renderer process types
```

### Key File Locations

```
📁 Main Configuration Files
├── package.json              # Dependencies and scripts
├── astro.config.mjs          # Astro build configuration
├── tsconfig.json             # TypeScript root config
├── eslint.config.ts          # ESLint configuration
├── electron-builder.json     # Distribution config
└── vitest.config.ts          # Test configuration

📁 Application Entry Points
├── src/main/main.ts          # Electron app entry point
├── src/preload/index.ts      # Preload script entry
└── src/renderer/pages/       # Astro page entry points

📁 Build Outputs
├── dist-electron/main/       # Compiled main process
├── dist-electron/preload/    # Compiled preload scripts
├── dist-electron/renderer/   # Compiled Astro app
└── release/                  # Distribution binaries
```

### Common Code Patterns

#### Creating a New IPC Handler

```typescript
// 1. Define types in shared
// src/shared/types/my-feature.ts
export interface MyFeatureOptions {
  name: string;
  enabled: boolean;
}

// 2. Implement handler in main process
// src/main/core/my-feature/ipc.ts
import { ipcMain } from 'electron';
ipcMain.handle('my-feature:action', async (event, options: MyFeatureOptions) => {
  // Implementation
});

// 3. Expose in preload using "ab" prefix convention
// src/preload/browser.preload.ts
const abMyFeature = {
  action: (options: MyFeatureOptions) => ipcRenderer.invoke('my-feature:action', options)
};
contextBridge.exposeInMainWorld('abMyFeature', abMyFeature);

// 4. Use in renderer with "ab" prefixed API
// Any .astro component
<script>
  const result = await abMyFeature.action({ name: 'test', enabled: true });
</script>
```

#### Adding a New Command

```typescript
// src/main/core/commands/my-command.ts
import { ICommand } from './types';
import { TPartitionId } from '~/types';

export interface ICommandParams {
  customParam: string;
  partitionId?: TPartitionId;
}

export const TRIGGER = 'my-command';

export const Command: ICommand<ICommandParams> = {
  trigger: TRIGGER,
  name: 'My Command',
  description: 'Does something useful',
  modal: {
    page: 'my-command-page', // Optional modal page
  },
  visibility: ({ window, tab }) => {
    // Define when command is visible/available
    return !!window && !!tab;
  },
  async handler({ browser, window, desktop, tabContainer, tab, params }) {
    // Command implementation with full context access
    console.log('Executing command with:', params);

    // Example: Close modal if it was opened
    window.modal.close();

    // Example: Use browser, window, tab context
    if (tab) {
      await tab.loadURL('https://example.com');
    }
  },
};
```

#### Creating Astro Components

```astro
---
export interface Props {
  title: string;
  active?: boolean;
}

const { title, active = false } = Astro.props;
---

<!-- src/renderer/components/MyComponent.astro -->
<div class={`component-base ${active ? 'active' : ''}`}>
  <h2 class="text-lg font-semibold">{title}</h2>
  <slot />
</div>

<style>
  .component-base {
    @apply p-4 rounded-lg border;
  }
  .active {
    @apply bg-primary text-primary-content;
  }
</style>
```

### Important APIs & Modules

#### Core Browser API

```typescript
// Access the main browser controller
const browser = BrowserManager.getInstance();
const activeWindow = browser.getActiveWindow();
const currentTab = activeWindow?.getActiveTab();
```

#### Tab Management API

```typescript
// Create, navigate, and control tabs
const tab = await tabController.createTab({
  url: 'https://example.com',
  partition: 'work',
});

await tab.navigate('https://newurl.com');
tab.close();
```

#### Desktop Management API

```typescript
// Manage desktop workspaces
const desktop = desktopManager.createDesktop('My Workspace');
desktop.addTab(tab);
desktop.rename('Updated Name');
```

#### Command System API

```typescript
// Execute commands programmatically
await commandRegistry.execute('tab-next');
await commandRegistry.execute('desktop-rename', { name: 'New Name' });
```

---

This comprehensive documentation provides AI agents with all necessary context for developing, debugging, and extending the AwesomeB application. The modular architecture, type-safe communication patterns, and extensive command system make it a robust foundation for continued development.
