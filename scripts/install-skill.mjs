import { mkdir, writeFile, access, cp, readdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const starter = fileURLToPath(new URL("..", import.meta.url));
const source = path.join(starter, ".agents/skills/astro-lumos-starter");
const destination = path.join(
  process.env.CODEX_HOME || path.join(os.homedir(), ".codex"),
  "skills",
  "astro-lumos-starter",
);
try {
  await access(destination);
  throw new Error(
    `Skill already exists at ${destination}; review it before replacing it`,
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
await access(path.join(source, "SKILL.md"));
await mkdir(path.dirname(destination), { recursive: true });
await mkdir(destination);
for (const entry of await readdir(source)) {
  await cp(path.join(source, entry), path.join(destination, entry), {
    recursive: true,
    errorOnExist: true,
    force: false,
  });
}
await writeFile(
  path.join(destination, "starter.json"),
  JSON.stringify({ starter }, null, 2) + "\n",
);
console.log(
  `Installed ${destination}\nRestart Codex if the skill is not listed. Keep the starter at ${starter}`,
);
