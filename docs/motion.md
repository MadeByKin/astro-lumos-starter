# Motion and resource ownership

`BaseLayout.astro` includes exactly one `SiteRuntime`. `src/lib/motion/scroll.ts` owns Lenis and its single GSAP ticker callback. `autoRaf` is false; the shared GSAP ticker disables lag smoothing as recommended by the Lenis integration; do not start another loop or create Lenis in a component. Lenis's own automatic resize observes content size; explicit refresh is queued after font/image load, viewport resize and editor morphs. Touch scrolling and anchor links remain native. `data-lenis-prevent` marks nested scroll areas such as dialogs.

`defineBehaviour` registers a browser custom element once. Each connected instance receives a fresh `Scope`; removal aborts its listeners and runs cleanup in reverse order. It also disposes on `pagehide` and remounts on `pageshow` for back/forward cache restoration. A `site:content-updated` event remounts connected component instances after an editor updates their internals. The shared SiteRuntime opts out of that remount: it refreshes geometry while retaining the current editor mode and Lenis owner. A failed setup disposes its partial resources and leaves static HTML available.

Shared reusable effects live once in `src/scripts/` and target explicit data attributes. `site.ts` loads the global `[data-reveal]` implementation from `reveals.ts`; no heading tag enables motion. Component-specific controls can retain their owning scripts. Shared Modal/Dropdown behavior is loaded once from `src/scripts/overlays.ts`; its registration still creates separate state and cleanup scopes per instance. Native dialog close/Escape behavior is retained. Astro ClientRouter uses before-swap teardown and incoming/page-load initialization; see docs/navigation.md.

```ts
import { defineBehaviour } from "@/lib/motion/scope";
import { observeMotion } from "@/lib/motion/policy";
import { gsap } from "@/lib/motion/gsap";

defineBehaviour("client-example", (element, scope) => {
  let context: gsap.Context | undefined;
  scope.defer(() => context?.revert());
  observeMotion(scope, (allowed) => {
    context?.revert();
    context = undefined;
    if (!allowed) return;
    context = gsap.context(() => {
      // Only descendants of this instance. Register event-created tweens
      // through context.add(...) as well; a context cannot collect arbitrary
      // work created by a later callback outside its execution.
    }, element);
  });
  element.addEventListener("click", () => {}, { signal: scope.signal });
  scope.observe(new ResizeObserver(() => {})).observe(element);
  scope.timeout(() => {}, 200);
  scope.frame(() => {}); // Only when needed; not a component render loop.
});
```

Resources GSAP does not own still need explicit disposal. Use `scope.defer` for custom subscriptions, `scope.observe` for observers, `{ signal: scope.signal }` for event listeners and fetch. Use `scope.timeout` / `scope.frame` for cancellable one-shot work. Global ownership is limited to shared runtime services. Never globally kill all ScrollTriggers or remove another component's listeners.

`observeMotion` responds to system reduced motion, visibility and the root `data-motion="off"` / `data-studio-editing="true"` attributes. Callbacks should revert animation styles and destroy decorative loops when disabled, while retaining essential controls. It may run more than once with the same value; setup must be idempotent. Reveal content starts visible in HTML/CSS and only moves vertically; it never relies on JavaScript to become readable.

`lockScroll()` returns an idempotent release function. Release it on overlay close **and** scope disposal. Multiple locks coexist; only the last release restores the original overflow declaration. Native `<dialog>` supplies the focus boundary and Escape behavior. Add an accessible label and ensure focus returns to its trigger.

Inherited interactive components have been adapted to instance scopes (including navigation, dropdowns, tabs, sliders, marquee, accordion, modal, form and range). They use display-contents lifecycle hosts around their semantic roots; keep those hosts when editing. Static wrapper, typography and media components need no motion lifecycle. Review future upstream Lumos upgrades rather than overwriting these adapters.

For continuous custom effects, `onMotionFrame(scope, callback)` in `src/lib/motion/subscriptions.ts` shares GSAP's existing clock and pauses/removes its subscription when motion is disabled or the scope is disposed. `time` and `delta` are seconds. `observeViewport(scope, callback)` shares one window resize listener and coalesces work into a single frame; a component ResizeObserver remains appropriate for element sizing. See docs/federico-comparison.md for examples.

Development-only diagnostics are dynamically imported behind `import.meta.env.DEV`. Shift+F opens/closes a panel without collecting or sending telemetry. Closing it disposes its frame and viewport subscriptions. Production builds exclude this module.
