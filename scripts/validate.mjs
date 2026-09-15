#!/usr/bin/env node
// Validates data/successors.json.
//
// Three checks, in order:
//   1. The file matches data/schema.json (shape, allowed values, required fields).
//   2. No (ecosystem, package) pair appears twice.
//   3. Every package and every successor really exists on its registry
//      (stdlib successors and null successors are skipped).
//
// Exit code 0 = all good, 1 = something is wrong. The messages say what.
// Run with:  node scripts/validate.mjs        (or: npm run validate)
// Add --no-network to only run checks 1 and 2.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { checkSchema } from "./lib/mini-schema.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(here, "..", "data", "successors.json");
const schemaFile = path.join(here, "..", "data", "schema.json");
const USER_AGENT = "busfactor/0.1 (+https://github.com/benhamadi/busfactor)";
const CONCURRENCY = 4; // be polite to registries
const withNetwork = !process.argv.includes("--no-network");

const problems = [];

// ---------- 1. schema ----------
const data = JSON.parse(readFileSync(dataFile, "utf8"));
const schema = JSON.parse(readFileSync(schemaFile, "utf8"));
for (const message of checkSchema(schema, data)) problems.push(`schema: ${message}`);

// ---------- 2. duplicates ----------
const seen = new Set();
for (const entry of data.entries ?? []) {
  const key = `${entry.ecosystem}:${entry.package}`;
  if (seen.has(key)) problems.push(`duplicate entry: ${key}`);
  seen.add(key);
}

// Stop here if the shape is wrong: the network checks would only add noise.
if (problems.length) finish();

// ---------- 3. registry existence ----------
// One URL per ecosystem that answers 200 when the package exists.
function registryUrl(ecosystem, name) {
  switch (ecosystem) {
    case "npm":
      return `https://registry.npmjs.org/${encodeURIComponent(name).replace("%40", "@")}`;
    case "pypi":
      return `https://pypi.org/pypi/${name}/json`;
    case "cargo":
      return `https://crates.io/api/v1/crates/${name}`;
    case "go":
      // The Go proxy wants upper-case letters written as "!x" (so "Foo" becomes "!foo").
      return `https://proxy.golang.org/${name.replace(/[A-Z]/g, (c) => "!" + c.toLowerCase())}/@latest`;
    case "rubygems":
      return `https://rubygems.org/api/v1/gems/${name}.json`;
    case "packagist":
      return `https://repo.packagist.org/p2/${name}.json`;
    default:
      throw new Error(`no registry URL for ecosystem ${ecosystem}`);
  }
}

// Build the list of (label, url) pairs to check.
const checks = [];
for (const entry of data.entries) {
  checks.push({ label: `${entry.ecosystem}:${entry.package} (package)`, url: registryUrl(entry.ecosystem, entry.package) });
  if (entry.successor && entry.successor_kind !== "stdlib") {
    checks.push({ label: `${entry.ecosystem}:${entry.successor} (successor of ${entry.package})`, url: registryUrl(entry.ecosystem, entry.successor) });
  }
}

async function exists(url) {
  // Three attempts, because registries sometimes hiccup.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(20000) });
      if (res.status === 404) return false;
      if (res.ok) return true;
      // 5xx or 429: wait and retry
    } catch {
      // network error: wait and retry
    }
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  throw new Error(`could not reach ${url}`);
}

// Simple worker pool: CONCURRENCY workers pull from the shared queue.
if (withNetwork) {
  const queue = [...checks];
  let ok = 0;
  async function worker() {
    while (queue.length) {
      const { label, url } = queue.shift();
      try {
        if (await exists(url)) ok++;
        else problems.push(`not found on registry: ${label} -> ${url}`);
      } catch (err) {
        problems.push(`unreachable: ${label} -> ${err.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`checked ${checks.length} registry lookups, ${ok} found`);
} else {
  console.log("skipped registry lookups (--no-network)");
}

finish();

function finish() {
  console.log(`${data.entries?.length ?? 0} entries in ${path.relative(process.cwd(), dataFile)}`);
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log("successors.json is valid");
  process.exit(0);
}
