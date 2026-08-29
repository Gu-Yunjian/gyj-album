# External MP4 Video Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Tencent COS-hosted MP4 playback to the existing video page and admin manager without placing video files in GitHub.

**Architecture:** Keep `videos.json` as the ordered content source and normalize each entry to a provider-aware `VideoEntry`. Bilibili entries retain the existing iframe flow; external HTTPS MP4 entries use the native video element. The admin manager chooses the provider and validates the corresponding URL, while the supplied COS entries are added to the public configuration.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS Modules, Node built-in test runner.

---

### Task 1: Extend video configuration validation

**Files:**
- Modify: `src/lib/bilibili.ts`
- Test: `tests/videos.test.mjs`

- [ ] Add tests proving valid external `.mp4` HTTPS URLs normalize with `provider: 'mp4'`, invalid protocols/extensions are skipped, and existing Bilibili entries normalize with `provider: 'bilibili'`.
- [ ] Run `npm test` and confirm the new tests fail because provider-aware normalization is not implemented.
- [ ] Add `VideoProvider`, `VideoEntry`, and external URL validation while retaining backward compatibility for existing Bilibili JSON entries without a provider.
- [ ] Run `npm test` and confirm the configuration tests pass.

### Task 2: Render external MP4 entries

**Files:**
- Modify: `src/components/video/VideoCard.tsx`
- Modify: `src/components/video/VideoCard.module.css`
- Test: `tests/videos.test.mjs`

- [ ] Add source assertions for a native video element with controls, metadata-only preload, and inline playback while retaining the Bilibili iframe and fallback link.
- [ ] Run the focused test and confirm it fails before the component changes.
- [ ] Render MP4 entries with `<video controls preload="metadata" playsInline src={video.url}>` and use provider-specific external-link text.
- [ ] Add responsive video styling matching the existing frame.
- [ ] Run the focused test and confirm it passes.

### Task 3: Add provider selection to local admin management

**Files:**
- Modify: `src/components/admin/VideoManager.tsx`
- Test: `tests/videos.test.mjs`

- [ ] Add source assertions for provider selection and the external MP4 validation path.
- [ ] Run the focused test and confirm it fails before the admin changes.
- [ ] Add a Bilibili/外部 MP4 selector, route Bilibili input through the existing resolver, validate MP4 URLs locally, and save normalized provider fields.
- [ ] Keep ordering, title editing, deletion, and local JSON saving unchanged.
- [ ] Run the focused test and confirm it passes.

### Task 4: Add the supplied COS videos and update documentation

**Files:**
- Modify: `public/content/videos.json`
- Modify: `PROJECT_GUIDE.md`

- [ ] Add the two supplied COS URLs as `mp4` entries titled “环境学院” and “软件学院”, preserving all existing Bilibili entries.
- [ ] Update the project guide to describe both video providers and external COS hosting.

### Task 5: Verify the complete change

**Files:** None.

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build:skip-lint`.
- [ ] Inspect the final diff and confirm no MP4 binary was added to the repository.
