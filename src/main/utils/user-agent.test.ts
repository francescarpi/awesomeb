import { expect, test } from 'vitest';
import { sanitizeUserAgent } from '@/utils';

const checks = [
  {
    url: 'https://example.com',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) AwesomeB/1.0.0 Chrome/144.0.7559.96 Electron/40.1.0 Safari/537.36',
    expect:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.7559.96 Safari/537.36',
  },
];

test('santifize user agent works as expected', () => {
  for (const check of checks) {
    const sanitized = sanitizeUserAgent(check.ua, new URL(check.url));
    expect(sanitized).toBe(check.expect);
  }
});
