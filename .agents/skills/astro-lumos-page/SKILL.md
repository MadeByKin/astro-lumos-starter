---
name: astro-lumos-page
description: Compose or restructure pages in Astro Lumos Starter with sections visible in route files and small content components for useful styling or behavior boundaries. Use when creating pages, adding sections or reorganizing page markup.
---

Read AGENTS.md and LUMOS.md. Use src/pages/index.astro as the current composition example. Pages import BaseLayout and compose Section, ContentWrapper and Grid directly; preserve meaningful headings, slots and the layout's shared runtime/router.

Extract smaller content/card components only when they own reusable markup, a useful styling boundary or specific behavior. Give authorable content documented props. Do not hide an entire ordinary page or several unrelated sections behind a convenience component. Keep custom scripts/styles out of page files; place component-specific styles in the smallest useful owning component and use Lumos variants/utilities for composition.

Reusable animation and overlay behavior is implemented once under src/scripts, loaded through site.ts and enabled by explicit data attributes. Use Modal/Dropdown markup and the shared overlay controller instead of inventing a duplicate dialog implementation for a demo or page. State and cleanup remain instance-owned. Do not animate headings by semantic tag.

Preserve the established visual layout when moving markup. Check desktop/mobile output, keyboard/focus, modal locking and ClientRouter navigation when affected. Run npm run check and npm run build; use the existing browser suite for shared behavior changes. Describe actual Studio editing coverage rather than treating a build or simulated iframe as proof of the installed editor UI.
