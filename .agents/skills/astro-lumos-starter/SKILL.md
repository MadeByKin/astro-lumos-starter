---
name: astro-lumos-starter
description: Create a new Lumos/Astro client project from this starter checkout, including Lenis, GSAP, cleanup, reduced motion and Stacki guidance. Use for new projects, not to replace existing repositories.
---

Locate the source relative to this skill: in the repository, go three directories up from this SKILL.md's directory to the repository root. For an optional globally installed copy, read starter.json alongside this file instead. Verify the source contains scripts/create-project.mjs and package.json with name astro-lumos-starter. If it is a generated client project or the pointer is missing/stale, ask for the maintained starter checkout; do not use a client site as a template or assume a machine-specific path.

Run node <source>/scripts/create-project.mjs with an absolute new destination and --name=project-name. Add --site=https://client.example when the real origin is known; otherwise retain the example origin and flag it before launch. The script refuses existing destinations and copies no dependencies, Git history, editor state or secrets. Read its output and run npm ci in the result. Initialise Git or publish a repository only when requested.

Read the result's AGENTS.md, LUMOS.md and relevant project skills before implementation. Customise that result, never the source template or an unrelated site. Astro ClientRouter is already enabled; do not add Taxi.js or another router. Shared sitewide animations use explicit data attributes and one implementation in src/scripts, never heading-tag selectors or repeated component scripts.

Compose ordinary Section/ContentWrapper/Grid sections directly in route files. Extract only useful content, styling or interaction boundaries; read astro-lumos-page. Shared overlays use src/scripts/overlays.ts with independent instance state and cleanup. Use astro-lumos-interaction for behaviour and astro-lumos-release for validation. Preserve the shared Lenis/GSAP clock, live reduced motion and Stacki editor contract. Obtain a working visual preview and report actual checks and untested editor behaviour before calling UI changes complete.
