import { contextBridge, ipcRenderer } from 'electron';

export function iniUrlInfo() {
  contextBridge.executeInMainWorld({
    func: (
      registerShow: (callback: (url: string) => void) => void,
      registerHide: (callback: () => void) => void,
    ) => {
      const OVERLAY_ID = '__ab-url-info-overlay';
      const SHOW_DELAY_MS = 1000;

      let showTimer: ReturnType<typeof setTimeout> | null = null;
      let cleanupAnim: (() => void) | null = null;

      function animateString(el: HTMLElement, tmout = 2000): () => void {
        const elContainer = el.parentElement;
        if (!elContainer) {
          return () => {};
        }

        let cancelled = false;
        let pendingTimer: ReturnType<typeof setTimeout> | null = null;

        const cleanup = () => {
          cancelled = true;
          if (pendingTimer) {
            clearTimeout(pendingTimer);
            pendingTimer = null;
          }
          el.removeEventListener('transitionend', onTransitionEnd);
          el.removeEventListener('transitionend', onReturnEnd);
          el.style.transition = '';
          el.style.transform = '';
        };

        const onTransitionEnd = () => {
          if (cancelled) return;

          el.removeEventListener('transitionend', onTransitionEnd);

          pendingTimer = setTimeout(() => {
            if (cancelled) return;

            const spanWidth = el.scrollWidth;
            const containerWidth = elContainer.clientWidth;
            const distance = spanWidth - containerWidth;
            const duration = distance * 15;

            el.style.transition = `transform ${duration}ms cubic-bezier(0.42, 0, 0.58, 1)`;
            el.style.transform = `translateX(0px)`;
            el.addEventListener('transitionend', onReturnEnd);
          }, 4000);
        };

        const onReturnEnd = () => {
          if (cancelled) return;

          el.removeEventListener('transitionend', onReturnEnd);
        };

        pendingTimer = setTimeout(() => {
          if (cancelled) return;

          const spanWidth = el.scrollWidth;
          const containerWidth = elContainer.clientWidth;

          if (spanWidth > containerWidth) {
            const distance = spanWidth - containerWidth;
            const duration = distance * 15;

            el.style.transition = `transform ${duration}ms cubic-bezier(0.42, 0, 0.58, 1)`;
            el.style.transform = `translateX(-${distance}px)`;
            el.addEventListener('transitionend', onTransitionEnd);
          }
        }, tmout);

        return cleanup;
      }

      function getOrCreateOverlay(): { overlay: HTMLDivElement; span: HTMLSpanElement } {
        let overlay = document.getElementById(OVERLAY_ID) as HTMLDivElement | null;

        if (overlay) {
          const span = overlay.querySelector('span') as HTMLSpanElement;
          return { overlay, span };
        }

        overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.style.cssText = [
          'position: fixed',
          'bottom: 0',
          'left: 0',
          'width: 400px',
          'height: 24px',
          'display: none',
          'align-items: center',
          'background: #000',
          'color: #fff',
          'font-size: 12px',
          'line-height: 1',
          'padding: 0 8px',
          'border-bottom-left-radius: 12px',
          'border-top-right-radius: 6px',
          'z-index: 2147483647',
          'pointer-events: none',
          'font-family: -apple-system, system-ui, sans-serif',
          'box-sizing: border-box',
        ].join(';');

        const container = document.createElement('div');
        container.style.cssText = 'overflow: hidden; flex: 1;';

        const span = document.createElement('span');
        span.style.cssText = 'display: inline-block; white-space: nowrap;';

        container.appendChild(span);
        overlay.appendChild(container);
        (document.body ?? document.documentElement).appendChild(overlay);

        return { overlay, span };
      }

      function show(url: string) {
        if (showTimer) {
          clearTimeout(showTimer);
          showTimer = null;
        }
        if (cleanupAnim) {
          cleanupAnim();
          cleanupAnim = null;
        }

        const { overlay, span } = getOrCreateOverlay();
        span.textContent = url;

        showTimer = setTimeout(() => {
          showTimer = null;
          overlay.style.display = 'flex';
          cleanupAnim = animateString(span);
        }, SHOW_DELAY_MS);
      }

      function hide() {
        if (showTimer) {
          clearTimeout(showTimer);
          showTimer = null;
        }
        if (cleanupAnim) {
          cleanupAnim();
          cleanupAnim = null;
        }

        const overlay = document.getElementById(OVERLAY_ID);
        if (overlay) {
          overlay.style.display = 'none';
          const span = overlay.querySelector('span');
          if (span) {
            span.textContent = '';
          }
        }
      }

      registerShow((url: string) => {
        show(url);
      });

      registerHide(() => {
        hide();
      });
    },
    args: [
      (callback: (url: string) => void) => {
        ipcRenderer.on('tab:url-info-show', (_event, params: { url: string }) => {
          callback(params.url);
        });
      },
      (callback: () => void) => {
        ipcRenderer.on('tab:url-info-hide', () => {
          callback();
        });
      },
    ],
  });
}
