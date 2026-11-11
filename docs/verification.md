# Delivery verification · 11 November 2026

Verified on the delivered source with Node 26.13.0 and installed Google Chrome, using the production static build at localhost:4323.

- `npm run check`: zero errors, warnings or hints.
- `npm test`: three passing checks covering scope disposal, timers/observers, clean project scaffolding, destination refusal and symlink recursion prevention.
- `npm run build`: four static pages plus robots/sitemap generated successfully.
- `BASE_URL=http://127.0.0.1:4323 PLAYWRIGHT_CHANNEL=chrome npm run test:browser`: passed. Checked live reduced-motion changes and initially reduced motion, dialog Escape and focus return, scroll-lock cleanup after component removal, concurrent modal locks, observer counts across repeated mounts, simulated BFCache lifecycle events, full document navigation/back, anchors and skip link, library tab click/keyboard behavior after reconnection, narrow viewport overflow, no-JavaScript navigation and the simulated Studio adapter.
- The Studio fixture checked parent/origin filtering, select/interact signals, interactive mode persistence after a morph, and return to design mode.
- Desktop and narrow-screen screenshots were visually inspected.
- A fresh project was generated separately, installed from its lockfile and type-checked successfully.
- Both project skills and the installed `astro-lumos-starter` skill passed the supplied skill validator.

No live Stacki UI certification, Safari/Firefox run, real touch-device test, performance benchmark or production Cloudflare deployment was performed. The fixture and browser checks cover this starter's runtime contract; they do not prove every inherited component's behavior in every editor version. Follow docs/stacki.md for the installed editor review, particularly source mapping of lifecycle hosts and prop/page saving.

The default canonical origin, identity, logos, favicon and demo content are intentional template placeholders, listed in README.md. Forms need a configured, tested endpoint. No client credentials are present or required to run this starter.

## Refinement validation

Revalidated the renamed Astro Lumos Starter 1.1.0 with Lumos 1.0.3 and Astro 7.4.7:

- Type check: zero errors, warnings or hints. The three unit/scaffolding checks pass.
- Static build and the complete production-browser suite pass, including restored original brand token/card assertions and no active development panel in production.
- The separate development-browser suite passes: Shift+F panel toggle/FPS display, shared GSAP-clock frame subscription, live reduced-motion stop/resume, and independently disposable viewport subscriptions.
- Confirmed no diagnostics panel strings in the generated production assets. This is a local developer panel, not a Web Vitals or Lighthouse score.
- Visually reviewed the restored dark/lime desktop and narrow-screen screenshots. No edits were made to the original Lumos base.css tokens. The wrapper/container fix is the only adopted upstream component change.
- The upstream checker completed successfully against the public exact commit and saved a no-pending-update report in docs/maintenance/last-check.json.
- The original new-project skill was renamed to astro-lumos-starter and its source pointer updated; the UI label is Astro Lumos Starter.
- Scheduled maintenance is active as maintain-astro-lumos-starter for Mondays at 09:00 local Europe/London time. It integrates compatible validated updates locally and never deploys or changes client projects.

The live Studio, other-browser/device and deployment limitations above still apply.

## Data-attribute and ClientRouter refinement

Version 1.2.0 follows the user's explicit animation convention: shared effects live once in src/scripts and only data-reveal enables a reveal. Removed the old Reveal wrapper. Hero content now uses a consistent responsive gap, with a shorter 0.75rem title movement to retain breathing room during the reveal.

Enabled Astro ClientRouter with fade on the home page and slide on the second page. Component scopes dispose before swaps and initialize on incoming connection/page load; the global reveal scanner clears outgoing contexts and binds incoming data attributes. The manual site motion switch survives root attribute swaps.

Production browser checks passed for data-attribute insertion/removal, an unmarked h1 remaining unchanged, title/body spacing, same-document navigation, four repeated home/next round trips with stable observer counts, history/anchors, controls, reduced motion, no-JavaScript fallback and the simulated Studio adapter. Original validation history above describes earlier versions; current routing and reveal behavior is documented in docs/navigation.md and docs/astro-basics.md.

