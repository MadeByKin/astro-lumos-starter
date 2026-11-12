# Astro Lumos Starter

An Astro starter with Lumos components, Lenis smooth scrolling, GSAP animations, page transitions and Stacki editing support. Includes project instructions and skills for Codex and Claude Code.

## Start a client project

Requires Node 22.23.4+ and npm. Each client project gets its own folder and Git repository.

Clone the starter into a location of your choice:

```sh
git clone https://github.com/MadeByKin/astro-lumos-starter.git
cd astro-lumos-starter
```

Open the checkout in Codex or Claude Code. In the prompts below, use `Use $skill-name …` in Codex or `/skill-name …` in Claude Code. Both use the same repository skills. If a skill is missing, restart your tool or ask it to read the corresponding `.agents/skills/<name>/SKILL.md`.

### New-client checklist

- [ ] Choose a lowercase, hyphenated project name, a new destination folder and, if known, the live website URL. The destination must not already exist.
- [ ] From the starter checkout, ask your assistant to generate a client project:

  ```text
  Use $astro-lumos-starter to create /absolute/path/to/client-name,
  named client-name, with the website URL https://client-domain.com.
  Install dependencies, initialise a separate Git repository, and verify
  the starter works. Follow the copied project instructions and skills.
  ```

  Replace the example name, path and URL. If the URL is unknown, omit it; the generated project retains an example origin that must be replaced before launch.

