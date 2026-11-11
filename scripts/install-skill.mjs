import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const starter = fileURLToPath(new URL("..", import.meta.url));
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
await mkdir(path.dirname(destination), { recursive: true });
await mkdir(destination);
await mkdir(path.join(destination, "agents"));
await writeFile(
  path.join(destination, "agents/openai.yaml"),
  'interface:\n  display_name: "Astro Lumos Starter"\n  short_description: "Create a Lumos/Astro site with a reliable motion setup"\n  default_prompt: "Use $astro-lumos-starter to create a new project."\n',
);
await writeFile(
  path.join(destination, "starter.json"),
  JSON.stringify({ starter }, null, 2) + "\n",
);
await writeFile(
  path.join(destination, "SKILL.md"),
  `---
name: astro-lumos-starter
description: Create a new Lumos/Astro project using the installed starter, including Lenis, GSAP, cleanup, reduced motion and Stacki guidance. Use for new projects, not to replace existing repositories.
---

Read starter.json alongside this file to locate the installed source. Check that source still exists; if it moved, locate the user's delivered astro-lumos-starter and update only this pointer with their authorization.

Run its scripts/create-project.mjs with Node, an absolute new destination and --name=project-name. Include --site=https://client.example when the real origin is known; otherwise retain the example origin and flag it before launch. The script refuses existing destinations and copies no Git history, editor state, dependencies or secrets.

Run npm ci in the result. Read its AGENTS.md, LUMOS.md and .agents/skills/astro-lumos-interaction/SKILL.md before implementation. Customize that result, never the source template or an unrelated site. Astro ClientRouter is already enabled; do not add Taxi.js or another router. Shared sitewide animations use explicit data attributes and one implementation in src/scripts, not heading-tag selectors or repeated component scripts. Compose Sections, ContentWrappers and Grids directly in route files and extract only useful content/card boundaries; read .agents/skills/astro-lumos-page/SKILL.md. Shared overlays use src/scripts/overlays.ts with per-instance state and cleanup. Follow the project's validation commands and obtain a working visual preview before calling UI changes complete.
`,
);
console.log(
  `Installed ${destination}\nRestart Codex if the skill is not listed. Keep the starter at ${starter}`,
);
