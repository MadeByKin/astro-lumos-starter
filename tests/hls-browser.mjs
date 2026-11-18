import { chromium, webkit } from "playwright";
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const base = process.env.BASE_URL || "http://127.0.0.1:4323";
const engine = process.env.PLAYWRIGHT_BROWSER === "webkit" ? webkit : chromium;
const browser = await engine.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHANNEL
    ? { channel: process.env.PLAYWRIGHT_CHANNEL }
    : {}),
});
const fixture = new URL("./fixtures/hls/", import.meta.url);
const sample =
  "https://vz-6ed806ff-5e5.b-cdn.net/b6a663de-07c1-4c37-8bb6-0e79fef7fb3c/";
const cloudflareSample =
  "https://customer-example.cloudflarestream.com/example-video/manifest/";
const errors = [];
const requests = [];
let broken = false;
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
});
async function servePlaylistFixture(route) {
  const name = new URL(route.request().url()).pathname.split("/").pop();
  requests.push(name);
  if (broken)
    return route.fulfill({
      status: 403,
      body: "Unavailable",
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  if (name === "master.m3u8" || name === "video.m3u8")
    return route.fulfill({
      body: "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=400000,RESOLUTION=320x180\nhls-fixture.m3u8\n",
      contentType: "application/vnd.apple.mpegurl",
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  const body = await readFile(
    new URL(name === "playlist.m3u8" ? "hls-fixture.m3u8" : name, fixture),
  );
  return route.fulfill({
    body,
    contentType: name.endsWith(".m3u8")
      ? "application/vnd.apple.mpegurl"
      : "video/mp2t",
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}
await context.route(`${sample}**`, servePlaylistFixture);
await context.route(`${cloudflareSample}**`, servePlaylistFixture);
await context.addInitScript(() => {
  const original = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function () {
    if (window.__blockNextHlsPlay && this.closest("[data-hls-player-init]")) {
      window.__blockNextHlsPlay = false;
      return Promise.reject(
        new DOMException("Playback blocked", "NotAllowedError"),
      );
    }
    return original.call(this);
  };
});
const page = await context.newPage();
page.setDefaultTimeout(15000);
page.on("pageerror", (error) => errors.push(error.message));
const player = page.locator("[data-hls-player-init]").first();
const background = page.locator("[data-hls-background-init]").first();
const waitPlaying = (locator) =>
  locator.locator("video").evaluate(
    (video) =>
      new Promise((resolve, reject) => {
        if (!video.paused && video.readyState >= 3) return resolve();
        const timeout = setTimeout(
          () => reject(new Error("Playback did not start")),
          15000,
        );
        video.addEventListener(
          "playing",
          () => {
            clearTimeout(timeout);
            resolve();
          },
          { once: true },
        );
      }),
  );
try {
  await page.goto(`${base}/`);
  assert.equal(
    await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .some((entry) => /\/hls[.-]/.test(entry.name)),
    ),
    false,
    "homepage does not load HLS library",
  );
  await page.goto(`${base}/example-components`);
  await player.waitFor({ state: "attached" });
  await page.waitForFunction(
    () =>
      document.querySelector("[data-hls-player-init]")?.dataset.playerStatus ===
      "ready",
  );
  assert.ok(requests.includes("playlist.m3u8"), "metadata playlist loaded");
  assert.equal(
    requests.some((name) => name.endsWith(".mpegts")),
    false,
    "metadata-only mode fetches no segments",
  );
  assert.equal(
    await player.locator("[data-player-time-duration]").textContent(),
    "00:08",
  );
  await player.scrollIntoViewIfNeeded();
  await player.locator(".hls-player_start").click();
  await waitPlaying(player);
  await player
    .getByRole("button", { name: "Pause video", exact: true })
    .click();
  assert.equal(
    await player.locator("video").evaluate((video) => video.paused),
    true,
  );
  const seek = player.getByRole("slider", { name: "Seek video" });
  await seek.focus();
  await seek.press("End");
  await seek.press("Home");
  await seek.press("ArrowRight");
  assert.ok(
    (await seek.evaluate((node) => Number(node.value))) > 0,
    "keyboard seeking works",
  );
  await player.getByRole("button", { name: "Mute video", exact: true }).click();
  assert.equal(
    await player.locator("video").evaluate((video) => video.muted),
    true,
  );
  const box = await seek.boundingBox();
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2);
  await page.mouse.up();
  assert.ok(
    (await player.locator("video").evaluate((video) => video.currentTime)) > 3,
    "pointer seeking works",
  );
  assert.equal(
    await player.locator("video").evaluate((video) => video.paused),
    true,
    "scrubbing preserves pause",
  );
  await player.getByRole("button", { name: "Enter fullscreen" }).click();
  if (await page.evaluate(() => Boolean(document.fullscreenElement))) {
    assert.equal(await player.getAttribute("data-player-fullscreen"), "true");
    assert.equal(await background.getAttribute("data-player-fullscreen"), null);
    await page.evaluate(() => document.exitFullscreen());
  }
  await background.scrollIntoViewIfNeeded();
  assert.ok(
    await background.evaluate(
      (node) => node.clientWidth > 100 && node.clientHeight > 100,
    ),
    "background has a sized parent",
  );
  await waitPlaying(background);
  await background
    .getByRole("button", { name: "Pause video", exact: true })
    .click();
  await page.evaluate(() => scrollTo(0, 0));
  await background.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  assert.equal(
    await background.locator("video").evaluate((video) => video.paused),
    true,
    "manual pause survives viewport re-entry",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await background
    .getByRole("button", { name: "Play video", exact: true })
    .click();
  await waitPlaying(background);
  await page.evaluate(() => (document.documentElement.dataset.motion = "off"));
  await page.waitForFunction(
    () =>
      document
        .querySelector("[data-hls-background-init]")
        .querySelector("video").paused,
  );
  await player.scrollIntoViewIfNeeded();
  await player.getByRole("button", { name: "Play video", exact: true }).click();
  await waitPlaying(player);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  assert.equal(
    await player.locator("video").evaluate((video) => video.paused),
    true,
    "hidden tab pauses foreground playback",
  );
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  assert.equal(
    await player.locator("video").evaluate((video) => video.paused),
    true,
    "foreground playback does not resume automatically",
  );
  await player.getByRole("button", { name: "Play video", exact: true }).click();
  await waitPlaying(player);
  await page.evaluate(
    () => (document.documentElement.dataset.studioEditing = "true"),
  );
  await page.waitForFunction(
    () =>
      document.querySelector("[data-hls-player-init]").querySelector("video")
        .paused,
  );
  await page.evaluate(
    () => delete document.documentElement.dataset.studioEditing,
  );
  assert.equal(
    await player.locator("video").evaluate((video) => video.paused),
    true,
  );
  await page.evaluate((src) => {
    const original = document.querySelector("hls-player");
    const duplicate = original.cloneNode(true);
    const root = duplicate.querySelector("[data-hls-player-init]");
    root.dataset.playerSrc = src;
    root.dataset.playerLazy = "true";
    root.dataset.playerAutoplay = "false";
    original.after(duplicate);
  }, `${cloudflareSample}video.m3u8`);
  const duplicate = page.locator("[data-hls-player-init]").nth(1);
  const before = requests.length;
  await page.waitForTimeout(250);
  assert.equal(requests.length, before, "lazy duplicate makes no requests");
  await duplicate.scrollIntoViewIfNeeded();
  await duplicate.locator(".hls-player_start").click();
  await waitPlaying(duplicate);
  assert.ok(
    requests.includes("video.m3u8"),
    "Cloudflare URL loads its playlist",
  );
  assert.equal(
    await player.locator("video").evaluate((video) => video.paused),
    true,
    "instances are independent",
  );
  await page.evaluate(() => {
    const host = document.querySelectorAll("hls-player")[1];
    window.__removedVideo = host.querySelector("video");
    host.remove();
  });
  assert.equal(
    await page.evaluate(
      () =>
        window.__removedVideo.paused &&
        !window.__removedVideo.getAttribute("src"),
    ),
    true,
    "removal releases media",
  );
  await context.route(`${base}/local-video/**`, servePlaylistFixture);
  await page.evaluate(() => {
    const original = document.querySelector("hls-player");
    const host = original.cloneNode(true);
    const root = host.querySelector("[data-hls-player-init]");
    root.dataset.playerSrc = "/local-video/master.m3u8";
    root.dataset.playerLazy = "meta";
    root.dataset.playerUpdateSize = "true";
    original.after(host);
  });
  const metadata = page.locator("[data-hls-player-init]").nth(1);
  await page.waitForFunction(
    () =>
      document.querySelectorAll("[data-hls-player-init]")[1].dataset
        .playerStatus === "ready",
  );
  assert.equal(
    await metadata.locator("[data-player-time-duration]").textContent(),
    "00:08",
    "master manifest metadata resolves duration",
  );
  assert.equal(
    await metadata.evaluate((node) => node.style.aspectRatio),
    "320 / 180",
    "auto ratio comes from the master manifest",
  );
  await metadata.evaluate((node) => node.closest("hls-player").remove());
  await page.evaluate(() => {
    const original = document.querySelector("hls-player");
    const host = original.cloneNode(true);
    host.querySelector("[data-hls-player-init]").dataset.playerLazy = "false";
    original.after(host);
  });
  await page.waitForFunction(
    () =>
      document
        .querySelectorAll("[data-hls-player-init]")[1]
        .querySelector("video").readyState >= 2,
  );
  const eager = page.locator("[data-hls-player-init]").nth(1);
  assert.equal(
    await eager.locator("video").evaluate((video) => video.paused),
    true,
    "eager loading does not start playback",
  );
  await eager.evaluate((node) => node.closest("hls-player").remove());
  await page.evaluate(() =>
    document.dispatchEvent(new Event("site:content-updated")),
  );
  await player.scrollIntoViewIfNeeded();
  await page.evaluate(() => (window.__blockNextHlsPlay = true));
  await player.locator(".hls-player_start").click();
  await page.waitForFunction(
    () =>
      document.querySelector("[data-hls-player-init]").dataset.playerStatus ===
      "ready",
  );
  assert.equal(
    await player.locator("video").evaluate((video) => video.paused),
    true,
    "blocked playback returns to ready",
  );
  await player.locator(".hls-player_start").click();
  await waitPlaying(player);
  await player
    .getByRole("button", { name: "Pause video", exact: true })
    .click();
  assert.equal(
    await player.locator("video").evaluate((video) => video.paused),
    true,
    "remount does not duplicate handlers",
  );
  await page.evaluate(() => {
    window.__removedVideo = document.querySelector("hls-player video");
    document.querySelector('a[href="/"]').click();
  });
  await page.waitForURL(`${base}/`);
  assert.equal(
    await page.evaluate(() => window.__removedVideo?.paused),
    true,
    "ClientRouter cleanup pauses media",
  );
  await page.goto(`${base}/example-components`);
  await player.scrollIntoViewIfNeeded();
  broken = true;
  await player.locator(".hls-player_start").click();
  await page.waitForFunction(
    () =>
      document.querySelector("[data-hls-player-init]")?.dataset.playerStatus ===
      "error",
    { timeout: 30000 },
  );
  broken = false;
  await player.getByRole("button", { name: "Retry video" }).click();
  await waitPlaying(player);
  await player
    .getByRole("button", { name: "Pause video", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await player.scrollIntoViewIfNeeded();
  assert.ok(
    await player.evaluate(
      (node) => node.getBoundingClientRect().right <= innerWidth,
    ),
    "mobile player fits viewport",
  );
  await mkdir(new URL("../output/playwright/", import.meta.url), {
    recursive: true,
  });
  await player.screenshot({
    path: fileURLToPath(
      new URL("../output/playwright/hls-mobile.png", import.meta.url),
    ),
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await player.screenshot({
    path: fileURLToPath(
      new URL("../output/playwright/hls-desktop.png", import.meta.url),
    ),
  });
  assert.deepEqual(errors, []);
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await nojs.newPage();
  await staticPage.goto(`${base}/example-components`);
  assert.equal(
    await staticPage
      .locator("[data-hls-player-init]")
      .getByRole("link", { name: "Open video" })
      .count(),
    1,
  );
  assert.equal(
    (await staticPage
      .locator("[data-hls-player-init] video")
      .getAttribute("poster")) !== null,
    true,
  );
  await nojs.close();
  console.log(
    "PASS: HLS metadata/loading, playback, keyboard/pointer seeking, fullscreen, pause policy, instance isolation, removal/remount/navigation, retry, responsive layout and no-JS fallback.",
  );
} finally {
  await browser.close();
}
