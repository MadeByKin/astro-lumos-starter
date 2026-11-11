# Astro structure and shared animations

An `.astro` file can contain frontmatter (`---`) for build/server code, an HTML template, a browser `<script>` and styles. This starter generates static HTML; browser behavior is added explicitly. Astro processes and deduplicates ordinary script tags, so a shared script does not need repeating in every heading component.

## Project preference: explicit attributes and one shared implementation

Reusable sitewide animations live in `src/scripts/`, loaded once through `src/scripts/site.ts` and SiteRuntime. Opt in with a data attribute on the actual element:

```astro
<Heading
  tag="h1"
  variant="display"
  data-reveal="up"
  data-reveal-distance="1.5"
  data-reveal-duration="0.7"
>
  A considered starting point.
</Heading>
```

Distance and duration attributes are optional; the defaults are 1.5rem and 0.7 seconds. `data-reveal="off"` disables an individual effect. An unmarked heading, paragraph or card remains static. This hook works on semantic HTML or a Lumos component that forwards attributes; it does not depend on a heading tag or styling class.

## Trace the animation

1. The page and HeroIntro/PrincipleCard content components render `data-reveal="up"` on the title and selected cards/headings. No Reveal wrapper is required.
2. SiteRuntime imports the shared `src/scripts/site.ts` entry point.
3. That calls `installReveals` from `src/scripts/reveals.ts` once per document.
4. The scanner selects only `[data-reveal]`, creates an instance Scope and a GSAP context for each marked element, and observes the motion policy.
5. ScrollTrigger starts a vertical whole-block movement when the target's top reaches 92% of the viewport height. Content is visible before scripts load.
6. Contexts are reverted when their attributes change, the element is removed, motion is disabled, or the router swaps pages. Incoming/newly inserted elements receive fresh setup. `once: true` means once per mounted animation instance.

The shared script observes only relevant attributes and structural DOM changes, and coalesces scans into one animation frame. It also handles Studio's content-update event. It never selects all `h1` or applies an effect to unmarked elements.

Component-specific controls, such as a dialog or slider, can keep their own scripts because their behavior belongs to that component. Reusable heading/scroll effects follow the global, attribute-driven rule above. Per-character or line splitting remains a separate optional effect.

## Routing

Astro ClientRouter is enabled in BaseLayout. It allows same-document transitions and project-specific shared/persistent elements without requiring React. Layout has an explicit fade/slide/none transition option; the second demo page uses slide. See docs/navigation.md for lifecycle and tradeoffs.

Sources: [Astro browser scripts](https://docs.astro.build/en/guides/client-side-scripts/), [ClientRouter](https://docs.astro.build/en/guides/view-transitions/).

## Page composition

`src/pages/index.astro` directly composes its Sections, ContentWrappers and Grid. HeroIntro owns a small styled content block; PrincipleCard owns a card's markup/styles. Neither hides the whole page or carries a duplicate behavior script. The page uses the existing Modal component; its controller is shared in src/scripts/overlays.ts.
