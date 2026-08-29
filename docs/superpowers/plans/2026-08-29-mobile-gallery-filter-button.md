# Mobile Gallery Filter Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the compressed mobile gallery filter text control with an icon-only button that opens the existing filter choices.

**Architecture:** Keep the desktop chip filter unchanged. On screens up to 768px, render an icon-only button and a compact popover containing the same tag choices; the button exposes the current filter state through accessible labels and an active indicator.

**Tech Stack:** Next.js, React, TypeScript, CSS Modules, Node test runner.

---

### Task 1: Add a failing source regression test

**Files:**
- Create: `tests/gallery-filter.test.mjs`

- [x] **Step 1: Assert the mobile button contract**

Check that the component has an icon-only mobile button, an expandable menu, menu item semantics, and a mobile media-query style that hides the desktop chips.

- [x] **Step 2: Run the test and confirm it fails**

Run: `node --test tests/gallery-filter.test.mjs`

Expected: FAIL because the current mobile implementation is a text-bearing `<select>`.

### Task 2: Implement the mobile filter button and menu

**Files:**
- Modify: `src/components/gallery/GalleryFilter.tsx`
- Modify: `src/components/gallery/GalleryFilter.module.css`

- [x] **Step 1: Add toggle state and menu options**

Render a button with a funnel SVG and active dot; clicking it toggles a menu containing “全部” and every `GALLERY_FILTER_TAGS` value. Selecting an item calls the existing `onChange` callback and closes the menu.

- [x] **Step 2: Add compact mobile-only styling**

Hide the current select-based control, keep chips hidden at mobile width, and style the button/menu with fixed compact dimensions, right alignment, white background, border, and shadow.

- [x] **Step 3: Run the focused test and lint**

Run: `node --test tests/gallery-filter.test.mjs && node node_modules/eslint/bin/eslint.js src/components/gallery/GalleryFilter.tsx`

Expected: PASS with no lint errors.

### Task 3: Verify the complete app

**Files:**
- No additional files.

- [x] **Step 1: Run all tests**

Run: `npm test`

Expected: all tests pass.

- [x] **Step 2: Run the production build**

Run: `node node_modules/next/dist/bin/next build --no-lint`

Expected: build completes successfully.

- [x] **Step 3: Inspect desktop and mobile layouts**

Open `/gallery/` at desktop width and confirm chips remain visible. Switch to a phone-sized viewport and confirm only the icon button is visible, the menu opens, and selecting a tag filters the gallery.
