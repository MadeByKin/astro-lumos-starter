# Astro ClientRouter transitions

The starter now enables `<ClientRouter />` in BaseLayout at the user's request. It intercepts internal navigation and swaps page content in the same document. React is not required. Standard full navigation remains available without JavaScript or with `data-astro-reload` on a link.

BaseLayout accepts `pageTransition="fade" | "slide" | "none"`. The home page uses a short fade and `/next` demonstrates a slide. The explicit main-content transition directives generate Astro's transition attributes. Reduced motion disables decorative transition animation. Do not add Taxi or another router alongside ClientRouter.

This supports more elaborate project-specific transitions: named shared elements, persistent media/state, route-specific animation pairs and lifecycle hooks. An asynchronous GSAP leave/enter sequence still needs a deliberate implementation using Astro's supported preparation/swap lifecycle; adding ClientRouter alone does not choreograph one automatically.

## Runtime contract

- The shared processed script is `src/scripts/site.ts`. Module scripts execute once per document, so it installs stable document-level lifecycle listeners.
- `src/scripts/reveals.ts` scans only `[data-reveal]`; no effect is enabled by an `h1` or other semantic tag. It disposes outgoing contexts before the swap and binds incoming targets after the swap/page load. DOM insertion/removal and Studio morphs are supported too.
- Component-owned controls use custom elements. `defineBehaviour` disposes scopes on `astro:before-swap`, disconnect and pagehide; incoming elements initialize on connection, with `astro:page-load` filling any unmounted scope. No double mounting of an already active scope.
- SiteRuntime releases the outgoing Lenis owner before replacement, then initializes one owner for the new page. Page-load refresh updates geometry without forcing scroll to the top; ClientRouter owns history/anchor restoration.
- Layout's SiteRuntime is not persisted across swaps. Persisting a custom component requires an explicit state/cleanup review rather than assuming disconnect will run.

Browser tests exercise same-document navigation, repeated home/next round trips, observer counts, controls after navigation, anchors/history, reduced motion and no-JavaScript fallback. Actual installed Studio acceptance remains a separate check.

Source: [Astro view transitions and lifecycle](https://docs.astro.build/en/guides/view-transitions/).
