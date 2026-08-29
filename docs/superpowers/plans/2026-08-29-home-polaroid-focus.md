# 首页拍立得聚焦态 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reversible centered focus state for home polaroids with a dark backdrop, reliable top-layer animation, and a tight pointer hit area.

**Architecture:** `ScatteredPhotos` owns the focused photo index and calculates the viewport center in the photo-container coordinate system. Each `PhotoCard` remains a single DOM instance and animates its outer `motion.div` between its stored position and the focus position; the selected card gets a dedicated high z-index while the backdrop is rendered in the same stacking context below it. The hit area is sized from the card’s maximum planar rotation/hover scale plus a small margin, so it covers the visual card without adding a large invisible ring.

**Tech Stack:** Next.js App Router, React state/effects, Framer Motion, CSS Modules, Node test runner, in-app browser verification.

---

### Task 1: Lock the focus and tight-hit-area contract in tests

**Files:**
- Modify: `tests/home-photo-card.test.mjs`
- Test: `tests/home-photo-card.test.mjs`

- [ ] **Step 1: Write the failing source-contract tests**

Add assertions covering the public behavior before implementation:

```js
test('home polaroid cards support centered focus without enlarging', async () => {
  const source = await fs.readFile(
    new URL('../src/components/explore/PhotoCard.tsx', import.meta.url),
    'utf8'
  );

  assert.match(source, /isFocused/);
  assert.match(source, /focusPosition/);
  assert.match(source, /FOCUSED_Z_INDEX/);
  assert.match(source, /isFocused \? 1 : isHovered \? 1\.045 : 1/);
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
```

- [ ] **Step 2: Run the focused tests and confirm the expected RED state**

Run:

```bash
node --test tests/home-photo-card.test.mjs
```

Expected: the existing card tests pass, and the new focus/backdrop/hit-area assertions fail because the implementation does not yet expose those props or calculations.

### Task 2: Add parent-owned focus state and the dismissible backdrop

**Files:**
- Modify: `src/components/explore/ScatteredPhotos.tsx`
- Modify: `src/app/explore/Explore.module.css`
- Test: `tests/home-photo-card.test.mjs`

- [ ] **Step 1: Add focus state and center calculation**

Import `AnimatePresence` and `motion`, add `focusedIndex` and `focusPosition` state, and calculate the target relative to `photosContainer`:

```tsx
const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
const [focusPosition, setFocusPosition] = useState<{ x: number; y: number } | null>(null);

const updateFocusPosition = useCallback(() => {
  const rect = containerRef.current?.getBoundingClientRect();
  if (!rect) return;

  setFocusPosition({
    x: window.innerWidth / 2 - rect.left,
    y: window.innerHeight / 2 - rect.top,
  });
}, []);

const openFocus = useCallback((index: number) => {
  updateFocusPosition();
  setFocusedIndex(index);
}, [updateFocusPosition]);

const closeFocus = useCallback(() => {
  setFocusedIndex(null);
  setFocusPosition(null);
}, []);
```

Use a `containerRef` on `#photos-area`, and update the focus target on `resize` while a photo is focused. Keep the focus state independent from drag position state.

- [ ] **Step 2: Render the backdrop above normal cards and below the focused card**

Inside the same `photosContainer` stacking context, render:

```tsx
<AnimatePresence>
  {focusedIndex !== null && (
    <motion.button
      type="button"
      className={styles.focusBackdrop}
      aria-label="关闭聚焦"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      onClick={closeFocus}
    />
  )}
</AnimatePresence>
```

Add CSS with `position: fixed`, full viewport coverage, `z-index: 2000`, a dark translucent background, and no default button border/padding. Add `:focus-visible` styling so keyboard users can see the dismiss control.

- [ ] **Step 3: Pass focus props into every card and close the focused layer on the backdrop**

Pass these props from `ScatteredPhotos`:

```tsx
isFocused={focusedIndex === index}
focusPosition={focusPosition}
onFocus={() => openFocus(index)}
onClose={closeFocus}
```

Keep the backdrop mounted until its exit animation begins; the card’s return-layer state in Task 3 keeps the returning card above the normal stack.

- [ ] **Step 4: Run the focused tests**

Run:

```bash
node --test tests/home-photo-card.test.mjs
```

Expected: backdrop/state assertions pass; card prop and dynamic hit-area assertions remain RED until Task 3.

### Task 3: Animate one card to the viewport center and preserve layering during return

