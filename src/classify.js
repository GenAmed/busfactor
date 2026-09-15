// Turns a package record (see sources.js) into a handful of yes/no flags.
//
//   dead      the registry marks it deprecated, or its repository is archived
//   dormant   not dead, but no release for more than 3 years AND no commit for
//             more than 1 year (or no repository at all)
//   solo      exactly one account can publish it
//   orgOwned  solo, but the single account looks like an organisation account
//             (login equals the npm scope, or equals a GitHub organisation that
//             owns the repository). Shown as "org-owned?" because it is a guess.
//   hasAdvisories  at least one known security advisory
//   hasFunding     at least one funding link
//
// The thresholds live here so a maintainer can change them in one place.

export const DORMANT_RELEASE_YEARS = 3;
export const DORMANT_PUSH_YEARS = 1;

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

export function yearsSince(isoDate, now = Date.now()) {
  if (!isoDate) return null;
  const t = Date.parse(isoDate);
  if (Number.isNaN(t)) return null;
  return (now - t) / YEAR_MS;
}

export function classify(record, now = Date.now()) {
  const releaseAge = yearsSince(record.latestReleaseAt, now);
  const pushAge = yearsSince(record.lastPushAt, now);

  const dead = Boolean(record.deprecated) || record.archived;
  const dormant =
    !dead &&
    releaseAge !== null &&
    releaseAge > DORMANT_RELEASE_YEARS &&
    (pushAge === null || pushAge > DORMANT_PUSH_YEARS);

  const solo = record.maintainers.length === 1;
  const orgOwned = solo && looksLikeOrgAccount(record);

  return {
    dead,
    dormant,
    solo,
    orgOwned,
    hasAdvisories: record.advisories > 0,
    hasFunding: record.fundingLinks.length > 0,
    releaseAgeYears: releaseAge,
    pushAgeYears: pushAge,
    // A short human-readable reason for the dead/dormant flag, used in reports.
    reason: dead
      ? record.archived && !record.deprecated
        ? "repository archived"
        : `deprecated: ${String(record.deprecated).slice(0, 80)}`
      : dormant
        ? `last release ${releaseAge.toFixed(0)}y ago, last commit ${pushAge === null ? "unknown" : pushAge.toFixed(0) + "y ago"}`
        : "",
  };
}

// Heuristic: is the single publisher account an organisation rather than a person?
// We only say yes when the source repository belongs to a GitHub *organisation*
// (not a user) and the publisher login matches either that organisation or the
// npm scope. Example: "@types/node" is published by "types" and lives under the
// DefinitelyTyped organisation. "@jridgewell/foo" published by "jridgewell" from
// a personal repository stays a person.
function looksLikeOrgAccount(record) {
  const login = record.maintainers[0]?.toLowerCase();
  if (!login || record.repoOwnerKind !== "organization") return false;
  if (record.repoOwner?.toLowerCase() === login) return true;
  const scope = record.name.startsWith("@") ? record.name.slice(1).split("/")[0].toLowerCase() : null;
  return scope === login;
}
