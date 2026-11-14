# Maintaining Astro Lumos Starter

Lumos components and tokens are copied source. `package.json` records the integrated `lumos.version` and exact `lumos.commit` used as the three-way merge baseline.

## Check for updates

```sh
npm run updates:check
# Save the verified comparison:
npm run updates:check -- --write
```

The checker compares the baseline with the upstream main commit and reads its package version. Review [Lumos docs](https://lumosframework.com/docs/) and release notes too. Network/API failures leave the update status unverified. The checker reports candidates; integration is a separate step.

## Integration workflow

1. Confirm the checkout, branch, HEAD and clean tree. Preserve existing edits; a dirty tree permits read-only checking. Capture a baseline commit and desktop/mobile screenshots.
2. Prepare the candidate in an isolated branch/worktree using `.agents/skills/lumos-upgrade-version/SKILL.md` and the recorded upstream baseline.
3. Merge shared files three ways, check dependency pairings and record included/omitted changes. Preserve theme tokens, pages, runtime, controls, tests and local skills. Leave conflicts, removed-prop decisions and breaking changes for review.
4. Run type checks, unit/scaffold tests, build and production browser checks. Run development checks when diagnostics/helpers change. Compare before/after captures and explain visual differences. Check the installed Studio when editor integration changes, recording any remaining gap.
5. Integrate and commit only after validation passes and the original branch, HEAD and clean tree remain unchanged. Advance the Lumos stamp to the source actually merged.

## Scheduled publication

The maintainer's configured Monday 09:00 Europe/London task follows this workflow and may push verified starter changes to `https://github.com/MadeByKin/astro-lumos-starter.git`, branch `main`. This authorisation applies only to the configured original checkout. Cloning the repository does not install a task or authorise publication of client projects.

Before publishing, confirm the exact checkout, branch and remote; fetch `origin`; review every outgoing commit; and recheck clean status and the validated HEAD. Remote main must be an ancestor of that HEAD. Use a normal `git push origin main`, then verify the remote SHA matches.

Stop publication if the remote advances or diverges, authentication fails, the tree/HEAD changes or validation is incomplete. Preserve the candidate and report the blocker; force-push and automatic remote conflict resolution are excluded. A no-change run needs no commit or push. Retry a verified unpushed commit after reviewing its recorded checks, rerunning validation if relevant state changed. Deployments, client-site updates and Astro major upgrades require separate decisions.

## Preserve during upgrades

Keep route-level section composition, shared attribute-driven animations/overlays, scoped cleanup, reduced motion, the trusted-origin Studio adapter, root viewport transitions and scrollbar preferences. Preserve local `astro-lumos-*` skills, their Claude links, `CLAUDE.md`, project-specific `AGENTS.md`/`LUMOS.md` rules and development-only Tick diagnostics. Optional global skill pointers stay local to each machine.

Preserve the standalone contact Worker, `wrangler.jsonc` routing/bindings, Form component's optional Turnstile lifecycle and client setup documentation. Keep the email and Turnstile defaults unconfigured in the reusable starter. Upstream form replacements must retain honest failure states, server-side validation and spam verification.

## Source archive

After committing a verified update:

```sh
mkdir -p outputs
git archive --format=zip --prefix=astro-lumos-starter/ --output=outputs/astro-lumos-starter.zip HEAD
```

The ignored ZIP contains tracked source from that commit. See [recorded validation](verification.md) for test coverage and [provenance](provenance.md) for the integrated baseline.
