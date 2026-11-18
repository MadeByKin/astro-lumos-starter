# HLS video

`HlsBackground` and `HlsPlayer` play HLS playlists from Cloudflare Stream, Bunny Stream or another HLS host. Both use custom controls styled with Lumos tokens. See [provenance](provenance.md) for the original Osmo resources.

## Setup

Upload your MP4 or MOV to your streaming provider and wait for encoding. Copy the HLS manifest URL into the component's `src` prop or the corresponding field in your site editor.

```text
Cloudflare Stream: https://customer-CODE.cloudflarestream.com/VIDEO-ID/manifest/video.m3u8
Bunny Stream:      https://YOUR-PULL-ZONE.b-cdn.net/VIDEO-ID/playlist.m3u8
```

Use the playlist URL ending in `.m3u8` for `src`. The provider handles source file encoding. Configure allowed origins for production, preview and local development as needed. Playlists, segments and any encryption keys must permit cross-origin browser requests. For private videos, use the provider's playback-token flow for the playlist and its dependent requests. Keep API credentials server-side.

## Foreground player

```astro
---
import HlsPlayer from "@/components/media/HlsPlayer.astro";
---

<HlsPlayer
  src="https://customer-CODE.cloudflarestream.com/VIDEO-ID/manifest/video.m3u8"
  poster="/images/film-poster.webp"
  label="Our studio film"
  variant="16-9"
/>
```

Playback starts on interaction, with audio enabled. Controls include play/pause, current time and duration, buffered progress, seeking, mute and fullscreen. Controls remain visible while focused or paused. Seeking supports pointer/touch and the native range keyboard controls (arrows, Home, End). Fullscreen uses the container when supported and native video fullscreen on iOS when available. Captions can be supplied as standard `<track slot="tracks" ... />` elements; this version has no custom caption selection menu.

`variant` accepts these ratio presets: `2-1`, `16-9` (default), `3-2`, `5-4`, `1-1`, `4-5`, `2-3`. Use `variant="custom" ratio="21 / 9"`, `variant="auto"` to adopt the source ratio after metadata loads (initially 16:9), or `variant="cover"` inside a positioned parent with an explicit size. Ratio changes with `auto` can shift layout; use a known ratio where possible. The poster and foreground video fill the selected ratio using `object-fit: cover`, cropping when their proportions differ. Fullscreen uses contain fitting to show the whole video.

## Background video

```astro
---
import HlsBackground from "@/components/media/HlsBackground.astro";
---

<div class="position-relative width-full ratio-16-9 radius-main">
  <HlsBackground
    src="https://YOUR-PULL-ZONE.b-cdn.net/VIDEO-ID/playlist.m3u8"
    poster="/images/background-poster.webp"
    label="Studio background film"
  />
</div>
```

The background fills its positioned parent, inherits its corner radius and crops with `object-fit: cover`. Give the parent a height or aspect ratio. It loops muted and includes a pause/play button by default. Set `controls={false}` on `HlsBackground` to omit that button for an individual instance. With controls hidden, reduced motion or blocked autoplay leaves the poster visible; `autoplay={false}` also leaves it static. Keep decorative video out of the accessibility tree; the wrapper and button remain labelled. Position overlaid content so it does not cover the pause button at the bottom inline-end corner.

## Props and loading

Both components accept `render`, `src`, `poster`, `label`, `autoplay`, `lazy`, utility `class` and wrapper HTML attributes. `render={false}` or a missing source emits nothing. A poster is recommended for initial loading, reduced motion and no-JavaScript rendering.

- `HlsPlayer`: `autoplay={false}`, `muted={false}`, `lazy="meta"` by default. `lazy="meta"` requests playlists for duration/ratio but no video segments. `lazy={true}` waits for play; `lazy={false}` attaches immediately and may buffer segments.
- `HlsBackground`: `autoplay={true}`, `lazy={true}` by default. Lazy autoplay attaches when visible and motion is allowed; `lazy={false}` permits eager attachment when motion is allowed. `autoplay={false}` waits for manual play unless eager loading was requested. Backgrounds are always muted and looping.
- Opting into foreground autoplay also enables muted looping playback. Autoplay observes viewport visibility, reduced motion, `data-motion="off"`, hidden tabs and trusted editor design mode. User pauses survive viewport changes. Explicit playback remains available under reduced motion; a later policy change pauses decorative playback.
- Hidden tabs and editor design mode pause manually started foreground videos; they require an explicit restart. These do not resume just because the tab becomes visible.

Native HLS is preferred where supported. Other supported browsers load the locked npm `hls.js` dependency on demand; pages without these components do not download that library. Each instance owns and releases its media, requests, observers, handlers and timers across navigation and editor remounts.

Blocked autoplay leaves a play control available when controls are enabled. Fatal loading/playback failures show Retry; metadata-only failures do not prevent a later playback attempt. Without JavaScript, the poster and an Open video link remain available; opening an HLS URL depends on the browser's native support.

The component showcase uses external demonstration assets supplied with the Osmo resources. Replace those URLs before publishing a client project.

When migrating an existing project, replace `BunnyPlayer` and `BunnyBackground` imports and tags with `HlsPlayer` and `HlsBackground`. The props and existing playlist URLs carry over. If your own code targets the old `bunny-*` classes, custom elements or `data-bunny-*` attributes, update those prefixes to `hls-*` and `data-hls-*`.

## Validation

`npm run test:hls-browser` runs against a production preview (`BASE_URL`, default `http://127.0.0.1:4323`). It intercepts the sample URLs with a local deterministic H.264/AAC HLS fixture, so automated playback does not depend on an live streaming account. `PLAYWRIGHT_CHANNEL=chrome` selects installed Chrome. `PLAYWRIGHT_BROWSER=webkit` selects installed Playwright WebKit; desktop WebKit is not a substitute for testing a physical iPhone.

The fixture is eight seconds of FFmpeg-generated test pattern and sine tone, split into two-second segments. It is test-only and not copied into the built site. Live Bunny access and installed Stacki UI checks remain separate from deterministic playback and simulated editor tests.

### Playback verification from 15 November 2026

- `npm run check`: 0 errors, warnings or hints. `npm test`: all 12 tests pass, including generated-project inheritance of the video components, docs and the locked HLS dependency.
- Production build passes. Vite reports a size warning for the full HLS.js chunk; that chunk is dynamically loaded only when non-native HLS playback is attached, and is not downloaded on the homepage.
- The existing shared-runtime browser suite passes in installed Chrome. Bunny-specific tests pass in installed Chrome and Playwright WebKit, including metadata-only/master-playlist loading, lazy/eager loading, actual fixture playback, keyboard/pointer seeking, fullscreen, simulated hidden-tab/editor policy, reduced motion, blocked-play recovery, manual-pause preservation, independent instances, removal/remount, ClientRouter cleanup, retry, responsive layout and no-JavaScript fallback.
- The supplied live Bunny stream plays in Chrome. Desktop, mobile and background screenshots were reviewed under `output/playwright/`.
- Physical iPhone fullscreen and the installed Stacki editor UI were not tested. WebKit playback and simulated editor signals do not establish those integrations.
