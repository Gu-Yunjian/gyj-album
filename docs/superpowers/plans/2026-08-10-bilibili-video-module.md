# Bilibili Video Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight, statically deployed video page whose ordered Bilibili links can be managed from the local admin tool.

**Architecture:** Store title and canonical Bilibili URL pairs in `public/content/videos.json`. Parse links with dependency-free TypeScript, render Bilibili's hosted iframe player, and resolve `b23.tv` links only inside the local admin API. Keep the large admin page focused by placing video state and controls in a separate `VideoManager` component.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, CSS Modules, Node's built-in test runner, Bilibili iframe player.

---

### Task 1: Restore the lint baseline

**Files:**
- Modify: `eslint.config.mjs`

- [ ] **Step 1: Reproduce the configuration failure**

Run: `npm run lint`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `eslint-config-next/core-web-vitals`.

- [ ] **Step 2: Confirm the explicit module paths resolve**

Run:

```bash
node -e "Promise.all([import('eslint-config-next/core-web-vitals.js'), import('eslint-config-next/typescript.js')]).then(() => process.stdout.write('resolved\n'))"
```

Expected: output contains `resolved`.

- [ ] **Step 3: Adapt the Next 15 legacy configs to ESLint 9 flat config**

```js
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
]);
```

- [ ] **Step 4: Verify ESLint starts**

Run: `npm run lint`

Expected: ESLint loads its configuration. Existing source warnings or errors may remain and must be recorded separately from the resolved module failure.

- [ ] **Step 5: Commit the compatibility fix**

```bash
git add eslint.config.mjs
git commit -m "fix: load next eslint config on node 24"
```

### Task 2: Parse Bilibili links and build player URLs

**Files:**
- Create: `src/lib/bilibili.ts`
- Create: `tests/bilibili.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add the test command and failing parser tests**

Add this script:

```json
"test": "node --experimental-strip-types --test tests/*.test.mjs"
```

Create tests that define the public contract:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBilibiliPlayerUrl,
  canonicalizeBilibiliUrl,
  parseBilibiliUrl,
} from '../src/lib/bilibili.ts';

test('parses a BV video URL and strips tracking parameters', () => {
  const parsed = parseBilibiliUrl('https://www.bilibili.com/video/BV1Sa6cBDEXQ/?share_source=copy_web');
  assert.deepEqual(parsed, { kind: 'bvid', value: 'BV1Sa6cBDEXQ', page: 1 });
  assert.equal(canonicalizeBilibiliUrl(parsed), 'https://www.bilibili.com/video/BV1Sa6cBDEXQ/');
});

test('parses AV and player URLs with a page number', () => {
  assert.deepEqual(parseBilibiliUrl('https://www.bilibili.com/video/av170001?p=2'), {
    kind: 'aid', value: '170001', page: 2,
  });
  assert.deepEqual(parseBilibiliUrl('https://player.bilibili.com/player.html?bvid=BV1Sa6cBDEXQ&page=3'), {
    kind: 'bvid', value: 'BV1Sa6cBDEXQ', page: 3,
  });
});

test('rejects unsupported hosts and malformed identifiers', () => {
  assert.equal(parseBilibiliUrl('https://example.com/video/BV1Sa6cBDEXQ'), null);
  assert.equal(parseBilibiliUrl('https://www.bilibili.com/video/BVbad'), null);
});

test('builds a lazy iframe source with restrained defaults', () => {
  assert.equal(
    buildBilibiliPlayerUrl({ kind: 'bvid', value: 'BV1Sa6cBDEXQ', page: 1 }),
    'https://player.bilibili.com/player.html?bvid=BV1Sa6cBDEXQ&page=1&high_quality=1&as_wide=1&danmaku=0',
  );
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test`

Expected: FAIL because `src/lib/bilibili.ts` does not exist.

- [ ] **Step 3: Implement the minimal dependency-free parser**

```ts
export type ParsedBilibiliVideo = {
  kind: 'bvid' | 'aid';
  value: string;
  page: number;
};

const BVID_PATTERN = /^BV[0-9A-Za-z]{10}$/;
const AID_PATTERN = /^av([0-9]+)$/i;

export function parseBilibiliUrl(rawUrl: string): ParsedBilibiliVideo | null {
  let url: URL;
  try { url = new URL(rawUrl.trim()); } catch { return null; }

  const host = url.hostname.toLowerCase();
  if (host !== 'bilibili.com' && !host.endsWith('.bilibili.com')) return null;

  const pageValue = url.searchParams.get('p') ?? url.searchParams.get('page') ?? '1';
  const parsedPage = Number.parseInt(pageValue, 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const queryBvid = url.searchParams.get('bvid');
  if (queryBvid && BVID_PATTERN.test(queryBvid)) return { kind: 'bvid', value: queryBvid, page };
  const queryAid = url.searchParams.get('aid');
  if (queryAid && /^\d+$/.test(queryAid)) return { kind: 'aid', value: queryAid, page };

  const segment = url.pathname.split('/').find(part => BVID_PATTERN.test(part) || AID_PATTERN.test(part));
  if (!segment) return null;
  if (BVID_PATTERN.test(segment)) return { kind: 'bvid', value: segment, page };
  return { kind: 'aid', value: segment.match(AID_PATTERN)?.[1] ?? '', page };
}
```

