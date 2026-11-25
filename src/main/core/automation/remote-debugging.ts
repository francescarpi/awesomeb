import { app } from 'electron';

/**
 * Remote debugging detection.
 *
 * When the app is launched with `--remote-debugging-port`, an AI agent can drive it
 * over the Chrome DevTools Protocol. In that mode suspended tabs keep their
 * WebContents alive instead of being destroyed, so their URL stays visible to the
 * agent and they can be inspected without being woken first.
 */

const REMOTE_DEBUGGING_SWITCH = 'remote-debugging-port';

let _remoteDebuggingEnabled: boolean | null = null;

/**
 * Whether the app runs with remote debugging enabled.
 *
 * Must be called after `app.commandLine` is populated, i.e. after the app is ready.
 */
export function isRemoteDebuggingEnabled(): boolean {
  if (_remoteDebuggingEnabled !== null) {
    return _remoteDebuggingEnabled;
  }

  _remoteDebuggingEnabled = app.commandLine?.hasSwitch?.(REMOTE_DEBUGGING_SWITCH) ?? false;
  return _remoteDebuggingEnabled;
}
