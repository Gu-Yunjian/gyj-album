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
