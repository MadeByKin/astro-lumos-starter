# Stacki / Studio integration

Use this as a normal Astro/Lumos project in Stacki. Keep the source components, documented props, slots and Lumos tokens available for authoring. The motion runtime is browser-only; there is no framework island dependency. The starter contains no copied Studio server, account data, CMS credentials or `.stacki` state.

## Isolated editor adapter

`src/lib/motion/studio.ts` follows concrete signals found in the user's local Stacki Studio source on 11 November 2026:

- In an iframe with `meta[name="studio-parent-origin"]`, an `avb-design` hash indicates initial design mode.
- Parent messages `avb:interaction` with mode `select` / `interact`, and `studio:interactive` with a boolean `enabled`, update the motion policy.
- Messages are accepted only from `window.parent` at the exact origin from that meta element. No wildcard origins or outgoing credential messages are used.
- The observed `avb:morphed` document event triggers component refresh, so internal replacements receive fresh setup after prior cleanup. Whole-instance insertion/removal also works through custom-element connection callbacks.

These are **observed implementation details, not a published stable Stacki API**. They may change. This delivery verifies the adapter using a simulated editor iframe and DOM morphs; it does not certify every operation in the live Stacki application. The source of truth for these observations was the local `studio/src/features/preview/previewClient.ts` and `studio/vendor/stacki/shared/properties/canvasInteraction.ts` files; no Studio code was copied into this template.

For an editor version without those signals, set `document.documentElement.dataset.motion = 'off'` in its trusted preview integration; remove that attribute for interactive preview. This is a decorative-motion switch, not an authentication boundary. Unknown iframe contexts are treated as normal sites rather than guessed to be editors.

## Check inside your installed editor

1. Open the demo in Stacki, then design and interactive preview. In design mode the reveal is at rest, marquee/tabs autoplay are paused and Lenis is absent. Essential controls still exist; the editor owns selection interception.
2. Change the marked element's data-reveal-distance/data-reveal-duration attributes and HeroIntro title prop. Verify values save to the intended component/page source.
3. Insert, duplicate and remove elements marked data-reveal and library interactions. Verify independent instances, no duplicate handlers and no frozen page scroll after deleting an open modal.
4. Edit a component's internal content, then switch preview modes repeatedly. Confirm fresh child content is enhanced and original styles return in design mode.
5. Create a page using components and check the actual saved route, navigation link and responsive layout. Page creation and arbitrary visual layout editing depend on the Stacki version and project configuration; the starter cannot guarantee them.
6. Validate normal browser navigation, back/forward, keyboard and reduced motion outside the editor as well.

If Studio's component selection cannot measure the display-contents lifecycle hosts in your installed version, adjust that integration after checking its rendered-source mapping; don't flatten component boundaries or remove cleanup merely to satisfy selection. Custom animation design, content schemas and Sanity read/write setup remain project-specific work.
