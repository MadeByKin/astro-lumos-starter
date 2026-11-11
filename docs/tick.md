# Tick: local console timing and frame diagnostics

The starter's Tick-style utility is original, lightweight developer tooling inspired by Federico's setup. It is dynamically imported only in development, sends no telemetry and is excluded from the default production build. The existing Shift+F panel remains the single on-screen display.

Run `npm run dev` and open the browser console. Tick logs `diagnostics-ready` and ClientRouter route timing events automatically. In the development console:

```js
tick.add("app-ready");
tick.add("checkpoint", true); // Include the browser-metric table.
tick.showBrowserMetrics();
tick.enableFrameDropDetection(true); // Starts optional sampling, target 60fps.
tick.showAnimationMetrics();
tick.getFrameDropHistory();
tick.stopFrameTracking();
```

In application code, keep the import behind a development guard:

```ts
if (import.meta.env.DEV) {
  const { tick } = await import("@/utils/tick");
  tick.add("gallery-ready");
}
```

`tick.instrumentFunction(fn, 'name')` returns a wrapper that preserves `this`, arguments, return values and thrown errors. It records the synchronous invocation as a native Performance measure. For an async function, that does **not** measure all awaited work or CPU usage. Only explicitly wrapped functions are instrumented; no automatic patching of application objects occurs.

## What the readings mean

- `tickModuleStartedMs`: navigation-relative time when the diagnostics module executes.
- `headToTickMs`: interval from the development head marker to module execution. This includes intervening parsing, loading, dependency ordering, scheduling and execution. It is **not isolated JavaScript evaluation time**. The marker is guarded so soft navigation does not reset it.
- `domReadyMs` / `ttfbMs`: document Navigation Timing values, when available.
- `fcpMs`: browser First Contentful Paint entry.
- `lcpCandidateMs`: latest observed Largest Contentful Paint candidate, not a promise that the final value is available at startup.
- `clsSessionWindow`: largest observed layout-shift session window, excluding recent-input shifts, with a one-second gap and five-second window. This local document observation is not a complete field Web Vitals report across all browser lifecycle cases.
- `observedLongTasks` / `observedBlockingMs`: supported Long Tasks observations and accumulated duration beyond 50ms. The latter is **not Lighthouse TBT**: it has a different observation window.
- FPS/frame gaps: samples of the existing GSAP clock using wall time. Frame gaps and estimated drops are relative to a configured target (default 60fps). They are not a direct GPU/display measurement.
- Nearby measures on a slow gap are correlated work, not proof that a particular function caused the gap. Use DevTools traces to establish the cause.

Unsupported or not-yet-observed values are `null`, not fabricated zeros or passing scores. FID/TTI and invented smoothness/Lighthouse scores are not reported. INP requires a proper implementation such as Google's web-vitals library; this tool does not approximate it under that name.

## Lifetime and overhead

Tick installs one document-level set of observers and router listeners. Document paint/timing readings stay document-scoped across ClientRouter transitions; route start/ready durations are reported separately rather than pretending every soft navigation is a fresh document load. Buffers are bounded (120 frame samples, 60 gaps, 100 measures).

Frame sampling is opt-in and shares GSAP's clock; it adds no independent RAF loop. It pauses with the shared motion/visibility policy and discards the pause interval. `stopFrameTracking()` removes that subscription. `cleanup()` disconnects Tick's observers/listeners, stops sampling, clears its own measures and removes/restores its console global; refreshing starts a fresh session. Site hot-disposal also cleans it up. The existing Shift+F panel has its own independently disposable sampling scope.

Development timings include Vite/HMR overhead and should not be presented as client production results. For production assessment, use Lighthouse and correctly collected field data.

Sources: [Google's current web-vitals library](https://github.com/GoogleChrome/web-vitals), [TBT measurement](https://web.dev/articles/tbt), [TTI retirement](https://developer.chrome.com/docs/lighthouse/performance/interactive/).
