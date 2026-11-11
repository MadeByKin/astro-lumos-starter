import { gsap } from "./gsap";
import { observeMotion } from "./policy";
import type { Scope } from "./scope";

export type MotionFrame = { time: number; delta: number; frame: number };

/** Use the existing GSAP clock; no independent requestAnimationFrame loop. */
export function onMotionFrame(
  scope: Scope,
  callback: (frame: MotionFrame) => void,
) {
  if (scope.signal.aborted) return;
  let active = false;
  const tick = (time: number, deltaMs: number, frame: number) =>
    callback({ time, delta: deltaMs / 1000, frame });
  const stop = () => {
    if (active) gsap.ticker.remove(tick);
    active = false;
  };
  scope.defer(stop);
  observeMotion(scope, (allowed) => {
    if (!allowed) {
      stop();
      return;
    }
    if (!active) {
      active = true;
      gsap.ticker.add(tick);
    }
  });
}

export type Viewport = { width: number; height: number };
const subscribers = new Map<symbol, (viewport: Viewport) => void>();
let controller: AbortController | undefined;
let frame = 0;

/** One shared, frame-coalesced window resize subscription; removed when unused. */
export function observeViewport(
  scope: Scope,
  callback: (viewport: Viewport) => void,
) {
  if (scope.signal.aborted) return;
  const id = Symbol("viewport");
  subscribers.set(id, callback);
  if (!controller) {
    controller = new AbortController();
    window.addEventListener(
      "resize",
      () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const size = { width: innerWidth, height: innerHeight };
          for (const [key, subscriber] of [...subscribers]) {
            if (!subscribers.has(key)) continue;
            try {
              subscriber(size);
            } catch (error) {
              console.error("Viewport subscriber failed", error);
            }
          }
        });
      },
      { passive: true, signal: controller.signal },
    );
  }
  scope.defer(() => {
    subscribers.delete(id);
    if (subscribers.size) return;
    controller?.abort();
    controller = undefined;
    cancelAnimationFrame(frame);
    frame = 0;
  });
  callback({ width: innerWidth, height: innerHeight });
}
