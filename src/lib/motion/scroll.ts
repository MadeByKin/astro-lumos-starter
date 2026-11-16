import { smooth, type Smooth } from "@alpacka/scroll";
import { ScrollTrigger } from "./gsap";
import { observeMotion } from "./policy";
import type { Scope } from "./scope";

let scroller: Smooth | undefined;
let owner: Scope | undefined;
const locks = new Set<symbol>();
let restoreOverflow: (() => void) | undefined;

function saveOverflow() {
  const style = document.documentElement.style;
  const x = style.getPropertyValue("overflow-x");
  const y = style.getPropertyValue("overflow-y");
  const xPriority = style.getPropertyPriority("overflow-x");
  const yPriority = style.getPropertyPriority("overflow-y");
  return () => {
    style.setProperty("overflow-x", x, xPriority);
    style.setProperty("overflow-y", y, yPriority);
  };
}

function applyLock() {
  scroller?.lock("overlays");
  document.documentElement.style.setProperty("overflow", "hidden", "important");
}

/** Pair with scope.defer(lockScroll()). Tokens prevent one overlay unlocking another. */
export function lockScroll() {
  const token = Symbol("scroll-lock");
  if (locks.size === 0) {
    restoreOverflow = saveOverflow();
    applyLock();
  }
  locks.add(token);
  return () => {
    if (!locks.delete(token) || locks.size) return;
    scroller?.unlock("overlays");
    restoreOverflow?.();
    restoreOverflow = undefined;
  };
}

export function refreshMotion() {
  scroller?.resize();
  ScrollTrigger.refresh();
}

export function scrollState() {
  return { smooth: !!scroller, locks: locks.size };
}

/** Alpacka owns the wheel easing clock for the lifetime of this page. */
export function startScroll(scope: Scope) {
  if (owner) throw new Error("Only one SiteRuntime may own scrolling");
  owner = scope;
  const destroy = () => {
    if (!scroller) return;
    // Alpacka clears inline overflow and restores its initial history mode.
    // Preserve the current overlay lock, site styles and ClientRouter state.
    const restore = saveOverflow();
    const restoration = history.scrollRestoration;
    scroller.destroy();
    scroller = undefined;
    history.scrollRestoration = restoration;
    restore();
  };
  scope.defer(() => {
    destroy();
    owner = undefined;
  });
  observeMotion(scope, (allowed) => {
    if (!allowed) {
      destroy();
      return;
    }
    if (scroller) return;
    const restoration = history.scrollRestoration;
    scroller = smooth();
    history.scrollRestoration = restoration;
    scroller.on("scroll", () => ScrollTrigger.update());
    if (locks.size) applyLock();
  });
  let frame = 0;
  const queueRefresh = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(refreshMotion);
  };
  document.addEventListener("astro:page-load", queueRefresh, {
    signal: scope.signal,
  });
  document.addEventListener("site:content-updated", queueRefresh, {
    signal: scope.signal,
  });
  document.addEventListener("load", queueRefresh, {
    capture: true,
    signal: scope.signal,
  });
  window.addEventListener("resize", queueRefresh, {
    passive: true,
    signal: scope.signal,
  });
  document.fonts.ready.then(() => {
    if (!scope.signal.aborted) queueRefresh();
  });
  scope.defer(() => cancelAnimationFrame(frame));
  queueRefresh();
}
