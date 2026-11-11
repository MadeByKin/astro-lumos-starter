import "lenis/dist/lenis.css";
import { defineBehaviour, Scope } from "@/lib/motion/scope";
import { connectStudio } from "@/lib/motion/studio";
import { startScroll } from "@/lib/motion/scroll";
import { installReveals } from "./reveals";
import { installOverlays } from "./overlays";
import { observeMotion } from "@/lib/motion/policy";

// One processed entry point for shared attribute-driven effects and site services.
const lifetime = new Scope();
defineBehaviour(
  "site-runtime",
  (_element, scope) => {
    connectStudio(scope);
    startScroll(scope);
    observeMotion(scope, (allowed) => {
      document.querySelectorAll("[data-motion-status]").forEach((element) => {
        element.textContent = allowed
          ? "Motion enabled · Lenis + GSAP"
          : "Motion paused · native scrolling";
      });
    });
    if (import.meta.env.DEV) {
      import("@/lib/motion/diagnostics").then(({ installDiagnostics }) => {
        if (!scope.signal.aborted) installDiagnostics(scope);
      });
    }
  },
  { refreshOnContent: false },
);
installOverlays(lifetime);
installReveals(lifetime);

// A manually selected site motion policy survives the router's root attribute swap.
document.addEventListener(
  "astro:before-swap",
  (event) => {
    const next = (event as Event & { newDocument?: Document }).newDocument;
    if (next && document.documentElement.hasAttribute("data-motion")) {
      next.documentElement.dataset.motion =
        document.documentElement.dataset.motion;
    }
  },
  { signal: lifetime.signal },
);
if (import.meta.hot) import.meta.hot.dispose(() => lifetime.dispose());
