import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";
import { observeMotion } from "./policy";
import type { Scope } from "./scope";

let lenis: Lenis | undefined;
let owner: Scope | undefined;
const locks = new Set<symbol>();
let originalOverflow = "";
let originalOverflowPriority = "";

/** Pair with scope.defer(lockScroll()). Tokens prevent one overlay unlocking another. */
export function lockScroll() {
  const token = Symbol("scroll-lock");
  if (locks.size === 0) {
    originalOverflow =
      document.documentElement.style.getPropertyValue("overflow");
    originalOverflowPriority =
      document.documentElement.style.getPropertyPriority("overflow");
    document.documentElement.style.setProperty(
      "overflow",
      "hidden",
      "important",
    );
  }
  locks.add(token);
  lenis?.stop();
  return () => {
    if (!locks.delete(token) || locks.size) return;
    if (originalOverflow)
      document.documentElement.style.setProperty(
        "overflow",
        originalOverflow,
        originalOverflowPriority,
      );
    else document.documentElement.style.removeProperty("overflow");
    lenis?.start();
  };
}

export function refreshMotion() {
  lenis?.resize();
  ScrollTrigger.refresh();
}

export function scrollState() {
  return { smooth: !!lenis, locks: locks.size };
}

/** Exactly one Lenis instance and one GSAP ticker callback; never a second RAF. */
export function startScroll(scope: Scope) {
  if (owner) throw new Error("Only one SiteRuntime may own scrolling");
  owner = scope;
  let removeTicker: (() => void) | undefined;
  const destroy = () => {
    removeTicker?.();
    removeTicker = undefined;
    lenis?.destroy();
    lenis = undefined;
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
    if (lenis) return;
    lenis = new Lenis({
      autoRaf: false,
      autoResize: true,
      smoothWheel: true,
      syncTouch: false,
      anchors: false,
    });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (seconds: number) => lenis?.raf(seconds * 1000);
    gsap.ticker.add(tick);
    removeTicker = () => gsap.ticker.remove(tick);
    if (locks.size) lenis.stop();
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
