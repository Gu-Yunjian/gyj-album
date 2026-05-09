# GU-Album Code And Documentation Conventions

## Documentation Rules

- `PROJECT_GUIDE.md` is the primary reference for current behavior.
- Do not describe planned or historical behavior as shipped behavior.
- When documenting content data, use `public/albums.json`.
- Do not reintroduce `photos.json`, per-album `info.txt`, or `public/home-photos` unless the code is intentionally changed.
- When mentioning `/admin`, call it a local development content tool, not a production CMS.
- Keep deployment instructions in `DEPLOY.md`; keep product behavior in `ProductSpec.md`; keep implementation details in `TechSpec.md`.

## Project Structure

```text
src/
├── app/                    # Next.js App Router pages and route handlers
├── components/             # React components grouped by feature
│   ├── about/
│   ├── album/
│   ├── explore/
│   ├── gallery/
│   ├── layout/
│   └── ui/
└── lib/                    # Shared data helpers and utilities

public/
├── albums.json             # Active metadata
├── content/                # About and social content
├── photos/                 # Main generated images
├── medium/                 # Medium generated images
└── thumbnails/             # Thumbnail-purpose generated images

scripts/
└── process_photos.py       # Local image pipeline
```

## Naming

- React components: PascalCase, for example `AlbumView.tsx`.
- CSS Modules: pair with the component or route, for example `AlbumView.module.css`.
- Utilities: camelCase or concise domain names, for example `photos.ts`.
- CSS class names in modules: camelCase and semantic names, for example `carouselSlide`.
- Route files follow Next.js App Router conventions.

## React And TypeScript

- Prefer existing local types from `src/lib/photos.ts` for photo and album data.
- Keep props interfaces near the component using them.
- Avoid `any`; use explicit types or `unknown` with narrowing.
- Keep client components focused on interaction state.
- Keep server components responsible for loading static content and passing serializable props.

## Styling

- Use CSS Modules for component-specific styles.
- Use global CSS only for resets, fonts, tokens, and truly shared primitives.
- Preserve the restrained photo-first visual system from `DesignSpec.md`.
- Do not add broad visual frameworks or new styling systems without a clear product reason.

## Image Handling

- Use paths derived from `public/albums.json`.
- Use `public/medium` for gallery/explore preview quality.
- Use `public/photos` for main viewing.
- Use `public/thumbnails` for album thumbnail controls.
- Remember that thumbnail-purpose files can be larger than their rendered UI size.

## Local Admin And APIs

- Route handlers under `src/app/api/admin/*` are local development helpers.
- Do not add production promises to these routes without changing deployment architecture.
- If a feature needs persistent online writes, document and implement a real backend/auth/storage plan first.

## Git And Generated Content

- `originals/` is source material and should stay out of git.
- Generated deployable assets under `public/` may need to be committed.
- Before committing content updates, check that `public/albums.json` and generated image folders are in sync.

## Review Checklist

Before finishing a change:

- Does the behavior still match `PROJECT_GUIDE.md`?
- If not, did you intentionally update both code and docs?
- Does `npm run lint` pass for code changes?
- Does `npm run build` pass for route/build changes?
- For content changes, did `scripts/process_photos.py` produce the expected assets?
