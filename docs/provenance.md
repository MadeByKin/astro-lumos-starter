# Sources and licensing

Based on [Lumos for Astro](https://github.com/lumosframework/lumos-for-astro). The integrated baseline is Lumos 1.0.4, commit `43e4d5290fd7fa5165e2118689e680971624f0cb`, with Astro 7.4.7. The current baseline is recorded in `package.json`; see [maintenance](maintenance.md) for upgrades.

The Lumos MIT license is retained in `LICENSE`. Starter additions include the shared motion runtime, scoped cleanup, demo pages, diagnostics, scaffolding, skills and checks. Lenis and GSAP are pinned dependencies with their own licenses; GSAP uses its standard license.

The bundled Inter font ships with its [SIL Open Font License](../public/licenses/inter.txt). Astro copies this notice to `/licenses/inter.txt` in production.

Implementation references:

- [Lumos documentation](https://lumosframework.com/docs/)
- [Lenis and GSAP integration](https://github.com/darkroomengineering/lenis)
- [GSAP context and cleanup](<https://gsap.com/docs/v3/GSAP/gsap.context()/>)
- [Astro browser scripts](https://docs.astro.build/en/guides/client-side-scripts/)
- [Astro transitions](https://docs.astro.build/en/guides/view-transitions/)
- [Federico Valla’s Webflow setup](https://github.com/vallafederico/webflow-dev-setup), an architectural reference. See the [capability comparison and recipes](federico-comparison.md).
