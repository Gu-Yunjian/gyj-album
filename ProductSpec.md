# GU-Album Product Specification

> Product-level description of the current site. Future ideas are listed separately and are not shipped behavior.

## Positioning

GU-Album is a minimal personal photography portfolio for GU-PROJECTS. The site should feel like a quiet online exhibition: fast, restrained, photo-first, and easy to browse on desktop and mobile.

## Current Audience

- Visitors browsing photography work.
- Friends, collaborators, or potential clients reviewing albums.
- The site owner maintaining a lightweight personal portfolio.

## Current Information Architecture

```text
GU-PROJECTS
├── /                 Welcome and exploration entry
├── /gallery          All-photo gallery
├── /collections      Album list
├── /album/[name]     Single album viewer
├── /about            Profile and social links
└── /admin            Local development content tool
```

## Current Features

| Feature | Status | Notes |
| --- | --- | --- |
| Welcome/explore page | Shipped | Random scattered photo preview plus navigation buttons. |
| All-photo gallery | Shipped | Aggregates all album photos; supports lightbox browsing. |
| Album collections | Shipped | Album cards read from `public/albums.json`. |
| Single album viewer | Shipped | Carousel, thumbnails, EXIF, photo title/description, dark mode. |
| About page | Shipped | Markdown content and JSON-configured social buttons. |
| Local content admin | Shipped as local tool | Edits local files in development; not production CMS. |
| EXIF display | Shipped | Shows primary fields such as aperture, shutter speed, ISO. |
| BGM controls | Partially represented | UI state exists when `hasBgm` is true, but there is no confirmed production audio pipeline in current docs. Treat as future/experimental unless code is completed. |

## Page Behavior

### `/`

Purpose: give visitors a low-friction entry point.

Current behavior:

- Shows `WELCOME!` and a short welcome line.
- Provides buttons to `/gallery` and `/collections`.
- Displays a random scattered selection of photos from all album data.
- Provides a refresh button to reshuffle the scattered layout.

It is not the all-photo grid. The all-photo grid belongs to `/gallery`.

### `/gallery`

Purpose: browse the full body of photos without choosing an album first.

Current behavior:

- Reads all photos from `public/albums.json`.
- Uses a daily seeded shuffle.
- Renders a grid through `OverviewGrid`.
- Opens `Lightbox` on photo click.
- Uses medium images for grid display and main images in the lightbox.

### `/collections`

Purpose: choose a thematic album.

Current behavior:

- Shows all albums from `albums[]`.
- Uses each album's `cover` filename for the card image.
- Links to `/album/[name]`.

### `/album/[name]`

Purpose: focused album viewing.

Current behavior:

- Static params are generated from album names.
- URL names are decoded before album lookup.
- Main photo area uses Embla carousel.
- Desktop layout shows a side information panel.
- Mobile layout uses overlay controls and a bottom information panel.
- Supports dark mode on the album page.
- Does not use gallery lightbox as the primary album interaction.

### `/about`

Purpose: profile information and outbound links.

Current behavior:

- Reads `public/content/about.md`.
- Parses frontmatter for name, school, and slogan.
- Reads `public/content/social.json`.

### `/admin`

Purpose: local content maintenance.

Current behavior:

- Uses a simple hard-coded local password.
- Edits album metadata, photo titles/descriptions, about content, and social links.
- Can upload source images locally and run the processing script.

Product boundary:

- This is not a secure online admin console.
- This does not provide production content editing after static deployment.

## Content Model

The active content model is `public/albums.json`. It contains album records and a flat `allPhotos` map. The old per-album `info.txt` model is not current.

Photo source files live in `originals/` and are processed into generated WebP assets before deployment.

## Non-Goals For Current Architecture

- No database.
- No user accounts.
- No visitor uploads.
- No production CMS.
- No comments or public interaction features.
- No server-side runtime dependency after static export.

## Future Ideas

These are not part of the current implementation unless promoted into a task:

| Idea | Notes |
| --- | --- |
| Search | Search by photo title, description, album, or EXIF. |
| Tags | Add a tag field to metadata and filter views. |
| Photo sorting UI | Drag-and-drop order editing in local admin. |
| Production CMS | Requires real backend/auth/storage; not compatible with current static-only assumption by itself. |
| Audio/BGM | Needs an explicit asset pipeline and playback implementation. |
| Public comments | Requires backend, moderation, and data persistence. |
