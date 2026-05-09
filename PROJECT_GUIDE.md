# Gu Album Project Guide

> Primary reference for future code changes. If another project document conflicts with this file, update the other document or the code before proceeding.

## Product Definition

Gu Album is a static personal photography portfolio for GU-PROJECTS. It prioritizes fast browsing, a quiet visual system, and local-first content updates.

The production site is static. Photo processing, metadata editing, and file writes happen locally during development, then generated assets are committed and deployed.

## Authoritative Routes

| Route | Purpose | Data source | Notes |
| --- | --- | --- | --- |
| `/` | Welcome/explore entry | `getAllPhotos()` from `public/albums.json` | Shows scattered random photos and buttons to `/gallery` and `/collections`. |
| `/gallery` | All-photo browsing | `getHomePhotos()` from all albums | Daily seeded ordering, fills with mock photos only if fewer than 30 real photos. |
| `/collections` | Album list | `getAlbums()` | Shows album cards from `albums[].cover`. |
| `/album/[name]` | Single album viewer | `getAlbum()` and `getAllPhotosData()` | Static params from album names; decodes URL names. |
| `/about` | Profile page | `public/content/about.md`, `public/content/social.json` | Markdown frontmatter drives profile metadata. |
| `/admin` | Local content tool | local API routes and static JSON | Development helper only, not production CMS. |

## Current File Structure

```text
gu-album/
├── originals/                 # Source photos, ignored by git
│   ├── [album-name]/
│   └── *.jpg                  # Root photos become the "default" album
├── public/
│   ├── photos/[album]/        # Main WebP images for large views
│   ├── medium/[album]/        # Medium WebP images for gallery/explore views
│   ├── thumbnails/[album]/    # Thumbnail-purpose WebP images for album UI
│   ├── albums.json            # Authoritative album and photo metadata
│   └── content/
│       ├── about.md
│       └── social.json
├── scripts/
│   ├── process_photos.py      # Image processing and metadata generation
│   ├── deploy.bat
│   └── deploy.ps1
├── src/
│   ├── app/                   # Next.js App Router pages and local API routes
│   ├── components/            # UI components grouped by feature
│   └── lib/photos.ts          # Data loading and transformation helpers
└── next.config.ts             # Static export configuration for production
```

## Data Model

`public/albums.json` is the deployed content index.

```json
{
  "albums": [
    {
      "name": "album-id",
      "title": "Album Title",
      "subtitle": "Short subtitle",
      "cover": "photo.webp",
      "photos": ["photo.webp"],
      "photoInfos": {
        "photo": {
          "title": "Photo title",
          "desc": "Photo description"
        }
      },
      "hasBgm": false,
      "order": 0
    }
  ],
  "allPhotos": {
    "album-id/photo": {
      "filename": "photo.webp",
      "originalName": "photo.jpg",
      "mainSize": 123456,
      "mediumSize": 45678,
      "thumbSize": 12345,
      "exif": {
        "aperture": "f/2.8",
        "shutterSpeed": "1/125s",
        "iso": 100,
        "dateTaken": "2024:01:01 12:00:00",
        "camera": "Camera Model"
      }
    }
  }
}
```

Keys in `photoInfos` and `allPhotos` use the photo stem without extension. Frontend display paths are derived from `filename`.

## Image Pipeline

Run:

```bash
python scripts/process_photos.py
```

The script:

- Scans `originals/[album-name]/` as album folders.
- Treats images directly under `originals/` as the `default` album.
- Writes main images to `public/photos/[album]/`.
- Writes medium images to `public/medium/[album]/`.
- Writes thumbnail-purpose images to `public/thumbnails/[album]/`.
- Extracts EXIF fields into `public/albums.json`.
- Preserves existing album and photo titles/descriptions where possible.

Current generated image targets:

| Output | Path | Purpose | Script target |
| --- | --- | --- | --- |
| Main | `public/photos` | album viewer and lightbox | <= 900KB target |
| Medium | `public/medium` | gallery and explore cards | <= 400KB target, max side 800px |
| Thumbnail-purpose | `public/thumbnails` | album thumbnail UI | <= 150KB target, max side 400px |

UI display sizes are smaller than file dimensions. For example, album thumbnails may render around 48-54px while using files generated with a 400px max side.

## Admin Boundary

`/admin` is a local development convenience:

- It uses a hard-coded local password to prevent accidental access.
- It can write local files through `/api/admin/*` while running `next dev`.
- It is not a secure authentication system.
- It is not expected to work as a production CMS after static export.

When documenting or extending admin behavior, call it a local content tool unless the architecture is changed to include a real backend.

## Development Commands

```bash
npm run dev
npm run lint
npm run build
python scripts/process_photos.py
```

`npm run build` currently installs with `--legacy-peer-deps` before `next build`, then writes static output to `dist` in production mode.

## Deployment

Cloudflare Pages settings:

```yaml
Framework preset: Next.js
Build command: npm run build
Build output directory: dist
```

Deploy generated static assets, including:

- `public/albums.json`
- `public/photos/**`
- `public/medium/**`
- `public/thumbnails/**`
- `public/content/**`

Do not deploy `originals/` as part of the public site.

## Known Deferred Issues

The site is primarily used as an interview portfolio and is expected to have low traffic. The following issues are recorded for future maintenance, but they are not current blockers unless the site becomes more public, more frequently edited, or more security-sensitive.

| Area | Deferred issue | When to revisit |
| --- | --- | --- |
| Admin security | `/admin` and `/api/admin/*` are local development tools, not hardened production admin endpoints. They do not provide server-side session auth or CSRF protection. | Revisit before exposing admin routes on any deployed backend or shared network. |
| Editable about content | `public/content/about.md` is loaded as MDX-capable content. This is acceptable while content is locally trusted, but it is too permissive for untrusted editing. | Revisit if non-developers can edit profile content or if content comes from a remote source. |
| Upload validation | Admin upload handling should enforce server-side file size and MIME/type validation instead of relying on client behavior. | Revisit before allowing larger batches, shared editing, or remote uploads. |
| Special filenames | Album and photo paths should be URL-encoded and tested with spaces, punctuation, non-ASCII names, and bracket-like characters. | Revisit before importing albums from mixed sources or preserving arbitrary camera/export filenames. |
| Explore mobile layout | The explore/welcome layout may need visual verification on narrow mobile screens, especially around overflow and scattered photo positioning. | Revisit during the next visual polish pass with browser screenshots. |

## Current Implementation Principles

- Prefer `public/albums.json` over filesystem scanning at runtime.
- Keep the public site static and portable.
- Keep the UI photography-first: restrained controls, generous visual focus, no marketing-style hero unless product direction changes.
- Keep docs honest about current behavior. Historical fixes and planned ideas must be clearly labeled as such.
- If code and documentation disagree, verify the code first, then update the stale document or make an intentional code change.
