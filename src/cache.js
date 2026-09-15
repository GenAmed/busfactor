// A tiny on-disk cache for HTTP responses.
//
// Every URL we fetch is stored as one JSON file under ~/.cache/busfactor/
// (or $XDG_CACHE_HOME/busfactor, or $BUSFACTOR_CACHE_DIR if set).
// Entries older than 7 days are ignored, unless "offline" mode asks for
// whatever we have. Delete the folder to start fresh.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function cacheDir() {
  if (process.env.BUSFACTOR_CACHE_DIR) return process.env.BUSFACTOR_CACHE_DIR;
  const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), ".cache");
  return path.join(base, "busfactor");
}

function fileFor(url) {
  // A hash keeps file names short and safe whatever the URL contains.
  const hash = createHash("sha1").update(url).digest("hex");
  return path.join(cacheDir(), `${hash}.json`);
}

// Returns the cached body, or undefined when missing / too old.
// With allowStale = true (offline mode) the age is ignored.
export function readCache(url, { allowStale = false } = {}) {
  const file = fileFor(url);
  if (!existsSync(file)) return undefined;
  try {
    const entry = JSON.parse(readFileSync(file, "utf8"));
    const age = Date.now() - entry.fetchedAt;
    if (!allowStale && age > TTL_MS) return undefined;
    return entry.body;
  } catch {
    return undefined; // corrupt file: behave as a miss
  }
}

export function writeCache(url, body) {
  mkdirSync(cacheDir(), { recursive: true });
  writeFileSync(fileFor(url), JSON.stringify({ url, fetchedAt: Date.now(), body }));
}
