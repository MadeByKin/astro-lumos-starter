# Recorded validation

Checks recorded on 11–12 November 2026 using Node 26.13.0 and Google Chrome. This summary describes the checks performed during development; rerun the [validation commands](../README.md#validate) after project changes. Detailed change history is retained in Git.

| Check                     | Recorded result                                                              |
| ------------------------- | ---------------------------------------------------------------------------- |
| `npm run check`           | 70 files; zero errors, warnings or hints                                     |
| `npm test`                | Five passing scope, scaffolding and Codex/Claude skill-installer checks      |
| `npm run build`           | Four static pages plus robots/sitemap                                        |
| Production browser suite  | Passed for navigation, motion, controls, mobile layout and no-JavaScript use |
| Development browser suite | Passed for Tick, FPS panel, shared subscriptions and live reduced motion     |

## Browser coverage

- Dialog Escape/focus return, concurrent scroll locks and component removal/reinsertion.
- Repeated ClientRouter navigation with stable observer counts, history, anchors and skip link.
- Navigation from a scrolled position: incoming page at the top, stable viewport transition geometry and Back restoring the saved position.
- Reduced motion on initial load and changed while open; motion-off persistence across routes.
- Mobile layout and navigation, plus no-JavaScript reading/navigation.
- Simulated Studio parent/origin filtering, editing/interactive mode switches and DOM morphs.
- Tick timing, formatted ratings, duplicate suppression, function wrappers, sampling stop and cleanup; diagnostics excluded from production.

Desktop/mobile captures and a paused page-transition midpoint were visually reviewed. Additional targeted checks covered hidden scrollbars, keyboard/panel scrolling and visible-scrollbar opt-ins. Fresh-project checks verified copied skills, Claude instruction imports, safe destination handling, installer overwrite refusal, tool selection and rejection of invalid options.

## Integration coverage

The Studio adapter was tested with a simulated editor. Validate your installed version using the [Stacki checklist](stacki.md#check-inside-your-installed-editor). Safari/Firefox, physical touch devices, production performance benchmarks and a Cloudflare deployment were not covered by these recorded checks.

## Cloudflare Workers setup — 14 November 2026

Using Node 26.13.0, Wrangler 4.162.0 and Google Chrome:

- `npm run check`: 70 files, zero errors, warnings or hints. All five unit/scaffold/installer tests passed; the production static build passed.
- A fresh generated project installed with `npm ci`, built independently and passed a Wrangler upload dry run. Scaffold checks covered the substituted Worker name, deploy command, copied setup guide and rejection of names unsuitable for a `workers.dev` hostname.
- The starter passed `wrangler deploy --dry-run` with its final assets configuration. No account authentication or publication was performed.
- The production browser suite passed against `wrangler dev --local`, including ClientRouter navigation, controls, cleanup, mobile, reduced motion, no-JavaScript use and simulated Studio signals. Desktop and mobile captures were visually reviewed.
- Local Workers HTTP checks returned 200 for home and an inner page, and 404 with the custom page for an unknown URL. Explicit HTML handling preserves the starter's URLs without trailing slashes.

Live Cloudflare GitHub builds, account permissions, custom domains/certificates and installed Stacki editing remain untested. Follow [Cloudflare setup](cloudflare.md) and record those checks when connecting a real project.

## Reusable contact forms — 14 November 2026

- All 12 unit/scaffold/installer checks passed, including contact validation, request limits, origin/hostname checks, fixed email destination, spam trap, rate limiting, failed/expired Turnstile verification and provider failures. Verification, rate-limit and email services were stubbed; no email was sent.
- The production static build passed. A generated client project installed its lockfile dependencies, built independently and passed Wrangler's upload dry run with the new Worker entry point and bindings.
- Local Workers HTTP checks confirmed static pages (200), unknown pages (404), API method rejection (405) and rejected localhost submissions to the production-configured origin (403).
- The targeted contact browser fixture passed expiry, retry with preserved fields, duplicate-submit prevention, multiple instances, removal/remount, content refresh and ClientRouter cleanup. Desktop/mobile form captures were reviewed; the challenge UI and contact responses were mocked.
- The full production browser suite passed against local Workers after the form changes. The normal starter build was restored without the dummy public site key.

Live Turnstile validation, email-domain onboarding, verified recipients, inbox delivery and Stacki deployment of the Worker/bindings remain untested. Follow [client contact form setup](contact-forms.md) before launch. The handler has no submission database, automatic visitor reply or delivery guarantee.

The contact UI was subsequently consolidated into the existing Form component: `action="/api/contact"` opts into its Turnstile/spam-trap behaviour, while other endpoints retain normal submission. The separate contact component was removed. All 12 tests, type checks (75 files, zero diagnostics), production build, contact browser fixtures and the full production browser suite passed after this change. The browser fixture also verified a normal endpoint without an injected challenge. Updated desktop/mobile captures were reviewed; live service and editor limitations above still apply.
