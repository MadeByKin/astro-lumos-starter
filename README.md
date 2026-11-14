# Astro Lumos Starter

An Astro starter with Lumos components, Lenis smooth scrolling, GSAP animations, page transitions and Stacki editing support. Includes project instructions and skills for Codex and Claude Code.

## Start a project

Requires Node 22.23.4+ and npm. Each client project gets its own folder and Git repository.

Clone the starter into a location of your choice:

```sh
git clone https://github.com/MadeByKin/astro-lumos-starter.git
cd astro-lumos-starter
```

Open the checkout in Codex or Claude Code. In the prompts below, use `Use $skill-name …` in Codex or `/skill-name …` in Claude Code. Both use the same repository skills. If a skill is missing, restart your tool or ask it to read the corresponding `.agents/skills/<name>/SKILL.md`.

### New Project Checklist

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
- [ ] Open that **same project folder** in Codex or Claude Code and start a fresh chat. Ask it to read `AGENTS.md` and `LUMOS.md` before making changes.
- [ ] Follow [Cloudflare Workers setup](docs/cloudflare.md#publish-through-stacki-recommended) to select the Cloudflare account in Stacki, add the generated Worker name, save Publish settings and publish with **Hosting** enabled. The next publish creates the Worker. Connect the real domain when ready; GitHub builds and terminal deployment are documented alternatives.
- [ ] For enquiries, follow [contact form setup](docs/contact-forms.md) to configure the client's sender, inbox and Turnstile keys, set `action="/api/contact"` on the existing `<Form>`, then test real delivery. The handler stays disabled until configured.

### Example interaction prompt

```text
Use $astro-lumos-interaction to implement an image gallery where selecting
a thumbnail updates the main image with a short crossfade.
```

Describe the interaction or attach reference screenshots. The skill handles the implementation conventions and practical browser checks. In Claude Code, use `/astro-lumos-interaction` followed by the same request.

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

On [MadeByKin/astro-lumos-starter](https://github.com/MadeByKin/astro-lumos-starter), choose **Use this template** to create a separate client repository, then clone the new client repository and run `npm ci`. Open that client folder in Stacki and your chosen coding tool and follow the checklist above. This route copies the instructions and skills too, but does not run our naming/origin setup: update `package.json`, the matching package-lock names, `wrangler.jsonc`'s Worker name and `src/consts.ts` for the client. This route creates the project repository directly.

### Optional global skill installation

Repository skills work directly in Codex and Claude Code. To use the new-project skill from other folders, run the command for your tool from the starter checkout:

```sh
# Codex
npm run skills:install -- --tool=codex

# Claude Code
npm run skills:install -- --tool=claude
```

The installer copies the skill to your tool’s user-level skills folder and records this checkout’s location. It preserves existing installations. Keep the starter in that location, and restart your tool if the skill is not listed. Running `npm run skills:install` without an option defaults to Codex.

## Included

- Lumos components and page-building skills.
- Lenis smooth scrolling with a shared GSAP clock and native touch/anchor navigation.
- Data-attribute animations, scoped cleanup and live reduced-motion support.
- Astro ClientRouter with fade, slide and disabled-animation options.
- Accessible dialog/dropdown controls with independent state and scroll locks.
- Development console metrics, an optional FPS panel and browser checks.
- Demo routes at `/`, `/next` and `/example-components`.
- Cloudflare Workers Static Assets configuration for publishing through Stacki, plus Wrangler and `npm run deploy` for manual deployment.
- A reusable Cloudflare email contact handler wired into the existing Form component, with Turnstile, validation, spam trap and rate limiting.

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

Use these in the project checkout. In Claude Code, replace `Use $astro-lumos-interaction` with `/astro-lumos-interaction`.

**Change the default transition:**

```text
Use $astro-lumos-interaction to change this site's default page transition
from fade to slide. Keep existing page overrides.
```

To apply one effect everywhere, replace “Keep existing page overrides” with “Make every page use the new default.”

**Create a custom transition for one page:**

```text
Use $astro-lumos-interaction to create a custom transition for /about:
a short fade with a subtle upward entrance lasting 0.35s. Keep the
current default on all other pages.
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

Set `src/consts.ts` (site name, description, canonical origin, locale). Replace the neutral demo, Lumos logos, favicon and social image. Remove example-only pages as appropriate. Configure and test [contact form delivery](docs/contact-forms.md): the included handler requires client email settings, an Email Service binding and Turnstile keys. Keep the secret key in provider-managed server secrets. The inherited generic form requires an endpoint and no longer simulates success without one. Static output is `dist/`, served alongside the standalone contact Worker. Follow [Cloudflare setup](docs/cloudflare.md) to publish through Stacki and connect the domain, or choose the GitHub/terminal alternatives; server-rendered Astro routes require a separately configured Cloudflare adapter.

## Page and behaviour structure

Compose sections directly in `src/pages/*.astro` with Section, ContentWrapper and Grid. Smaller components own their content, styles or specific interactions; see `index.astro`, `HeroIntro.astro` and `PrincipleCard.astro`. Shared animations and overlays live in `src/scripts/` and use explicit data attributes. See [Astro structure](docs/astro-basics.md) and [motion ownership](docs/motion.md).

## Console timing

In development, open the console for Tick metrics or press **Shift+F** for the FPS panel. Use `tick.add("checkpoint", true)` for a named timing event. These tools are excluded from production. See [Tick usage](docs/tick.md).

## Scrollbar defaults

Scrollbars are hidden by default while scrolling remains enabled. The rules live in `src/styles/preferences.css`.

To show native scrollbars throughout a site, add `data-scrollbars="visible"` to the `<html>` element in `src/layouts/BaseLayout.astro`. To show them only in a scrolling panel, add the attribute to that container instead. The preference applies to its descendants too; a nested `data-scrollbars="hidden"` can opt back out. Browser/system settings still determine native scrollbar appearance.

## Reference docs

- [Cloudflare accounts, Workers deployment and domains](docs/cloudflare.md)
- [Client contact forms and email delivery](docs/contact-forms.md)
- [Astro structure and shared animations](docs/astro-basics.md)
- [Motion and cleanup](docs/motion.md)
- [Page transitions](docs/navigation.md)
- [Stacki integration](docs/stacki.md)
- [Tick metrics](docs/tick.md)
- [Lumos updates and maintenance](docs/maintenance.md)
- [Recorded validation](docs/verification.md)
- [Sources and licensing](docs/provenance.md)
