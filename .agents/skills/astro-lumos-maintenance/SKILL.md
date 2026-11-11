---
name: astro-lumos-maintenance
description: Check or integrate upstream Lumos for Astro updates in Astro Lumos Starter while preserving its motion runtime, theme, project skills and tested behavior. Use for framework maintenance, including the scheduled update check.
---

Read AGENTS.md and docs/maintenance.md. Run npm run updates:check and inspect current Lumos docs/release notes. Treat API or network failure as an unverified check. Compare exact commit SHAs, not only npm versions. Lumos components are scaffolded source; npm update alone is insufficient.

Use the repository-local lumos-upgrade-version skill for the three-way merge, with the starter protections in docs/maintenance.md taking precedence for local additions. Keep the original starter's Git tree clean and preserve a baseline commit and visual evidence. Evaluate candidate changes in an isolated local branch/worktree; never discard existing user edits.

Preserve locally added starter/page/interaction/release/maintenance skills and their symlinks, custom pages, colour tokens, runtime and tests. Integrate compatible changes locally only after appropriate build, browser and visual checks pass, the original head/tree remain unchanged, and visual differences are explained. Update the Lumos baseline stamp only to the source actually merged. A missing browser or failed visual check is a remaining validation gap, not a passed release.

Record the sources, included/omitted upstream changes, actual checks, remaining Studio limitations and source archive path. Leave conflicts, removed-prop choices, visual regressions, failed tests or major upgrades isolated for review. For the explicitly configured original-starter task, push verified changes to MadeByKin/astro-lumos-starter main only under the publication checks in docs/maintenance.md. Verify the exact remote, outgoing commits, clean tree and unchanged validated HEAD; fetch first, use a normal fast-forward push and verify the remote SHA. Divergence, unverified commits or incomplete checks stop publication. Never force-push, deploy, modify client copies or install unrelated services. This push authorisation does not extend to generated client projects.

Preserve visible route-level section composition and the shared overlay/animation controllers during framework upgrades; these are explicit project conventions.
