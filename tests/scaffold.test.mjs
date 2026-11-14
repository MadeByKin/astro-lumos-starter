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
    const worker = await readFile(path.join(target, "wrangler.jsonc"), "utf8");
    assert.match(worker, /"name": "client-site"/);
    assert.match(worker, /"directory": "\.\/dist"/);
    assert.match(worker, /"html_handling": "drop-trailing-slash"/);
    assert.match(worker, /"not_found_handling": "404-page"/);
    assert.match(worker, /"CONTACT_ORIGIN": "https:\/\/client\.example"/);
    assert.match(worker, /"main": "\.\/worker\/index\.mjs"/);
    await access(path.join(target, "worker/contact.mjs"));
    await access(path.join(target, "docs/contact-forms.md"));
    await access(path.join(target, ".env.example"));
    await access(path.join(target, ".dev.vars.example"));
    assert.equal(pkg.scripts.deploy, "npm run build && wrangler deploy");
    assert.ok(pkg.devDependencies.wrangler);
    await access(path.join(target, "docs/cloudflare.md"));
    assert.match(result.stdout, /docs\/cloudflare\.md/);
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
      ".wrangler",
      ".dev.vars",
    ]) {
      await assert.rejects(access(path.join(target, excluded)));
    }
    await access(
      path.join(target, ".claude/skills/astro-lumos-interaction/SKILL.md"),
    );
    assert.match(
      await readFile(path.join(target, "CLAUDE.md"), "utf8"),
      /@AGENTS\.md/,
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
    const invalidTarget = path.join(folder, "invalid-name");
    assert.notEqual(run(invalidTarget, `--name=${"a".repeat(64)}`).status, 0);
    assert.notEqual(run(invalidTarget, "--name=client-").status, 0);
    await assert.rejects(access(invalidTarget));
    // Seed a disposable source with local settings as on a developer's machine.
    await writeFile(path.join(target, ".claude/settings.local.json"), "{}");
    await writeFile(path.join(target, "src/.env.local"), "SAMPLE=test");
    const second = path.join(folder, "second-client");
    const copied = spawnSync(
      process.execPath,
      [path.join(target, "scripts/create-project.mjs"), second],
      { encoding: "utf8" },
    );
    assert.equal(copied.status, 0, copied.stderr);
    for (const local of [".claude/settings.local.json", "src/.env.local"]) {
      await assert.rejects(access(path.join(second, local)), {
        code: "ENOENT",
      });
    }
    const alias = path.join(folder, "client-link");
    await symlink(target, alias, "dir");
    const nested = spawnSync(process.execPath, [
      path.join(target, "scripts/create-project.mjs"),
      path.join(alias, "missing-parent", "nested-site"),
    ]);
    assert.notEqual(nested.status, 0);
    await assert.rejects(access(path.join(target, "missing-parent")), {
      code: "ENOENT",
    });
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

for (const tool of ["codex", "claude"]) {
  test(`${tool} installer copies the shared skill and preserves existing installs`, async () => {
    const folder = await mkdtemp(
      path.join(os.tmpdir(), "starter-skill-check-"),
    );
    const script = fileURLToPath(
      new URL("../scripts/install-skill.mjs", import.meta.url),
    );
    const source = fileURLToPath(new URL("..", import.meta.url));
    const config = path.join(folder, tool);
    const destination = path.join(config, "skills/astro-lumos-starter");
    const run = (...args) =>
      spawnSync(process.execPath, [script, ...args], {
        encoding: "utf8",
        env: {
          ...process.env,
          CODEX_HOME: path.join(folder, "codex"),
          CLAUDE_CONFIG_DIR: path.join(folder, "claude"),
        },
      });
    try {
      assert.notEqual(run("--tool=unknown").status, 0);
      await assert.rejects(access(config));
      // Keep the no-option Codex entry point covered for existing users.
      const result = tool === "codex" ? run() : run("--tool=claude");
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
        JSON.parse(
          await readFile(path.join(destination, "starter.json"), "utf8"),
        ).starter,
        source,
      );
      await access(path.join(destination, "agents/openai.yaml"));
      await writeFile(path.join(destination, "keep.txt"), "preserve me");
      assert.notEqual(run(`--tool=${tool}`).status, 0);
      assert.equal(
        await readFile(path.join(destination, "keep.txt"), "utf8"),
        "preserve me",
      );
      const other = tool === "codex" ? "claude" : "codex";
      await assert.rejects(access(path.join(folder, other)));
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  });
}
