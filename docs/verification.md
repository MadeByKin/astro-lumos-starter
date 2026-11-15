# Starter verification

Checked on 14 November 2026 with Node 26.13.0, npm 11.20.0, Google Chrome and Wrangler 4.162.0. Use the [README validation commands](../README.md#validate) to repeat the checks in a fresh client project.

| Area                             | Result                                                                                                                                                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Install and build                | A generated project installed 306 packages from the lockfile using the local npm cache. Astro reported zero diagnostics across 77 files and built four static pages, robots.txt and the sitemap.                                                                                                 |
| Project generator and unit tests | All 12 tests passed. Coverage includes name and origin substitution, destination protection, local settings and environment-file exclusions, skill installation, scoped cleanup and Worker contact handling.                                                                                     |
| Component and page review        | The prop audit reported zero findings across 36 components. All four built pages had one main heading, unique IDs and valid local links and fragments. Relative documentation links resolved.                                                                                                    |
| Production browser               | Chrome passed navigation, history and anchors, keyboard access, dialog focus and concurrent locks, reconnects, live reduced motion, mobile layout, no-JavaScript navigation and simulated Studio mode changes. Desktop and mobile captures were reviewed.                                        |
| Development browser              | A background server in the generated project passed Tick, diagnostics, shared frame and viewport subscription checks.                                                                                                                                                                            |
| Contact forms                    | The isolated fixture passed native GET submission, challenge expiry, failure and retry, duplicate-submit prevention, multiple forms and navigation cleanup. Its output is separate from the deployable build. Turnstile, email and rate-limit services were simulated in their respective tests. |
| Worker                           | The generated project passed a Wrangler upload dry run. Local HTTP checks returned 200 for inner pages, 307 from the trailing-slash URL to its canonical path, 404 for an unknown route, 405 for GET on the contact API and 403 for a submission from the wrong origin.                          |
| Upstream                         | Lumos 1.0.4 was integrated at `43e4d5290fd7fa5165e2118689e680971624f0cb`; [update checks and visual comparison](maintenance/1.0.4-review.md).                                                                                                                                                    |

npm 11 reported install-script policy warnings for esbuild, fsevents and workerd. The clean install, local Worker and production build passed on this Mac with the default settings.

## Checks to complete for a client release

- Open the generated project in the installed editor and verify prop editing, duplication, saving and switching previews. [Stacki acceptance steps](stacki.md#check-inside-your-installed-editor)
- Publish to the intended Cloudflare account and verify DNS, the domain, the deployed Worker and its bindings. [Cloudflare publishing](cloudflare.md)
- For sites with enquiries, validate a real Turnstile challenge and confirm inbox delivery and Reply-To on the final domain. [Contact form setup](contact-forms.md)
- Repeat browser checks on the devices and browsers required by the client. This review used headless Chrome and a mobile viewport.

The live npm advisory check was unavailable during this review. Dependency advisory status remains unverified.

## Bunny video update — 15 November 2026

Added the reusable Bunny HLS player and background with Lumos styling, scoped cleanup, motion-aware autoplay and custom accessible controls. The examples have distinct section labels; the player poster/video cover the selected ratio. Removed the previous direct-file `Video` component and its showcase section. Generated-project checks confirm the Bunny components, setup guide and locked HLS dependency are included.

After removal, `npm run check` reported zero diagnostics across 81 files, all 12 unit/scaffold/contact tests passed, and the production build passed. Chrome passed both the shared-runtime browser suite and the dedicated Bunny suite. Earlier Bunny checks also passed in WebKit, and the supplied live Bunny stream played in Chrome. Desktop/mobile screenshots were reviewed. See [Bunny setup and detailed coverage](bunny-video.md).

Vite reports a chunk-size warning for dynamically loaded HLS.js. Physical iPhone fullscreen and installed Stacki UI editing remain untested. No hosting deployment was present under the configured `astro-lumos-starter` Worker name in the connected Cloudflare account at publication preparation.
