import { chromium } from "playwright";
import assert from "node:assert/strict";
const base = process.env.BASE_URL || "http://127.0.0.1:4322";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHANNEL
    ? { channel: process.env.PLAYWRIGHT_CHANNEL }
    : {}),
});
const context = await browser.newContext({ reducedMotion: "no-preference" });
context.setDefaultTimeout(10000);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
try {
  await page.goto(base);
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("lenis"),
  );
  await page.waitForFunction(() => !!window.tick);
  const timing = await page.evaluate(() => window.tick.getBrowserMetrics());
  assert.ok(timing.tickModuleStartedMs >= 0);
  assert.ok(timing.headToTickMs !== null && timing.headToTickMs >= 0);
  const instrumented = await page.evaluate(() => {
    const object = {
      value: 5,
      run: window.tick.instrumentFunction(function (add) {
        return this.value + add;
      }, "sum"),
    };
    const result = object.run(3);
    let error;
    try {
      window.tick.instrumentFunction(() => {
        throw new Error("expected");
      }, "throw")();
    } catch (value) {
      error = value.message;
    }
    window.tick.startFrameTracking();
    return { result, error };
  });
  assert.deepEqual(instrumented, { result: 8, error: "expected" });
  await page.waitForFunction(
    () => window.tick.getAnimationMetrics().sampleCount > 3,
  );
  await page.evaluate(() => window.tick.stopFrameTracking());
  const samples = await page.evaluate(
    () => window.tick.getAnimationMetrics().sampleCount,
  );
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  assert.equal(
    await page.evaluate(() => window.tick.getAnimationMetrics().sampleCount),
    samples,
  );
  await page.getByRole("link", { name: "Try a page transition" }).click();
  await page.waitForURL("**/next");
  assert.equal(await page.evaluate(() => typeof window.tick.add), "function");
  await page.getByRole("link", { name: "Return to the demo" }).click();
  await page.waitForURL(base + "/");
  await page.keyboard.press("Shift+F");
  await page.locator("[data-motion-diagnostics]").waitFor();
  await page.waitForFunction(() =>
    /GSAP clock \d+ fps/.test(
      document.querySelector("[data-motion-diagnostics]").textContent,
    ),
  );
  await page.keyboard.press("Shift+F");
  assert.equal(await page.locator("[data-motion-diagnostics]").count(), 0);

  await page.evaluate(async () => {
    const { Scope } = await import("/src/lib/motion/scope.ts");
    const { onMotionFrame, observeViewport } =
      await import("/src/lib/motion/subscriptions.ts");
    window.__frameCalls = 0;
    window.__viewportA = 0;
    window.__viewportB = 0;
    window.__frameScope = new Scope();
    window.__viewportScopeA = new Scope();
    window.__viewportScopeB = new Scope();
    onMotionFrame(window.__frameScope, () => window.__frameCalls++);
    observeViewport(window.__viewportScopeA, () => window.__viewportA++);
    observeViewport(window.__viewportScopeB, () => window.__viewportB++);
  });
  await page.waitForFunction(() => window.__frameCalls > 3);
  assert.equal(await page.evaluate(() => window.__viewportA), 1);
  await page.setViewportSize({ width: 900, height: 700 });
  await page.waitForFunction(
    () => window.__viewportA > 1 && window.__viewportB > 1,
  );
  await page.evaluate(() => {
    window.__viewportScopeA.dispose();
    window.__viewportStopped = window.__viewportA;
  });
  await page.setViewportSize({ width: 1000, height: 720 });
  await page.waitForFunction(() => window.__viewportB > 2);
  assert.equal(
    await page.evaluate(() => window.__viewportA),
    await page.evaluate(() => window.__viewportStopped),
  );

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(
    () => !document.documentElement.classList.contains("lenis"),
  );
  const paused = await page.evaluate(() => window.__frameCalls);
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  assert.equal(await page.evaluate(() => window.__frameCalls), paused);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForFunction((value) => window.__frameCalls > value, paused);
  await page.evaluate(() => {
    window.__frameScope.dispose();
    window.__viewportScopeB.dispose();
    window.__stoppedFrames = window.__frameCalls;
  });
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  assert.equal(
    await page.evaluate(() => window.__frameCalls),
    await page.evaluate(() => window.__stoppedFrames),
  );
  await page.keyboard.press("Shift+F");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() =>
    document
      .querySelector("[data-motion-diagnostics]")
      .textContent.includes("Motion paused"),
  );
  await page.keyboard.press("Shift+F");
  assert.equal(await page.locator("[data-motion-diagnostics]").count(), 0);
  await page.evaluate(() => window.tick.cleanup());
  assert.equal(await page.evaluate(() => typeof window.tick), "undefined");
  assert.deepEqual(errors, []);
  console.log(
    "PASS: development diagnostics toggle, shared frame clock, live reduced-motion stop/resume and independent viewport subscription disposal.",
  );
} finally {
  await context.close();
  await browser.close();
}
