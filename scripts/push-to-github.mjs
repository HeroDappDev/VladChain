#!/usr/bin/env node
/**
 * Safe GitHub push for VladChain.
 *
 * WHY THIS EXISTS
 * ---------------
 * The workspace git repo still contains old old-brand commit history.
 * A plain `git push origin main` would resurrect the old-brand history on GitHub.
 * The GitHub repo (HeroDappDev/VladChain) was reset to a single clean
 * "Initial commit" — all future pushes must build on top of that clean
 * history, never on the local workspace history.
 *
 * This script snapshots the current working tree (with exclusions), builds
 * a new commit via the GitHub Git Data API whose parent is the CURRENT
 * GitHub head, and fast-forwards refs/heads/main (never force). The local
 * git history is never sent to GitHub.
 *
 * USAGE
 *   node scripts/push-to-github.mjs "Commit message here"
 *
 * Must be run from the workspace root (needs @replit/connectors-sdk from
 * node_modules and the Replit GitHub connection for auth — the GITHUB_TOKEN
 * secret has no write access).
 *
 * EXCLUSIONS (keep in sync with the clean snapshot):
 *   .git/ .agents/ .local/ node_modules/ frontend/dist/ backend/data/ *.db
 *   plus anything matched by .gitignore.
 */
import { ReplitConnectors } from "@replit/connectors-sdk";
import { execSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

const OWNER = "HeroDappDev";
const REPO = "VladChain";
const BRANCH = "main";
const ROOT = process.cwd();

const DRY_RUN = process.argv.includes("--dry-run");
const message = process.argv.filter((a) => a !== "--dry-run")[2];
if (!message && !DRY_RUN) {
  console.error('Usage: node scripts/push-to-github.mjs "Commit message"');
  process.exit(1);
}

// ---- collect files -------------------------------------------------------
const EXCLUDE_DIRS = [".git", ".agents", ".local", "node_modules", "frontend/dist", "backend/data"];
const EXCLUDE_PATTERNS = [/\.db$/i];
// Old brand names must never reach GitHub. Built from parts so this file
// itself doesn't trip its own guard.
const BRAND_RE = new RegExp(["hood", "ansem", "grok", "aster"].map((p) => p + "chain").join("|"), "i");

// Tracked + untracked-but-not-ignored files, then apply snapshot exclusions.
const listed = execSync("git ls-files --cached --others --exclude-standard", {
  cwd: ROOT,
  maxBuffer: 64 * 1024 * 1024,
})
  .toString()
  .split("\n")
  .filter(Boolean);

const files = listed.filter((f) => {
  if (EXCLUDE_DIRS.some((d) => f === d || f.startsWith(d + "/"))) return false;
  if (EXCLUDE_PATTERNS.some((re) => re.test(f))) return false;
  try {
    return statSync(path.join(ROOT, f)).isFile();
  } catch {
    return false; // deleted from working tree
  }
});

// ---- old-brand guard ------------------------------------------------------
const offenders = [];
for (const f of files) {
  if (BRAND_RE.test(f)) offenders.push(`${f} (filename)`);
  else {
    const buf = readFileSync(path.join(ROOT, f));
    // skip binary-ish files for content scan
    if (!buf.includes(0) && BRAND_RE.test(buf.toString("utf8"))) offenders.push(f);
  }
}
if (offenders.length) {
  console.error("ABORT: old brand names found — fix these before pushing:");
  offenders.forEach((f) => console.error("  - " + f));
  process.exit(1);
}

if (DRY_RUN) {
  console.log(`Dry run: would push ${files.length} files (brand guard passed). No API calls made.`);
  files.slice(0, 20).forEach((f) => console.log("  " + f));
  if (files.length > 20) console.log(`  ... and ${files.length - 20} more`);
  process.exit(0);
}

// ---- GitHub API via connector proxy ---------------------------------------
const connectors = new ReplitConnectors();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gh(pathname, options = {}, attempt = 0) {
  const res = await connectors.proxy("github", pathname, {
    ...options,
    headers: { "Content-Type": "application/json", Accept: "application/vnd.github+json", ...(options.headers || {}) },
  });
  if (res.status === 429 || res.status === 403 || res.status >= 500) {
    if (attempt >= 6) throw new Error(`Retries exhausted on ${pathname} (last status ${res.status})`);
    await sleep(1500 * (attempt + 1));
    return gh(pathname, options, attempt + 1);
  }
  if (!res.ok) throw new Error(`${options.method || "GET"} ${pathname} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

const api = (p) => `/repos/${OWNER}/${REPO}${p}`;

console.log(`Pushing ${files.length} files to ${OWNER}/${REPO}@${BRANCH} ...`);

const ref = await gh(api(`/git/ref/heads/${BRANCH}`));
const parentSha = ref.object.sha;
const parentCommit = await gh(api(`/git/commits/${parentSha}`));
console.log(`Parent commit on GitHub: ${parentSha.slice(0, 10)} "${parentCommit.message.split("\n")[0]}"`);

// create blobs (~110ms spacing for the ~10 RPS proxy limit)
const treeEntries = [];
for (const f of files) {
  const buf = readFileSync(path.join(ROOT, f));
  const isExec = (statSync(path.join(ROOT, f)).mode & 0o100) !== 0;
  const blob = await gh(api("/git/blobs"), {
    method: "POST",
    body: JSON.stringify({ content: buf.toString("base64"), encoding: "base64" }),
  });
  treeEntries.push({ path: f, mode: isExec ? "100755" : "100644", type: "blob", sha: blob.sha });
  await sleep(110);
}

// full (non-delta) tree so removed files disappear from GitHub too
const tree = await gh(api("/git/trees"), { method: "POST", body: JSON.stringify({ tree: treeEntries }) });
const commit = await gh(api("/git/commits"), {
  method: "POST",
  body: JSON.stringify({ message, tree: tree.sha, parents: [parentSha] }),
});
// NEVER force — history on GitHub only moves forward from the clean root
await gh(api(`/git/refs/heads/${BRANCH}`), {
  method: "PATCH",
  body: JSON.stringify({ sha: commit.sha, force: false }),
});

console.log(`Done. New commit: ${commit.sha}`);
console.log(`https://github.com/${OWNER}/${REPO}/commit/${commit.sha}`);
