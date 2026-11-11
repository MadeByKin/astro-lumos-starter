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
