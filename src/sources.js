// Fetches what we know about one package and returns a flat "record".
//
// Two sources:
//   1. packages.ecosyste.ms  - one call per package, any ecosystem. Gives release
//      dates, repository state (archived? last push?), publisher accounts,
//      advisories, funding links and how many repos depend on it.
//   2. registry.npmjs.org   - npm only. Gives the "deprecated" message and the
//      package.json "funding" field of the latest version.
//
// Everything downstream (classify, humans, reports) works on the record shape
// documented in emptyRecord() below, never on raw API responses.

import { getJson } from "./net.js";

// ecosyste.ms names registries by host, not by ecosystem.
export const ECOSYSTEMS_REGISTRY = {
  npm: "npmjs.org",
  pypi: "pypi.org",
  cargo: "crates.io",
  go: "proxy.golang.org",
  rubygems: "rubygems.org",
  packagist: "packagist.org",
};

export function emptyRecord(ecosystem, name) {
  return {
    ecosystem,
    name,
    found: false,            // false when neither source knew the package
    error: null,             // network error message, if any
    deprecated: null,        // registry deprecation message or status, null if none
    archived: false,         // source repository archived
    latestReleaseAt: null,   // ISO date of the latest release
    lastPushAt: null,        // ISO date of the last commit push to the repository
    maintainers: [],         // publisher account logins
    fundingLinks: [],        // URLs where you can pay the maintainers
    advisories: 0,           // number of known security advisories
    dependentRepos: 0,       // how many repositories depend on it (ecosyste.ms count)
    repoUrl: null,
    repoOwner: null,         // GitHub/GitLab owner login
    repoOwnerKind: null,     // "organization" or "user" when known
  };
}

export async function fetchRecord(ecosystem, name, { offline = false } = {}) {
  const record = emptyRecord(ecosystem, name);

  // --- 1. ecosyste.ms ---
  const registry = ECOSYSTEMS_REGISTRY[ecosystem];
  const url = `https://packages.ecosyste.ms/api/v1/registries/${registry}/packages/${encodeURIComponent(name)}`;
  const eco = await getJson(url, { offline });
  if (eco.ok && eco.body?.name) {
    applyEcosystems(record, eco.body);
  } else if (!eco.ok && eco.error) {
    record.error = eco.error;
  }

  // --- 2. npm registry (npm only) ---
  if (ecosystem === "npm") {
    const npmUrl = `https://registry.npmjs.org/${name.replace("/", "%2f")}/latest`;
    const npm = await getJson(npmUrl, { offline });
    if (npm.ok && npm.body) applyNpm(record, npm.body);
    else if (!npm.ok && npm.error && !record.error) record.error = npm.error;
  }

  return record;
}

// Copy the fields we care about from an ecosyste.ms package document.
function applyEcosystems(record, pkg) {
  record.found = true;
  const repo = pkg.repo_metadata ?? {};
  if (pkg.status && pkg.status !== "active") record.deprecated = record.deprecated ?? pkg.status;
  record.archived = Boolean(repo.archived);
  record.latestReleaseAt = pkg.latest_release_published_at ?? null;
  record.lastPushAt = repo.pushed_at ?? null;
  record.maintainers = (pkg.maintainers ?? []).map((m) => m.login).filter(Boolean);
  record.advisories = (pkg.advisories ?? []).length;
  record.dependentRepos = pkg.dependent_repos_count ?? 0;
  record.repoUrl = repo.html_url ?? pkg.repository_url ?? null;
  record.repoOwner = repo.owner ?? null;
  record.repoOwnerKind = repo.owner_record?.kind ?? null;

  addFunding(record, pkg.funding_links);
  addFunding(record, repo.owner_record?.funding_links);
  addFunding(record, fundingObjectToUrls(repo.metadata?.funding));
}

// Copy the fields we care about from registry.npmjs.org/<name>/latest.
function applyNpm(record, latest) {
  record.found = true;
  if (latest.deprecated) record.deprecated = latest.deprecated;
  if (!record.maintainers.length) {
    record.maintainers = (latest.maintainers ?? []).map((m) => m.name).filter(Boolean);
  }
  addFunding(record, fundingFieldToUrls(latest.funding));
}

function addFunding(record, urls) {
  for (const u of urls ?? []) {
    if (typeof u === "string" && u.startsWith("http") && !record.fundingLinks.includes(u)) record.fundingLinks.push(u);
  }
}

// package.json "funding" can be a string, an object {url}, or an array of those.
export function fundingFieldToUrls(funding) {
  if (!funding) return [];
  const list = Array.isArray(funding) ? funding : [funding];
  return list.map((f) => (typeof f === "string" ? f : f?.url)).filter(Boolean);
}

// GitHub FUNDING.yml as parsed by ecosyste.ms: { github: "login" | ["a","b"], open_collective: "x", custom: "url" | [...] , ... }
export function fundingObjectToUrls(funding) {
  if (!funding || typeof funding !== "object") return [];
  const urls = [];
  const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  for (const login of asList(funding.github)) urls.push(`https://github.com/sponsors/${login}`);
  for (const slug of asList(funding.open_collective)) urls.push(`https://opencollective.com/${slug}`);
  for (const slug of asList(funding.patreon)) urls.push(`https://www.patreon.com/${slug}`);
  for (const slug of asList(funding.ko_fi)) urls.push(`https://ko-fi.com/${slug}`);
  for (const slug of asList(funding.tidelift)) urls.push(`https://tidelift.com/funding/github/${slug}`);
  for (const slug of asList(funding.liberapay)) urls.push(`https://liberapay.com/${slug}`);
  for (const url of asList(funding.custom)) if (typeof url === "string") urls.push(url);
  return urls;
}
