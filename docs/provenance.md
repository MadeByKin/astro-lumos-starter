# Sources and licensing

Based on [Lumos for Astro](https://github.com/lumosframework/lumos-for-astro). The integrated baseline is Lumos 1.0.3, commit `9eb6523e70e49548a1e29d81ae26a5482fa0b790`, with Astro 7.4.7. The current baseline is recorded in `package.json`; see [maintenance](maintenance.md) for upgrades.

The Lumos MIT license is retained in `LICENSE`. Starter additions include the shared motion runtime, scoped cleanup, demo pages, diagnostics, scaffolding, skills and checks. Lenis and GSAP are pinned dependencies with their own licenses; GSAP uses its standard license.

Implementation references:

- [Lumos documentation](https://lumosframework.com/docs/)
- [Lenis and GSAP integration](https://github.com/darkroomengineering/lenis)
- [GSAP context and cleanup](<https://gsap.com/docs/v3/GSAP/gsap.context()/>)
- [Astro browser scripts](https://docs.astro.build/en/guides/client-side-scripts/)
- [Astro transitions](https://docs.astro.build/en/guides/view-transitions/)
- [Federico Valla’s Webflow setup](https://github.com/vallafederico/webflow-dev-setup), an architectural reference. See the [capability comparison and recipes](federico-comparison.md).
