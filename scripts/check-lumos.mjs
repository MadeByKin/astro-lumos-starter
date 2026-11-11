import { readFile, mkdir, writeFile } from "node:fs/promises";
const root = new URL("../", import.meta.url);
const pkg = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
if (!/^[a-f0-9]{40}$/.test(pkg.lumos?.commit || ""))
  throw new Error(
    "Missing valid Lumos baseline commit; do not guess a merge base",
  );
const get = async (url) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "astro-lumos-starter-update-check",
      Accept: "application/vnd.github+json",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok)
    throw new Error(`Cannot verify upstream: ${response.status} ${url}`);
  return response;
};
const api = "https://api.github.com/repos/lumosframework/lumos-for-astro";
const [current, base] = await Promise.all([
  get(`${api}/git/trees/main?recursive=1`).then((r) => r.json()),
  get(`${api}/git/trees/${pkg.lumos.commit}?recursive=1`).then((r) => r.json()),
]);
if (current.truncated || base.truncated || !current.sha || !base.sha)
  throw new Error("Incomplete upstream tree; cannot establish update status");
const upstreamPkg = JSON.parse(
  await (
    await get(
      `https://raw.githubusercontent.com/lumosframework/lumos-for-astro/${current.sha}/package.json`,
    )
  ).text(),
);
const previous = new Map(
  base.tree.filter((x) => x.type === "blob").map((x) => [x.path, x.sha]),
);
const latest = new Map(
  current.tree.filter((x) => x.type === "blob").map((x) => [x.path, x.sha]),
);
const changed = [...latest]
  .filter(([path, sha]) => previous.get(path) !== sha)
  .map(([path]) => path);
const removed = [...previous.keys()].filter((path) => !latest.has(path));
const report = {
  checkedAt: new Date().toISOString(),
  baselineVersion: pkg.lumos.version,
  baselineCommit: pkg.lumos.commit,
  upstreamVersion: upstreamPkg.version,
  upstreamCommit: current.sha,
  updateAvailable: current.sha !== pkg.lumos.commit,
  changed,
  removed,
  documentation: "https://lumosframework.com/docs/",
  comparison: `https://github.com/lumosframework/lumos-for-astro/compare/${pkg.lumos.commit}...${current.sha}`,
  scope:
    "Upstream source check only. Read current docs/release notes and use the maintenance workflow before applying any changes.",
};
if (process.argv.includes("--write")) {
  const dir = new URL("docs/maintenance/", root);
  await mkdir(dir, { recursive: true });
  await writeFile(
    new URL("last-check.json", dir),
    JSON.stringify(report, null, 2) + "\n",
  );
}
console.log(JSON.stringify(report, null, 2));
