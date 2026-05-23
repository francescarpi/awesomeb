import { contextBridge, ipcRenderer } from 'electron';

function truncateLargeStrings(
  str: string | undefined,
  maxLength: number = 2000,
): string | undefined {
  if (typeof str === 'undefined') {
    return undefined;
  }

  return str.slice(0, maxLength);
}

function normalizeNewLines(str: string): string {
  return str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

export function iniPrompts() {
  contextBridge.executeInMainWorld({
    func: (
      customAlert: (message: string) => void,
      customConfirm: (message?: string) => boolean,
      customPrompt: (message?: string, defaultValue?: string) => string | null,
    ) => {
      window.alert = customAlert;
      window.confirm = customConfirm;
      window.prompt = customPrompt;
    },
    args: [
      (message: string) => {
        ipcRenderer.sendSync('prompts:alert', {
          message: truncateLargeStrings(normalizeNewLines(message)),
        });
      },
      (message: string) => {
        return ipcRenderer.sendSync('prompts:confirm', {
          message: truncateLargeStrings(normalizeNewLines(message)),
        });
      },
      (message: string, defaultValue?: string) => {
        return ipcRenderer.sendSync('prompts:prompt', {
          message: truncateLargeStrings(normalizeNewLines(message)),
          defaultValue: truncateLargeStrings(defaultValue),
        });
      },
    ],
  });
}
