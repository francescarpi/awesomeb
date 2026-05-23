import { contextBridge, ipcRenderer } from 'electron';

export function iniAnchors() {
  contextBridge.executeInMainWorld({
    func: (openPreview: (url: string) => void) => {
      document.addEventListener('click', (event) => {
        const anchor = (event.target as Element).closest('a');
        if (!anchor) return;

        if (event.altKey && anchor.href) {
          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();

          const activeElement = document.activeElement as HTMLElement | null;
          if (activeElement) activeElement.blur();

          openPreview(anchor.href);
        }
      });
    },
    args: [
      (url: string) => {
        ipcRenderer.send('tabs:open-tab-preview', { url });
      },
    ],
  });
}
