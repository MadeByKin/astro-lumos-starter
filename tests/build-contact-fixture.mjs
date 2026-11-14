import { build } from "astro";
import { fileURLToPath } from "node:url";

process.env.PUBLIC_TURNSTILE_SITE_KEY = "browser-test-key";
await build({
  root: fileURLToPath(new URL("../", import.meta.url)),
  outDir: "./output/contact-fixture",
  integrations: [
    {
      name: "contact-browser-fixture",
      hooks: {
        "astro:config:setup": ({ injectRoute }) => {
          injectRoute({
            pattern: "/contact-test-fixture",
            entrypoint: fileURLToPath(
              new URL("fixtures/contact.astro", import.meta.url),
            ),
          });
        },
      },
    },
  ],
});
