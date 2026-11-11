# Comparison with Federico Valla's Webflow development setup

Reviewed 11 November 2026 against public commit `0ff2c52f0922b652072d97b0e5d297ea3a37484a` in [webflow-dev-setup](https://github.com/vallafederico/webflow-dev-setup). This is a capability comparison, not a claim of drop-in feature parity. More files do not necessarily mean more useful site behavior: many bridge a Webflow-hosted HTML document to a separately served JS/CSS bundle or repeat instructions for different coding agents.

| Federico's capability                                                                          | Astro Lumos equivalent / decision                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bun build scripts, manifest, CSS splitting and live reload                                     | Astro/Vite provide project compilation, asset bundling and development updates. No separate Webflow loader is required.                                                                                                                                                       |
| Webflow localhost/deployed fallback, branch override URLs, mobile loader fixes and SSL scripts | Those solve cross-origin external-script loading into Webflow. This project serves its own site and assets together; use Astro local preview and the chosen host's previews.                                                                                                  |
| `data-module` discovery and mount/destroy hooks                                                | Component-local scripts register custom elements with `defineBehaviour`; each instance owns an abortable Scope. Shared reusable effects use one explicit data-attribute scanner; no Webflow module loader is needed.                                                          |
| Webflow Editor detection and IX reset                                                          | Isolated Stacki adapter and motion policy. Webflow runtime resets would be inappropriate here. Actual installed Studio UI still needs testing.                                                                                                                                |
| Lenis and scroll subscribers                                                                   | One Lenis owner and shared GSAP clock, native touch/anchors, tokenized locks, ScrollTrigger for scroll progress and scrubbed effects.                                                                                                                                         |
| Priority RAF and resize subscriptions                                                          | Added `onMotionFrame(scope, callback)` on GSAP's existing clock, plus `observeViewport(scope, callback)` sharing one frame-coalesced resize listener. No arbitrary priority system unless a real ordering dependency arises.                                                  |
| `onView` viewport helpers                                                                      | `scope.observe(new IntersectionObserver(...))` for visibility and GSAP ScrollTrigger for animation starts. See recipes below.                                                                                                                                                 |
| `onTrack` progress mapping                                                                     | ScrollTrigger `onUpdate(self)` / `self.progress`, `scrub` and `gsap.utils.mapRange`. A second scroll geometry engine is unnecessary for the current starter.                                                                                                                  |
| Taxi page-in/page-out hooks                                                                    | Astro ClientRouter is enabled with fade/slide examples and lifecycle cleanup. More elaborate asynchronous leave/enter sequences are project-specific work.                                                                                                                    |
| SplitText module                                                                               | Optional effect; not enabled globally. Our Reveal moves the whole block. For a project needing character/line splits, use a dedicated component with font/resize handling, accessible text and context/SplitText revert on cleanup.                                           |
| Tick metrics panel and timing markers                                                          | Added a small **development-only** Shift+F panel for GSAP-clock FPS, viewport, motion, Lenis and locks. It sends no telemetry and is not a Lighthouse score or a full replacement for Tick. Use browser performance tools or a deliberate Web Vitals integration when needed. |
| Form/nav/example modules                                                                       | Lumos already supplies nav, modal, dropdown, tabs, slider, marquee and form controls. We adapted lifecycle cleanup; form endpoints remain project-specific.                                                                                                                   |
| API routes, CORS helpers and Vercel tooling                                                    | Not copied. Static Cloudflare deployment is the current scope; add backend endpoints, validation, CORS and secrets only when an actual feature needs them.                                                                                                                    |
| Multiple agent skills and `.cursor` rule copies                                                | Preserved Lumos's original skills plus Astro interaction, release and maintenance guidance. The installed `astro-lumos-starter` skill creates projects; no Webflow-only skills are needed.                                                                                    |
| Mouse/math/graphics utilities and test modules                                                 | Adopt project-specific utilities when used. The reviewed mouse helper is commented out; it is not a missing active runtime service.                                                                                                                                           |

## Scoped recipes

```ts
import { onMotionFrame, observeViewport } from "@/lib/motion/subscriptions";

// Inside defineBehaviour: automatic disposal and live motion policy.
onMotionFrame(scope, ({ time, delta }) => {
  // time and delta are seconds. Use for a real continuous effect only.
});
observeViewport(scope, ({ width, height }) => {
  // One immediate call, then coalesced viewport size changes.
});

// Basic visibility without an animation library abstraction.
const observer = scope.observe(
  new IntersectionObserver(([entry]) => {
    element.classList.toggle("in-view", entry.isIntersecting);
  }),
);
observer.observe(element);

// In a scoped GSAP context, when observeMotion allows motion:
gsap.to(visual, {
  xPercent: 20,
  scrollTrigger: {
    trigger: element,
    start: "top bottom",
    end: "bottom top",
    scrub: true,
    onUpdate: (self) =>
      element.style.setProperty("--progress", String(self.progress)),
  },
});
// Also restore any manually written --progress property on disposal.
```

Do not add permanent frame subscriptions for simple one-shot reveals. A component-specific text effect, cursor, canvas or WebGL scene can be added when a project calls for it. This comparison preserves the useful lifecycle principles without importing Webflow-specific runtime machinery.

Inspected sources: [README](https://github.com/vallafederico/webflow-dev-setup/blob/0ff2c52f0922b652072d97b0e5d297ea3a37484a/README.md), [subscriptions](https://github.com/vallafederico/webflow-dev-setup/blob/0ff2c52f0922b652072d97b0e5d297ea3a37484a/src/lib/subs.ts), [scroll](https://github.com/vallafederico/webflow-dev-setup/blob/0ff2c52f0922b652072d97b0e5d297ea3a37484a/src/lib/scroll.ts), [lifecycle](https://github.com/vallafederico/webflow-dev-setup/blob/0ff2c52f0922b652072d97b0e5d297ea3a37484a/docs/component-lifecycle.md), [SplitText example](https://github.com/vallafederico/webflow-dev-setup/blob/0ff2c52f0922b652072d97b0e5d297ea3a37484a/src/modules/split.ts), [Tick](https://github.com/vallafederico/webflow-dev-setup/blob/0ff2c52f0922b652072d97b0e5d297ea3a37484a/src/utils/tick.ts).
