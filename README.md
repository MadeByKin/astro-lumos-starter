# Astro Lumos Starter

An Astro starter with Lumos components, Lenis smooth scrolling, GSAP animations, page transitions and Stacki editing support. Includes project instructions and skills for Codex and Claude Code.

## Start a project

Use Node 22.23.4+ and npm 9.6.5+. Create each client site in a separate folder. The generator writes the project files. Initialise Git in the new folder when you want version control.

Clone the starter into a location of your choice:

```sh
git clone https://github.com/MadeByKin/astro-lumos-starter.git
cd astro-lumos-starter
```

Open the checkout in Codex or Claude Code. In the prompts below, use `Use $skill-name …` in Codex or `/skill-name …` in Claude Code. Both use the same repository skills. If a skill is missing, restart your tool or ask it to read the corresponding `.agents/skills/<name>/SKILL.md`.

### New project checklist

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
- [ ] Verify the fresh project using the [validation commands](#validate). Run the demo browser suite before replacing the example routes and labels it exercises.

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
npm run dev -- --background
```

The generator copies source, lockfile and skills into a fresh folder, excluding dependencies, Git history, editor state and secrets. Use `npm run dev -- status` to find the local URL and `npm run dev -- stop` to stop it. When Stacki starts the server, use its preview URL.

### GitHub template alternative

Choose **Use this template** on [GitHub](https://github.com/MadeByKin/astro-lumos-starter), then clone the new repository and run `npm ci`. This path skips the generator. Set the package name in `package.json` and both root name fields in `package-lock.json`, set `SITE_URL` in `src/consts.ts`, and set the Worker name, `CONTACT_ORIGIN` and a distinct rate-limit namespace ID in `wrangler.jsonc`. Continue from the Stacki step above.

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

Set `pageTransition="slide"`, `"fade"` or `"none"` on a page’s `BaseLayout`. The default is a 0.2s fade. The `/next` demo uses a 0.4s slide. See [default and per-page configuration, examples and prompts](docs/navigation.md#change-the-site-wide-default).

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

For development helpers, run `npm run dev -- --background --host 127.0.0.1 --port 4322`, then `BASE_URL=http://127.0.0.1:4322 npm run test:development`. Stop that server with `npm run dev -- stop`.

With Google Chrome installed, skip the Chromium download and set `PLAYWRIGHT_CHANNEL=chrome` on each browser test command. Screenshots are saved to `output/playwright/`. Review the site in a browser and Stacki alongside the automated checks.

## Before shipping

- Set the client name, description, language and canonical origin in `src/consts.ts`. Match the final HTTPS origin in `wrangler.jsonc`.
- Replace the logos, favicon, social image and demo content. When removing demo pages, update the header, footer and browser tests that link to them.
- If the site accepts enquiries, configure the sender, inbox, Turnstile keys and Worker bindings. Submit from the final domain and confirm receipt and Reply-To. [Contact form setup](docs/contact-forms.md)
- In Stacki, select the client’s Cloudflare account and Worker, save the publish settings and publish with **Hosting** enabled. Verify an inner page and the custom 404 at the deployed URL. [Cloudflare publishing and domains](docs/cloudflare.md#publish-through-stacki-recommended)

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
