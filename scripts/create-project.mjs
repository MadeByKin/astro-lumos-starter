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
if (!/^[a-z0-9][a-z0-9-]*$/.test(name))
  throw new Error(
    "Use a lowercase project name with letters, digits and hyphens",
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
  ".agents",
  ".claude",
  ".gitignore",
  ".prettierignore",
  ".prettierrc",
  "AGENTS.md",
  "LUMOS.md",
  "LICENSE",
  "README.md",
  "astro.config.mjs",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "src",
  "public",
  "docs",
  "scripts",
  "tests",
];
await mkdir(path.dirname(target), { recursive: true });
const canonicalSource = await realpath(source);
const canonicalTarget = path.join(
  await realpath(path.dirname(target)),
  path.basename(target),
);
if (
  canonicalTarget === canonicalSource ||
  canonicalTarget.startsWith(canonicalSource + path.sep)
) {
  throw new Error(
    "Choose a destination outside the starter, including through symlinks",
  );
}
await mkdir(target); // Exclusive: a concurrent creator cannot be overwritten.
try {
  for (const entry of entries) {
    await cp(path.join(source, entry), path.join(target, entry), {
      recursive: true,
      verbatimSymlinks: true,
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
  const constants = path.join(target, "src/consts.ts");
  await writeFile(
    constants,
    (await readFile(constants, "utf8")).replace(
      '"https://example.com"',
      JSON.stringify(url.origin),
    ),
  );
} catch (error) {
  // Only this script's newly created destination is removed on an incomplete copy.
  await rm(target, { recursive: true, force: true });
  throw error;
}
console.log(
  `Created ${target}\nNext: cd ${JSON.stringify(target)}\nRun npm ci, then npm run dev.\nSet SITE_NAME and replace demo content before launch.`,
);
