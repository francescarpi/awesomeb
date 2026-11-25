#!/usr/bin/env node
/**
 * Dev orchestrator.
 *
 * Why this exists:
 * `electron-vite` exports `ELECTRON_RENDERER_URL` to the spawned Electron
 * process ONLY when it owns the renderer dev server. In this project, Astro
 * owns the renderer dev server, so we set the env var ourselves and let
 * electron-vite spawn Electron which inherits it.
 *
 * Flow:
 *   1. Start `astro dev` (renderer on http://localhost:4321)
 *   2. Wait until it answers (poll /, max ~30s)
 *   3. Spawn `electron-vite dev` (builds main+preloads, launches Electron)
 *      with ELECTRON_RENDERER_URL set in its env so the spawned Electron sees it
 *   4. On any exit, kill the other child
 *
 * Note: astro and electron-vite are invoked directly through their local
 * entry points (node_modules/...) instead of via `npx`. `npx` spawns `npm`,
 * which inherits the `npm_config_*` environment variables that pnpm injects
 * into run scripts and then warns about every key it does not recognise
 * ("npm warn Unknown env config ...").
 */
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
import { resolve } from 'node:path';

const RENDERER_URL = process.env.ASTRO_URL ?? 'http://localhost:4321';
const children = [];
let exiting = false;

// Every dev build runs as a tagged "dev" instance so it can coexist with a
// packaged release (they share Electron's single-instance lock otherwise).
// Override with: pnpm dev -- --instance-name=<tag>  (or AB_INSTANCE_NAME=...).
function parseInstanceName(argv) {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--instance-name=')) {
      return arg.slice('--instance-name='.length);
    }
    if (arg === '--instance-name') {
      const next = argv[i + 1];
      if (next && !next.startsWith('-')) return next;
    }
  }
  return null;
}

const instanceName = parseInstanceName(process.argv) ?? process.env.AB_INSTANCE_NAME ?? 'dev';

// Remote debugging port, used by AI agents to drive the app over CDP.
// `electron-vite` forwards REMOTE_DEBUGGING_PORT to Electron as
// `--remote-debugging-port=<port>` (see its startElectron()).
const remoteDebuggingPort = process.env.REMOTE_DEBUGGING_PORT?.trim() || null;

function startChild(name, command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  children.push({ name, child });
  child.on('exit', (code) => {
    if (!exiting) {
      console.log(`[dev] ${name} exited with code ${code}`);
      shutdown(code ?? 0);
    }
  });
  return child;
}

async function waitForUrl(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok || res.status < 500) return true;
    } catch {
      // not ready yet
    }
    await wait(500);
  }
  throw new Error(`Timeout waiting for ${url}`);
}

function shutdown(code = 0) {
  if (exiting) return;
  exiting = true;
  for (const { child } of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

(async () => {
  startChild('astro', process.execPath, [resolve('node_modules/astro/bin/astro.mjs'), 'dev'], {
    // Astro 7 auto-backgrounds the dev server when it detects an AI agent
    // (see `isRunByAgent` in astro/dist/cli/agent.js). The daemonised parent
    // exits immediately, which would trip the exit handler below and kill the
    // whole dev session before electron-vite even starts. Forcing it to stay
    // in the foreground keeps it as a child we can supervise.
    ASTRO_DEV_BACKGROUND: 'false',
  });

  try {
    console.log(`[dev] waiting for astro at ${RENDERER_URL}...`);
    await waitForUrl(RENDERER_URL);
    console.log('[dev] astro is up, starting electron-vite');
  } catch (err) {
    console.error(`[dev] ${err.message}`);
    shutdown(1);
    return;
  }

  startChild(
    'electron-vite',
    process.execPath,
    [resolve('node_modules/electron-vite/bin/electron-vite.js'), 'dev'],
    {
      ELECTRON_RENDERER_URL: RENDERER_URL,
      AB_INSTANCE_NAME: instanceName,
      ...(remoteDebuggingPort ? { REMOTE_DEBUGGING_PORT: remoteDebuggingPort } : {}),
    },
  );

  if (remoteDebuggingPort) {
    console.log(`[dev] remote debugging enabled on http://127.0.0.1:${remoteDebuggingPort}`);
  }
})();
