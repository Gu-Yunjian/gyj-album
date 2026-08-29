import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('home polaroid cards keep a stable pointer hit area separate from animation', async () => {
  const source = await fs.readFile(
    new URL('../src/components/explore/PhotoCard.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /className={styles\.hitArea}/);
  assert.match(source, /className={styles\.animatedCard}/);
  assert.match(source, /onPointerEnter/);
  assert.match(source, /onPointerLeave={handleHoverEnd}/);
  assert.match(source, /getBoundingClientRect\(\)/);
});

test('home polaroid frame opts out of dark-mode recoloring', async () => {
  const source = await fs.readFile(
    new URL('../src/app/explore/Explore.module.css', import.meta.url),
    'utf8'
  );

  assert.match(source, /\.polaroidFrame\s*{[\s\S]*color-scheme:\s*only light/);
  assert.match(source, /\.polaroidFrame\s*{[\s\S]*background-color:\s*#fff/);
  assert.match(source, /\.polaroidFrame\s*{[\s\S]*forced-color-adjust:\s*none/);
});
