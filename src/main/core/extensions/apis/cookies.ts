import { Browser, Window } from '@/core';
import type { IExtension } from '~/types';
import log from 'electron-log';

const scopeLog = log.scope('ChromeCookies');

export class ChromeCookies {
  constructor(_browser: Browser) {}

  async getAll(
    window: Window,
    _extension: IExtension,
    props: chrome.cookies.GetAllDetails,
  ): Promise<chrome.cookies.Cookie[]> {
    const tabData = props.url
      ? window.tabs.find((t) => t.tab.url === props.url)
      : window.selectedTab;
    if (!tabData) {
      scopeLog.warn('No tab found');
      return [];
    }

    const cookies = await tabData.tab.webContents.session.cookies.get({
      url: props.url,
      name: props.name,
      domain: props.domain,
      path: props.path,
      secure: props.secure,
      session: props.session,
    });

    const response: chrome.cookies.Cookie[] = cookies.map((c) => ({
      domain: c.domain || '',
      name: c.name,
      storeId: c.name,
      value: c.value,
      session: c.session || false,
      hostOnly: c.hostOnly || false,
      expirationDate: c.expirationDate,
      path: c.path || '',
      httpOnly: c.httpOnly || false,
      secure: c.secure || false,
      sameSite: c.sameSite,
    }));

    return response;
  }
}
