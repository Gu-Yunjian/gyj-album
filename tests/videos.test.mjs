import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { normalizeVideoConfig } from '../src/lib/bilibili.ts';

test('keeps valid titled videos in source order', () => {
  assert.deepEqual(
    normalizeVideoConfig({
      videos: [
        {
          title: 'A',
          url: 'https://www.bilibili.com/video/BV1Sa6cBDEXQ/?share_source=copy_web',
        },
        {
          title: 'B',
          url: 'https://example.com/video/BV1Sa6cBDEXQ/',
        },
      ],
    }),
    [
      {
        title: 'A',
        url: 'https://www.bilibili.com/video/BV1Sa6cBDEXQ/',
      },
    ]
  );
});

test('returns an empty list for malformed configuration', () => {
  assert.deepEqual(normalizeVideoConfig(null), []);
  assert.deepEqual(normalizeVideoConfig({ videos: 'bad' }), []);
});

test('loads the deployed video configuration through the shared normalizer', async () => {
  const source = await fs.readFile(
    new URL('../src/lib/videos.ts', import.meta.url),
    'utf8'
  );

  assert.match(
    source,
    /['"]public['"],\s*['"]content['"],\s*['"]videos\.json['"]/
  );
  assert.match(source, /normalizeVideoConfig\(JSON\.parse\(raw\)\)/);
});

test('registers the video route before the about navigation item', async () => {
  const source = await fs.readFile(
    new URL('../src/components/layout/Navigation.tsx', import.meta.url),
    'utf8'
  );
  const videosIndex = source.indexOf('href="/videos"');
  const aboutIndex = source.indexOf('href="/about"');

  assert.ok(videosIndex >= 0);
  assert.ok(videosIndex < aboutIndex);
});

test('video cards use lazy Bilibili iframes with a fallback link', async () => {
  const source = await fs.readFile(
    new URL('../src/components/video/VideoCard.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /loading="lazy"/);
  assert.match(source, /allowFullScreen/);
  assert.match(source, /在 B 站观看/);
});

test('video page renders configured cards and an empty state', async () => {
  const source = await fs.readFile(
    new URL('../src/app/videos/page.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /<VideoCard/);
  assert.match(source, /暂时还没有视频/);
});
