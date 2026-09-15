// Tests for the classifier, the human aggregation, the successor lookup and
// the report renderers. No network: records are built by hand.
import { test } from "node:test";
import assert from "node:assert/strict";
import { classify } from "../src/classify.js";
import { emptyRecord, fundingFieldToUrls, fundingObjectToUrls } from "../src/sources.js";
import { aggregateHumans } from "../src/humans.js";
import { matchSuccessors, loadSuccessors } from "../src/successors.js";
import { renderTable } from "../src/report/table.js";
import { renderMarkdown } from "../src/report/md.js";
import { renderSvg } from "../src/report/svg.js";
import { parseArgs } from "../src/args.js";

// A fixed "now" so the tests do not change with the calendar.
const NOW = Date.parse("2026-01-01T00:00:00Z");
const years = (n) => new Date(NOW - n * 365.25 * 24 * 3600 * 1000).toISOString();

function record(overrides) {
  return { ...emptyRecord("npm", "pkg"), found: true, maintainers: ["alice"], ...overrides };
}

test("dead: deprecated message or archived repository", () => {
  assert.equal(classify(record({ deprecated: "use something else" }), NOW).dead, true);
  assert.equal(classify(record({ archived: true }), NOW).dead, true);
  assert.equal(classify(record({ latestReleaseAt: years(0.5) }), NOW).dead, false);
});

test("dormant: needs >3y without release AND >1y without commit", () => {
  const old = record({ latestReleaseAt: years(4), lastPushAt: years(2) });
  assert.equal(classify(old, NOW).dormant, true);
  const oldButActiveRepo = record({ latestReleaseAt: years(4), lastPushAt: years(0.5) });
  assert.equal(classify(oldButActiveRepo, NOW).dormant, false);
  const noRepo = record({ latestReleaseAt: years(4), lastPushAt: null });
  assert.equal(classify(noRepo, NOW).dormant, true);
  const dead = record({ latestReleaseAt: years(4), lastPushAt: years(2), archived: true });
  assert.equal(classify(dead, NOW).dormant, false, "dead packages are not also counted as dormant");
});

test("solo and the org-owned heuristic", () => {
  assert.equal(classify(record({ maintainers: ["alice"] }), NOW).solo, true);
  assert.equal(classify(record({ maintainers: ["alice", "bob"] }), NOW).solo, false);
  // @types/node published by "types" from the DefinitelyTyped organisation
  const types = record({ name: "@types/node", maintainers: ["types"], repoOwner: "DefinitelyTyped", repoOwnerKind: "organization" });
  assert.equal(classify(types, NOW).orgOwned, true);
  // personal scope from a personal repository stays a person
  const personal = record({ name: "@alice/thing", maintainers: ["alice"], repoOwner: "alice", repoOwnerKind: "user" });
  assert.equal(classify(personal, NOW).orgOwned, false);
  // organisation login equals publisher login
  const org = record({ name: "thing", maintainers: ["babel"], repoOwner: "babel", repoOwnerKind: "organization" });
  assert.equal(classify(org, NOW).orgOwned, true);
});

test("funding fields are turned into URLs", () => {
  assert.deepEqual(fundingFieldToUrls("https://a"), ["https://a"]);
  assert.deepEqual(fundingFieldToUrls({ url: "https://b" }), ["https://b"]);
  assert.deepEqual(fundingFieldToUrls([{ url: "https://c" }, "https://d"]), ["https://c", "https://d"]);
  assert.deepEqual(fundingObjectToUrls({ github: "alice", custom: ["https://e"] }), ["https://github.com/sponsors/alice", "https://e"]);
});

test("humans: counts solo packages and attributes funding carefully", () => {
  const analysed = [
    { record: record({ name: "a", maintainers: ["alice"], fundingLinks: ["https://github.com/sponsors/alice"] }), flags: classify(record({ maintainers: ["alice"] }), NOW) },
    { record: record({ name: "b", maintainers: ["alice"], fundingLinks: ["https://github.com/sponsors/someone-else"] }), flags: classify(record({ maintainers: ["alice"] }), NOW) },
    { record: record({ name: "c", maintainers: ["alice", "bob"] }), flags: classify(record({ maintainers: ["alice", "bob"] }), NOW) },
  ];
  const humans = aggregateHumans(analysed);
  assert.equal(humans[0].login, "alice");
  assert.equal(humans[0].packages, 3);
  assert.equal(humans[0].solo, 2);
  assert.deepEqual(humans[0].fundingLinks, ["https://github.com/sponsors/alice"], "a link seen once that does not mention alice is dropped");
  assert.equal(humans[1].login, "bob");
  assert.equal(humans[1].solo, 0);
});

test("successors: exact match, case-insensitive, pypi normalised", () => {
  const map = loadSuccessors();
  assert.ok(map.entries.length >= 25);
  const npm = matchSuccessors("npm", ["lodash", "Request"], map);
  assert.deepEqual(npm.map((h) => h.entry.successor), ["undici"]);
  const py = matchSuccessors("pypi", ["Docopt"], map);
  assert.equal(py[0].entry.successor, "docopt-ng");
  assert.equal(matchSuccessors("cargo", ["request"], map).length, 0, "ecosystems do not mix");
});

test("reports render without throwing and carry the headline numbers", () => {
  const result = {
    tool: "busfactor", version: "0.1.0", scannedAt: "2026-01-01T00:00:00.000Z", lockfile: "/x/package-lock.json", ecosystem: "npm", analysed: true,
    totals: { packages: 3, found: 3, errors: 0, dead: 1, dormant: 1, solo: 2, soloPercent: 66, soloOrgOwned: 0, withAdvisories: 0, withFunding: 1, humans: 2, soloCritical: 1 },
    dead: [{ name: "old", reason: "repository archived", maintainers: ["alice"], orgOwned: false, dependentRepos: 10, advisories: 0, fundingLinks: [], repoUrl: null }],
    dormant: [{ name: "sleepy", reason: "last release 4y ago, last commit 2y ago", maintainers: ["alice"], orgOwned: false, dependentRepos: 5, advisories: 0, fundingLinks: [], repoUrl: null }],
    solo: [],
    humans: [{ login: "alice", packages: 3, solo: 2, orgOwned: false, fundingLinks: ["https://github.com/sponsors/alice"], examples: ["old"] }],
    successors: [{ package: "old", ecosystem: "npm", status: "archived", successor: "new", successor_kind: "fork", sources: ["https://example.com"], notes: "n" }],
    packages: [],
  };
  const table = renderTable(result, { color: false });
  assert.match(table, /3 packages/);
  assert.match(table, /alice\s+2 alone/);
  assert.doesNotMatch(table, /\x1b\[/, "no ANSI codes when colour is off");
  const md = renderMarkdown(result);
  assert.match(md, /\| Single publisher account \| \*\*2\*\* \(66%\) \|/);
  assert.match(md, /use new \(fork\)/);
  const svg = renderSvg(result);
  assert.match(svg, /^<svg /);
  assert.match(svg, /width="800" height="420"/);
  assert.match(svg, />alice</);
});

test("args: flags are parsed, bad values rejected", () => {
  const o = parseArgs(["./here", "--md", "--offline", "--fail-on", "dead", "--top", "3"]);
  assert.equal(o.path, "./here");
  assert.equal(o.format, "md");
  assert.equal(o.offline, true);
  assert.equal(o.failOn, "dead");
  assert.equal(o.top, 3);
  assert.throws(() => parseArgs(["--fail-on", "everything"]), /--fail-on must be/);
  assert.throws(() => parseArgs(["--bogus"]), /unknown option/);
});
