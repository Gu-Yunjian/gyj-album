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
  assert.match(source, /const HIT_AREA_PADDING = 4;/);
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
  assert.match(source, /const visualScale = isFocused \|\| isDragging \? 1 : isHovered \? HOVER_SCALE : 1/);
  assert.match(source, /scale: visualScale/);
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

  assert.match(source, /const HIT_AREA_PADDING = 4;/);
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

test('home focus layer covers the page without letting ordinary cards overtake it', async () => {
  const componentSource = await fs.readFile(
    new URL('../src/components/explore/ScatteredPhotos.tsx', import.meta.url),
    'utf8'
  );
  const cardSource = await fs.readFile(
    new URL('../src/components/explore/PhotoCard.tsx', import.meta.url),
    'utf8'
  );
  const styleSource = await fs.readFile(
    new URL('../src/app/explore/Explore.module.css', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(styleSource, /\.photosSection\s*{[^}]*z-index:\s*100/);
  assert.match(styleSource, /\.focusBackdrop\s*{[\s\S]*?z-index:\s*10000/);
  assert.match(componentSource, /const FOCUS_BACKDROP_Z_INDEX = 10000;/);
  assert.match(
    componentSource,
    /Math\.min\(baseZIndex \+ zLevel \* 100, FOCUS_BACKDROP_Z_INDEX - 1\)/
  );
  assert.match(cardSource, /const FOCUSED_Z_INDEX = 10001;/);
});

test('home polaroid rotation resets during focus and drag while its hit shape follows the card', async () => {
  const source = await fs.readFile(
    new URL('../src/components/explore/PhotoCard.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /const \[isDragging, setIsDragging\] = useState\(false\);/);
  assert.match(source, /isFocused \|\| isDragging \|\| isReturning \? 0 : rotation/);
  assert.match(source, /getRotatedRectClipPath/);
  assert.match(source, /clipPath: hitClipPath/);
  assert.match(source, /onPointerCancel={handlePointerUp}/);
});

test('home polaroid hit clipping does not cut off the frame shadow', async () => {
  const source = await fs.readFile(
    new URL('../src/components/explore/PhotoCard.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /className={styles\.hitShape}/);
  assert.match(source, /className={styles\.hitShape}[\s\S]*?clipPath: hitClipPath/);
  const hitAreaBlock = source.match(
    /<motion\.div\s+className={styles\.hitArea}[\s\S]*?onAnimationComplete/
  )?.[0];
  assert.ok(hitAreaBlock);
  assert.doesNotMatch(hitAreaBlock, /clipPath: hitClipPath/);
});

test('home polaroid randomizes its saved rotation only after drag or focus return', async () => {
  const source = await fs.readFile(
    new URL('../src/components/explore/PhotoCard.tsx', import.meta.url),
    'utf8'
  );
  const parentSource = await fs.readFile(
    new URL('../src/components/explore/ScatteredPhotos.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /onRotationChange/);
  assert.match(source, /getRandomRotation/);
  assert.match(source, /-12/);
  assert.match(source, /12/);
  assert.match(source, /hasMovedRef\.current/);
  assert.match(source, /onAnimationComplete=\{\(\) => \{[\s\S]*?isReturning[\s\S]*?onRotationChange/);
  assert.match(parentSource, /rotation: p\.rotation/);
  assert.match(parentSource, /onRotationChange=\{/);
});

test('home polaroid random rotation avoids an identical angle when possible', async () => {
  const source = await fs.readFile(
    new URL('../src/components/explore/PhotoCard.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /getRandomRotation\(rotation\)/);
  assert.match(source, /nextRotation !== currentRotation/);
});
