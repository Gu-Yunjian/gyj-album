# GU-Album Technical Specification

> Current implementation reference. `PROJECT_GUIDE.md` remains the highest-level source of truth; this file explains how the current code realizes it.

## Stack

| Layer | Technology | Current role |
| --- | --- | --- |
| Framework | Next.js 15 App Router | Static routes, server components, development API routes |
| UI | React 19 | Client interactions and component state |
| Language | TypeScript | Shared data shapes and component props |
| Styling | CSS Modules + `globals.css` | Component-scoped styles plus global tokens |
| Carousel | `embla-carousel-react` | Single-album photo carousel |
| Icons | `@phosphor-icons/react` | Navigation and control icons |
| Content | JSON, Markdown, static assets | No database |
| Image processing | Python, Pillow, piexif | Local photo compression and EXIF extraction |

## Runtime Modes

Development:

- `npm run dev`
- Next.js API routes under `src/app/api/admin/*` can read and write local files.
- `/admin` can be used as a local content tool.

Production:

- `npm run build`
- `next.config.ts` enables `output: 'export'` outside development.
- Output directory is `dist`.
- The deployed site is static. Admin API behavior is not a production backend.

## Route Implementation

| Route | File | Render model | Key component |
| --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | Server component passing data to client | `src/app/explore/ExploreClient.tsx` |
| `/gallery` | `src/app/gallery/page.tsx` | Server component passing data to client | `src/app/gallery/GalleryClient.tsx` |
| `/collections` | `src/app/collections/page.tsx` | Server component | `CollectionCard` |
| `/album/[name]` | `src/app/album/[name]/page.tsx` | Static params + client wrapper | `AlbumViewWrapper`, `AlbumView` |
| `/about` | `src/app/about/page.tsx` | Server component | MDX content and `SocialButtons` |
| `/admin` | `src/app/admin/page.tsx` | Client-only local tool | inline admin UI |

## Data Loading

`src/lib/photos.ts` is the frontend data gateway.

- Server-side reads use `fs.readFile(process.cwd()/public/albums.json)`.
- Client-side reads use `fetch('/albums.json')`.
- `getAlbums()` returns album metadata.
- `getAllPhotos()` flattens album photos into gallery photo records.
- `getHomePhotos()` currently aliases `getAllPhotos()`.
- `getAllPhotosData()` returns the raw `allPhotos` map for album pages.

There is no active runtime dependency on `photos.json`, `info.txt`, or `public/home-photos`.

## Types

```typescript
interface ExifInfo {
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
  dateTaken?: string;
  camera?: string;
}

interface PhotoInfo {
  title: string;
  desc: string;
  exif?: ExifInfo;
}

interface AlbumInfo {
  name: string;
  title: string;
  subtitle: string;
  cover: string;
  photos: string[];
  photoInfos: Record<string, PhotoInfo>;
  hasBgm: boolean;
}

interface GalleryPhoto {
  src: string;
  mediumSrc: string;
  thumbSrc: string;
  album: string;
  albumTitle: string;
  index: string;
  info?: PhotoInfo;
  exif?: ExifInfo;
}
```

Note: `public/albums.json` may include extra fields such as `order`, `originalName`, and `mediumSize`. Keep TypeScript interfaces in sync when code starts relying on those fields.

## Image Paths

`GalleryPhoto` paths are derived from metadata:

```text
src       -> /photos/[album]/[filename]
mediumSrc -> /medium/[album]/[filename]
thumbSrc  -> /thumbnails/[album]/[filename]
```

The gallery grid uses `mediumSrc` for better quality than thumbnails. Album thumbnail controls use `thumbSrc`.

## Main Components

| Component | Responsibility |
| --- | --- |
| `Navigation` | Top navigation with links to `/`, `/gallery`, `/collections`, `/about`. |
| `ExploreClient` | Welcome page state, random photo selection, route buttons. |
| `ScatteredPhotos` / explore `PhotoCard` | Random scattered photo layout and drag/activation behavior. |
| `GalleryClient` | Gallery lightbox state and photo mapping. |
| `OverviewGrid` | Grid display for gallery photos. |
| `Lightbox` | Full-screen photo view for gallery browsing. |
| `CollectionCard` | Album card linking to `/album/[name]`. |
| `AlbumView` | Carousel, desktop sidebar, mobile controls, thumbnails, EXIF, dark mode. |
| `SocialButtons` | About page social link rendering. |

## Album Viewer Behavior

`AlbumView` owns these UI states:

- `currentIndex` - selected photo.
- `isDarkMode` - album-page dark mode.
- `showControls` - desktop hover controls.
- `showMobileControls` - mobile overlay controls.
- `isPanelOpen` - mobile information panel.
- `scrollY` - desktop thumbnail grid offset.

Embla settings:

```typescript
{
  loop: false,
  align: 'center',
  containScroll: false,
  dragFree: false
}
```

Near navigation scrolls smoothly; distant thumbnail jumps are hard jumps.

## Local Admin API Routes

| Route | File | Current behavior |
| --- | --- | --- |
| `/api/admin/files` | `src/app/api/admin/files/route.ts` | Create/list local album source folders, upload source images, delete source/generated images. |
| `/api/admin/process` | `src/app/api/admin/process/route.ts` | Runs `scripts/process_photos.py` locally. |
| `/api/admin/save` | `src/app/api/admin/save/route.ts` | Writes `public/albums.json` or allowed files under `public/content`. |
| `/api/admin/about` | `src/app/api/admin/about/route.ts` | Reads/writes `public/content/about.md`. |

These routes should not be documented as production-safe endpoints unless a real backend and authentication layer are added.

## Build Configuration

`next.config.ts` currently sets:

- `output: undefined` in development.
- `output: 'export'` outside development.
- `distDir: 'dist'`.
- `images.unoptimized: true`.
- `trailingSlash: true`.

Because static export is active in production, avoid adding server-only runtime behavior to public-facing routes unless deployment architecture changes.
