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
 */
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';

const RENDERER_URL = process.env.ASTRO_URL ?? 'http://localhost:4321';
const children = [];
let exiting = false;

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
  startChild('astro', 'npx', ['astro', 'dev']);

  try {
    console.log(`[dev] waiting for astro at ${RENDERER_URL}...`);
    await waitForUrl(RENDERER_URL);
    console.log('[dev] astro is up, starting electron-vite');
  } catch (err) {
    console.error(`[dev] ${err.message}`);
    shutdown(1);
    return;
  }

  startChild('electron-vite', 'npx', ['electron-vite', 'dev'], {
    ELECTRON_RENDERER_URL: RENDERER_URL,
  });
})();
