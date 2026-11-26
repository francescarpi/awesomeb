import { expect, test, beforeEach, afterEach, vi } from 'vitest';
import { Menu } from 'electron';
import { partitions } from '@/core';
import { initI18n } from '~/i18n';
import { tabMenu } from './tab';

interface ITemplateItem {
  label?: string;
  click?: () => void;
}

let template: ITemplateItem[] = [];

beforeEach(async () => {
  vi.spyOn(Menu, 'buildFromTemplate').mockImplementation((t) => {
    template = t as ITemplateItem[];
    return { popup: () => undefined, template: t } as never;
  });

  partitions.init();
  await initI18n();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('clicking set emoji sends the tab id to the renderer', () => {
  const sendMessage = vi.fn();
  const window = {
    id: 1,
    sendMessage,
    modal: { open: vi.fn() },
  };
  const tab = {
    id: 42,
    loading: false,
    suspended: false,
    canGoBack: false,
    canGoForward: false,
    isMuted: false,
    url: 'https://example.com',
    title: 'Example',
    partition: partitions.default,
    openTabsAsChild: false,
  };
  const tabContainer = { hasChildren: false, parent: null, childrenCollapsed: false, children: [] };
  const desktop = { id: 1 };
  const browser = {
    performCommand: vi.fn(),
    bookmarks: { all: [] },
    renderer: { targetsEntities: vi.fn(() => []) },
  };

  tabMenu(browser as never, { tab, window, tabContainer, desktop } as never);

  const emojiItem = template.find((i) => i.label === 'Set emoji...');
  expect(emojiItem).toBeDefined();

  emojiItem!.click!();

  expect(sendMessage).toHaveBeenCalledWith('tabs:open-emoji-picker', 42);
});