**Files:**
- Modify: `src/components/explore/PhotoCard.tsx`
- Modify: `tests/home-photo-card.test.mjs`

- [ ] **Step 1: Add focus props and returning-layer state**

Extend `PhotoCardProps` with:

```tsx
isFocused: boolean;
focusPosition: { x: number; y: number } | null;
onFocus: () => void;
onClose: () => void;
```

Track `isReturning` with a ref/effect: when `isFocused` changes from true to false, keep the focused z-index until the position animation completes. The animation-complete callback clears `isReturning` only after the return target has been reached.

- [ ] **Step 2: Calculate a tight hit area around the maximum planar card bounds**

Replace the fixed `40px` ring with a size derived from the actual card dimensions, rotation, and hover scale:

```tsx
const HIT_AREA_PADDING = 8;
const HOVER_SCALE = 1.045;
const rotationRadians = Math.abs(rotation) * Math.PI / 180;
const maxTransformedWidth = HOVER_SCALE * (
  cardWidth * Math.cos(rotationRadians) + cardHeight * Math.sin(rotationRadians)
);
const maxTransformedHeight = HOVER_SCALE * (
  cardWidth * Math.sin(rotationRadians) + cardHeight * Math.cos(rotationRadians)
);
const hitWidth = Math.max(cardWidth, maxTransformedWidth) + HIT_AREA_PADDING * 2;
const hitHeight = Math.max(cardHeight, maxTransformedHeight) + HIT_AREA_PADDING * 2;
```

Keep the inner animated card at `cardWidth`/`cardHeight` and center it with flex, so shrinking the hit area never changes the visible photo size.

- [ ] **Step 3: Animate position, focus scale, and layer without 3D rotation**

Convert the outer hit container to `motion.div` and use:

```tsx
animate={{
  left: isFocused && focusPosition ? focusPosition.x : position.x,
  top: isFocused && focusPosition ? focusPosition.y : position.y,
  scale: isFocused ? 1 : isHovered ? HOVER_SCALE : 1,
}}
```

Use a single spring for `left`/`top`/`scale`, set `zIndex` to `FOCUSED_Z_INDEX` while focused or returning, and keep the base `rotate={rotation}` only. A focused click calls `onClose`; a normal no-drag click calls `onFocus`. Pointer movement beyond a small threshold continues to mean drag and must not focus.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run:

```bash
node --test tests/home-photo-card.test.mjs
```

Expected: all home photo-card tests pass.

### Task 4: Verify the interaction in the local browser

**Files:**
- Modify: none
- Test: local page at `http://127.0.0.1:3100/`

- [ ] **Step 1: Verify normal click focus**

Click a visible photo and confirm its center reaches the viewport center, the card size stays unchanged, the backdrop fades in, and the focused card is above every other card.

- [ ] **Step 2: Verify both close paths**

Click the focused photo and confirm it returns to its original position. Repeat, then click the dark backdrop and confirm the same return animation.

- [ ] **Step 3: Verify drag and overlap behavior**

Drag a photo far enough to exceed the click threshold and confirm it moves without opening focus. Click a photo that overlaps another and confirm only the clicked/topmost card moves above the backdrop; no other card appears through it during either direction of the animation.

- [ ] **Step 4: Verify resize behavior**

While focused, resize the browser viewport and confirm the focused photo remains centered. Close it and confirm it returns to its saved scattered position.

### Task 5: Run full verification and commit the implementation

**Files:**
- Modify: `src/components/explore/PhotoCard.tsx`
- Modify: `src/components/explore/ScatteredPhotos.tsx`
- Modify: `src/app/explore/Explore.module.css`
- Modify: `tests/home-photo-card.test.mjs`

- [ ] **Step 1: Run all automated checks**

Run:

```bash
npm test
node node_modules/eslint/bin/eslint.js src/components/explore/PhotoCard.tsx src/components/explore/ScatteredPhotos.tsx
node node_modules/next/dist/bin/next build --no-lint
```

Expected: all tests pass, lint reports no errors, and the production build exits with code 0. An existing `@next/next/no-img-element` warning in `PhotoCard.tsx` is acceptable if it remains the only lint finding.

- [ ] **Step 2: Inspect the final diff**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and only the four implementation/test files changed after the committed design and plan documents.

- [ ] **Step 3: Commit the implementation**

```bash
git add src/components/explore/PhotoCard.tsx src/components/explore/ScatteredPhotos.tsx src/app/explore/Explore.module.css tests/home-photo-card.test.mjs
git commit -m "feat: add focused home polaroid interaction"
```
