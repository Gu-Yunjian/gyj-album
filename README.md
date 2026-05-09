# Gu Album

Gu Album is a static personal photography portfolio built with Next.js, React, TypeScript, CSS Modules, and a local Python image pipeline. The production site is generated as static files for Cloudflare Pages; content management happens locally before deployment.

## Current Source Of Truth

Use these documents in this order when changing the project:

1. `PROJECT_GUIDE.md` - current product, architecture, data flow, and workflow. Treat this as the primary reference.
2. `TechSpec.md` - implementation details for routes, data shapes, components, and build behavior.
3. `DesignSpec.md` - visual and interaction rules.
4. `DEPLOY.md` - deployment-only checklist.
5. `CODE_CONVENTION.md` - coding and documentation conventions.

`ProductSpec.md` describes the current product surface and separates future ideas from shipped behavior. `CodeExplanation.md` is a plain-language guide, not the authority when it differs from `PROJECT_GUIDE.md`.

## Site Structure

- `/` - welcome and explore entry with scattered photos and links to gallery/collections.
- `/gallery` - all-photo gallery with lightbox browsing.
- `/collections` - album list.
- `/album/[name]` - immersive single-album viewer with carousel, thumbnails, EXIF, and dark mode.
- `/about` - Markdown profile page plus social buttons.
- `/admin` - local development content tool. It is not a production CMS or security boundary.

## Content Pipeline

```text
originals/[album]/
  -> scripts/process_photos.py
  -> public/photos/[album]/
  -> public/medium/[album]/
  -> public/thumbnails/[album]/
  -> public/albums.json
```

The frontend reads `public/albums.json`. Do not introduce `photos.json`, `info.txt`, or `home-photos` as active data sources unless the code is changed to support them.

## Quick Start

```bash
npm install
pip install -r scripts/requirements.txt
npm run dev
```

Add photos by placing source files in `originals/[album-name]/`, then run:

```bash
python scripts/process_photos.py
```

For local metadata edits, open `/admin` during `npm run dev`. The default password is only a local guard against accidental access.

## Build And Deploy

```bash
npm run build
```

Production builds use static export and write to `dist/`. Cloudflare Pages should use:

```yaml
Build command: npm run build
Build output directory: dist
```

## Important Constraints

- Keep originals out of git; generated WebP assets and `public/albums.json` are deployable content.
- Treat `public/albums.json` as the only deployed metadata file.
- Admin API routes are for local development. Static deployment does not provide a real online backend.
- Preserve the restrained photography-first design unless a product decision explicitly changes it.