- [ ] In Stacki, choose **Open Existing Project…** and select the generated client folder. Stacki starts the project’s development server. Open this folder rather than creating another blank Astro project. See the [Stacki quick start](https://stacki.build/docs/quick-start/).
- [ ] Open that **same client folder** in Codex or Claude Code and start a fresh chat there. Use this first prompt:

  ```text
  Read AGENTS.md and LUMOS.md, and identify the relevant project skills
  before making changes. Follow this project’s route-level page composition,
  explicit data-attribute animations, shared Lenis/GSAP runtime, cleanup,
  reduced-motion, Stacki and validation conventions. Confirm the client
  checkout before editing and customise this project only.
  ```

- [ ] Use the project skills as you build:

  ```text
  Use $astro-lumos-page to build the home page from this brief: [brief].
  Keep ordinary sections in src/pages/index.astro and extract only useful
  content, styling or interaction boundaries.
  ```

  ```text
  Use $astro-lumos-interaction to implement [interaction]. Use an explicit
  data attribute, the shared runtime and scoped cleanup. Check reduced
  motion, navigation and removal/reinsertion before calling it complete.
  ```

- [ ] Set the client’s identity and origin in `src/consts.ts`, replace demo content/assets and configure any required forms or CMS. Review [Before shipping](#before-shipping).
- [ ] Review the site in a browser and follow the [Stacki editor checklist](docs/stacki.md#check-inside-your-installed-editor).
- [ ] Before review or release, ask:

  ```text
  Use $astro-lumos-release to validate this client project. Run the required
  checks, review desktop/mobile and motion behaviour, and provide a working
  local preview. Report untested integrations and remaining launch setup.
  ```

- [ ] Create a client GitHub repository under the agreed owner. The setup prompt initialises local Git; publishing is a separate step:

  ```text
  Create a private GitHub repository named client-name under [owner],
  connect this client checkout to it, commit the reviewed source and push.
  Exclude dependencies, build outputs, editor state and secrets.
  ```

### What keeps Codex and Claude Code consistent

The generator copies these files into every client project:

| File or folder    | Purpose                                                               |
| ----------------- | --------------------------------------------------------------------- |
| `AGENTS.md`       | Project-wide instructions and required checks                         |
| `CLAUDE.md`       | Imports the shared instructions for Claude Code                       |
| `LUMOS.md`        | Lumos component and styling conventions                               |
| `.agents/skills/` | Page, interaction, release, maintenance and inherited Lumos workflows |
| `docs/`           | Motion, Stacki, navigation, Tick and supporting guidance              |

Keep these files in the client repository. Codex discovers skills in `.agents/skills`; Claude Code uses the matching relative links in `.claude/skills`. `CLAUDE.md` imports `AGENTS.md` so both tools use the same project rules. Skills load when selected or matched to a task; explicit prompts make the intended workflow clear. See [Codex skills](https://learn.chatgpt.com/docs/build-skills) and [Claude Code skills](https://code.claude.com/docs/en/skills).

Client projects are independent copies. The maintainer’s weekly task updates the GitHub starter; apply relevant updates to existing client projects separately. Cloning the repo does not create a scheduled task.

### Terminal alternative

From the original starter:

```sh
cd /absolute/path/to/astro-lumos-starter
npm run new -- /absolute/path/to/client-name --name=client-name --site=https://client-domain.com
cd /absolute/path/to/client-name
npm ci
git init
npm run dev
```

The generator copies source, lockfile and skills into a fresh folder, excluding dependencies, Git history, editor state and secrets. When Stacki runs the dev server, use its preview URL.

### GitHub template alternative

On [MadeByKin/astro-lumos-starter](https://github.com/MadeByKin/astro-lumos-starter), choose **Use this template** to create a separate client repository, then clone the new client repository and run `npm ci`. Open that client folder in Stacki and your chosen coding tool and follow the checklist above. This route copies the instructions and skills too, but does not run our naming/origin setup: update `package.json`, the matching package-lock names and `src/consts.ts` for the client. The repository already exists on this route, so skip the create-repository prompt.

### Optional global Codex skill installation

To invoke the new-project skill from other folders in Codex, run `npm run skills:install` from this checkout. It installs a local pointer to the starter and preserves existing installations. Repository skills work directly in Codex and Claude Code without this step.

## Included

- Lumos components, original dark/lime theme and page-building skills.
- Lenis smooth scrolling with a shared GSAP clock and native touch/anchor navigation.
- Data-attribute animations, scoped cleanup and live reduced-motion support.
- Astro ClientRouter with fade, slide and disabled-animation options.
- Accessible dialog/dropdown controls with independent state and scroll locks.
- Development console metrics, an optional FPS panel and browser checks.
- Demo routes at `/`, `/next` and `/example-components`.

## Page transitions

Astro ClientRouter handles internal navigation. Each page’s `BaseLayout` accepts `pageTransition="fade" | "slide" | "none"`. The effect is configured on the page, not the link: `/next` demonstrates a slide, while home and the component library currently inherit the fade default. The outgoing and incoming snapshots use their respective page settings, so mixed settings can produce different leave/enter effects.

### Change the site-wide default

In `src/layouts/BaseLayout.astro`, change the destructured prop default:

```ts
const {
  theme = "inherit",
  overlap = false,
  pageTransition = "slide", // "fade", "slide" or "none"
  ...seo
} = Astro.props;
```

Pages that omit `pageTransition` inherit this default. Existing explicit overrides remain in effect; remove them if every page should follow the default. The starter currently uses a 0.2s fade and a 0.4s slide; change the `fade({ duration: "0.2s" })` or `slide({ duration: "0.4s" })` options in the same layout to adjust their timing.

### Override an individual page

Set the prop on that route’s layout in `src/pages/*.astro`:

```astro
---
import Layout from "@/layouts/BaseLayout.astro";
---

<Layout title="About" pageTransition="slide">
  <!-- Compose this page’s sections here. -->
</Layout>
```

Use `pageTransition="fade"` for a crossfade or `pageTransition="none"` to disable that page’s viewport animation. Omit the prop to return to the site-wide default. `none` keeps ClientRouter navigation enabled; it is not a full browser reload. For a transition with no animation on either snapshot, both the outgoing and incoming pages must use `none`.

Keep page transitions on the root viewport (`transition:name="root"`) so navigation from a scrolled position stays stable. Reduced motion disables decorative animations. See [navigation lifecycle](docs/navigation.md) for implementation details.

### Example prompts for Codex and Claude Code

Use these in the client project checkout. Codex can use `Use $astro-lumos-interaction` before either prompt; in Claude Code, invoke `/astro-lumos-interaction` followed by the same instructions.

**Change the default transition:**

```text
Change this site's default page transition from fade to slide in
src/layouts/BaseLayout.astro. Keep existing explicit page overrides.
Keep the animation on the root viewport, preserve ClientRouter history
and anchor scrolling, and respect reduced motion. Update the docs and
verify navigation from the top and part way down a page, plus Back/Forward.
Provide a local preview before calling it complete.
```

To apply one effect everywhere, replace “Keep existing explicit page overrides” with “Remove explicit pageTransition overrides so every page inherits the new default.”

**Create a custom transition for one page:**

```text
Create a custom transition for /about: a short fade combined with a
subtle upward entrance, lasting 0.35s. Keep the current default on all
other pages. Extend BaseLayout's typed pageTransition options and the
animation mapping, then opt /about into the new transition. Define both
leave and enter effects deliberately, including navigation back out of
/about; the two snapshots can use different page settings.

Use Astro ClientRouter and its supported animation/lifecycle APIs. Keep
page-wide animation on the root viewport, use data attributes for any
additional shared element effects, and preserve cleanup, instant route
scroll positioning, history/anchors and reduced motion. Update the docs,
run the relevant checks, and provide a local preview for review.
```

Replace `/about` and the motion description as needed. Custom transition values require an implementation in the layout; the built-in values are `fade`, `slide` and `none`.

## Validate

```sh
npm run check
npm test
npm run build
npm exec playwright install chromium
npm run preview -- --host 127.0.0.1 --port 4323
# In another terminal:
BASE_URL=http://127.0.0.1:4323 npm run test:browser
```

For development helpers, run `npm run dev -- --host 127.0.0.1 --port 4322`, then `BASE_URL=http://127.0.0.1:4322 npm run test:development` in another terminal.

With Google Chrome installed, set `PLAYWRIGHT_CHANNEL=chrome` to use it for browser checks. Screenshots are saved to `output/playwright/`. Review the site in a browser and Stacki alongside the automated checks.

## Before shipping

Set `src/consts.ts` (site name, description, canonical origin, locale). Replace the neutral demo, Lumos logos, favicon and social image. Remove example-only pages as appropriate. Configure and test a real form endpoint: the inherited form is a demonstration until an endpoint is supplied. Keep private credentials in provider-managed server secrets; this starter needs none. Static output is `dist/`, suitable for Cloudflare Pages; dynamic Astro routes require a separately configured Cloudflare adapter.

## Page and behaviour structure

Compose sections directly in `src/pages/*.astro` with Section, ContentWrapper and Grid. Smaller components own their content, styles or specific interactions; see `index.astro`, `HeroIntro.astro` and `PrincipleCard.astro`. Shared animations and overlays live in `src/scripts/` and use explicit data attributes. See [Astro structure](docs/astro-basics.md) and [motion ownership](docs/motion.md).

## Console timing

In development, open the console for Tick metrics or press **Shift+F** for the FPS panel. Use `tick.add("checkpoint", true)` for a named timing event. These tools are excluded from production. See [Tick usage](docs/tick.md).

## Scrollbar defaults

Scrollbars are hidden by default while scrolling remains enabled. The rules live in `src/styles/preferences.css`.

To show native scrollbars throughout a site, add `data-scrollbars="visible"` to the `<html>` element in `src/layouts/BaseLayout.astro`. To show them only in a scrolling panel, add the attribute to that container instead. The preference applies to its descendants too; a nested `data-scrollbars="hidden"` can opt back out. Browser/system settings still determine native scrollbar appearance.

## Reference docs

- [Astro structure and shared animations](docs/astro-basics.md)
- [Motion and cleanup](docs/motion.md)
- [Page transitions](docs/navigation.md)
- [Stacki integration](docs/stacki.md)
- [Tick metrics](docs/tick.md)
- [Lumos updates and maintenance](docs/maintenance.md)
- [Recorded validation](docs/verification.md)
- [Sources and licensing](docs/provenance.md)
