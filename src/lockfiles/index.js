// Finds the lockfile to scan and turns it into a list of package names.
//
// Each supported file maps to an ecosystem and a parser. "analysed: true" means
// v0 fetches maintainer data for that ecosystem; "false" means we only list the
// names and tell the user the ecosystem is not yet analysed.

import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { parseNpmLock } from "./npm.js";
import { parseRequirementsTxt, parsePoetryLock, parseUvLock } from "./pypi.js";
import { parseCargoLock } from "./cargo.js";
import { parseGoSum } from "./go.js";

export const LOCKFILES = [
  { file: "package-lock.json", ecosystem: "npm", parse: parseNpmLock, analysed: true },
  { file: "poetry.lock", ecosystem: "pypi", parse: parsePoetryLock, analysed: true },
  { file: "requirements.txt", ecosystem: "pypi", parse: parseRequirementsTxt, analysed: true },
  { file: "uv.lock", ecosystem: "pypi", parse: parseUvLock, analysed: false },
  { file: "Cargo.lock", ecosystem: "cargo", parse: parseCargoLock, analysed: false },
  { file: "go.sum", ecosystem: "go", parse: parseGoSum, analysed: false },
];

// Given a directory OR a file path, return { file, ecosystem, packages, analysed }.
// In a directory, the first matching entry of LOCKFILES wins (npm before Python, etc.).
export function loadLockfile(target = process.cwd()) {
  let filePath;
  if (existsSync(target) && !isDirectory(target)) {
    filePath = target;
  } else {
    const hit = LOCKFILES.find((l) => existsSync(path.join(target, l.file)));
    if (!hit) {
      throw new Error(`no lockfile found in ${target}. Looked for: ${LOCKFILES.map((l) => l.file).join(", ")}`);
    }
    filePath = path.join(target, hit.file);
  }
  const base = path.basename(filePath);
  const kind = LOCKFILES.find((l) => l.file === base);
  if (!kind) throw new Error(`${base} is not a supported lockfile. Supported: ${LOCKFILES.map((l) => l.file).join(", ")}`);
  const packages = kind.parse(readFileSync(filePath, "utf8"));
  return { file: filePath, ecosystem: kind.ecosystem, packages, analysed: kind.analysed };
}

function isDirectory(p) {
  return statSync(p).isDirectory();
}
