# Stacki integration

Open the client project in Stacki as an existing Astro project. Components expose their props, slots and Lumos tokens for editing. Design mode pauses decorative motion; interactive preview enables the normal site behavior.

## Publish to Cloudflare

Publishing through Stacki is the main deployment workflow. In Publish settings, select your Cloudflare account, choose **Add Worker**, enter the generated project name and save the selected hosting destination. With **Hosting** enabled, the next publish creates the Worker using the project's Cloudflare configuration.

The **GitHub** option publishes source changes; **Hosting** publishes the site. Both can be enabled together. When Stacki handles hosting, leave Cloudflare's separate automatic GitHub builds disconnected to avoid duplicate deployments. See [Cloudflare setup](cloudflare.md) for the full publishing steps, domains and alternative GitHub/terminal workflows. Live Stacki-to-Cloudflare publishing still needs validation for each connected project.

For contact forms, follow [client email setup](contact-forms.md). The local build needs the public Turnstile site key in `.env`; the deployed Worker needs the secret and Email Service binding. Publishing must include `worker/index.mjs` and its bindings alongside static assets. Confirm this on a live deployment before promising form delivery.

## Editor adapter

`src/lib/motion/studio.ts` uses signals observed in Stacki Studio source on 11 November 2026:

- `meta[name="studio-parent-origin"]` identifies the trusted parent origin; the `avb-design` hash selects initial design mode in an iframe.
- Parent messages `avb:interaction` (`select` / `interact`) and `studio:interactive` (`enabled`) update the motion policy.
- Messages are accepted from `window.parent` at that exact origin.
- `avb:morphed` refreshes component behavior after the editor replaces content.

These are version-dependent implementation details, verified with a simulated editor. Check them against your installed Stacki version. The source references were `studio/src/features/preview/previewClient.ts` and `studio/vendor/stacki/shared/properties/canvasInteraction.ts`.

A trusted integration can also pause decorative motion with `document.documentElement.dataset.motion = 'off'`; remove the attribute to resume. This controls animation only. Unrecognized iframe contexts retain normal site behavior.

## Check inside your installed editor

1. Switch between design and interactive modes. Confirm reveals rest in place, autoplay pauses and Lenis stops in design mode.
2. Edit reveal attributes and the HeroIntro title prop. Confirm changes save to the intended source.
3. Insert, duplicate and remove animated elements and controls. Confirm instances work independently and deleting an open modal releases its scroll lock.
4. Edit component content and switch preview modes repeatedly. Confirm behavior reinitializes and design-mode styles reset.
5. Create a page and check the saved route, navigation link and responsive layout. Available page/layout editing depends on the editor version and project configuration.
6. Check browser navigation, history, keyboard controls and reduced motion outside the editor.

Component lifecycle hosts use `display: contents`. If selection behaves unexpectedly, check Stacki's source mapping before changing those hosts. Configure and test any CMS schemas, Sanity access and publishing flow for the client project.
