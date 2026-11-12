# Lumos for Astro

This is **Lumos for Astro**, an Astro component framework styled with plain CSS
and custom properties. Do not apply conventions from **Lumos for Webflow**.
Project conventions live in `LUMOS.md` and `.agents/skills/`.

## Development

Start the dev server in background mode:

```
astro dev --background
```

Use `astro dev stop`, `astro dev status`, and `astro dev logs` to manage it.

## Astro documentation

Use the relevant [Astro documentation](https://docs.astro.build) before working
on these areas:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Building

Read [LUMOS.md](LUMOS.md) before adding pages, components, or styles.

## Skills

Task-specific procedures live in `.agents/skills/<name>/SKILL.md`, alongside
any scripts they need.

- `lumos-import-figma` — build pages or variables from a Figma file.
- `lumos-audit-props` — check prop order and tooltip consistency.
- `lumos-scaling-graphic` — build an editable graphic that scales as one piece.
- `lumos-import-webflow` — migrate a Webflow export and connect its CMS.
- `lumos-upgrade-version` — upgrade Lumos without losing customizations.

`.agents/skills/` is the source of truth. Claude Code loads the same skills from
relative symlinks in `.claude/skills/`. For each new skill, add
`.claude/skills/<name>` pointing to `../../.agents/skills/<name>`.

- Codex: use `$lumos-import-figma` or ask for the skill by name. Restart Codex
  if a new skill does not appear.
- Claude Code: use `/lumos-import-figma` or let it load the skill when relevant.
- Other assistants: read `SKILL.md` directly. Instructions are Markdown and
  scripts are Node.

## Astro Lumos Starter contract

Read `docs/motion.md` before modifying behaviour, and `docs/stacki.md` before changing editor integration. New interactions use `.agents/skills/astro-lumos-interaction/SKILL.md`; review/release work uses `.agents/skills/astro-lumos-release/SKILL.md`. These project-local skills are copied into every generated project. The portable astro-lumos-starter skill creates new projects from this repository checkout; it is also the source for the optional global installer. `npm run skills:install` in the original starter installs a global new-project entry point.

- Exactly one `SiteRuntime` in `BaseLayout`; it alone owns Lenis and its GSAP ticker callback. Native touch and anchors remain available; Astro ClientRouter handles internal navigation.
- Astro ClientRouter is enabled in BaseLayout. Do not add Taxi.js or another router alongside it. Preserve before-swap cleanup and page-load initialization.
- Shared reusable animations belong in `src/scripts/`, loaded once from `site.ts`, and opt in only through explicit data attributes such as `data-reveal`. Never animate all headings by tag or repeat the same effect script in each content component. Component-specific controls retain local scripts. Use scopes and GSAP contexts and release every owned resource.
- Respect reduced motion dynamically, hidden tabs and supported editor mode. Useful content remains visible without JavaScript. Do not use an unknown Stacki API or assume every iframe is an editor.
- Preserve the inherited Lumos composition/prop conventions. Review upstream upgrades around the adapted interactive scripts instead of overwriting them.
- Keep client content and brand changes in the generated project. Do not modify this reusable source while building a client site.
- Run `npm run check`, `npm test`, `npm run build`; run `npm run test:browser` against a preview when shared runtime/interaction behavior changes. Review the resulting UI before calling it complete. Describe untested live-editor behavior explicitly.

## Upstream maintenance

For framework update work use `.agents/skills/astro-lumos-maintenance/SKILL.md` and `docs/maintenance.md`. Lumos is copied source; the package stamp's commit is the three-way merge baseline. Do not replace the added runtime, modified interaction scripts, brand tokens or local skills during an upstream refresh. Validate candidate upgrades in an isolated local branch/worktree and integrate compatible changes only after checks and visual review pass. The configured recurring task may commit and push verified starter changes to MadeByKin/astro-lumos-starter main under docs/maintenance.md. It does not deploy or modify client projects. This permission applies only to that original starter, not generated client copies.

For custom continuous effects use `onMotionFrame` from `src/lib/motion/subscriptions.ts` (existing GSAP clock, motion-aware cleanup). For shared viewport updates use `observeViewport`; for scroll animation progress prefer scoped ScrollTrigger. Shift+F toggles a development-only diagnostics panel; do not present its FPS estimate as Lighthouse or field Web Vitals.

## Page composition and shared controls

Compose ordinary sections directly in `src/pages/*.astro` using Section, ContentWrapper and Grid. Do not hide an entire page or several unrelated sections in a convenience component. Keep page files free of custom scripts/styles; use smaller content/card components only when they own reusable markup, a useful styling boundary or specific behavior. The home page is the reference example. For page work read `.agents/skills/astro-lumos-page/SKILL.md`.

Shared modal/dropdown behavior is implemented once in `src/scripts/overlays.ts`, registered by `site.ts`, with explicit data attributes. Components retain semantic markup, content, props and styles; the shared controller retains separate state/scopes for each instance. Preserve existing data-modal-open/data-modal-close contracts, native dialog behavior, focus return, concurrent scroll locks, DOM removal and ClientRouter cleanup. Component-local scripts remain appropriate for genuinely component-specific controls, not repeated implementations of shared behavior.

Development-only console metrics live in src/utils/tick.ts, imported behind DEV in site.ts. Keep the early marker development-only, preserve cleanup and bounded buffers, and label head-to-module time, observed blocking and correlated frame gaps accurately. Do not claim isolated eval time, INP, Lighthouse TBT/TTI or a performance score from these local diagnostics. See docs/tick.md.

Scrollbars are hidden by default through src/styles/preferences.css without disabling scrolling. Use data-scrollbars="visible" on html for a site-wide opt-in, or on a scroll container for that subtree. Preserve this default during upstream upgrades; do not use overflow:hidden to hide scrollbars.
