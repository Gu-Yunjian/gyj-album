import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {
  buildBilibiliPlayerUrl,
  canonicalizeBilibiliUrl,
  isB23Url,
  isBilibiliUrl,
  parseBilibiliUrl,
  validateResolvedBilibiliUrl,
} from '../src/lib/bilibili.ts';

test('parses a BV video URL and strips tracking parameters', () => {
  const parsed = parseBilibiliUrl(
    'https://www.bilibili.com/video/BV1Sa6cBDEXQ/?share_source=copy_web'
  );

  assert.deepEqual(parsed, {
    kind: 'bvid',
    value: 'BV1Sa6cBDEXQ',
    page: 1,
  });
  assert.equal(
    canonicalizeBilibiliUrl(parsed),
    'https://www.bilibili.com/video/BV1Sa6cBDEXQ/'
  );
});

test('parses AV and player URLs with a page number', () => {
  assert.deepEqual(
    parseBilibiliUrl('https://www.bilibili.com/video/av170001?p=2'),
    { kind: 'aid', value: '170001', page: 2 }
  );
  assert.deepEqual(
    parseBilibiliUrl(
      'https://player.bilibili.com/player.html?bvid=BV1Sa6cBDEXQ&page=3'
    ),
    { kind: 'bvid', value: 'BV1Sa6cBDEXQ', page: 3 }
  );
});

test('rejects unsupported hosts and malformed identifiers', () => {
  assert.equal(
    parseBilibiliUrl('https://example.com/video/BV1Sa6cBDEXQ'),
    null
  );
  assert.equal(
    parseBilibiliUrl('https://www.bilibili.com/video/BVbad'),
    null
  );
});

test('builds a player URL with restrained defaults', () => {
  assert.equal(
    buildBilibiliPlayerUrl({
      kind: 'bvid',
      value: 'BV1Sa6cBDEXQ',
      page: 1,
    }),
    'https://player.bilibili.com/player.html?bvid=BV1Sa6cBDEXQ&page=1&high_quality=1&as_wide=1&danmaku=0'
  );
});

test('recognizes only exact Bilibili and b23 hosts', () => {
  assert.equal(isB23Url('https://b23.tv/abc123'), true);
  assert.equal(isB23Url('https://b23.tv.example.com/abc123'), false);
  assert.equal(
    isBilibiliUrl('https://www.bilibili.com/video/BV1Sa6cBDEXQ/'),
    true
  );
  assert.equal(
    isBilibiliUrl('https://bilibili.com.example.com/video/BV1Sa6cBDEXQ/'),
    false
  );
});

test('accepts a resolved video URL and returns its canonical form', () => {
  assert.equal(
    validateResolvedBilibiliUrl(
      'https://www.bilibili.com/video/BV1Sa6cBDEXQ/?vd_source=tracking'
    ),
    'https://www.bilibili.com/video/BV1Sa6cBDEXQ/'
  );
  assert.equal(validateResolvedBilibiliUrl('https://www.bilibili.com/'), null);
});

test('short-link resolver validates input before following a HEAD redirect', async () => {
  const source = await fs.readFile(
    new URL('../src/app/api/admin/videos/resolve/route.ts', import.meta.url),
    'utf8'
  );

  assert.match(source, /isB23Url\(url\)/);
  assert.match(source, /method: 'HEAD'/);
  assert.match(source, /validateResolvedBilibiliUrl\(response\.url\)/);
});
