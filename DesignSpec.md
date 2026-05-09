# GU-Album Design Specification

> Visual and interaction rules for the current site. Product facts live in `PROJECT_GUIDE.md`; implementation facts live in `TechSpec.md`.

## Design Direction

The site should feel like a restrained personal photography exhibition:

- Photos are the primary visual signal.
- UI controls should be quiet, predictable, and easy to scan.
- Avoid decorative clutter, marketing-heavy sections, and loud color systems.
- Maintain strong mobile usability without turning the experience into a generic app shell.

## Global Visual System

### Color

Default pages use a light, minimal palette:

```css
--bg-primary: #ffffff;
--text-primary: #000000;
--text-secondary: rgba(0, 0, 0, 0.55);
--border: rgba(0, 0, 0, 0.1);
```

Album dark mode is local to the album viewer:

```css
--bg-primary: #1a1a1a;
--text-primary: #e5e5e5;
--text-secondary: #999999;
--border: #3a3a3a;
```

In album dark mode, the primary photo display area should remain pure black or near-black so the image carries the view.

### Typography

Use the project fonts from `src/app/layout.tsx`:

- Inter for Latin text.
- Noto Sans SC for Chinese text.
- System sans-serif fallbacks.

Guidelines:

- Keep navigation and metadata small.
- Use larger type only where the page needs a real title or welcome signal.
- Do not use oversized marketing hero typography on operational pages such as `/collections` or `/album/[name]`.
- Avoid negative letter spacing.

### Spacing

Use generous but practical spacing:

- Desktop page margins: around 48px where layout allows.
- Tablet margins: around 24px.
- Mobile margins: around 16px.
- Keep album viewer controls compact so photos remain dominant.

## Page-Level Design

### `/`

Current role: welcome/explore entry.

Design intent:

- Left side introduces the site with short copy and two clear actions.
- Right side shows scattered photos from the current collection.
- The refresh control should feel like a lightweight interaction, not a major callout.
- This page should invite entry; it should not duplicate the complete gallery grid.

### `/gallery`

Current role: all-photo browsing.

Design intent:

- Dense but calm photo grid.
- Use medium images for useful preview quality.
- Clicking a photo opens the lightbox.
- Hover labels should be subtle and only appear when useful metadata exists.

### `/collections`

Current role: album selection.

Design intent:

- Album cards should emphasize cover imagery.
- Titles/subtitles should be readable without competing with the image.
- The page should feel like a portfolio index, not a marketing landing page.

### `/album/[name]`

Current role: immersive single-album viewing.

Desktop intent:

- Large photo area plus a compact right-side information panel.
- Controls appear quietly and do not distract from the current image.
- Thumbnail grid supports fast navigation.

Mobile intent:

- Photo remains the primary surface.
- Controls are available on tap.
- Bottom panel carries photo details and thumbnails.
- Top album information can appear with the mobile panel when needed.

### `/about`

Current role: profile content.

Design intent:

- Markdown content should remain readable and quiet.
- Social buttons should be clear links, not dominant promotional blocks.

### `/admin`

Current role: local content tool.

Design intent:

- Utility matters more than portfolio polish.
- It can be denser and more form-heavy than the public site.
- Do not use `/admin` styling as precedent for public pages.

## Components

### Navigation

The navigation should expose the main public routes:

- Brand link to `/`.
- `画廊` -> `/gallery`.
- `影集` -> `/collections`.
- `关于` -> `/about`.

It should stay visually light, with small text and unobtrusive hover states.

### Lightbox

Used by `/gallery`.

- Full-screen overlay.
- Dark background.
- Clear close and previous/next controls.
- Keyboard support is expected where implemented.

### Album Viewer

Used by `/album/[name]`.

- Carousel is the central interaction.
- Do not add a second lightbox interaction unless product direction changes.
- EXIF display should stay compact: aperture, shutter speed, ISO.
- Camera/date fields can exist in metadata but should not be forced into the main UI without a design reason.

### Thumbnails

Generated thumbnail-purpose files are larger than their rendered UI size. The design controls the displayed dimensions; the image pipeline controls source-file dimensions.

Desktop album thumbnails should remain compact and grid-like. Mobile thumbnails should support horizontal scanning.

## Motion

Motion should support orientation, not decoration.

- Hover and control fades: short and calm.
- Panel movement: smooth but not slow.
- Photo transitions: carousel movement should feel direct.
- Avoid adding decorative animations to static portfolio pages.

## Accessibility Baseline

- Interactive controls need accessible names.
- Text should meet reasonable contrast against its background.
- Controls should be reachable and understandable on mobile.
- Avoid relying on hover-only information for essential navigation.

## Change Review Checklist

Before accepting a visual change:

- Does the page still make photos the primary visual focus?
- Does mobile still provide the same core task as desktop?
- Does the change respect the current route roles in `PROJECT_GUIDE.md`?
- Does the UI avoid adding decorative visual noise?
- Are generated image sizes and rendered UI sizes described accurately?
