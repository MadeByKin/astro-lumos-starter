---
name: astro-lumos-release
description: Prepare an Astro Lumos project for client review or release by checking its actual motion behavior, Stacki integration, site metadata and static build. Use for review and release requests in this starter family.
---

Read README.md, AGENTS.md and docs/stacki.md. Confirm the intended checkout and requested destination before running servers or deploying. Use npm ci when dependencies are absent; preserve the lockfile.

Run npm run check, npm test and npm run build. Run browser checks against the production preview with BASE_URL and, if needed, PLAYWRIGHT_CHANNEL=chrome. See README.md for commands. Inspect the screenshot and actual responsive layout; a listening server or passing build does not prove the UI works.

Check keyboard navigation, dialog Escape and focus return, concurrent scroll locks, native anchors and history, reduced motion before load and changed live, component removal/reinsertion and editor mode switches. Match testing depth to changes and report exactly what ran. The simulated Studio fixture does not replace opening the installed Studio and verifying real prop editing, insertion, duplication, page saving and preview switching.

Before client release, set the site identity and origin, replace the demo assets and check the remaining routes and links. Cloudflare Workers Static Assets serves `dist/`. The standalone Worker handles `/api/contact`. Use `docs/cloudflare.md` for local routing checks and a Wrangler dry run, and `docs/contact-forms.md` for binding setup and a real inbox check when the client uses contact forms. Configure an Astro adapter separately for on-demand Astro routes.

Make the current work reviewable locally before deployment. Deploy only to the user's requested environment and source of truth; this skill does not authorize publication. Report check results and any material untested integration.
