# Cloudflare contact forms

The existing `src/components/form/Form.astro` connects to a Worker endpoint at `POST /api/contact`. The pages remain statically built. Only the contact endpoint runs server code; no Astro adapter is needed for this standalone Worker. The initial project has no email binding or secret, so submissions fail closed until configured.

The flow is: contact form → origin/field validation and spam checks → Cloudflare Email Service → the client's inbox. There is no submissions database, file upload, visitor auto-reply or admin inbox. Successful submission means Email Service accepted the message, not a guarantee it reached the inbox. Check actual delivery before launch.

## Set up each client project

### 1. Choose the domain and inbox

Publish the project through [Stacki](cloudflare.md#publish-through-stacki-recommended), connect its real domain and choose the final canonical HTTPS origin, such as `https://client.example`. Redirect alternate hostnames to it.

In that same Cloudflare account, open **Compute → Email Service → Email Sending** and onboard a sender domain. Follow the provided SPF, DKIM and bounce-domain DNS instructions. Cloudflare DNS is required. Use a sender such as `website@client.example` and verify the intended destination inbox in Email Service if using the verified-destination sending allowance. Keep the client's existing mailbox provider and its root MX records; onboarding outbound sending is separate from moving their incoming mail. See [Email Sending setup](https://developers.cloudflare.com/email-service/get-started/send-emails/) and [destination verification](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/).

### 2. Set the Worker configuration

In the generated project's `wrangler.jsonc`, set:

```jsonc
"vars": {
  "CONTACT_ORIGIN": "https://client.example",
  "CONTACT_FROM": "website@client.example",
  "CONTACT_TO": "hello@client.example"
},
"send_email": [
  {
    "name": "EMAIL",
    "destination_address": "hello@client.example"
  }
]
```

Add `send_email` as a top-level property alongside `vars` and `assets`. Its destination must match `CONTACT_TO`. These values are deployment configuration, not secrets; keep them in the client's repository, not the reusable source. The server always chooses the sender, recipient and subject. The visitor's validated email becomes `Reply-To`, so the client can reply normally.

Preserve `main: "./worker/index.mjs"`, the `ASSETS` binding, `run_worker_first: ["/api/contact"]`, and the `CONTACT_RATE_LIMIT` binding. The rate limit allows five attempts per IP per minute in a Cloudflare location; it is approximate, can affect users sharing an IP, and is not a global quota. Choose a distinct positive integer string for `namespace_id` within the Cloudflare account; the generator chooses one for each new project, while GitHub template copies must change it themselves. See [rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

`CONTACT_ORIGIN` must match the request's origin exactly, without a trailing slash. The generator sets it from `--site`; if the real domain was unknown, replace `https://example.com`. Keep `SITE_URL` in `src/consts.ts` consistent. A preview on another hostname cannot submit to the production endpoint. Use separate staging configuration and a test inbox when testing previews.

### 3. Configure Turnstile

Create a **Managed** Turnstile widget in Cloudflare for the client's hostname. Copy its public site key into a local `.env` file (start from `.env.example`):

```dotenv
PUBLIC_TURNSTILE_SITE_KEY=your-public-site-key
```

Stacki's local Astro build must receive this variable; restart its preview after changing `.env` and republish. With Cloudflare GitHub builds instead, set the same public variable in the build settings. Without a site key, the component shows an unavailable message rather than an active form. Public site keys are safe to include in browser code.

Store the matching **secret key** on the deployed Worker under **Settings → Variables & Secrets**, named `TURNSTILE_SECRET_KEY`, as a secret. Alternatively, from the client project after authenticating the intended Cloudflare account:

```sh
npx wrangler secret put TURNSTILE_SECRET_KEY
```

For local Wrangler development, copy `.dev.vars.example` to `.dev.vars` and fill in the secret there. `.dev.vars` and `.env` are ignored and never copied by the generator. Do not use a `PUBLIC_` name for the secret or put it in `wrangler.jsonc`.

The component sets Turnstile's action to `contact`. The handler verifies each token with Cloudflare, including its hostname and action, before sending email. Tokens expire and are single-use; a failed submission resets the widget for a fresh token. See [server verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/). Turnstile is required; do not bypass it for a production form.

### 4. Wire the existing Form component

Set `action="/api/contact"` on the existing Form component. It automatically adds the Turnstile widget and hidden spam trap for that endpoint. Keep composing your own fields with the existing Input, Textarea, Fieldset and Button components:

```astro
---
import Form from "@/components/form/Form.astro";
import Input from "@/components/form/Input.astro";
import Textarea from "@/components/form/Textarea.astro";
import Button from "@/components/Button.astro";
---

<Form name="contact" action="/api/contact">
  <Input
    label="Name"
    name="name"
    autocomplete="name"
    maxlength={100}
    required
  />
  <Input label="Email" name="email" variant="email" maxlength={254} required />
  <Textarea label="Message" name="message" maxlength={5000} required />
  <Button slot="submit" type="submit">
    Send message
  </Button>
</Form>
```

The optional `submit` slot places your button after the automatically added spam check. Existing buttons in the default slot still work, with the spam check appended after the default content. The component library keeps its original form section; enable the Cloudflare endpoint on that Form or on a client form when needed.

`turnstileSiteKey` optionally overrides `PUBLIC_TURNSTILE_SITE_KEY` for a particular form. `name`, `action`, `successMessage`, `errorMessage` and `render` retain their existing roles. Other endpoints keep their normal submission behaviour and do not load Turnstile or inject contact-form fields. No additional contact-form component is needed.

Multiple instances keep independent widgets and submission state. Widget resources are removed on navigation, DOM removal and editor remounts. External script loading is shared. No form data is sent on page load or while editing. Add the client's contact email or phone beside the form so visitors have another way to reach them, including when JavaScript or the spam check is unavailable.

For a bespoke form, keep the submitted names `name` (up to 100 characters), `email` (254), `message` (5,000), optional `website` (must stay empty), and `cf-turnstile-response`. The endpoint accepts URL-encoded or multipart form data, with a 16 KiB total request limit and no file uploads. Extra text fields are ignored; extend the handler's allowlist and tests if the client needs phone numbers or other fields.

### 5. Publish and verify

Run `npm run check`, `npm test` and `npm run build`, then publish through Stacki. Confirm that it deploys the Worker entry point and configured bindings as well as `dist/`. This must be a Worker deployment, not an assets-only upload. The documented Stacki flow uses project Cloudflare configuration; this integration has not yet been verified against a live Stacki publish.

On the final domain:

- Submit a real test enquiry. Confirm the success state, inbox delivery, correct recipient and that Reply addresses the visitor.
- Submit invalid fields and test an expired challenge. Errors must not show success, and the visitor's message must remain available for retry.
- Check repeated requests receive 429 after the configured rate limit. Filling the hidden spam trap intentionally returns a generic success without sending mail.
- Check desktop/mobile layout, keyboard use and ClientRouter navigation away and back. Confirm the fallback contact details are usable without JavaScript.
- Confirm the site still serves inner pages and custom 404s. If requests to `/api/contact` return HTML from the site's 404, the Worker routing was not deployed correctly.

Requests asking for JSON receive `{ "ok": true|false, "message": "..." }`; native form requests receive a simple HTML result. A missing configuration returns 503, bad origin 403, invalid input/challenge 400, excessive size 413, rate limit 429 and email failure 502. No message contents, addresses, tokens or provider errors are logged by the handler. Cloudflare may retain platform-level delivery metadata; review the client's data handling and retention needs.

## Local checks and delivery limits

`npm test` exercises the handler with stubbed verification, rate-limit and email services; it sends no real email. `npm run preview` and Astro dev serve static pages but do not run the standalone Worker endpoint. Build first, then use `npx wrangler dev` for local Worker routing. The HTTPS origin guard intentionally rejects ordinary localhost submissions for a production-configured origin; use the automated fixtures for local success/error paths and test real delivery on a staging or final HTTPS domain.

Keep local email bindings simulated (omit `remote: true`) unless you explicitly intend to send real test mail. Local simulation and an upload dry run do not prove domain authentication, secret setup or inbox delivery.

The browser fixture uses a dummy public key and mocks both Turnstile and the contact endpoint. The test build injects its route directly and writes to `output/contact-fixture/`. The normal `dist/` remains ready for deployment. Build and start Wrangler in one terminal:

```sh
npm run build:contact-fixture
npx wrangler dev --assets ./output/contact-fixture --ip 127.0.0.1 --port 8787 --local
```

In another terminal, run:

```sh
BASE_URL=http://127.0.0.1:8787 npm run test:contact-browser
```

If using installed Google Chrome, add `PLAYWRIGHT_CHANNEL=chrome`. The fixture covers expiry, failure/retry, preserved input, duplicate-submit prevention, independent instances and navigation/remount cleanup. Screenshots are stored in `output/playwright/contact-*.png`.

Email Sending is currently beta. Sends to verified destination addresses are free under the documented allowance; arbitrary-recipient sending requires Workers Paid and has its own included quota. Worker execution follows Workers pricing. Review [current Email Service pricing](https://developers.cloudflare.com/email-service/platform/pricing/) for each account. This handler sends only to the configured client inbox and does not send automatic replies to visitors.
