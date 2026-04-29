import { contextBridge, ipcRenderer } from 'electron';

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
        ipcRenderer.sendSync('prompts:alert', { message });
      },
      (message: string) => {
        return ipcRenderer.sendSync('prompts:confirm', { message });
      },
      (message: string, defaultValue?: string) => {
        return ipcRenderer.sendSync('prompts:prompt', { message, defaultValue });
      },
    ],
  });
}
