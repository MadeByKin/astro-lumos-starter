# Tick diagnostics

Tick is development-only console tooling. Open the browser console after `npm run dev`, or press **Shift+F** for the FPS panel. Diagnostic modules are excluded from production and send no telemetry.

LCP candidates and live CLS readings use coloured badges and [Google’s thresholds](https://support.google.com/webmasters/answer/9205520): LCP ≤2.5s / ≤4s; CLS ≤0.1 / ≤0.25. Ratings use unrounded values; console values are rounded. Readings print when available and update when the displayed value or rating changes. Additional timings are collapsed; `getBrowserMetrics()` keeps full precision.

## Usage

Tick logs startup and route events automatically. In the browser console:

```js
tick.add("app-ready");
tick.add("checkpoint", true); // Include metrics and timing details.
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

## Readings

| Field                                      | Meaning                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `tickModuleStartedMs`                      | Time from document navigation to Tick module execution.                                                             |
| `headToTickMs`                             | Head marker → module execution, including loading, parsing, dependency order and scheduling.                        |
| `domReadyMs` / `ttfbMs`                    | Document Navigation Timing values.                                                                                  |
| `fcpMs`                                    | Browser First Contentful Paint.                                                                                     |
| `lcpCandidateMs`                           | Latest observed Largest Contentful Paint candidate.                                                                 |
| `clsSessionWindow`                         | Largest observed layout-shift session window, excluding recent-input shifts; one-second gap and five-second window. |
| `observedLongTasks` / `observedBlockingMs` | Long-task count and accumulated duration beyond 50ms.                                                               |
| FPS / frame gaps                           | Wall-time samples of the GSAP clock against a target rate, 60fps by default.                                        |

Unavailable readings are `null`. Paint/layout readings remain document-scoped across ClientRouter navigation; route durations are logged separately.

These are local development observations. Head-to-module time is not isolated JS evaluation, observed blocking uses a different window from Lighthouse TBT, and frame gaps are estimates rather than GPU measurements. Nearby function measures show correlation; use DevTools traces to identify causes. For production assessment use Lighthouse and field data collected with a library such as [web-vitals](https://github.com/GoogleChrome/web-vitals).

## Cleanup and sampling

Frame sampling is opt-in on the shared GSAP clock. It pauses with motion/visibility policy and discards paused intervals. `stopFrameTracking()` removes the subscription. Buffers are bounded to 120 frame samples, 60 gaps and 100 measures.

`cleanup()` disconnects observers/listeners, stops sampling, clears Tick’s measures and restores/removes its console global. Hot disposal also cleans up; refreshing starts a new session. The Shift+F panel owns an independently disposable sampling scope.

References: [Web Vitals](https://github.com/GoogleChrome/web-vitals), [TBT measurement](https://web.dev/articles/tbt).
