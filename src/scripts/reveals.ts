import { gsap } from "@/lib/motion/gsap";
import { observeMotion } from "@/lib/motion/policy";
import { Scope } from "@/lib/motion/scope";

const selector = "[data-reveal]";
const attributes = [
  "data-reveal",
  "data-reveal-distance",
  "data-reveal-duration",
];

/** Shared sitewide effect. Semantic tags never opt an element into animation. */
export function installReveals(lifetime: Scope) {
  const instances = new Map<HTMLElement, { scope: Scope; signature: string }>();
  let paused = false;
  let frame = 0;
  const clear = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    instances.forEach(({ scope }) => scope.dispose());
    instances.clear();
  };
  const number = (
    value: string | undefined,
    fallback: number,
    min: number,
    max: number,
  ) => {
    const parsed = value === undefined ? NaN : Number(value);
    return Number.isFinite(parsed)
      ? Math.min(max, Math.max(min, parsed))
      : fallback;
  };
  const scan = () => {
    if (paused || lifetime.signal.aborted) return;
    for (const [element, instance] of instances) {
      if (!element.isConnected || !element.matches(selector)) {
        instance.scope.dispose();
        instances.delete(element);
      }
    }
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      const signature = JSON.stringify(
        attributes.map((name) => element.getAttribute(name)),
      );
      if (instances.get(element)?.signature === signature) return;
      instances.get(element)?.scope.dispose();
      const scope = new Scope();
      instances.set(element, { scope, signature });
      let context: gsap.Context | undefined;
      const reset = () => {
        context?.revert();
        context = undefined;
      };
      scope.defer(reset);
      try {
        observeMotion(scope, (allowed) => {
          reset();
          if (!allowed || element.dataset.reveal === "off") return;
          context = gsap.context(() => {
            // Visible HTML is the baseline. Move only explicitly marked elements.
            gsap.from(element, {
              y: `${number(element.dataset.revealDistance, 1.5, 0, 4)}rem`,
              duration: number(element.dataset.revealDuration, 0.7, 0.1, 2),
              ease: "power2.out",
              scrollTrigger: { trigger: element, start: "top 92%", once: true },
            });
          }, element);
        });
      } catch (error) {
        scope.dispose();
        console.error("Reveal enhancement failed", error);
      }
    });
  };
  const queue = () => {
    if (frame || paused) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      scan();
    });
  };
  const suspend = () => {
    paused = true;
    clear();
  };
  const resume = () => {
    paused = false;
    scan();
  };
  document.addEventListener("astro:before-swap", suspend, {
    signal: lifetime.signal,
  });
  document.addEventListener("astro:after-swap", resume, {
    signal: lifetime.signal,
  });
  document.addEventListener("astro:page-load", resume, {
    signal: lifetime.signal,
  });
  document.addEventListener(
    "site:content-updated",
    () => {
      clear();
      scan();
    },
    { signal: lifetime.signal },
  );
  window.addEventListener("pagehide", suspend, { signal: lifetime.signal });
  window.addEventListener("pageshow", resume, { signal: lifetime.signal });
  const observer = lifetime.observe(new MutationObserver(queue));
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: attributes,
  });
  lifetime.defer(clear);
  scan();
}
