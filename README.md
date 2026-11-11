# Astro Lumos Starter

A reusable static Astro foundation with Lumos components, Lenis, GSAP + ScrollTrigger, scoped cleanup, attribute-driven sitewide effects, live reduced-motion handling and an isolated Stacki Studio adapter.

## Start a client project

Requires Node 22.23.4+ and npm. Use the installed Codex starter skill on this Mac, or the terminal commands below. Each client gets an independent folder and Git repository.

### New-client checklist

- [ ] Choose a lowercase, hyphenated project name, a new destination folder and, if known, the live website URL. The destination must not already exist.
- [ ] Ask Codex to generate the project with the prompt below. The global starter skill is already installed on Jordan’s Mac and points to `/Users/jordangilroy/build/astro-lumos-starter`.

  ```text
  Use $astro-lumos-starter to create /Users/jordangilroy/build/client-name,
  named client-name, with the website URL https://client-domain.com.
  Install dependencies, initialise a separate Git repository, and verify
  the starter works. Follow the copied project instructions and skills.
  ```

  Replace the example name, path and URL. If the URL is unknown, omit it; the generated project retains an example origin that must be replaced before launch.

- [ ] In Stacki, choose **Open Existing Project…** and select the generated client folder. Stacki starts the project’s development server. Open this folder rather than creating another blank Astro project. See the [Stacki quick start](https://stacki.build/docs/quick-start/).
- [ ] Open that **same client folder** as a project in Codex and start a fresh chat there. Use this first prompt:

  ```text
  Read AGENTS.md and LUMOS.md, and identify the relevant project skills
  before making changes. Follow this project’s route-level page composition,
  explicit data-attribute animations, shared Lenis/GSAP runtime, cleanup,
  reduced-motion, Stacki and validation conventions. Confirm the client
  checkout before editing and customise this project only.
  ```

- [ ] Confirm Codex can see the project skills. If they do not appear, restart Codex with the client folder open. Request a specific workflow when useful:

  ```text
  Use $astro-lumos-page to build the home page from this brief: [brief].
  Keep ordinary sections in src/pages/index.astro and extract only useful
  content, styling or interaction boundaries.
  ```

  ```text
  Use $astro-lumos-interaction to implement [interaction]. Use an explicit
  data attribute, the shared runtime and scoped cleanup. Check reduced
  motion, navigation and removal/reinsertion before calling it complete.
  ```

- [ ] Set the client’s identity and origin in `src/consts.ts`, replace demo content/assets and configure any required forms or CMS. Review [Before shipping](#before-shipping).
- [ ] Check the actual page in Stacki’s design and interactive modes, plus a normal browser. Follow [the installed-editor checklist](docs/stacki.md#check-inside-your-installed-editor); automated simulation does not certify the installed editor.
- [ ] Before review or release, ask:

  ```text
  Use $astro-lumos-release to validate this client project. Run the required
  checks, review desktop/mobile and motion behaviour, and provide a working
  local preview. Report untested integrations and remaining launch setup.
  ```

- [ ] Create and connect a separate client GitHub repository under the agreed owner. The generator initialises neither Git nor a remote; the setup prompt above asks Codex to initialise local Git. To publish, explicitly ask:

  ```text
  Create a private GitHub repository named client-name under [owner],
  connect this client checkout to it, commit the reviewed source and push.
  Exclude dependencies, build outputs, editor state and secrets.
  ```

### What keeps Codex consistent

The generator copies these files into every client project:

| File or folder    | Purpose                                                               |
| ----------------- | --------------------------------------------------------------------- |
| `AGENTS.md`       | Project-wide instructions and required checks                         |
| `LUMOS.md`        | Lumos component and styling conventions                               |
| `.agents/skills/` | Page, interaction, release, maintenance and inherited Lumos workflows |
| `docs/`           | Motion, Stacki, navigation, Tick and supporting guidance              |

Keep these files in the client repository. Codex discovers repository skills in `.agents/skills` and loads the relevant instructions when a skill is selected or matched to a task; explicit skill prompts make the intended workflow clear. See [official skill guidance](https://learn.chatgpt.com/docs/build-skills).

Client projects are independent copies: weekly maintenance updates the original starter locally, not existing client sites. Review and apply updates to client projects separately.

### Terminal alternative

From the original starter:

```sh
cd /Users/jordangilroy/build/astro-lumos-starter
npm run new -- /Users/jordangilroy/build/client-name --name=client-name --site=https://client-domain.com
cd /Users/jordangilroy/build/client-name
npm ci
git init
npm run dev
```

The scaffolder copies source, lockfile and project skills without dependencies, Git history, editor state or secrets. Keep this starter as the reusable source. If Stacki already owns the client dev server, use its URL rather than starting another server unnecessarily.

### GitHub template alternative

On [MadeByKin/astro-lumos-starter](https://github.com/MadeByKin/astro-lumos-starter), choose **Use this template** to create a separate client repository, then clone the new client repository and run `npm ci`. Open that client folder in Stacki and Codex and follow the checklist above. This route copies the instructions and skills too, but does not run our naming/origin setup: update `package.json`, the matching package-lock names and `src/consts.ts` for the client. The repository already exists on this route, so skip the create-repository prompt.

### Installing the starter skill on another Mac

Run `npm run skills:install` once from the original starter to install `astro-lumos-starter` in the local Codex skill directory and record this starter’s location. The installer refuses to overwrite an existing skill. Restart Codex if needed. This is a machine-level entry point for creating new projects; the project-level skills are already included in every generated site and need no separate global installation.

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
