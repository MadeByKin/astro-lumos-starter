import {
  cp,
  mkdir,
  readFile,
  writeFile,
  access,
  rm,
  realpath,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomInt } from "node:crypto";

const source = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const [destination, ...options] = process.argv.slice(2);
if (
  !destination ||
  options.some(
    (arg) => !arg.startsWith("--name=") && !arg.startsWith("--site="),
  )
) {
  console.error(
    "Usage: npm run new -- /path/to/client-site --name=client-site --site=https://client.example",
  );
  process.exit(1);
}
const target = path.resolve(destination);
if (target === source || target.startsWith(source + path.sep))
  throw new Error("Choose a destination outside the starter");
try {
  await access(target);
  throw new Error("Destination already exists; nothing was changed");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const name =
  options.find((arg) => arg.startsWith("--name="))?.slice(7) ??
  path.basename(target);
if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(name) || name.length > 63)
  throw new Error(
    "Use a lowercase project name of at most 63 characters with letters, digits and hyphens; start and end with a letter or digit",
  );
const site =
  options.find((arg) => arg.startsWith("--site="))?.slice(7) ??
  "https://example.com";
const url = new URL(site);
if (
  url.protocol !== "https:" ||
  url.username ||
  url.password ||
  url.pathname !== "/" ||
  url.search ||
  url.hash
)
  throw new Error(
    "Site must be a public HTTPS origin without credentials, path, query or hash",
  );
const entries = [
  ".agents/skills",
  ".claude/skills",
  ".gitignore",
  ".prettierignore",
  ".prettierrc",
  "AGENTS.md",
  "CLAUDE.md",
  "LUMOS.md",
  "LICENSE",
  "README.md",
  "astro.config.mjs",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "wrangler.jsonc",
  ".env.example",
  ".dev.vars.example",
  "worker",
  "src",
  "public",
  "docs",
  "scripts",
  "tests",
];
const canonicalSource = await realpath(source);
// Check the nearest existing parent before creating missing directories.
let ancestor = path.dirname(target);
let resolvedAncestor;
while (!resolvedAncestor) {
  try {
    resolvedAncestor = await realpath(ancestor);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    ancestor = path.dirname(ancestor);
  }
}
if (
  resolvedAncestor === canonicalSource ||
  resolvedAncestor.startsWith(canonicalSource + path.sep)
) {
  throw new Error(
    "Choose a destination outside the starter, including through symlinks",
  );
}
await mkdir(path.dirname(target), { recursive: true });
await mkdir(target); // Exclusive: a concurrent creator cannot be overwritten.
try {
  for (const entry of entries) {
    await cp(path.join(source, entry), path.join(target, entry), {
      recursive: true,
      verbatimSymlinks: true,
      filter: (file) => {
        const basename = path.basename(file);
        if (basename === ".env.example" || basename === ".dev.vars.example")
          return true;
        if (basename.startsWith(".env") || basename.startsWith(".dev.vars"))
          return false;
        return ![
          ".DS_Store",
          "node_modules",
          ".git",
          ".stacki",
          ".wrangler",
        ].includes(basename);
      },
    });
  }
  const pkg = JSON.parse(
    await readFile(path.join(target, "package.json"), "utf8"),
  );
  pkg.name = name;
  await writeFile(
    path.join(target, "package.json"),
    JSON.stringify(pkg, null, 2) + "\n",
  );
  const lock = JSON.parse(
    await readFile(path.join(target, "package-lock.json"), "utf8"),
  );
  lock.name = name;
  lock.packages[""].name = name;
  await writeFile(
    path.join(target, "package-lock.json"),
    JSON.stringify(lock, null, 2) + "\n",
  );
  const workerFile = path.join(target, "wrangler.jsonc");
  await writeFile(
    workerFile,
    (await readFile(workerFile, "utf8"))
      .replace(/("name"\s*:\s*)"[^"]+"/, `$1${JSON.stringify(name)}`)
      .replace(
        /("CONTACT_ORIGIN"\s*:\s*)"[^"]+"/,
        `$1${JSON.stringify(url.origin)}`,
      )
      .replace(
        /("namespace_id"\s*:\s*)"[^"]+"/,
        `$1"${randomInt(1000, 2 ** 31)}"`,
      ),
  );
  const constants = path.join(target, "src/consts.ts");
  await writeFile(
    constants,
    (await readFile(constants, "utf8")).replace(
      /export const SITE_URL = "[^"]*";/,
      () => `export const SITE_URL = ${JSON.stringify(url.origin)};`,
    ),
  );
} catch (error) {
  // Only this script's newly created destination is removed on an incomplete copy.
  await rm(target, { recursive: true, force: true });
  throw error;
}
console.log(
  `Created ${target}\nNext: cd ${JSON.stringify(target)}\nRun npm ci, then npm run dev.\nCloudflare Worker: ${name}. Follow docs/cloudflare.md to add the Worker and publish through Stacki; GitHub and terminal deployment are alternatives.\nSet SITE_NAME and replace demo content before launch.`,
);
