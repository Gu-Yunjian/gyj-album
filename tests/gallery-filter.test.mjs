import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('gallery filter has an icon-only mobile trigger and an expandable menu', async () => {
  const component = await fs.readFile(
    new URL('../src/components/gallery/GalleryFilter.tsx', import.meta.url),
    'utf8'
  );
  const styles = await fs.readFile(
    new URL('../src/components/gallery/GalleryFilter.module.css', import.meta.url),
    'utf8'
  );

  assert.match(component, /mobileFilterButton/);
  assert.match(component, /aria-expanded={mobileMenuOpen}/);
  assert.match(component, /role="menu"/);
  assert.match(component, /role="menuitemradio"/);
  assert.match(component, /funnel|filter/i);
  assert.match(styles, /\.mobileFilterButton/);
  assert.match(styles, /\.mobileFilterMenu/);
  assert.match(styles, /@media\s*\(max-width:\s*768px\)[\s\S]*\.mobileFilterButton/);
});
