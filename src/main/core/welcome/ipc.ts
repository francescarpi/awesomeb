import { Browser, WelcomeWindow, config } from '@/core';
import { createHandler, welcomeWindowChecker } from '@/utils';
import slugify from 'slugify';

export function setupWelcomeIPC(browser: Browser) {
  //--------------------------------------------------------------------------------------
  createHandler<{ win: WelcomeWindow }>(
    'welcome:ready',
    'on',
    browser,
    [welcomeWindowChecker],
    async ({ win }) => {
      win.show();
    },
  );

  //--------------------------------------------------------------------------------------
  createHandler<{ win: WelcomeWindow; name: string; url: string }>(
    'welcome:add-search-engine-and-initiate',
    'on',
    browser,
    [welcomeWindowChecker],
    async ({ win, name, url }) => {
      const code = slugify(name, { lower: true, strict: true });

      const cfg = { ...config.config };
      cfg.searchEngines.push({ label: name, url, code });

      config.save(cfg);

      await browser.loadSession();
      win.close();
    },
  );
}
