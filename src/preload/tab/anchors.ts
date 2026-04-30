import { contextBridge, ipcRenderer } from 'electron';

export function iniAnchors() {
  contextBridge.executeInMainWorld({
    func: (openPreview: (url: string) => void, linkInfo: (url: string | null) => void) => {
      document.addEventListener('DOMContentLoaded', () => {
        const anchors = document.querySelectorAll('a');

        anchors.forEach((anchor) => {
          anchor.addEventListener('mouseover', () => {
            const href = anchor.getAttribute('href');
            if (href) {
              linkInfo(href);
            }
          });

          anchor.addEventListener('mouseout', () => {
            linkInfo(null);
          });

          anchor.addEventListener('click', (event: MouseEvent) => {
            linkInfo(null);

            if (event.altKey && anchor.href) {
              event.preventDefault();
              event.stopImmediatePropagation();
              event.stopPropagation();

              // Remove focus from the active element to prevent unwanted side effects
              const activeElement = document.activeElement as HTMLElement | null;
              if (activeElement) {
                activeElement.blur();
              }

              openPreview(anchor.href);
            }
          });
        });
      });
    },
    args: [
      (url: string) => {
        ipcRenderer.send('tabs:open-tab-preview', url);
      },
      (url: string | null) => {
        ipcRenderer.send('tab:show-url-info', url);
      },
    ],
  });
}
