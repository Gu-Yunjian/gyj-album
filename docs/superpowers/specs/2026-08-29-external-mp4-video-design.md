# External MP4 Video Support Design

## Goal

Extend the existing video portfolio so it can display externally hosted MP4 files from Tencent COS while preserving the existing Bilibili videos and keeping the public site static.

## Design

`public/content/videos.json` remains the single ordered source of video entries. Each normalized entry has a `provider` of either `bilibili` or `mp4`. Existing entries without a provider continue to be recognized as Bilibili URLs; valid HTTPS URLs ending in `.mp4` are recognized as external MP4 entries.

`VideoCard` renders the Bilibili iframe for Bilibili entries and a native `<video controls preload="metadata" playsInline>` element for MP4 entries. The external link remains available for both providers, with provider-specific link text.

The local admin video manager gets a provider selector. Bilibili entries keep the current canonicalization and `b23.tv` resolution flow. MP4 entries accept only HTTPS URLs ending in `.mp4`; no upload, proxy, token generation, or account access is added. Saving normalizes all entries before writing the local JSON file.

The two supplied COS URLs are added as new entries titled “环境学院” and “软件学院”; current Bilibili entries remain unchanged.

## Error handling and validation

- Invalid or empty titles are rejected as before.
- Invalid Bilibili URLs are rejected by the existing parser.
- External entries reject non-HTTP(S) URLs and URLs whose path does not end in `.mp4`.
- Existing malformed entries are skipped during normalization.
- The MP4 player uses browser-native controls and metadata-only preload to avoid downloading every video immediately.

## Testing

Extend the existing Node test suite to cover MP4 normalization, provider-specific player markup, and provider selection in the admin manager. Run the full test suite, lint, and production build after implementation.
