import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  readFile,
  writeFile,
  access,
  rm,
  symlink,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

test("scaffolding copies a clean project and refuses existing or recursive destinations", async () => {
  const folder = await mkdtemp(path.join(os.tmpdir(), "jg-starter-check-"));
  const script = fileURLToPath(
    new URL("../scripts/create-project.mjs", import.meta.url),
  );
  const target = path.join(folder, "client-site");
  const run = (...args) =>
    spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
  try {
    const result = run(
      target,
      "--name=client-site",
      "--site=https://client.example",
    );
    assert.equal(result.status, 0, result.stderr);
    const pkg = JSON.parse(
      await readFile(path.join(target, "package.json"), "utf8"),
    );
    const lock = JSON.parse(
      await readFile(path.join(target, "package-lock.json"), "utf8"),
    );
    assert.equal(pkg.name, "client-site");
    assert.equal(lock.packages[""].name, pkg.name);
    assert.match(
      await readFile(path.join(target, "src/consts.ts"), "utf8"),
      /https:\/\/client\.example/,
    );
    for (const excluded of [
      "node_modules",
      "dist",
      ".git",
      ".stacki",
      "studio",
      ".env",
    ]) {
      await assert.rejects(access(path.join(target, excluded)));
    }
    await access(
      path.join(target, ".claude/skills/astro-lumos-interaction/SKILL.md"),
    );
    await access(
      path.join(target, ".agents/skills/astro-lumos-starter/SKILL.md"),
    );
    await access(
      path.join(target, ".claude/skills/astro-lumos-starter/SKILL.md"),
    );
    await writeFile(path.join(target, "keep.txt"), "preserve me");
    assert.notEqual(run(target).status, 0);
    assert.equal(
      await readFile(path.join(target, "keep.txt"), "utf8"),
      "preserve me",
    );
    const link = path.join(folder, "source-link");
    await symlink(fileURLToPath(new URL("..", import.meta.url)), link, "dir");
    assert.notEqual(run(path.join(link, "recursive-copy")).status, 0);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test("optional installer copies the portable repository skill and preserves existing installs", async () => {
  const folder = await mkdtemp(path.join(os.tmpdir(), "starter-skill-check-"));
  const script = fileURLToPath(
    new URL("../scripts/install-skill.mjs", import.meta.url),
  );
  const source = fileURLToPath(new URL("..", import.meta.url));
  const destination = path.join(folder, "skills/astro-lumos-starter");
  const run = () =>
    spawnSync(process.execPath, [script], {
      encoding: "utf8",
      env: { ...process.env, CODEX_HOME: folder },
    });
  try {
    const result = run();
    assert.equal(result.status, 0, result.stderr);
    const installed = await readFile(
      path.join(destination, "SKILL.md"),
      "utf8",
    );
    assert.equal(
      installed,
      await readFile(
        path.join(source, ".agents/skills/astro-lumos-starter/SKILL.md"),
        "utf8",
      ),
    );
    assert.equal(
      JSON.parse(await readFile(path.join(destination, "starter.json"), "utf8"))
        .starter,
      source,
    );
    await access(path.join(destination, "agents/openai.yaml"));
    await writeFile(path.join(destination, "keep.txt"), "preserve me");
    assert.notEqual(run().status, 0);
    assert.equal(
      await readFile(path.join(destination, "keep.txt"), "utf8"),
      "preserve me",
    );
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
