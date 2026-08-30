# 首页拍立得结束事件随机旋转 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在拖拽结束和焦点态退出回位完成后，让首页拍立得在 `-12°~12°` 内平滑切换到新的随机旋转角度。

**Architecture:** `ScatteredPhotos` 继续作为照片布局状态的唯一来源，新增按索引更新 rotation 的回调；`PhotoCard` 仅识别拖拽结束和焦点回位完成两个事件并调用回调。随机角度函数放在 `PhotoCard.tsx` 的纯函数区域，便于通过源码测试验证范围和避重。

**Tech Stack:** React, TypeScript, Framer Motion, Node.js built-in test runner, Next.js.

---

### Task 1: 锁定随机角度和触发规则

**Files:**
- Modify: `tests/home-photo-card.test.mjs`

- [ ] **Step 1: Write the failing tests**

追加以下测试，锁定实现必须包含 `-12~12` 的随机函数、父级更新回调、拖拽释放触发和焦点回位完成触发：

```js
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
  assert.match(source, /nextRotation === currentRotation/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/home-photo-card.test.mjs`

Expected: FAIL because `onRotationChange` and `getRandomRotation` do not yet exist.

### Task 2: 在布局状态中持久化旋转角度

**Files:**
- Modify: `src/components/explore/ScatteredPhotos.tsx`
- Modify: `src/components/explore/PhotoCard.tsx`

- [ ] **Step 1: Add the rotation update contract**

在 `PhotoCardProps` 增加：

```ts
onRotationChange: (rotation: number) => void;
```

在 `ScatteredPhotos` 增加按索引更新的回调：

```ts
const updatePhotoRotation = useCallback((index: number, rotation: number) => {
  setPhotoStates(photoStates => {
    const next = [...photoStates];
    if (!next[index]) return photoStates;
    next[index] = { ...next[index], rotation };
    return next;
  });
}, []);
```

将 `onRotationChange={rotation => updatePhotoRotation(index, rotation)}` 传给每个 `PhotoCard`。

- [ ] **Step 2: Add the bounded random-angle helper**

在 `PhotoCard.tsx` 的常量附近加入：

```ts
const MIN_ROTATION = -12;
const MAX_ROTATION = 12;

function getRandomRotation(currentRotation: number) {
  let nextRotation = currentRotation;
  for (let attempt = 0; attempt < 4 && nextRotation === currentRotation; attempt += 1) {
    nextRotation = MIN_ROTATION + Math.random() * (MAX_ROTATION - MIN_ROTATION);
  }
  return nextRotation;
}
```

保留现有布局初始化的 `-12 + Math.random() * 24`，并让新函数使用相同边界。

- [ ] **Step 3: Trigger the update only at the two requested end events**

拖拽释放处理器中，在释放指针、清理 dragging 状态后，仅在 `hasMovedRef.current` 为真时调用：

```ts
if (hasMovedRef.current) {
  onRotationChange(getRandomRotation(rotation));
}
```

焦点退出的 `onAnimationComplete` 中，在 `isReturning` 为真时先更新角度，再清理 `isReturning`：

```ts
if (isReturning) {
  onRotationChange(getRandomRotation(rotation));
  setIsReturning(false);
}
```

依赖数组同步加入 `onRotationChange` 和 `rotation`，确保回调拿到当前角度；普通点击进入焦点态路径不调用该回调。

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `node --test tests/home-photo-card.test.mjs`

Expected: all home photo tests PASS.

### Task 3: 回归验证并提交

**Files:**
- Test: `tests/home-photo-card.test.mjs`
- Verify: `src/app/explore/Explore.module.css`, `src/components/explore/PhotoCard.tsx`, `src/components/explore/ScatteredPhotos.tsx`

- [ ] **Step 1: Run the full automated checks**

Run: `npm test`

Expected: all tests PASS with zero failures.

Run: `node node_modules/eslint/bin/eslint.js src/components/explore/PhotoCard.tsx src/components/explore/ScatteredPhotos.tsx`

Expected: zero errors; the existing `@next/next/no-img-element` warning may remain.

Run: `git diff --check`

Expected: no output.

- [ ] **Step 2: Run the production build**

Run: `node node_modules/next/dist/bin/next build --no-lint`

Expected: `Compiled successfully` and route generation completes.

- [ ] **Step 3: Verify the rendered interaction**

Open `http://127.0.0.1:3100/` with the Browser runtime. Confirm:

1. The page renders the homepage and photo stack without a framework overlay.
2. A real drag changes the card position and, after release, the card settles at a different angle within `-12°~12°`.
3. A normal click enters focus with the card at `0°`; clicking the backdrop returns it, and only after the spring return does the card settle at a new bounded angle.
4. Browser console has no relevant errors.

- [ ] **Step 4: Commit the implementation**

```bash
git add src/components/explore/PhotoCard.tsx src/components/explore/ScatteredPhotos.tsx tests/home-photo-card.test.mjs
git commit -m "feat: randomize polaroid rotation after interactions"
```
