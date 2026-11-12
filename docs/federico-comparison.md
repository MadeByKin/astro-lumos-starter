# Webflow setup comparison and motion recipes

Reference: Federico Valla’s [Webflow development setup](https://github.com/vallafederico/webflow-dev-setup), reviewed on 11 November 2026 at commit `0ff2c52f0922b652072d97b0e5d297ea3a37484a`. This maps useful development patterns to the Astro starter.

| Pattern                              | Astro Lumos approach                                                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Build, assets and live reload        | Astro/Vite bundle the project and serve its assets.                                                                               |
| Component discovery and cleanup      | Custom elements use `defineBehaviour` and an instance-owned `Scope`. Shared effects scan explicit data attributes.                |
| Smooth scrolling and animation clock | One Lenis owner and shared GSAP ticker, with native touch/anchors and tokenized scroll locks.                                     |
| Frame and resize subscriptions       | `onMotionFrame` shares the GSAP clock; `observeViewport` coalesces resize work.                                                   |
| Viewport entry                       | Scoped `IntersectionObserver` or GSAP ScrollTrigger.                                                                              |
| Scroll progress                      | ScrollTrigger `self.progress`, `scrub` and `gsap.utils.mapRange`.                                                                 |
| Page transitions                     | Astro ClientRouter with viewport animations and swap cleanup.                                                                     |
| Text effects                         | Built-in reveal moves whole blocks. Add scoped SplitText with font/resize handling when a design needs character or line effects. |
| Performance diagnostics              | Development-only Tick console metrics and the Shift+F panel; see [Tick](tick.md).                                                 |
| Forms and controls                   | Lumos components with scoped interaction behavior. Configure a real form endpoint per project.                                    |
| Editor integration                   | Stacki adapter and motion policy; see the [installed-editor checks](stacki.md).                                                   |
| Project workflows                    | Repository skills shared by Codex and Claude Code, plus the portable project generator.                                           |

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

Use frame subscriptions for continuous effects and ScrollTrigger/IntersectionObserver for entry or scroll effects. Scope subscriptions and manually written style properties to the owning instance.
