---
name: astro-lumos-maintenance
description: Check or integrate upstream Lumos for Astro updates in Astro Lumos Starter while preserving its motion runtime, theme, project skills and tested behavior. Use for framework maintenance, including the scheduled update check.
---

Read AGENTS.md and docs/maintenance.md. Run npm run updates:check and inspect current Lumos docs/release notes. Treat API or network failure as an unverified check. Compare exact commit SHAs, not only npm versions. Lumos components are scaffolded source; npm update alone is insufficient.

Use the installed lumos-upgrade-version skill for the three-way merge, with the starter protections in docs/maintenance.md taking precedence for local additions. Keep the original starter's Git tree clean and preserve a baseline commit and visual evidence. Evaluate candidate changes in an isolated local branch/worktree; never discard existing user edits.

Preserve locally added page/interaction/release/maintenance skills and their symlinks, custom pages, colour tokens, runtime and tests. Integrate compatible changes locally only after appropriate build, browser and visual checks pass, the original head/tree remain unchanged, and visual differences are explained. Update the Lumos baseline stamp only to the source actually merged. A missing browser or failed visual check is a remaining validation gap, not a passed release.

Record the sources, included/omitted upstream changes, actual checks, remaining Studio limitations and source archive path. Leave conflicts, removed-prop choices, visual regressions, failed tests or major upgrades isolated for review. Never push, deploy, modify client copies or install unrelated services as part of a maintenance run.

Preserve visible route-level section composition and the shared overlay/animation controllers during framework upgrades; these are explicit project conventions.
