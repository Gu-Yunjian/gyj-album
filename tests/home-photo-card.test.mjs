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
  assert.match(source, /const HIT_AREA_PADDING = 8;/);
  assert.match(source, /width: hitWidth/);
  assert.match(source, /height: hitHeight/);
  assert.match(source, /const cardWidth = imgSize\.width \+ 24/);
  assert.match(source, /const cardHeight = imgSize\.height \+ 44/);
});

test('home polaroid hover keeps the base rotation instead of pointer-driven 3D tilt', async () => {
  const source = await fs.readFile(
    new URL('../src/components/explore/PhotoCard.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /rotate: rotation/);
  assert.doesNotMatch(source, /rotateX: isHovered \? tilt\.rotateX : 0/);
  assert.doesNotMatch(source, /rotateY: isHovered \? tilt\.rotateY : 0/);
  assert.doesNotMatch(source, /transformPerspective/);
});

test('home polaroid frame opts out of dark-mode recoloring', async () => {
  const source = await fs.readFile(
    new URL('../src/app/explore/Explore.module.css', import.meta.url),
    'utf8'
  );

  assert.match(source, /\.animatedCard\s*{[^}]*pointer-events:\s*none/);
  assert.match(source, /\.polaroidFrame\s*{[\s\S]*color-scheme:\s*only light/);
  assert.match(source, /\.polaroidFrame\s*{[\s\S]*background-color:\s*#fff/);
  assert.match(source, /\.polaroidFrame\s*{[\s\S]*forced-color-adjust:\s*none/);
});

test('home polaroid cards support centered focus without enlarging', async () => {
  const source = await fs.readFile(
    new URL('../src/components/explore/PhotoCard.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /isFocused/);
  assert.match(source, /focusPosition/);
  assert.match(source, /FOCUSED_Z_INDEX/);
  assert.match(source, /scale: isFocused \? 1 : isHovered \? HOVER_SCALE : 1/);
  assert.match(source, /onFocus/);
});

test('home focus backdrop is dismissible and keeps the focused card above it', async () => {
  const source = await fs.readFile(
    new URL('../src/components/explore/ScatteredPhotos.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /focusedIndex/);
  assert.match(source, /AnimatePresence/);
  assert.match(source, /onClick={closeFocus}/);
  assert.match(source, /onFocus/);
});

test('home hit area is derived from the transformed card size instead of a fixed large ring', async () => {
  const source = await fs.readFile(
    new URL('../src/components/explore/PhotoCard.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /const HIT_AREA_PADDING = 8;/);
  assert.match(source, /Math\.cos/);
  assert.match(source, /Math\.sin/);
  assert.match(source, /hitWidth/);
  assert.match(source, /hitHeight/);
});

test('home focused card releases its temporary top layer after the position return', async () => {
  const source = await fs.readFile(
    new URL('../src/components/explore/PhotoCard.tsx', import.meta.url),
    'utf8'
  );

  assert.match(
    source,
    /<motion\.div[\s\S]*?className={styles\.hitArea}[\s\S]*?onAnimationComplete=\{\(\) => \{[\s\S]*?isReturning/
  );
  assert.doesNotMatch(
    source,
    /className={styles\.animatedCard}[\s\S]*?onAnimationComplete=\{\(\) => \{[\s\S]*?isReturning/
  );
});
