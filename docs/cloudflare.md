# Cloudflare Workers setup

Publish through Stacki as the main workflow. Astro builds the site's static pages into `dist/`. A small standalone Worker handles `/api/contact` alongside those assets; no Astro adapter is needed for this handler. See [contact form setup](contact-forms.md) and [Cloudflare's Astro guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/).

## Set up Cloudflare once

1. [Create a Cloudflare login](https://dash.cloudflare.com/sign-up), verify your email, enable two-factor authentication and store the recovery codes.
2. Use your own account for personal projects and hosting you manage. For client-owned hosting, have the client create an account with their billing details and invite your login with the permissions needed for deployment and DNS. One login can belong to several accounts; see [accounts and profiles](https://developers.cloudflare.com/fundamentals/concepts/accounts-and-zones/).
3. Start with the free options. Domain plans, domain registration and Workers billing are separate. Check [current Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) before enabling paid products.

Each site has its own GitHub repository and Worker. Keep the Worker and its domain in the same Cloudflare account. Account IDs, domains and credentials are deliberately absent from the reusable starter.

## Create a project

From the maintained starter checkout:

```sh
npm run new -- /absolute/path/to/client-site --name=client-site --site=https://client.example
cd /absolute/path/to/client-site
npm ci
```

The generator sets the package and Worker names to `client-site`, and sets the website and contact origins in `src/consts.ts` and `wrangler.jsonc`. Names must be lowercase letters, digits or hyphens, at most 63 characters, and begin and end with a letter or digit. Choose a distinct name for each Worker in an account.

The copied `wrangler.jsonc` points at `./dist` and enables the existing custom 404 page. `html_handling: "drop-trailing-slash"` preserves the starter's `/next`-style URLs instead of redirecting them to `/next/`; see [HTML handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/). Its compatibility date stays pinned to the tested starter date; update it deliberately alongside validation. Wrangler is a development dependency recorded in the lockfile. `npm run deploy` builds before uploading, so it does not publish an old build accidentally.

If using GitHub's **Use this template** instead, update `wrangler.jsonc`'s `name`, the package names in `package.json` and `package-lock.json`, the site constants, `vars.CONTACT_ORIGIN` and a distinct `ratelimits[].namespace_id` yourself. The generator only makes those substitutions when you run it.

## Publish through Stacki (recommended)

1. Open the generated client folder in Stacki using **Open Existing Project…**. Open that same folder in your coding tool.
2. Open Stacki's Publish settings and connect or select the intended Cloudflare account.
3. Under the hosting destination, choose **Add Worker**. Enter the generated project name, matching `name` in `wrangler.jsonc`.
4. Add the Worker, select it as the hosting project and save the Publish settings. This selects the destination; the dialog states that the next publish creates the Worker using this project's Cloudflare configuration.
5. Enable **Hosting** for the main Publish button, then publish. Test the resulting site URL before connecting the real domain below.

You do not need to create the Worker manually in the Cloudflare dashboard, run `wrangler login`, or connect Cloudflare Workers Builds to GitHub for this workflow. The included `wrangler.jsonc` remains part of the project because Stacki uses the project's Cloudflare configuration.

Stacki's **GitHub** and **Hosting** publish options serve separate purposes: GitHub publishes source changes to the selected repository/branch, while Hosting deploys the website. Enable both if you want the main Publish button to do both. Leave Cloudflare's automatic GitHub builds disconnected when Stacki handles hosting, to avoid a second deployment from the same push.

These steps reflect the supplied Stacki Publish settings and **Add Cloudflare Worker** dialog. Confirm the resulting Worker, account and live URL after publishing; this starter's checks have not exercised a live Stacki-to-Cloudflare deployment.

## Connect the real domain

You can retain your existing registrar. Add the domain to the same Cloudflare account as the Worker and follow the [nameserver setup](https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/). Review the imported DNS records, including all email records, before switching nameservers. Follow the DNSSEC migration steps if it is already enabled.

Once the domain is active, open your Worker and select **Settings → Domains & Routes → Add → Custom Domain**. Add the intended hostname. Cloudflare creates its DNS record and certificate; resolve any existing conflicting record deliberately when cutting over from old hosting. See [custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

Choose the canonical hostname (for example `client.example`), connect any alternate hostname you need, and configure a redirect to the canonical one. Set both `SITE_URL` in `src/consts.ts` and `CONTACT_ORIGIN` in `wrangler.jsonc` to that final HTTPS origin and redeploy.

## Alternative: GitHub automatic deployment

Choose this if you want pushes to GitHub to deploy through Cloudflare Workers Builds. Use this as the hosting deployment path instead of Stacki's **Hosting** publish action. Stacki can still publish source changes to GitHub.

1. Initialise a separate Git repository in the generated project, commit the source and lockfile, and publish it to GitHub.
2. Select the intended Cloudflare account. Open **Workers & Pages**, create an application and choose the option to import a Git repository. Authorise the relevant GitHub account or organisation and select this project's repository.
3. Use the following build settings. The Worker name must match `name` in `wrangler.jsonc`.

| Setting           | Value                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Worker name       | The generated project name                                                                          |
| Production branch | `main` (or your chosen production branch)                                                           |
| Root directory    | Repository root; leave blank unless using a monorepo                                                |
| Build command     | `npm run build`                                                                                     |
| Deploy command    | `npx wrangler deploy`                                                                               |
| Node version      | Set build variable `NODE_VERSION` to `22.23.4`, or a tested newer version satisfying `package.json` |

Workers Builds uses the installed Wrangler dependency. Keep the separate build and deploy commands above; `npm run deploy` already builds and would repeat the build if used after the build command. For branch previews, enable preview builds and retain Cloudflare's default preview command instead of using the production deploy command. See [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) and the [build image](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/).

4. Deploy and test the assigned `workers.dev` URL. Subsequent pushes to the production branch rebuild and deploy automatically. Review branch previews before merging changes.

Cloudflare manages authentication for its Git integration. Do not commit a Global API Key or API token to the repository.

## Alternative: manual terminal deployment

Use this for an explicit deployment from your Mac instead of the Stacki publishing flow. It is also available for troubleshooting; it is not a required setup step for Stacki.

From the generated project, authenticate once using Wrangler's browser login:

```sh
npx wrangler login
npx wrangler whoami
```

Verify the intended account before publishing. If you have multiple accounts, specify the target account ID for that command:

```sh
CLOUDFLARE_ACCOUNT_ID=your-account-id npm run deploy
```

With one account, `npm run deploy` is sufficient. This command publishes to production. For unattended CI outside Cloudflare Builds, use a scoped API token and account ID stored in that CI provider's secrets; see [Wrangler authentication](https://developers.cloudflare.com/workers/wrangler/system-environment-variables/).

To validate the upload configuration locally without publishing:

```sh
npm run build
npx wrangler deploy --dry-run --outdir .wrangler/dry-run
```

A dry run does not verify account permissions, DNS, certificates or the live site.

## Before launch and future server features

- Run `npm run check`, `npm test` and `npm run build`. Review the deployed UI on desktop and mobile, navigate directly to an inner page, and check that an unknown URL returns the custom page with HTTP status 404.
- Replace demo content, branding and example origins. Follow [contact form setup](contact-forms.md) to configure the sender, recipient and Turnstile before testing real delivery.
- Files under `public/` and the built `dist/` are public. Build-time secrets must not be rendered into pages or browser code. `.wrangler/`, `.dev.vars*` and `.env*` stay ignored by Git.
- If adding Astro on-demand routes, Actions or sessions, configure a compatible `@astrojs/cloudflare` adapter using the current [Astro deployment guide](https://docs.astro.build/en/guides/deploy/cloudflare/). Preserve or deliberately integrate the standalone contact handler when changing the Worker entry point. The included handler does not make Astro pages server-rendered.

Local builds and dry runs are separate from a live Cloudflare deployment. Record the real deployment URL and checks in the client project's verification notes once its account and domain are connected.
