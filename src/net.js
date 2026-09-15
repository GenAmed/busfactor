// HTTP helpers: one function to fetch JSON (with cache, retries and a
// User-Agent) and one to run many fetches with limited concurrency.

import { readCache, writeCache } from "./cache.js";

export const USER_AGENT = "busfactor/0.1 (+https://github.com/benhamadi/busfactor)";
export const CONCURRENCY = 4; // ecosyste.ms asks for at most 4 parallel requests

// Fetch a JSON document. Returns:
//   { ok: true,  body }          on success (or cache hit)
//   { ok: false, status: 404 }   when the resource does not exist
//   { ok: false, error }         when the network failed after retries or we are offline
export async function getJson(url, { offline = false } = {}) {
  const cached = readCache(url, { allowStale: offline });
  if (cached === null) return { ok: false, status: 404, fromCache: true }; // we cached a "not found"
  if (cached !== undefined) return { ok: true, body: cached, fromCache: true };
  if (offline) return { ok: false, error: "offline and not in cache" };

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
      });
      if (res.status === 404) {
        writeCache(url, null); // remember "not found" too, it is a valid answer
        return { ok: false, status: 404 };
      }
      if (res.ok) {
        const body = await res.json();
        writeCache(url, body);
        return { ok: true, body };
      }
      lastError = `HTTP ${res.status}`;
      if (res.status === 429) await sleep(5000 * attempt); // rate limited: back off harder
    } catch (err) {
      lastError = err.message;
    }
    await sleep(1000 * attempt);
  }
  return { ok: false, error: lastError };
}

// Run "task(item)" for every item, at most CONCURRENCY at a time.
// onProgress(done, total) is called after each item, for the progress line.
export async function mapWithPool(items, task, onProgress = () => {}) {
  const results = new Array(items.length);
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await task(items[i]);
      onProgress(++done, items.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker));
  return results;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