Final checks also covered motion-off persistence through router swaps, first client-side arrival at the component library (including its newly loaded scripts), and the development diagnostics/subscription suite. Desktop and mobile screenshots were visually reviewed after the spacing change.

## Page composition and shared controls (1.3.0)

The canonical workspace is now `/Users/jordangilroy/Build/astro-lumos-starter`. Imported the previously verified source from commit a955d1b without copying its Git history, editor state or dependencies. The installed starter pointer and the existing weekly maintenance automation were updated to this workspace; the earlier source remains a historical copy.

Moved all home-page Sections, ContentWrappers and Grid composition into index.astro. Removed the whole-page MotionDemo abstraction. Smaller HeroIntro and PrincipleCard components own their content/style boundaries and have no browser scripts. Replaced the bespoke demo dialog with the existing Modal component. Shared Modal/Dropdown behavior now lives once in src/scripts/overlays.ts, using data attributes and independent instance scopes. Keyboard focus into native details content waits until opening styles paint; scheduled focus is cancelled on removal/navigation.

The browser suite covers the demo dialog, Escape/focus return, concurrent modal locks, removal/reinsertion, dropdown arrow/Escape/outside-click handling after reconnection, repeated ClientRouter navigation, motion preferences, no-JavaScript fallback and the simulated Studio signals. Screenshots use fileURLToPath so workspace names containing spaces are handled correctly. The new page-composition skill and updated project/global guidance were validated with the supplied skill validator.

Final 1.3.0 result: type checks (zero diagnostics), three unit/scaffold checks, the production build, the complete production-browser suite and development diagnostics/subscription checks passed. Desktop and mobile screenshots were reviewed. Installed Studio UI acceptance remains unverified.

## Tick and repository relocation — 1.4.0

The maintained checkout is now `/Users/jordangilroy/build/astro-lumos-starter` (macOS resolves the existing parent as `Build`). The installed new-project skill pointer and Monday maintenance task reference this checkout; the unrelated Plyed folder was left intact.

- Type check: 70 files, zero errors, warnings or hints. All three unit/scaffolding checks pass.
- Static build passes. Generated production assets contain neither the Tick marker nor diagnostic metric labels; the production browser suite verifies the API/marker are absent.
- Production browser suite passes for motion, cleanup, ClientRouter, dialogs/focus, mobile, no JavaScript and simulated Studio signals.
- Development browser suite passes for Tick timing values, function return/this/error preservation, optional frame sampling and stop, route persistence and cleanup, alongside the Shift+F panel, shared clock, live reduced motion and viewport disposal.
- Reviewed the production desktop and narrow-screen captures; original Lumos theme and page composition remain intact.

These are local functional checks, not production performance benchmarks or certification of the installed Stacki editor. Tick's document observations and soft-route durations have separate labels; it makes no isolated eval, INP, Lighthouse TBT/TTI or causal frame-attribution claims.

## Console readability refinement

Tick prints styled badges, rounded units and labelled LCP/CLS threshold ratings. Raw numeric API precision is preserved. Paint/shift observer callbacks coalesce updated console lines, and detailed document timings stay collapsed.

Type check, all three unit/scaffolding tests, static build and both browser suites pass. The development suite checks real paint output, green LCP/CLS styling and readable startup marks. A separate Chromium observer-injection check verified LCP at 2500, 2500.01, 4000 and 4000.01ms, including amber/red styles and classification before rounding. Production assets still exclude the marker and diagnostic labels. These are functional checks; candidate/live ratings are development observations rather than field scores.

## Metric deduplication refinement

Removed the automatic startup metric snapshot. Available metrics print once, then only when their formatted value or rating changes; explicit reports share the same cache. Cache state is cleared on session cleanup/reinstall. Type check, unit/scaffolding checks, static build and development browser suite pass. Chromium injected-observation checks verified no placeholders, suppression of hidden precision changes, and both rating-only and displayed-value changes.
