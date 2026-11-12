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
