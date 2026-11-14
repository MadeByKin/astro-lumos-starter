import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.env.BASE_URL || "http://127.0.0.1:8787";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHANNEL
    ? { channel: process.env.PLAYWRIGHT_CHANNEL }
    : {}),
});
const context = await browser.newContext();
context.setDefaultTimeout(10000);
context.setDefaultNavigationTimeout(15000);
const errors = [];
const calls = [];
let outcome = 502;
try {
  await context.route(
    "https://challenges.cloudflare.com/turnstile/v0/api.js*",
    (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: `window.__widgets = new Map(); window.__widgetCount = 0; window.__widgetRemoved = 0;
    window.turnstile = {
      render(container, options) {
        const id = String(++window.__widgetCount);
        const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Complete test spam check';
        const input = document.createElement('input'); input.type = 'hidden'; input.name = 'cf-turnstile-response';
        button.onclick = () => { input.value = 'test-token-' + id; options.callback(); };
        container.append(button, input); window.__widgets.set(id, { container, options, input }); return id;
      },
      reset(id) { const widget = window.__widgets.get(id); widget.input.value = ''; },
      remove(id) { const widget = window.__widgets.get(id); if (widget) { widget.container.replaceChildren(); window.__widgets.delete(id); window.__widgetRemoved++; } }
    };`,
      }),
  );
  await context.route("**/api/contact", async (route) => {
    calls.push(route.request().postData());
    await new Promise((resolve) => setTimeout(resolve, 50));
    await route.fulfill({
      status: outcome,
      contentType: "application/json",
      body: JSON.stringify({ ok: outcome === 200 }),
    });
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base + "/contact-test-fixture");
  const search = page.locator('form[name="search-test"]');
  await search.getByRole("textbox").fill("two words");
  await search.getByRole("button").click();
  await page.waitForURL(
    (url) =>
      url.pathname === "/next" && url.searchParams.get("q") === "two words",
  );
  await page.goto(base + "/contact-test-fixture");
  const contact = page
    .locator("lumos-form")
    .filter({ has: page.locator('form[action="/api/contact"]') })
    .first();
  const submit = contact.getByRole("button", {
    name: "Send message",
    exact: true,
  });
  assert.equal(
    await contact.locator(".form_wrap").getAttribute("data-site-key"),
    "browser-test-key",
    "Build with PUBLIC_TURNSTILE_SITE_KEY=browser-test-key for these fixtures",
  );
  await contact
    .getByRole("button", { name: "Complete test spam check" })
    .waitFor();
  assert.equal(await submit.isDisabled(), true);
  await contact
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Jane Smith");
  await contact
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("jane@example.net");
  await contact
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Please tell me about your services.");
  await contact
    .getByRole("button", { name: "Complete test spam check" })
    .click();
  await contact.evaluate(() => {
    const widget = [...window.__widgets.values()][0];
    widget.options["expired-callback"]();
  });
  assert.equal(
    await submit.isDisabled(),
    true,
    "Expiry requires another challenge",
  );
  await contact
    .getByRole("button", { name: "Complete test spam check" })
    .click();
  await submit.click();
  await contact.locator('.form_wrap[data-state="failed"]').waitFor();
  assert.equal(
    await contact
      .getByRole("textbox", { name: "Message", exact: true })
      .inputValue(),
    "Please tell me about your services.",
  );
  assert.equal(
    await submit.isDisabled(),
    true,
    "Failure resets the consumed challenge",
  );
  outcome = 200;
  await contact
    .getByRole("button", { name: "Complete test spam check" })
    .click();
  await contact.locator("form").evaluate((form) => {
    form.requestSubmit();
    form.requestSubmit();
  });
  await contact.locator('.form_wrap[data-state="sent"]').waitFor();
  assert.equal(
    calls.length,
    2,
    "Only one request while sending, plus the failed attempt",
  );
  assert.match(calls[1], /name="email"/);

  await page.evaluate(() => {
    const host = document
      .querySelector('.form_wrap[data-cloudflare="true"]')
      .closest("lumos-form");
    const parent = host.parentElement;
    host.remove();
    parent.append(host);
    const clone = host.cloneNode(true);
    clone.dataset.testClone = "true";
    parent.append(clone);
  });
  await page.waitForFunction(() => window.__widgets.size === 2);
  const clone = page.locator('lumos-form[data-test-clone="true"]');
  await clone.getByRole("button", { name: "Complete test spam check" }).click();
  assert.equal(
    await clone
      .getByRole("button", { name: "Send message", exact: true })
      .isEnabled(),
    true,
  );
  assert.equal(
    await submit.isDisabled(),
    true,
    "Instances keep separate readiness",
  );
  await clone.evaluate((el) => el.remove());
  await page.waitForFunction(() => window.__widgets.size === 1);
  await page.evaluate(() =>
    document.dispatchEvent(new Event("site:content-updated")),
  );
  await page.waitForFunction(() => window.__widgets.size === 1);
  assert.equal(await submit.isDisabled(), true);

  const generic = page
    .locator("lumos-form")
    .filter({ has: page.locator("form:not([action])") })
    .first();
  await generic.locator("form").evaluate((form) => {
    for (const field of form.querySelectorAll("[required]"))
      field.removeAttribute("required");
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
  await generic.locator('.form_wrap[data-state="failed"]').waitFor();
  assert.equal(
    calls.length,
    2,
    "Unconfigured generic forms do not fake success or submit",
  );
  await context.route("**/form-service", (route) =>
    route.fulfill({ status: 200, body: "accepted" }),
  );
  await generic.evaluate((host) => {
    host.querySelector(".form_wrap").dataset.endpoint = "/form-service";
    host
      .querySelector("form")
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await generic.locator('.form_wrap[data-state="sent"]').waitFor();
  assert.equal(
    await generic.locator("[data-contact-challenge]").count(),
    0,
    "Other endpoints do not add a challenge",
  );

  await page.goto(base + "/contact-test-fixture");
  await page
    .locator('lumos-form:has(form[action="/api/contact"])')
    .getByRole("button", { name: "Complete test spam check" })
    .waitFor();
  await mkdir(new URL("../output/playwright/", import.meta.url), {
    recursive: true,
  });
  const form = page.locator('.form_wrap[data-cloudflare="true"]');
  await page
    .locator(".nav_wrap")
    .evaluate((el) => (el.style.visibility = "hidden"));
  await form.screenshot({
    path: new URL("../output/playwright/contact-desktop.png", import.meta.url)
      .pathname,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await form.screenshot({
    path: new URL("../output/playwright/contact-mobile.png", import.meta.url)
      .pathname,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .locator(".nav_wrap")
    .evaluate((el) => el.style.removeProperty("visibility"));
  await page.locator('.nav_links a[href="/"]').click();
  await page.waitForURL(base + "/");
  await page.waitForFunction(() => window.__widgets.size === 0);
  await page.goBack();
  await page.waitForURL(base + "/contact-test-fixture");
  await page.waitForFunction(() => window.__widgets.size === 1);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: contact widget readiness/expiry, failure/retry, preserved input, duplicate-submit guard, independent instances, removal/remount, navigation and responsive layout. External services mocked; no email sent.",
  );
} finally {
  await context.close();
  await browser.close();
}
