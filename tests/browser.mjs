import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const base = process.env.BASE_URL || "http://127.0.0.1:4322";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHANNEL
    ? { channel: process.env.PLAYWRIGHT_CHANNEL }
    : {}),
});
const errors = [];
const output = new URL("../output/playwright/", import.meta.url);
await mkdir(output, { recursive: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "no-preference",
});
context.on("page", (page) => {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /Failed to enhance|Resource cleanup failed/.test(message.text())
    )
      errors.push(message.text());
  });
});
await context.addInitScript(() => {
  window.__observers = new Set();
  for (const name of [
    "MutationObserver",
    "ResizeObserver",
    "IntersectionObserver",
  ]) {
    const Native = window[name];
    window[name] = class extends Native {
      observe(...args) {
        window.__observers.add(this);
        return super.observe(...args);
      }
      disconnect() {
        window.__observers.delete(this);
        return super.disconnect();
      }
    };
  }
});
context.setDefaultTimeout(10000);
context.setDefaultNavigationTimeout(15000);
const page = await context.newPage();
const smooth = (value = true, target = page) =>
  target.waitForFunction(
    (expected) =>
      document.documentElement.classList.contains("lenis") === expected,
    value,
  );
try {
  await page.goto(base);
  await smooth();
  assert.equal(await page.locator("site-runtime").count(), 1);
  assert.equal(
    await page.evaluate(() => typeof window.tick),
    "undefined",
    "Tick is excluded from production",
  );
  assert.equal(await page.evaluate(() => window.__astroLumosHeadAt), undefined);
  assert.equal(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--brand-500")
        .trim(),
    ),
    "#c6fb50",
  );
  assert.equal(await page.locator(".layout.theme-brand").count(), 1);
  await page.keyboard.press("Shift+F");
  assert.equal(
    await page.locator("[data-motion-diagnostics]").count(),
    0,
    "Diagnostics are not active in production",
  );
  await page.waitForFunction(() => {
    const transform = getComputedStyle(
      document.querySelector("[data-reveal]"),
    ).transform;
    return (
      transform === "none" ||
      Math.abs(new DOMMatrixReadOnly(transform).m42) < 0.1
    );
  });
  await page.screenshot({
    path: fileURLToPath(new URL("desktop.png", output)),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Test the dialog" }).click();
  assert.equal(await page.locator("dialog").evaluate((el) => el.open), true);
  assert.equal(
    await page.evaluate(() => document.documentElement.style.overflow),
    "hidden",
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => document.documentElement.style.overflow !== "hidden",
  );
  assert.equal(
    await page
      .locator("[data-open-dialog]")
      .evaluate((el) => el === document.activeElement),
    true,
  );

  for (let i = 0; i < 3; i++) {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await smooth(false);
    await page.waitForFunction(() => {
      const value = getComputedStyle(
        document.querySelector("[data-reveal]"),
      ).transform;
      return value === "none" || value === "matrix(1, 0, 0, 1, 0, 0)";
    });
    const gap = await page.locator(".hero_intro_wrap").evaluate((el) => {
      const heading = el.querySelector("[data-reveal]").getBoundingClientRect();
      const paragraph = el
        .querySelector("[data-reveal]")
        .nextElementSibling.getBoundingClientRect();
      return paragraph.top - heading.bottom;
    });
    assert.ok(
      gap >= 24,
      `Hero title/body gap should be at least 24px, got ${gap}`,
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await smooth();
  }
  await page.evaluate(() => {
    const target = document.createElement("div");
    target.id = "attribute-test";
    target.textContent = "Explicit effect";
    target.dataset.reveal = "up";
    document.querySelector("main").append(target);
  });
  await page.waitForFunction(
    () => document.querySelector("#attribute-test").style.transform !== "",
  );
  await page
    .locator("#attribute-test")
    .evaluate((el) => el.removeAttribute("data-reveal"));
  await page.waitForFunction(
    () => document.querySelector("#attribute-test").style.transform === "",
  );
  await page.locator("#attribute-test").evaluate((el) => el.remove());
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const observerBaseline = await page.evaluate(() => window.__observers.size);
  // Runtime disconnect/reconnect, including overlay cleanup, must leave no scroll lock.
  await page.getByRole("button", { name: "Test the dialog" }).click();
  await page.evaluate(() => {
    const el = document.querySelector("lumos-modal");
    el.remove();
    document.querySelector("main").append(el);
  });
  await page.waitForFunction(
    () => document.documentElement.style.overflow !== "hidden",
  );
  assert.equal(await page.locator("dialog").evaluate((el) => el.open), false);
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => {
      const root = document.querySelector("main");
      const clone = document.querySelector("[data-reveal]").cloneNode(true);
      root.append(clone);
      clone.remove();
      document.dispatchEvent(new Event("site:content-updated"));
    });
  }
  await smooth();
  assert.equal(
    await page.evaluate(() => window.__observers.size),
    observerBaseline,
    "Repeated mounts release observers",
  );
  await page.evaluate(() => {
    window.__oldDocument = true;
  });
  await page.getByRole("link", { name: "Try a page transition" }).click();
  await page.waitForURL("**/next");
  await smooth();
  assert.equal(
    await page.evaluate(() => window.__oldDocument),
    true,
    "ClientRouter preserves the document",
  );
  assert.equal(
    await page.locator("main").getAttribute("data-page-transition"),
    "slide",
  );
  await page.goBack();
  await smooth();
  await page.locator("[data-open-dialog]").waitFor();
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const navigationBaseline = await page.evaluate(() => window.__observers.size);
  for (let visit = 0; visit < 4; visit++) {
    await page.getByRole("link", { name: "Try a page transition" }).click();
    await page.waitForURL("**/next");
    await smooth();
    await page.getByRole("link", { name: "Return to the demo" }).click();
    await page.waitForURL(base + "/");
    await smooth();
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    assert.equal(
      await page.evaluate(() => window.__observers.size),
      navigationBaseline,
      "Router round trips release page observers",
    );
  }
  await page.evaluate(() => {
    const heading = document.createElement("h1");
    heading.id = "unmarked-heading";
    heading.textContent = "Plain heading";
    document.querySelector("main").append(heading);
  });
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  assert.equal(
    await page.locator("#unmarked-heading").getAttribute("style"),
    null,
    "Unmarked headings are not animation targets",
  );
  await page.locator("#unmarked-heading").evaluate((el) => el.remove());
  await page.evaluate(() => {
    document.documentElement.dataset.motion = "off";
  });
  await smooth(false);
  await page.getByRole("link", { name: "Try a page transition" }).click();
  await page.waitForURL("**/next");
  await smooth(false);
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.motion),
    "off",
  );
  await page.getByRole("link", { name: "Return to the demo" }).click();
  await page.waitForURL(base + "/");
  await page.evaluate(() => {
    delete document.documentElement.dataset.motion;
  });
  await smooth();

  await page.getByRole("link", { name: "Explore the foundation" }).click();
  assert.equal(new URL(page.url()).hash, "#principles");
  await page.goto(base);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "main");

  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pagehide", { persisted: true }),
    ),
  );
  await smooth(false);
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    ),
  );
  await smooth();
  assert.equal(
    await page.evaluate(() => window.__observers.size),
    observerBaseline,
    "BFCache restoration releases and rebuilds owned observers",
  );

  // Existing library interactions must survive reconnection without duplicate handlers.
  await page.evaluate(() => {
    window.__libraryVisitMarker = true;
  });
  await page.locator('.nav_links a[href="/example-components"]').click();
  await page.waitForURL("**/example-components");
  assert.equal(
    await page.evaluate(() => window.__libraryVisitMarker),
    true,
    "Library scripts initialize on a first ClientRouter visit",
  );
  await smooth();
  await page.evaluate(() => {
    for (const id of ["modal-small", "modal-side"]) {
      const trigger = document.createElement("button");
      trigger.dataset.modalOpen = id;
      document.body.append(trigger);
      trigger.click();
      trigger.remove();
    }
  });
  assert.equal(await page.locator("dialog[open]").count(), 2);
  await page.evaluate(() => {
    const host = document.querySelector("#modal-small").closest("lumos-modal");
    const parent = host.parentElement;
    host.remove();
    parent.append(host);
  });
  assert.equal(
    await page.evaluate(() => document.documentElement.style.overflow),
    "hidden",
    "Second modal retains its scroll lock",
  );
  await page.evaluate(() => document.querySelector("#modal-side").close());
  await page.waitForFunction(
    () => document.documentElement.style.overflow !== "hidden",
  );
  const dropdown = page.locator("[data-dropdown]").first();
  const summary = dropdown.locator("[data-dropdown-toggle]");
  await summary.click();
  assert.equal(await dropdown.evaluate((el) => el.open), true);
  await dropdown.evaluate((el) => {
    const link = document.createElement("a");
    link.id = "dropdown-keyboard-item";
    link.href = "#dropdown-test";
    link.textContent = "Menu item";
    el.querySelector("[data-dropdown-content]").append(link);
  });
  await summary.press("ArrowDown");
  await page.waitForFunction(
    () => document.activeElement?.id === "dropdown-keyboard-item",
  );

  assert.equal(
    await dropdown
      .locator("[data-dropdown-content] a, [data-dropdown-content] button")
      .first()
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.keyboard.press("Escape");
  assert.equal(await dropdown.evaluate((el) => el.open), false);
  assert.equal(
    await summary.evaluate((el) => el === document.activeElement),
    true,
  );
  await dropdown.evaluate((el) => {
    const host = el.closest("lumos-dropdown");
    const parent = host.parentElement;
    host.remove();
    parent.append(host);
  });
  await summary.click();
  await page.getByRole("heading").first().click();
  assert.equal(
    await dropdown.evaluate((el) => el.open),
    false,
    "Shared outside-click dismissal survives reconnection",
  );
  const tabs = page.locator("lumos-tabs").first();
  assert.equal(await tabs.count(), 1);
  await page.evaluate(() => {
    const el = document.querySelector("lumos-tabs");
    const parent = el.parentElement;
    for (let i = 0; i < 5; i++) {
      el.remove();
      parent.append(el);
    }
  });
  const tabButtons = tabs.locator("[role=tab]");
  if ((await tabButtons.count()) > 1) {
    await tabButtons.nth(1).click();
    assert.equal(await tabButtons.nth(1).getAttribute("aria-selected"), "true");
    await tabButtons.nth(1).press("ArrowRight");
    assert.equal(
      await tabButtons
        .nth(2 % (await tabButtons.count()))
        .getAttribute("aria-selected"),
      "true",
    );
  }

  console.log("PASS: desktop motion, cleanup and library navigation");
  // Initial reduced motion, mobile nav and no-JS reading/navigation.
  const reduced = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 390, height: 844 },
  });
  const mobile = await reduced.newPage();
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto(base);
  await smooth(false, mobile);
  await mobile.locator(".nav_toggle").click();
  assert.equal(
    await mobile.locator(".nav_toggle").getAttribute("aria-expanded"),
    "true",
  );
  await mobile.keyboard.press("Escape");
  assert.equal(
    await mobile.locator(".nav_toggle").getAttribute("aria-expanded"),
    "false",
  );
  assert.equal(
    await mobile.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await mobile.screenshot({
    path: fileURLToPath(new URL("mobile-reduced.png", output)),
    fullPage: true,
  });
  await reduced.close();
  const plain = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await plain.newPage();
  await staticPage.goto(base);
  assert.equal(
    await staticPage.getByRole("heading", { level: 1 }).isVisible(),
    true,
  );
  await staticPage.getByRole("link", { name: "Try a page transition" }).click();
  await staticPage.waitForURL("**/next");
  await plain.close();

  console.log("PASS: mobile and no-JS");
  // Source-backed Studio adapter fixture. Not a claim of live editor certification.
  const origin = new URL(base).origin;
  await context.route("**/studio-fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<iframe title="Studio fixture" src="/?studio-fixture#avb-design"></iframe>',
    }),
  );
  await context.route("**/?studio-fixture", async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      "<head>",
      `<head><meta name="studio-parent-origin" content="${origin}">`,
    );
    await route.fulfill({ response, body });
  });
  await page.goto(`${base}/studio-fixture`);
  const frame = await (
    await page.locator("iframe").elementHandle()
  ).contentFrame();
  await frame.waitForSelector(".hero_intro_wrap");
  await smooth(false, frame);
  await frame.waitForFunction(
    () => document.documentElement.dataset.studioEditing === "true",
  );
  await frame.evaluate(() =>
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { type: "studio:interactive", enabled: true },
        origin: "https://untrusted.example",
        source: parent,
      }),
    ),
  );
  assert.equal(
    await frame.evaluate(() => document.documentElement.dataset.studioEditing),
    "true",
  );
  await page.evaluate(
    (origin) =>
      document
        .querySelector("iframe")
        .contentWindow.postMessage(
          { type: "avb:interaction", mode: "interact" },
          origin,
        ),
    origin,
  );
  await smooth(true, frame);
  await frame.evaluate(() => document.dispatchEvent(new Event("avb:morphed")));
  await smooth(true, frame);
  await page.evaluate(
    (origin) =>
      document
        .querySelector("iframe")
        .contentWindow.postMessage(
          { type: "studio:interactive", enabled: false },
          origin,
        ),
    origin,
  );
  await smooth(false, frame);
  assert.deepEqual(errors, [], "No browser runtime errors");
  console.log(
    "PASS: motion, preference changes, dialog/focus, teardown/reconnect, ClientRouter navigation/history/anchors, library tabs, mobile, no-JS and simulated Studio parent/morph signals.",
  );
} finally {
  await context.close();
  await browser.close();
}
