import { Scope } from "@/lib/motion/scope";
import { observeMotion } from "@/lib/motion/policy";
import { onMotionFrame } from "@/lib/motion/subscriptions";

export const ENABLE_TICK_LOGGING = import.meta.env.DEV;
const moduleStartedAt = performance.now();
type Timing = { name: string; startTime: number; duration: number };
type FrameGap = {
  at: number;
  durationMs: number;
  estimatedDrops: number;
  nearbyMeasures: Timing[];
};
let scope: Scope | undefined;
let frameScope: Scope | undefined;
let previousEventAt = moduleStartedAt;
let previousFrameAt: number | undefined;
let routeStartedAt: number | undefined;
let targetFps = 60;
let detectGaps = false;
let totalFrames = 0;
let estimatedDrops = 0;
const frameTimes: number[] = [];
const gaps: FrameGap[] = [];
const measures: Timing[] = [];
const ownedMeasures = new Set<string>();
const metrics = {
  fcpMs: null as number | null,
  lcpCandidateMs: null as number | null,
  clsSessionWindow: null as number | null,
  observedLongTasks: null as number | null,
  observedBlockingMs: null as number | null,
};
let clsStart = 0;
let clsLast = 0;
let clsValue = 0;
const active = () => ENABLE_TICK_LOGGING && !!scope && !scope.signal.aborted;
function append<T>(items: T[], item: T, limit: number) {
  items.push(item);
  if (items.length > limit) items.shift();
}

function stopFrameTracking() {
  frameScope?.dispose();
  frameScope = undefined;
  previousFrameAt = undefined;
}
function startFrameTracking(fps = 60) {
  if (!active() || frameScope) return;
  targetFps = Number.isFinite(fps) ? Math.min(240, Math.max(1, fps)) : 60;
  frameTimes.length = 0;
  gaps.length = 0;
  totalFrames = 0;
  estimatedDrops = 0;
  frameScope = new Scope();
  onMotionFrame(frameScope, () => {
    const now = performance.now();
    if (previousFrameAt !== undefined) {
      const delta = now - previousFrameAt;
      append(frameTimes, delta, 120);
      totalFrames++;
      const budget = 1000 / targetFps;
      if (detectGaps && delta > budget * 1.5) {
        const dropped = Math.max(0, Math.round(delta / budget) - 1);
        estimatedDrops += dropped;
        const gap = {
          at: now,
          durationMs: delta,
          estimatedDrops: dropped,
          nearbyMeasures: measures
            .filter(
              (entry) =>
                entry.startTime < now &&
                entry.startTime + entry.duration >= previousFrameAt!,
            )
            .slice(-10),
        };
        append(gaps, gap, 60);
        console.warn(
          "[tick] slow frame gap (correlation, not causal attribution)",
          gap,
        );
      }
    }
    previousFrameAt = now;
  });
  observeMotion(frameScope, () => {
    previousFrameAt = undefined;
  });
}

export const tick = {
  add(name: string, showMetrics = false) {
    if (!active()) return;
    const now = performance.now();
    console.info(`[tick] ${name}`, {
      documentMs: now,
      sinceTickMs: now - moduleStartedAt,
      deltaMs: now - previousEventAt,
      route: location.pathname,
    });
    previousEventAt = now;
    if (showMetrics) this.showBrowserMetrics();
  },
  getBrowserMetrics() {
    const nav = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming | undefined;
    const head = window.__astroLumosHeadAt;
    return {
      tickModuleStartedMs: moduleStartedAt,
      headToTickMs:
        typeof head === "number" && head >= 0 && head <= moduleStartedAt
          ? moduleStartedAt - head
          : null,
      domReadyMs: nav?.domContentLoadedEventEnd || null,
      ttfbMs: nav?.responseStart || null,
      ...metrics,
    };
  },
  showBrowserMetrics() {
    if (active()) console.table(this.getBrowserMetrics());
  },
  getAnimationMetrics() {
    const average = frameTimes.length
      ? frameTimes.reduce((sum, value) => sum + value, 0) / frameTimes.length
      : null;
    return {
      tracking: !!frameScope,
      sampleCount: frameTimes.length,
      totalFrames,
      targetFps,
      averageFps: average ? 1000 / average : null,
      averageFrameMs: average,
      maxFrameMs: frameTimes.length ? Math.max(...frameTimes) : null,
      estimatedDrops,
    };
  },
  showAnimationMetrics() {
    if (active()) console.table(this.getAnimationMetrics());
  },
  startFrameTracking,
  stopFrameTracking,
  enableFrameDropDetection(value: boolean) {
    detectGaps = value;
    if (value) startFrameTracking();
  },
  getFrameDropHistory() {
    return gaps.map((gap) => ({
      ...gap,
      nearbyMeasures: [...gap.nearbyMeasures],
    }));
  },
  instrumentFunction<TThis, TArgs extends unknown[], TResult>(
    fn: (this: TThis, ...args: TArgs) => TResult,
    name = fn.name || "function",
  ) {
    return function (this: TThis, ...args: TArgs): TResult {
      if (!active()) return fn.apply(this, args);
      const start = performance.now();
      try {
        return fn.apply(this, args);
      } finally {
        const label = `astro-tick:${name}`;
        ownedMeasures.add(label);
        if (ownedMeasures.size > 100) {
          const oldest = ownedMeasures.values().next().value!;
          performance.clearMeasures(oldest);
          ownedMeasures.delete(oldest);
        }
        performance.clearMeasures(label);
        performance.measure(label, { start, end: performance.now() });
      }
    };
  },
  cleanup() {
    scope?.dispose();
    scope = undefined;
  },
};

