// Loads data/successors.json and finds entries that match a list of packages.
//
// The successor map is the project's durable asset: other tools can read the
// same file (see README, "Using the successor map"). The CLI only looks up
// exact (ecosystem, package) matches. Names are compared case-insensitively;
// PyPI names are normalised (foo_bar == foo-bar == Foo.Bar).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { normalizePypiName } from "./lockfiles/pypi.js";

const here = path.dirname(fileURLToPath(import.meta.url));
export const SUCCESSORS_FILE = path.join(here, "..", "data", "successors.json");

export function loadSuccessors(file = SUCCESSORS_FILE) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function key(ecosystem, name) {
  const n = ecosystem === "pypi" ? normalizePypiName(name) : name.toLowerCase();
  return `${ecosystem}:${n}`;
}

// Returns [{ package, entry }] for every package that has a successor entry.
export function matchSuccessors(ecosystem, packages, map = loadSuccessors()) {
  const index = new Map(map.entries.map((e) => [key(e.ecosystem, e.package), e]));
  const hits = [];
  for (const name of packages) {
    const entry = index.get(key(ecosystem, name));
    if (entry) hits.push({ package: name, entry });
  }
  return hits;
}

// One-line advice for a successor entry, shared by all report formats.
export function describeSuccessor(entry) {
  if (entry.successor) {
    const kind = entry.successor_kind ? ` (${entry.successor_kind})` : "";
    return `${entry.status}; use ${entry.successor}${kind}`;
  }
  return `${entry.status}; no drop-in successor - ${entry.notes}`;
}
