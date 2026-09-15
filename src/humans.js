// Aggregates packages by publisher account to answer:
// "which people does this project depend on, and how much?"
//
// For each login we count the packages they can publish, how many of those
// they carry alone, and pick funding links that plausibly belong to them.

export function aggregateHumans(analysed) {
  const byLogin = new Map();
  for (const { record, flags } of analysed) {
    for (const login of record.maintainers) {
      if (!byLogin.has(login)) {
        byLogin.set(login, { login, packages: 0, solo: 0, soloOrgOwned: 0, orgOwned: false, fundingLinks: [], examples: [], _linkCounts: new Map() });
      }
      const human = byLogin.get(login);
      human.packages += 1;
      if (flags.solo) {
        human.solo += 1;
        if (flags.orgOwned) human.soloOrgOwned += 1;
        if (human.examples.length < 3) human.examples.push(record.name);
      }
      for (const url of record.fundingLinks) {
        human._linkCounts.set(url, (human._linkCounts.get(url) ?? 0) + 1);
      }
    }
  }

  for (const human of byLogin.values()) {
    // "org-owned?" only when every package they carry alone looks org-owned.
    human.orgOwned = human.solo > 0 && human.soloOrgOwned === human.solo;

    // A funding link is attributed to a person when it mentions their login,
    // or when it appears on at least two of their packages (a project collective).
    // A link seen once on a single package may belong to someone else
    // (typical for forks that kept the original author's funding field).
    human.fundingLinks = [...human._linkCounts.entries()]
      .filter(([url, count]) => mentions(url, human.login) || count >= 2)
      .map(([url]) => url)
      .sort((a, b) => fundingRank(a, human.login) - fundingRank(b, human.login));
    delete human._linkCounts;
  }

  // Most solo packages first, then most packages overall, then by name.
  return [...byLogin.values()].sort((a, b) => b.solo - a.solo || b.packages - a.packages || a.login.localeCompare(b.login));
}

function mentions(url, login) {
  return url.toLowerCase().includes(login.toLowerCase());
}

// Best link first: the person's own GitHub Sponsors page, then Open Collective,
// then any link that mentions their login, then the rest.
function fundingRank(url, login) {
  const u = url.toLowerCase();
  const l = login.toLowerCase();
  if (u === `https://github.com/sponsors/${l}`) return 0;
  if (u.includes(`opencollective.com/${l}`)) return 1;
  if (u.includes(l)) return 2;
  return 3;
}
