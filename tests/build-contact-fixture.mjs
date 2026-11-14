import { readFile, writeFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const route = new URL("src/pages/contact-test-fixture.astro", root);
const content = await readFile(
  new URL("fixtures/contact.astro", import.meta.url),
);
await writeFile(route, content, { flag: "wx" });
try {
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL("node_modules/astro/bin/astro.mjs", root)), "build"],
    {
      cwd: fileURLToPath(root),
      stdio: "inherit",
      env: { ...process.env, PUBLIC_TURNSTILE_SITE_KEY: "browser-test-key" },
    },
  );
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(route);
}
