import { contextBridge, ipcRenderer } from 'electron';

export function iniAnchors() {
  contextBridge.executeInMainWorld({
    func: (openPreview: (url: string) => void, linkInfo: (url: string | null) => void) => {
      document.addEventListener('mouseover', (event) => {
        const anchor = (event.target as Element).closest('a');
        if (anchor) {
          const href = anchor.getAttribute('href');
          if (href) linkInfo(href);
        }
      });

      document.addEventListener('mouseout', (event) => {
        const anchor = (event.target as Element).closest('a');
        if (anchor) {
          const relatedTarget = event.relatedTarget as Element | null;
          if (!anchor.contains(relatedTarget)) {
            linkInfo(null);
          }
        }
      });

      document.addEventListener('click', (event) => {
        const anchor = (event.target as Element).closest('a');
        if (!anchor) return;

        linkInfo(null);

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
      (url: string | null) => {
        ipcRenderer.send('tab:show-url-info', { url });
      },
    ],
  });
}
