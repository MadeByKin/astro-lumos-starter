# Astro ClientRouter transitions

`BaseLayout.astro` includes `<ClientRouter />`. It intercepts internal navigation and swaps page content in the same document. Standard full navigation remains available without JavaScript or with `data-astro-reload` on a link.

BaseLayout accepts `pageTransition="fade" | "slide" | "none"`. The home page uses a short fade and `/next` demonstrates a slide. The animation directive is on the root `<html>` element so Astro animates viewport snapshots. Do not name the full-height `<main>` as a shared transition element: its scrolled bounding box can animate back toward the top even though native scrolling already reset instantly. The viewport transition includes the header and footer. Reduced motion disables decorative transition animation.

Custom transitions can use named shared elements, persistent media, route-specific animation pairs and preparation/swap hooks. Implement asynchronous GSAP leave/enter sequences through these lifecycle hooks.

## Change the site-wide default

In `src/layouts/BaseLayout.astro`, change the destructured prop default:

```ts
const {
  theme = "inherit",
  overlap = false,
  pageTransition = "slide", // "fade", "slide" or "none"
  ...seo
} = Astro.props;
```

Pages that omit `pageTransition` inherit this default. Existing explicit overrides remain in effect; remove them if every page should follow the default. The starter currently uses a 0.2s fade and a 0.4s slide; change the `fade({ duration: "0.2s" })` or `slide({ duration: "0.4s" })` options in the same layout to adjust their timing.

## Override an individual page

Set the prop on that route’s layout in `src/pages/*.astro`:

```astro
---
import Layout from "@/layouts/BaseLayout.astro";
---

<Layout title="About" pageTransition="slide">
  <!-- Compose this page’s sections here. -->
</Layout>
```

Use `pageTransition="fade"` for a crossfade or `pageTransition="none"` to disable that page’s viewport animation. Omit the prop to return to the site-wide default. `none` keeps ClientRouter navigation enabled; it is not a full browser reload. For a transition with no animation on either snapshot, both the outgoing and incoming pages must use `none`.

Keep page transitions on the root viewport (`transition:name="root"`) so navigation from a scrolled position stays stable. Reduced motion disables decorative animations.

## Example prompts for Codex and Claude Code

Use these in the project checkout. In Claude Code, replace `Use $astro-lumos-interaction` with `/astro-lumos-interaction`.

**Change the default transition:**

```text
Use $astro-lumos-interaction to change this site's default page transition
from fade to slide. Keep existing page overrides.
```

To apply one effect everywhere, replace “Keep existing page overrides” with “Make every page use the new default.”

**Create a custom transition for one page:**

```text
Use $astro-lumos-interaction to create a custom transition for /about:
a short fade with a subtle upward entrance lasting 0.35s. Keep the
current default on all other pages.
```

Replace `/about` and the motion description as needed. Custom transition values require an implementation in the layout; the built-in values are `fade`, `slide` and `none`.

## Runtime contract

- The shared processed script is `src/scripts/site.ts`. Module scripts execute once per document, so it installs stable document-level lifecycle listeners.
- `src/scripts/reveals.ts` scans only `[data-reveal]`; no effect is enabled by an `h1` or other semantic tag. It disposes outgoing contexts before the swap and binds incoming targets after the swap/page load. DOM insertion/removal and Studio morphs are supported too.
- Component-owned controls use custom elements. `defineBehaviour` disposes scopes on `astro:before-swap`, disconnect and pagehide; incoming elements initialize on connection, with `astro:page-load` filling any unmounted scope. No double mounting of an already active scope.
- SiteRuntime releases the outgoing Lenis owner before replacement, then initializes one owner for the new page. Page-load refresh updates geometry without forcing scroll to the top; ClientRouter owns history/anchor restoration.
- Layout's SiteRuntime is not persisted across swaps. Persisting a custom component requires an explicit state/cleanup review rather than assuming disconnect will run.

Browser tests exercise same-document navigation, repeated home/next round trips, observer counts, controls after navigation, anchors/history, reduced motion and no-JavaScript fallback. Actual installed Studio acceptance remains a separate check.

Source: [Astro view transitions and lifecycle](https://docs.astro.build/en/guides/view-transitions/).
