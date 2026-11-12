# Astro ClientRouter transitions

`BaseLayout.astro` includes `<ClientRouter />`. It intercepts internal navigation and swaps page content in the same document. Standard full navigation remains available without JavaScript or with `data-astro-reload` on a link.

BaseLayout accepts `pageTransition="fade" | "slide" | "none"`. The home page uses a short fade and `/next` demonstrates a slide. The animation directive is on the root `<html>` element so Astro animates viewport snapshots. Do not name the full-height `<main>` as a shared transition element: its scrolled bounding box can animate back toward the top even though native scrolling already reset instantly. The viewport transition includes the header and footer. Reduced motion disables decorative transition animation.

Custom transitions can use named shared elements, persistent media, route-specific animation pairs and preparation/swap hooks. Implement asynchronous GSAP leave/enter sequences through these lifecycle hooks. See the [README examples](../README.md#page-transitions) for configuration and assistant prompts.

## Runtime contract

- The shared processed script is `src/scripts/site.ts`. Module scripts execute once per document, so it installs stable document-level lifecycle listeners.
- `src/scripts/reveals.ts` scans only `[data-reveal]`; no effect is enabled by an `h1` or other semantic tag. It disposes outgoing contexts before the swap and binds incoming targets after the swap/page load. DOM insertion/removal and Studio morphs are supported too.
- Component-owned controls use custom elements. `defineBehaviour` disposes scopes on `astro:before-swap`, disconnect and pagehide; incoming elements initialize on connection, with `astro:page-load` filling any unmounted scope. No double mounting of an already active scope.
- SiteRuntime releases the outgoing Lenis owner before replacement, then initializes one owner for the new page. Page-load refresh updates geometry without forcing scroll to the top; ClientRouter owns history/anchor restoration.
- Layout's SiteRuntime is not persisted across swaps. Persisting a custom component requires an explicit state/cleanup review rather than assuming disconnect will run.

Browser tests exercise same-document navigation, repeated home/next round trips, observer counts, controls after navigation, anchors/history, reduced motion and no-JavaScript fallback. Actual installed Studio acceptance remains a separate check.

Source: [Astro view transitions and lifecycle](https://docs.astro.build/en/guides/view-transitions/).
