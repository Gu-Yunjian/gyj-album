import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('gallery filters by assigned photo tags without inventing categories', async () => {
  const tagsModule = await import('../src/lib/photo-tags.ts').catch(() => null);
  assert.ok(tagsModule, 'Photo tag filtering module is missing');
  const { filterPhotosByTags } = tagsModule;
  const photos = [
    { id: 'a', tags: ['单人', '人像'] },
    { id: 'b', tags: ['双人', '人像'] },
    { id: 'c', tags: ['风景', '自然'] },
  ];

  assert.deepEqual(filterPhotosByTags(photos, ['单人']).map(p => p.id), ['a']);
  assert.deepEqual(filterPhotosByTags(photos, ['双人', '风景']).map(p => p.id), ['b', 'c']);
  assert.deepEqual(filterPhotosByTags(photos, []).map(p => p.id), ['a', 'b', 'c']);
});

test('every curated photo has valid tags and three matching image assets', async () => {
  const tagsModule = await import('../src/lib/photo-tags.ts').catch(() => null);
  assert.ok(tagsModule, 'Photo tag vocabulary is missing');
  const { PHOTO_TAGS } = tagsModule;
  const data = JSON.parse(await fs.readFile(path.join(root, 'public/albums.json'), 'utf8'));
  const keys = [];
  const allowedTags = new Set(PHOTO_TAGS);

  assert.ok(data.albums.length > 4);
  assert.ok(data.albums.some(album => album.photos.length > 0));

  for (const album of data.albums) {
    assert.ok(album.photos.includes(album.cover), `${album.name} cover is missing`);
    for (const filename of album.photos) {
      const stem = filename.replace(/\.[^/.]+$/, '');
      const key = `${album.name}/${stem}`;
      const photo = data.allPhotos[key];
      keys.push(key);

      assert.ok(photo, `Missing metadata for ${key}`);
      assert.ok(photo.tags?.length, `Missing tags for ${key}`);
      assert.ok(photo.tags.every(tag => allowedTags.has(tag)), `Unknown tag on ${key}`);
      assert.ok(new Set(photo.tags).size === photo.tags.length, `Duplicate tags on ${key}`);
      assert.ok(photo.tags.filter(tag => ['单人', '双人', '多人'].includes(tag)).length <= 1, `Conflicting people count on ${key}`);

      for (const variant of ['photos', 'medium', 'thumbnails']) {
        await fs.access(path.join(root, 'public', variant, album.name, filename));
      }
    }
  }

  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual(new Set(Object.keys(data.allPhotos)), new Set(keys));
});
