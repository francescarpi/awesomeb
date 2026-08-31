import { Browser, visitHistory } from '@/core';
import { createHandler, internalPageChecker } from '@/utils';
import { IVisitHistoryResponse } from './types';

export function setupVisitHistoryIPC(browser: Browser) {
  createHandler<{ page?: number; query?: string }>(
    'visit-history:get',
    'handle',
    browser,
    [internalPageChecker.bind(null, ['history'])],
    async ({ page, query }) => {
      const pageNum = page ?? 1;
      const pageSize = 15;

      const allResults = query ? visitHistory.queryHistory({ text: query }) : visitHistory.getAll();
      const totalItems = allResults.length;
      const totalPages = Math.ceil(totalItems / pageSize);

      const start = (pageNum - 1) * pageSize;
      const end = start + pageSize;
      const items = allResults.slice(start, end);

      const response: IVisitHistoryResponse = {
        items,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems,
          pageSize,
        },
      };

      return response;
    },
  );

  createHandler<{}>(
    'visit-history:delete-all',
    'handle',
    browser,
    [internalPageChecker.bind(null, ['history'])],
    async () => {
      visitHistory.deleteAll();
      return { success: true };
    },
  );

  createHandler<{ urls: string[] }>(
    'visit-history:delete-urls',
    'handle',
    browser,
    [internalPageChecker.bind(null, ['history'])],
    async ({ urls }) => {
      visitHistory.deleteUrls(urls);
      return { success: true };
    },
  );

  createHandler<{ query: string }>(
    'visit-history:find',
    'handle',
    browser,
    [],
    async ({ query }) => {
      return visitHistory.autocompleteUrls(query);
    },
  );
}
