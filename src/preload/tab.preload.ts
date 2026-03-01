import { contextBridge, ipcRenderer } from 'electron';

const awesomePublicAPI = {
  // showTabPreview: (url: string) => {
  //   ipcRenderer.send('show-tab-preview', url);
  // },
  showLinkInfo: (url: string | null) => {
    ipcRenderer.send('tab:show-url-info', url);
  },
};

contextBridge.exposeInMainWorld('awesomePublic', awesomePublicAPI);

// ----------------------------------------------------------------------------------------------- //
// Show link info on hover
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

    anchor.addEventListener(
      'click',
      () => {
        awesomePublicAPI.showLinkInfo(null);
      },
      { once: true },
    );
  });
});
