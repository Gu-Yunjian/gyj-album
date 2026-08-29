# Home Polaroid Theme and Hover Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the home page's polaroid frames white in dark browser environments and prevent hover tilt from changing its own pointer hit area.

**Architecture:** Keep a stable outer pointer target for each scattered photo and move Framer Motion scale/rotation onto an inner visual layer. Apply a light-only color scheme and explicit white background to the polaroid frame so browser dark-mode rendering does not recolor it.

**Tech Stack:** Next.js, React, TypeScript, Framer Motion, CSS Modules, Node test runner.

---

### Task 1: Lock the intended photo-card behavior with source tests

**Files:**
- Modify: `tests/home-photo-card.test.mjs`

- [x] **Step 1: Write failing assertions**

Assert that `PhotoCard.tsx` contains a stable pointer wrapper, a separately animated inner `motion.div`, and that `Explore.module.css` opts the polaroid frame into light-only rendering with a white background.

- [x] **Step 2: Run the focused test**

Run: `node --test tests/home-photo-card.test.mjs`

Expected: FAIL because the current card uses one motion element for both hit testing and animation and has no light-only color-scheme declaration.

### Task 2: Separate hover hit testing from animation

**Files:**
- Modify: `src/components/explore/PhotoCard.tsx`

- [x] **Step 1: Implement the stable wrapper**

Use a regular absolutely positioned wrapper with the calculated card width/height. Attach pointer handlers to that wrapper, measure tilt against its stable rectangle, and place the existing animated scale/rotation on a child `motion.div`.

- [x] **Step 2: Run the focused test**

Run: `node --test tests/home-photo-card.test.mjs`

Expected: PASS.

### Task 3: Protect the white polaroid frame from dark rendering

**Files:**
- Modify: `src/app/explore/Explore.module.css`

- [x] **Step 1: Add light-only frame styles**

Set `.polaroidFrame` to `color-scheme: only light`, `background-color: #fff`, and `forced-color-adjust: none`; retain the inline layout and shadow values already used by the component.

- [x] **Step 2: Run focused tests and lint**

Run: `node --test tests/home-photo-card.test.mjs && node node_modules/eslint/bin/eslint.js src/components/explore/PhotoCard.tsx`

Expected: PASS with no lint errors.

### Task 4: Verify the complete app

**Files:**
- No additional files.

- [x] **Step 1: Run the full test suite**

Run: `npm test`

Expected: all tests pass.

- [x] **Step 2: Run the production build**

Run: `node node_modules/next/dist/bin/next build --no-lint`

Expected: build completes successfully.

- [x] **Step 3: Inspect the local home page**

Open `http://127.0.0.1:3100/`, confirm the polaroid frame remains white, hover movement settles without entering/leaving repeatedly, and dragging still works.
