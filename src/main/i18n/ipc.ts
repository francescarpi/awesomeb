import { Browser, Window } from '@/core';
import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { getCurrentLocale, setLocale } from '@/i18n';
import { isLocale, type Locale } from '~/i18n';
import { createHandler } from '@/utils';
import log from 'electron-log';

const scopeLog = log.scope('I18nIPC');

export function setupI18nIPC(browser: Browser): void {
  ipcMain.handle('i18n:get-locale', (): Locale => {
    return getCurrentLocale();
  });

  createHandler<{
    locale: unknown;
    event: IpcMainInvokeEvent;
    win: Window;
  }>(
    'i18n:set-locale',
    'handle',
    browser,
    [],
    async ({ locale, event }): Promise<{ success: boolean; locale: Locale }> => {
      if (!isLocale(locale)) {
        scopeLog.warn(`Invalid locale rejected: ${locale}`);
        return { success: false, locale: getCurrentLocale() };
      }

      await setLocale(locale);
      scopeLog.info(`Locale set to ${locale}, broadcasting to all windows`);

      browser.toRenderer.broadcast('i18n:locale-changed', locale);

      const sender = event.sender;
      if (sender && !sender.isDestroyed()) {
        sender.send('i18n:locale-changed', locale);
      }

      return { success: true, locale };
    },
  );
}
