# Astro Lumos Starter

A reusable static Astro foundation with Lumos components, Lenis, GSAP + ScrollTrigger, scoped cleanup, attribute-driven sitewide effects, live reduced-motion handling and an isolated Stacki Studio adapter.

## Start a client project

Requires Node 22.23.4+ and npm. From this starter:

```sh
npm run new -- /absolute/path/to/client-site --name=client-site --site=https://client.example
cd /absolute/path/to/client-site
npm ci
npm run dev
```

The destination must not exist. The scaffolder copies the source, lockfile and project skills, without dependencies, Git history, editor state or secrets. Keep this starter as your reusable source. Run `npm ci` in this folder only to preview or maintain the starter itself.

To make this available in future Codex chats, run `npm run skills:install` once from this original starter. It installs `astro-lumos-starter` in your Codex skill directory and records this starter's location. Restart Codex if needed, then ask: **“Use $astro-lumos-starter to start a site at …”**. The installer refuses to overwrite an existing skill. Project-level page-composition, interaction, release and maintenance skills travel with every generated site.

## Included

- Lumos for Astro 1.0.3 foundation and its component library and original skills.
- One Lenis instance, driven by GSAP's ticker, with native touch and anchor navigation.
- One shared data-reveal script with scoped GSAP/ScrollTrigger instances; content remains visible without JavaScript.
- Resource scopes for listeners, timers, RAF callbacks, observers and fetch cancellation.
- Reference-counted scroll locking, native dialog focus handling and cleanup.
- Reduced-motion changes handled while the page is open. Motion also pauses in hidden tabs and the supported Studio authoring mode.
- Astro ClientRouter with explicit fade/slide/none main-content transitions, navigation cleanup and no-JavaScript fallback. No Taxi.js.
- A demo at `/`, another page at `/next`, the inherited library at `/example-components`.
- Unit checks, repeatable Chromium browser checks, scoped frame/resize helpers and development-only diagnostics.

## Validate

```sh
npm run check
npm test
npm run build
npm exec playwright install chromium
npm run preview -- --host 127.0.0.1 --port 4323
# In another terminal:
BASE_URL=http://127.0.0.1:4323 npm run test:browser
```

For development helpers, run `npm run dev -- --host 127.0.0.1 --port 4322`, then `BASE_URL=http://127.0.0.1:4322 npm run test:development` in another terminal.

On a machine with Google Chrome installed, set `PLAYWRIGHT_CHANNEL=chrome` instead of downloading Chromium. Browser checks write screenshots to `output/playwright/` (ignored by Git). `npm run dev` provides a local visual preview; never treat a passing build as proof that the Studio canvas works.

## Before shipping

Set `src/consts.ts` (site name, description, canonical origin, locale). Replace the neutral demo, Lumos logos, favicon and social image. Remove example-only pages as appropriate. Configure and test a real form endpoint: the inherited form is a demonstration until an endpoint is supplied. Keep private credentials in provider-managed server secrets; this starter needs none. Static output is `dist/`, suitable for Cloudflare Pages; dynamic Astro routes require a separately configured Cloudflare adapter.

Read [project instructions](AGENTS.md), [runtime and component contract](docs/motion.md), [Stacki integration and limits](docs/stacki.md), [navigation decision](docs/navigation.md) and [provenance](docs/provenance.md).

See [delivery verification](docs/verification.md) for checks performed and integration limits.

## Understand and maintain the starter

- [Astro basics and the text animation](docs/astro-basics.md)
- [Federico's setup: capability comparison and recipes](docs/federico-comparison.md)
- [Lumos updates and maintenance](docs/maintenance.md)

The demo uses the original Lumos dark theme and lime brand card; its original swatch tokens are preserved. Lumos 1.0.3 and its matching Astro 7.4.7 patch are integrated. In development, Shift+F toggles optional motion diagnostics; it is excluded from the production runtime. Run `npm run updates:check` to compare the exact upstream commit without applying changes.

## Page and behaviour structure

Compose ordinary sections directly in `src/pages/*.astro` with Section, ContentWrapper and Grid. Keep custom scripts/styles out of route files. Extract smaller content/card components only for useful markup, styling or interaction boundaries; `index.astro`, `HeroIntro.astro` and `PrincipleCard.astro` are the examples. The old whole-page MotionDemo component is removed. Shared dialog/dropdown behavior is loaded once by site.ts from overlays.ts, with explicit data attributes, native semantics and independent instance state/cleanup.

The canonical source is now this named project workspace. The installed starter skill and weekly maintenance task both point here. Source downloads are written under `outputs/`.

## Console timing

Development includes a lightweight Tick-style console utility: `tick.add("checkpoint", true)`, browser timing observations and opt-in frame-gap/function diagnostics. The head marker and module are excluded from production. See [Tick usage and measurement limits](docs/tick.md). The existing Shift+F panel remains available.

The maintained local source is `/Users/jordangilroy/build/astro-lumos-starter`; the installed starter skill and weekly maintenance task point there.
