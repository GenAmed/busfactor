// The scan itself: lockfile -> records -> flags -> one result object.
// Every report format (table, json, md, svg) is rendered from this object.

import { loadLockfile } from "./lockfiles/index.js";
import { fetchRecord } from "./sources.js";
import { classify } from "./classify.js";
import { aggregateHumans } from "./humans.js";
import { matchSuccessors } from "./successors.js";
import { mapWithPool } from "./net.js";

export const VERSION = "0.1.0";

// Options: { target, offline, onProgress }
export async function scan({ target = process.cwd(), offline = false, onProgress = () => {} } = {}) {
  const lock = loadLockfile(target);
  const result = {
    tool: "busfactor",
    version: VERSION,
    scannedAt: new Date().toISOString(),
    lockfile: lock.file,
    ecosystem: lock.ecosystem,
    analysed: lock.analysed,
    totals: { packages: lock.packages.length },
    successors: matchSuccessors(lock.ecosystem, lock.packages).map(({ package: name, entry }) => ({ package: name, ...entry })),
    dead: [],
    dormant: [],
    solo: [],
    humans: [],
    packages: [],
  };

  // Ecosystems we only list for now: stop after the successor lookup.
  if (!lock.analysed) return result;

  // Fetch every package, 4 at a time, then classify.
  const records = await mapWithPool(lock.packages, (name) => fetchRecord(lock.ecosystem, name, { offline }), onProgress);
  const now = Date.now();
  const analysed = records.map((record) => ({ record, flags: classify(record, now) }));

  const found = analysed.filter((a) => a.record.found);
  const pick = (test) => found.filter((a) => test(a.flags)).sort((a, b) => b.record.dependentRepos - a.record.dependentRepos);

  result.dead = pick((f) => f.dead).map(summary);
  result.dormant = pick((f) => f.dormant).map(summary);
  result.solo = pick((f) => f.solo).map(summary);
  result.humans = aggregateHumans(found);
  result.packages = analysed.map(({ record, flags }) => ({ ...record, flags }));

  const count = (test) => found.filter((a) => test(a.flags)).length;
  result.totals = {
    packages: lock.packages.length,
    found: found.length,
    errors: analysed.filter((a) => a.record.error).length,
    dead: result.dead.length,
    dormant: result.dormant.length,
    solo: result.solo.length,
    // Rounded down on purpose: "51%" means "at least 51%".
    soloPercent: found.length ? Math.floor((100 * result.solo.length) / found.length) : 0,
    soloOrgOwned: count((f) => f.solo && f.orgOwned),
    withAdvisories: count((f) => f.hasAdvisories),
    withFunding: count((f) => f.hasFunding),
    humans: result.humans.length,
    // "solo-critical": one account AND (dead or dormant). Used by --fail-on.
    soloCritical: count((f) => f.solo && !f.orgOwned && (f.dead || f.dormant)),
  };
  return result;
}

// The short per-package shape used in the dead/dormant/solo lists.
function summary({ record, flags }) {
  return {
    name: record.name,
    reason: flags.reason,
    maintainers: record.maintainers,
    orgOwned: flags.orgOwned,
    dependentRepos: record.dependentRepos,
    advisories: record.advisories,
    fundingLinks: record.fundingLinks,
    repoUrl: record.repoUrl,
  };
}