Add `canonicalizeBilibiliUrl` and `buildBilibiliPlayerUrl` with `URLSearchParams`, using `bvid` or `aid`, then `page`, `high_quality=1`, `as_wide=1`, and `danmaku=0` in that order.

- [ ] **Step 4: Run the tests and verify GREEN**

Run: `npm test`

Expected: 4 tests pass.

- [ ] **Step 5: Commit the parser**

```bash
git add package.json src/lib/bilibili.ts tests/bilibili.test.mjs
git commit -m "feat: parse bilibili video links"
```

### Task 3: Load and validate static video content

**Files:**
- Create: `src/lib/videos.ts`
- Create: `tests/videos.test.mjs`
- Create: `public/content/videos.json`
- Modify: `src/lib/bilibili.ts`

- [ ] **Step 1: Write failing configuration tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeVideoConfig } from '../src/lib/bilibili.ts';

test('keeps valid titled videos in source order', () => {
  assert.deepEqual(normalizeVideoConfig({ videos: [
    { title: 'A', url: 'https://www.bilibili.com/video/BV1Sa6cBDEXQ/' },
    { title: 'B', url: 'https://example.com/video/BV1Sa6cBDEXQ/' },
  ] }), [{ title: 'A', url: 'https://www.bilibili.com/video/BV1Sa6cBDEXQ/' }]);
});

test('returns an empty list for malformed configuration', () => {
  assert.deepEqual(normalizeVideoConfig(null), []);
  assert.deepEqual(normalizeVideoConfig({ videos: 'bad' }), []);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test`

Expected: FAIL because `src/lib/videos.ts` does not exist.

- [ ] **Step 3: Implement normalization and filesystem loading**

```ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { normalizeVideoConfig } from './bilibili';

export async function getVideos() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), 'public/content/videos.json'), 'utf8');
    return normalizeVideoConfig(JSON.parse(raw));
  } catch (error) {
    console.error('Failed to load videos.json:', error);
    return [];
  }
}
```

Define `VideoEntry` and `normalizeVideoConfig` in `src/lib/bilibili.ts` beside the other pure functions. Keeping all dependency-free validation in one file lets Node test it directly without adding a TypeScript runner or changing module-resolution settings.

- [ ] **Step 4: Seed the approved mock entry**

```json
{
  "videos": [
    {
      "title": "摄影小结丨一路向西，前往亚洲的另一端",
      "url": "https://www.bilibili.com/video/BV1Sa6cBDEXQ/"
    }
  ]
}
```

- [ ] **Step 5: Verify tests and commit**

Run: `npm test`

Expected: 6 tests pass.

```bash
git add src/lib/bilibili.ts src/lib/videos.ts tests/videos.test.mjs public/content/videos.json
git commit -m "feat: add static video content source"
```

### Task 4: Render the video page

**Files:**
- Create: `src/components/video/VideoCard.tsx`
- Create: `src/components/video/VideoCard.module.css`
- Create: `src/app/videos/page.tsx`
- Create: `src/app/videos/page.module.css`
- Modify: `src/components/layout/Navigation.tsx`

- [ ] **Step 1: Write a failing source-level page contract test**

Extend `tests/videos.test.mjs` to read the page and navigation source and assert that `/videos`, `VideoCard`, `loading="lazy"`, `allowFullScreen`, and the Chinese labels `视频` and `在 B 站观看` exist. This project has no component DOM test dependency, so the source contract protects the static route and iframe accessibility attributes without adding a test package.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test`

Expected: FAIL because the video page and card do not exist.

- [ ] **Step 3: Implement `VideoCard`**

```tsx
import { buildBilibiliPlayerUrl, parseBilibiliUrl } from '@/lib/bilibili';
import type { VideoEntry } from '@/lib/bilibili';
import styles from './VideoCard.module.css';

export default function VideoCard({ video }: { video: VideoEntry }) {
  const parsed = parseBilibiliUrl(video.url);
  if (!parsed) return null;
  return (
    <article className={styles.card}>
      <div className={styles.frame}>
        <iframe
          src={buildBilibiliPlayerUrl(parsed)}
          title={video.title}
          loading="lazy"
          allow="fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
      <div className={styles.meta}>
        <h2>{video.title}</h2>
        <a href={video.url} target="_blank" rel="noreferrer">在 B 站观看</a>
      </div>
    </article>
  );
}
```

Use `aspect-ratio: 16 / 9`, a one-pixel border, no decorative shadow, and CSS variables from `globals.css`.

