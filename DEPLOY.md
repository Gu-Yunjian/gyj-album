# Deployment Guide

> Deployment-only checklist for the current static site. For architecture and workflow details, use `PROJECT_GUIDE.md`.

## Deployment Model

Gu Album is deployed as a static export.

```text
local source photos and metadata
  -> generated public assets
  -> npm run build
  -> dist/
  -> Cloudflare Pages
```

Production does not run the local admin API routes as a CMS.

## Cloudflare Pages Settings

```yaml
Framework preset: Next.js
Build command: npm run build
Build output directory: dist
```

`next.config.ts` sets `distDir: 'dist'` and enables static export outside development.

## Before Deploying

1. Put source photos in `originals/[album-name]/`.
2. Run the image pipeline:

```bash
python scripts/process_photos.py
```

3. Confirm generated deployable content changed as expected:

```bash
git status --short public/albums.json public/photos public/medium public/thumbnails public/content
```

4. Optionally run the local site:

```bash
npm run dev
```

5. Build:

```bash
npm run build
```

## Files That Matter For Deployment

Commit generated static content:

- `public/albums.json`
- `public/photos/**`
- `public/medium/**`
- `public/thumbnails/**`
- `public/content/about.md`
- `public/content/social.json`

Do not rely on these legacy names:

- `public/photos.json`
- `public/photos/[album]/info.txt`
- `public/home-photos`

Do not deploy `originals/` as public site content.

## Manual Git Flow

```bash
git add public/albums.json public/photos public/medium public/thumbnails public/content
git commit -m "update album content"
git push origin main
```

Use the project deploy scripts only if they match the current git workflow you want:

```bash
scripts\deploy.bat
.\scripts\deploy.ps1
```

## Troubleshooting

If photos do not appear after deployment:

- Check that `public/albums.json` was committed.
- Check that every `albums[].photos[]` filename exists under `public/photos/[album]/`.
- Check that gallery images also exist under `public/medium/[album]/`.
- Check that album thumbnails exist under `public/thumbnails/[album]/`.
- Check Cloudflare build logs for `npm run build` failures.

If `/admin` does not work in production:

- That is expected for the current architecture.
- Run it locally with `npm run dev` when editing content.

If static export fails:

- Avoid adding runtime-only server behavior to public pages.
- Confirm dynamic album routes can be generated from `public/albums.json`.
