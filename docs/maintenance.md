# Maintaining Astro Lumos Starter

Lumos is scaffolded source, not just an npm dependency. Updating npm packages alone does not update its components or tokens. The `lumos.version` and `lumos.commit` fields in package.json record the last integrated upstream baseline. Keep the full commit: changes can arrive before a version label changes.

Run `npm run updates:check` for a read-only upstream source comparison. Add `-- --write` to save a verified report to `docs/maintenance/last-check.json`. It checks the pinned baseline against the public repository's current main tree and reads the package version at that exact commit. Network failure, rate limiting, missing baseline or an incomplete tree is an error, not evidence that the project is up to date. The script does not modify source, install dependencies or advance the baseline itself. Read current [Lumos documentation](https://lumosframework.com/docs/) and release notes as well; docs may change independently of source.

## Recurring workflow

The requested weekly check targets this original starter only. Client projects are independent snapshots; no client repository, hosting environment, account or deployed site is silently updated.

1. Verify the starter's path, Git branch and clean status. If there are existing edits, report them and keep checking upstream; do not stash, reset or overwrite user work. Retain a local pre-upgrade commit and visual screenshots.
2. Use the recorded commit for the merge base, latest upstream source for the incoming version, and this project for customizations. Follow `.agents/skills/lumos-upgrade-version/SKILL.md` with the starter-specific protections below. Work in an isolated local branch/worktree for the candidate.
3. Apply compatible framework fixes, merge shared files three ways, and check dependency pairings. Do not guess removed prop behavior or silently adopt breaking changes. Preserve user tokens/branding, demo content, runtime, tests and added skills. Document deliberate upstream omissions.
4. Run type checks, unit/scaffold checks, build and production browser suite, plus development checks when helpers/diagnostics changed. Capture desktop/mobile screenshots before and after. Every visual difference must be explained; theme or content changes are not routine upgrades.
5. After successful checks and visual review, commit and integrate compatible changes locally only if the original tree is still clean and its branch/head have not changed. Regenerate the source ZIP, advance the Lumos baseline only to the commit actually integrated and record changes/checks. If validation or merge decisions remain unresolved, leave the candidate isolated and report what needs attention.
6. Never push, publish, deploy, update client copies or upgrade an Astro major automatically. Those are separate user decisions. A no-change check should be brief and should not create empty release commits.

## Starter-specific protections

The upstream upgrade skill's wholesale `.agents/skills` refresh must not delete locally added `astro-lumos-page`, `astro-lumos-interaction`, `astro-lumos-release`, `astro-lumos-maintenance`, or project-specific sections. Preserve their Claude symlinks and LUMOS.md's local shared-animation preference section. Keep the installed `astro-lumos-starter` skill pointing at this source. Use the migration workflow for upstream skills, not the Webflow runtime's skill instructions.

Our attribute-driven global effects, ClientRouter lifecycle, interaction hosts, reduced-motion policy and trusted-origin Studio adapter are maintained additions. Review upstream edits to those components rather than replacing the scripts wholesale. The source monitor identifies a candidate; it does not prove Studio compatibility. Exercise the actual installed Studio for changes to source mapping or editing behavior when available, and state when only the simulated fixture was run.

## Initial update included in this delivery

Updated from Lumos 1.0.2 / `5e81e860175ed6cf4086c203e4178c2c6744ad93` to 1.0.3 / `9eb6523e70e49548a1e29d81ae26a5482fa0b790`:

- Took the untouched upstream ContentWrapper breakout fix: use container-query width and an inline-size container instead of viewport width, avoiding scrollbar-width overhang.
- Moved Astro from 7.4.4 to the upstream 7.4.7 patch and regenerated the lockfile. The integration dependency versions otherwise matched.
- Preserved our custom pages and original Lumos colour tokens. Upstream page content and local editor-state files were intentionally not imported.
- Did not copy upstream's GitHub Actions workflow; maintenance is handled by the explicitly requested local recurring task. No remote GitHub repository or CI publication was created.

See `docs/verification.md` for the final validation evidence.

After committing a verified update, regenerate the source archive from that exact commit with `git archive --format=zip --prefix=astro-lumos-starter/ --output=outputs/astro-lumos-starter.zip HEAD`. This replaces the archive cleanly, excludes ignored dependencies/editor state, and does not retain deleted files from a prior ZIP.

The maintained source now lives at `/Users/jordangilroy/Documents/ChatGPT/Astro Lumos Starter`. Create `outputs/` before archiving; it is ignored by Git. Preserve visible page section composition and the shared overlay controller during upgrades.
