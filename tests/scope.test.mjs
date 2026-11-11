import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";
// Test the actual TypeScript implementation without another test framework.
const source = await fs.readFile(
  new URL("../src/lib/motion/scope.ts", import.meta.url),
  "utf8",
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText;
const { Scope } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);

test("disposal aborts listeners, runs LIFO, survives cleanup errors and is idempotent", () => {
  const scope = new Scope();
  const calls = [];
  const target = new EventTarget();
  target.addEventListener("change", () => calls.push("event"), {
    signal: scope.signal,
  });
  scope.defer(() => calls.push("first"));
  scope.defer(() => {
    throw new Error("expected cleanup failure");
  });
  scope.defer(() => calls.push("last"));
  const previous = console.error;
  console.error = () => {};
  try {
    scope.dispose();
    scope.dispose();
  } finally {
    console.error = previous;
  }
  target.dispatchEvent(new Event("change"));
  assert.equal(scope.signal.aborted, true);
  assert.deepEqual(calls, ["last", "first"]);
  scope.defer(() => calls.push("late"));
  assert.equal(calls.at(-1), "late");
});

test("disposed scopes cancel timers and observers", async () => {
  globalThis.window = globalThis;
  const scope = new Scope();
  let fired = false;
  let disconnected = false;
  scope.timeout(() => {
    fired = true;
  }, 10);
  scope.observe({
    disconnect() {
      disconnected = true;
    },
  });
  scope.dispose();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(fired, false);
  assert.equal(disconnected, true);
});
