# Provenance and dependencies

Created 11 November 2026 from the clean `Start my-site from Lumos` commit `2332ea3` in the user's local checkout. No personal site content, later SplitText changes, Git history, Studio server, editor state or credentials were copied. Lumos metadata identifies version 1.0.2, upstream commit `5e81e860175ed6cf4086c203e4178c2c6744ad93`. This is a known local baseline, not a claim to use the latest Lumos release.

The upstream Lumos MIT LICENSE is retained. Original additions implement a reusable lifecycle and motion layer, demo, checks, project scaffold and skills. Lenis and GSAP are installed as version-pinned npm dependencies with a lockfile; their licenses remain their own. GSAP is governed by its standard license, not the Lumos MIT license. Review dependency terms when redistributing a platform or product.

Authoritative implementation references consulted:

- [Lumos documentation](https://lumosframework.com/docs/)
- [Lenis repository and GSAP integration](https://github.com/darkroomengineering/lenis)
- [GSAP context and cleanup](<https://gsap.com/docs/v3/GSAP/gsap.context()/>)
- [Astro client scripts and custom elements](https://docs.astro.build/en/guides/client-side-scripts/)
- [Astro view transitions](https://docs.astro.build/en/guides/view-transitions/)
- [Federico's Webflow development setup](https://github.com/vallafederico/webflow-dev-setup), as architectural inspiration. Its Webflow/Taxi module runtime was not copied into Astro.

Dependency updates should be deliberate: inspect release notes, regenerate the lockfile and rerun the included checks. Keep motion runtime changes separate from brand/content changes so later projects can adopt fixes selectively.

Subsequent refinement: renamed to Astro Lumos Starter, restored the original dark/lime demo presentation, added scoped subscriptions and development diagnostics, and integrated Lumos 1.0.3 from commit `9eb6523e70e49548a1e29d81ae26a5482fa0b790` with Astro 7.4.7. See docs/maintenance.md for the exact included and intentionally omitted upstream changes.

Version 1.3.0 imports the verified source into the named ChatGPT project workspace and restores route-level section composition. See docs/verification.md for the structural and shared-overlay changes. The local repository has a new baseline; upstream Lumos commit metadata remains unchanged.
