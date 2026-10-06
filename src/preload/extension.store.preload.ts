import { contextBridge } from 'electron';

contextBridge.executeInMainWorld({
  func: (isWebStore) => {
    if (!isWebStore) return;

    function updateAddButton() {
      const perform = () => {
        requestAnimationFrame(() => {
          [...document.querySelectorAll<HTMLSpanElement>('button span')]
            .filter((s) => s.textContent.endsWith('Chrome'))
            .forEach((s) => {
              s.textContent = s.textContent.replace('Chrome', 'AwesomeB');
            });
        });
      };
      perform();
      setTimeout(perform, 1000 / 60);
    }

    // function updateUserAgent() {
    //   const chromeVersion = getChromeVersion(navigator.userAgent, 'Chrome') || '152.0.7977.130';
    //   const userAgent = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
    //   Object.defineProperty(navigator, 'userAgent', { value: userAgent });
    // }
    //
    // function getChromeVersion(userAgent: string, product: string) {
    //   const regex = new RegExp(`${product}/([\\d.]+)`);
    //   return userAgent.match(regex)?.[1];
    // }
    //
    // updateUserAgent();

    document.addEventListener('DOMContentLoaded', updateAddButton);
    navigation.addEventListener('navigate', updateAddButton);
    window.addEventListener('popstate', updateAddButton);
  },
  args: [location.href.startsWith('https://chromewebstore.google.com')],
});
