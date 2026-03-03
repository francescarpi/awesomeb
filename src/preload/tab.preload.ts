import { contextBridge, ipcRenderer } from 'electron';

const awesomePublicAPI = {
  showTabPreview: (url: string) => {
    ipcRenderer.send('tabs:open-tab-preview', url);
  },
  showLinkInfo: (url: string | null) => {
    ipcRenderer.send('tab:show-url-info', url);
  },
};

contextBridge.exposeInMainWorld('awesomePublic', awesomePublicAPI);

// ----------------------------------------------------------------------------------------------- //
document.addEventListener('DOMContentLoaded', () => {
  const anchors = document.querySelectorAll('a');

  anchors.forEach((anchor) => {
    anchor.addEventListener('mouseover', () => {
      const href = anchor.getAttribute('href');
      if (href) {
        awesomePublicAPI.showLinkInfo(href);
      }
    });

    anchor.addEventListener('mouseout', () => {
      awesomePublicAPI.showLinkInfo(null);
    });

    anchor.addEventListener('click', (event: MouseEvent) => {
      awesomePublicAPI.showLinkInfo(null);

      if (event.altKey && anchor.href) {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        removeFocusActiveElement();

        awesomePublicAPI.showTabPreview(anchor.href);
      }
    });
  });
});

function removeFocusActiveElement() {
  const activeElement = document.activeElement as HTMLElement | null;
  if (activeElement) {
    activeElement.blur();
  }
}
