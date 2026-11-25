import { describe, expect, test } from 'vitest';
import { cleanReleaseNotes, removeAllAnchors } from './helpers';

const USER_ANCHOR =
  '<a class="user-mention notranslate" data-hovercard-type="user" href="https://github.com/francescarpi">@francescarpi</a>';
const PR_ANCHOR =
  '<a class="issue-link js-issue-link" data-url="https://github.com/francescarpi/awesomeb/pull/567" href="https://github.com/francescarpi/awesomeb/pull/567">#567</a>';
const FULL_CHANGELOG =
  '<p><strong>Full Changelog</strong>: <a class="commit-link" href="https://github.com/francescarpi/awesomeb/compare/v0.17.1-alpha...v0.18.0-alpha"><tt>v0.17.1-alpha...v0.18.0-alpha</tt></a></p>';

describe('removeAllAnchors', () => {
  test('replaces anchors with their inner text', () => {
    expect(removeAllAnchors(`a <a href="x">b</a> c`)).toBe('a b c');
  });

  test('handles multiple anchors and uppercase tags', () => {
    expect(removeAllAnchors('<A href="x">b</A> and <a href="y">c</a>')).toBe('b and c');
  });
});

describe('cleanReleaseNotes', () => {
  test('strips the author handle and pull request reference', () => {
    const notes = `<ul><li>Add a built-in ad blocker with a switch in general settings by ${USER_ANCHOR} in ${PR_ANCHOR}</li></ul>`;

    expect(cleanReleaseNotes(notes)).toBe(
      '<ul><li>Add a built-in ad blocker with a switch in general settings</li></ul>',
    );
  });

  test('strips the author handle when there is no pull request reference', () => {
    const notes = `<ul><li>Something changed by ${USER_ANCHOR}</li></ul>`;

    expect(cleanReleaseNotes(notes)).toBe('<ul><li>Something changed</li></ul>');
  });

  test('strips a plain author suffix without anchors', () => {
    const notes = '<ul><li>Something changed by @francescarpi in #567</li></ul>';

    expect(cleanReleaseNotes(notes)).toBe('<ul><li>Something changed</li></ul>');
  });

  test('strips a plain author suffix pointing to a pull request url', () => {
    const notes =
      '<ul><li>Something changed by @francescarpi in https://github.com/francescarpi/awesomeb/pull/567</li></ul>';

    expect(cleanReleaseNotes(notes)).toBe('<ul><li>Something changed</li></ul>');
  });

  test('keeps entries without an author untouched', () => {
    const notes = '<ul><li>Chrome version updated to 156.0.8078.109</li></ul>';

    expect(cleanReleaseNotes(notes)).toBe(notes);
  });

  test('keeps the word by when it is part of the description', () => {
    const notes = '<ul><li>Render text by splitting on commas</li></ul>';

    expect(cleanReleaseNotes(notes)).toBe(notes);
  });

  test('keeps a trailing by phrase that is not an author handle', () => {
    const notes = '<ul><li>Sort tabs by size</li></ul>';

    expect(cleanReleaseNotes(notes)).toBe(notes);
  });

  test('keeps a by phrase in the middle of the description', () => {
    const notes = '<ul><li>Show tabs grouped by window</li></ul>';

    expect(cleanReleaseNotes(notes)).toBe(notes);
  });

  test('keeps a trailing by phrase without a handle', () => {
    const notes = '<ul><li>Update to v2 by the team</li></ul>';

    expect(cleanReleaseNotes(notes)).toBe(notes);
  });

  test('removes the full changelog line', () => {
    const notes = `<ul><li>Something changed</li></ul>${FULL_CHANGELOG}`;

    expect(cleanReleaseNotes(notes)).toBe('<ul><li>Something changed</li></ul>');
  });

  test('removes the generated release notes comment', () => {
    const notes =
      '<!-- Release notes generated using configuration in .github/release.yml at v0.18.0-alpha --><ul><li>Something changed</li></ul>';

    expect(cleanReleaseNotes(notes)).toBe('<ul><li>Something changed</li></ul>');
  });

  test('cleans every entry of a multi entry release', () => {
    const notes =
      `<ul>` +
      `<li>First feature by ${USER_ANCHOR} in ${PR_ANCHOR}</li>` +
      `<li>Second feature by ${USER_ANCHOR} in ${PR_ANCHOR}</li>` +
      `</ul>`;

    expect(cleanReleaseNotes(notes)).toBe('<ul><li>First feature</li><li>Second feature</li></ul>');
  });

  test('preserves the surrounding structure of the release notes', () => {
    const notes =
      `<h2>What's Changed</h2>` +
      `<h3>Features</h3>` +
      `<ul><li>First feature by ${USER_ANCHOR} in ${PR_ANCHOR}</li></ul>`;

    expect(cleanReleaseNotes(notes)).toBe(
      `<h2>What's Changed</h2><h3>Features</h3><ul><li>First feature</li></ul>`,
    );
  });

  test('returns an empty string for empty input', () => {
    expect(cleanReleaseNotes('')).toBe('');
  });
});
