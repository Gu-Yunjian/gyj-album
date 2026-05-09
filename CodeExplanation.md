# GU-Album Plain-Language Code Guide

> A friendly explanation of the current project. If this guide ever disagrees with `PROJECT_GUIDE.md`, trust `PROJECT_GUIDE.md` and update this file.

## Big Picture

Think of the site as a small static exhibition:

- Next.js builds the rooms and routes.
- React provides the interactive displays.
- CSS Modules style each display without leaking styles everywhere.
- `public/albums.json` is the exhibition catalog.
- Generated WebP files are the framed works.
- Python prepares the photos before they enter the exhibition.

There is no database. The site is designed so the final production version can be served as static files.

## How Photos Get Into The Site

Source photos start locally:

```text
originals/[album-name]/photo.jpg
```

Then the processing script creates deployable files:

```text
public/photos/[album-name]/photo.webp
public/medium/[album-name]/photo.webp
public/thumbnails/[album-name]/photo.webp
public/albums.json
```

The website reads `albums.json`, then constructs image URLs from that catalog. This is why `albums.json` is so important: it tells the site which albums exist, which files belong to each album, and what EXIF/title/description metadata should be shown.

## What Each Page Does

`/` is the welcome room. It shows scattered photos and sends people to either the full gallery or the album list.

`/gallery` is the all-photo wall. It gathers photos from every album and lets visitors open a full-screen lightbox.

`/collections` is the album shelf. It shows one card per album.

`/album/[name]` is the focused viewing room. It has the carousel, thumbnails, photo information, EXIF display, and dark mode.

`/about` is a Markdown-powered profile page.

`/admin` is a local editing desk. It helps update files while developing, but it is not a secure online dashboard.

## The Main Data Helper

`src/lib/photos.ts` is the translator between raw JSON and the UI.

It provides functions such as:

- `getAlbums()` - get all album records.
- `getAlbum(name)` - find one album.
- `getAllPhotos()` - flatten all album photos into one list.
- `getHomePhotos()` - currently the same photo source as `getAllPhotos()`.
- `getAllPhotosData()` - return the raw photo metadata map.

Server code reads the JSON file directly from disk. Client code fetches `/albums.json`.

## The Most Important Components

| Component | Plain-language role |
| --- | --- |
| `Navigation` | The site header. |
| `ExploreClient` | The welcome page interaction. |
| `ScatteredPhotos` | The loose photo arrangement on the welcome page. |
| `GalleryClient` | Opens/closes the gallery lightbox. |
| `OverviewGrid` | Shows many photos in a grid. |
| `Lightbox` | Shows one gallery photo full-screen. |
| `CollectionCard` | Shows one album in the album list. |
| `AlbumView` | The main single-album experience. |
| `SocialButtons` | Renders links on the about page. |

## Why There Is A Local Admin Page

Editing JSON and Markdown by hand is annoying, so `/admin` gives a local interface for common content work. It can save local files and run the Python processing script when `npm run dev` is active.

Because the production site is static, this local admin page should not be treated like a deployed CMS. If online editing is ever needed, the project needs a real backend.

## Common Change Paths

Add photos:

```text
1. Put source files in originals/[album-name]/
2. Run python scripts/process_photos.py
3. Review /gallery, /collections, and /album/[name]
4. Commit public/albums.json and generated public image assets
```

Edit about content:

```text
1. Edit public/content/about.md directly, or use /admin locally
2. Review /about
3. Commit public/content/about.md
```

Change the album viewer:

```text
1. Read PROJECT_GUIDE.md and DesignSpec.md
2. Inspect AlbumView.tsx and AlbumView.module.css
3. Keep desktop and mobile behavior aligned
4. Run lint/build checks
```

## Rule Of Thumb

If a change needs visitors to write data online, it does not fit the current static architecture without a larger backend decision. If a change only adjusts generated content, display behavior, or static pages, it fits the current architecture well.