declare global {
  interface Window {
    __astroLumosHeadAt?: number;
    tick?: typeof tick;
  }
}

/** One development-only document lifetime; soft routes keep separate timing marks. */
export function installTick(owner: Scope) {
  if (!ENABLE_TICK_LOGGING || owner.signal.aborted) return;
  tick.cleanup();
  clsStart = 0;
  clsLast = 0;
  clsValue = 0;
  Object.assign(metrics, {
    fcpMs: null,
    lcpCandidateMs: null,
    clsSessionWindow: null,
    observedLongTasks: null,
    observedBlockingMs: null,
  });
  const session = new Scope();
  scope = session;
  const previousGlobal = window.tick;
  window.tick = tick;
  owner.defer(() => {
    session.dispose();
    if (scope === session) scope = undefined;
  });
  session.defer(() => {
    stopFrameTracking();
    if (window.tick === tick) window.tick = previousGlobal;
    ownedMeasures.forEach((name) => performance.clearMeasures(name));
    ownedMeasures.clear();
    measures.length = 0;
    frameTimes.length = 0;
    gaps.length = 0;
  });
  const observe = (
    type: string,
    receive: (entries: PerformanceEntry[]) => void,
  ) => {
    if (
      typeof PerformanceObserver === "undefined" ||
      !PerformanceObserver.supportedEntryTypes?.includes(type)
    )
      return false;
    try {
      const observer = session.observe(
        new PerformanceObserver((list) => {
          if (!session.signal.aborted) receive(list.getEntries());
        }),
      );
      observer.observe({ type, buffered: true });
      return true;
    } catch {
      return false;
    }
  };
  observe("paint", (entries) =>
    entries.forEach((entry) => {
      if (entry.name === "first-contentful-paint")
        metrics.fcpMs = entry.startTime;
    }),
  );
  observe("largest-contentful-paint", (entries) => {
    metrics.lcpCandidateMs = entries.at(-1)?.startTime ?? null;
  });
  if (
    observe("layout-shift", (entries) => {
      for (const entry of entries as (PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
      })[]) {
        if (entry.hadRecentInput || entry.value === 0) continue;
        if (
          clsValue > 0 &&
          entry.startTime - clsLast < 1000 &&
          entry.startTime - clsStart < 5000
        )
          clsValue += entry.value;
        else {
          clsStart = entry.startTime;
          clsValue = entry.value;
        }
        clsLast = entry.startTime;
        metrics.clsSessionWindow = Math.max(
          metrics.clsSessionWindow ?? 0,
          clsValue,
        );
      }
    })
  )
    metrics.clsSessionWindow = 0;
  if (
    observe("longtask", (entries) => {
      for (const entry of entries) {
        metrics.observedLongTasks = (metrics.observedLongTasks ?? 0) + 1;
        metrics.observedBlockingMs =
          (metrics.observedBlockingMs ?? 0) + Math.max(0, entry.duration - 50);
      }
    })
  ) {
    metrics.observedLongTasks = 0;
    metrics.observedBlockingMs = 0;
  }
  observe("measure", (entries) =>
    entries.forEach((entry) =>
      append(
        measures,
        {
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
        },
        100,
      ),
    ),
  );
  document.addEventListener(
    "astro:before-preparation",
    () => {
      routeStartedAt = performance.now();
      tick.add("route:start");
    },
    { signal: session.signal },
  );
  document.addEventListener(
    "astro:page-load",
    () => {
      tick.add("route:ready");
      if (routeStartedAt !== undefined)
        console.info("[tick] route duration (not document paint/vitals)", {
          routeMs: performance.now() - routeStartedAt,
          route: location.pathname,
        });
      routeStartedAt = undefined;
    },
    { signal: session.signal },
  );
  tick.add("diagnostics-ready", true);
}