- [ ] **Step 4: Implement the static page and navigation entry**

The page calls `getVideos()`, renders `Navigation`, a centered `视频` heading, and either a two-column grid or the empty text `暂时还没有视频`. Add the `视频` link between `影集` and `关于`.

- [ ] **Step 5: Verify tests and commit**

Run: `npm test`

Expected: all tests pass.

```bash
git add src/app/videos src/components/video src/components/layout/Navigation.tsx tests/videos.test.mjs
git commit -m "feat: add bilibili video page"
```

### Task 5: Resolve Bilibili short links locally

**Files:**
- Create: `src/app/api/admin/videos/resolve/route.ts`
- Modify: `src/lib/bilibili.ts`
- Modify: `tests/bilibili.test.mjs`

- [ ] **Step 1: Write failing host-validation tests**

Test `isB23Url`, `isBilibiliUrl`, and `validateResolvedBilibiliUrl` from `src/lib/bilibili.ts` with exact `b23.tv`, Bilibili subdomains, spoofed suffixes such as `bilibili.com.example.com`, and the approved mock URL.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test`

Expected: FAIL because the host-validation exports do not exist.

- [ ] **Step 3: Implement host validation and the local route**

The route accepts `{ "url": "https://b23.tv/..." }`, rejects other hosts with status 400, follows redirects with a `HEAD` request, validates the final hostname and parsed video identifier, then returns `{ "url": canonicalUrl }`. If `HEAD` fails, return status 400 with `无法解析短链接，请粘贴完整 B 站链接` rather than introducing retries or a proxy service.

- [ ] **Step 4: Verify tests and commit**

Run: `npm test`

Expected: all tests pass.

```bash
git add src/app/api/admin/videos/resolve/route.ts src/lib/bilibili.ts tests/bilibili.test.mjs
git commit -m "feat: resolve bilibili short links locally"
```

### Task 6: Add video management to the local admin tool

**Files:**
- Create: `src/components/admin/VideoManager.tsx`
- Modify: `src/app/admin/page.tsx`
- Modify: `tests/videos.test.mjs`

- [ ] **Step 1: Add a failing admin source contract**

Assert that `src/app/admin/page.tsx` includes the `videos` tab and renders `VideoManager`, and that `VideoManager.tsx` saves to `public/content/videos.json`, validates with `parseBilibiliUrl`, resolves `/api/admin/videos/resolve`, and exposes add, move, delete, and save button labels.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npm test`

Expected: FAIL because `VideoManager` does not exist and the tab union lacks `videos`.

- [ ] **Step 3: Implement the isolated manager**

`VideoManager` owns `videos`, `title`, `url`, `loading`, `saving`, and `error` state. It loads `/content/videos.json` on mount, canonicalizes long links locally, resolves only `b23.tv` links through the local API, rejects duplicate canonical URLs, reorders with immutable array swaps, and saves through the existing `/api/admin/save` endpoint:

```ts
body: JSON.stringify({
  path: 'public/content/videos.json',
  content: JSON.stringify({ videos }, null, 2),
})
```

Use the current admin page's inline control styles. Do not add a styling dependency or refactor the album and About panels.

- [ ] **Step 4: Add the admin tab**

Change the tab union to `'albums' | 'videos' | 'about'`, add `🎬 视频管理` between album and About, render `VideoManager`, and hide the album-only header save button outside the albums tab.

- [ ] **Step 5: Verify tests and commit**

Run: `npm test`

Expected: all tests pass.

```bash
git add src/app/admin/page.tsx src/components/admin/VideoManager.tsx tests/videos.test.mjs
git commit -m "feat: manage videos from local admin"
```

### Task 7: Document and verify the complete workflow

**Files:**
- Modify: `PROJECT_GUIDE.md`

- [ ] **Step 1: Update the project guide**

Add `/videos` to the route table, `public/content/videos.json` to the content tree, and video link management to the admin boundary. State that Bilibili playback uses the hosted iframe and the site does not proxy video streams.

- [ ] **Step 2: Run automated verification**

Run:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Expected: tests, lint, type-check, and static production build pass. Record any dependency audit notices separately; do not run `npm audit fix` because it changes dependency versions outside this feature.

- [ ] **Step 3: Run browser verification**

Start `npm run dev`, then verify `/videos` and `/admin` at desktop and mobile widths. Confirm the mock video frame loads, the title matches the supplied text, fullscreen is available, the external link points to the canonical BV URL, and admin add/order/delete/save survives a reload. Restore `public/content/videos.json` to the approved mock-only seed after destructive admin checks.

- [ ] **Step 4: Commit documentation or verification fixes**

```bash
git add PROJECT_GUIDE.md
git commit -m "docs: document bilibili video workflow"
```

- [ ] **Step 5: Review branch history and working tree**

Run:

```bash
git status --short
git log --oneline --decorate -10
```

Expected: working tree clean and commits separated by concern.
