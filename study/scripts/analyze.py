"""Step C: aggregate per-repo and global statistics, rank the humans, write JSON + markdown."""
import json, os, re, datetime, collections, urllib.parse

repos = [r for r in json.load(open("repos-with-deps.json")) if r.get("packages")]
now = datetime.datetime.now(datetime.timezone.utc)
def years(iso):
    if not iso: return None
    return (now - datetime.datetime.fromisoformat(iso.replace("Z", "+00:00"))).days / 365

meta = {}
# base: npm registry (all packages)
for f in os.listdir("npm"):
    d = json.load(open("npm/" + f))
    if d.get("_missing") or not d.get("name"): continue
    rel = years(d.get("latest_time"))
    logins = [x for x in (d.get("maintainers") or []) if x]
    repo = d.get("repository") or ""
    if not isinstance(repo, str): repo = str(repo)
    m = re.search(r"github\.com[/:]([^/]+)/", repo)
    owner = m.group(1).lower() if m else ""
    scope = d["name"].split("/")[0][1:].lower() if d["name"].startswith("@") else None
    meta[d["name"]] = dict(dead=bool(d.get("deprecated")), dormant=(not d.get("deprecated")) and rel is not None and rel > 3,
                           solo=len(logins) == 1, org_owned=False, logins=logins, owner=owner, scope=scope,
                           advisories=0, dependents=0, downloads=0, funding=bool(d.get("funding")), rel_age=rel,
                           status="deprecated" if d.get("deprecated") else None, archived=False, enriched=False)
# enrichment: ecosyste.ms (shared packages)
for f in os.listdir("cache"):
    d = json.load(open("cache/" + f))
    if d.get("_missing") or not d.get("name") or d["name"] not in meta: continue
    x = meta[d["name"]]; rm = d.get("repo_metadata") or {}
    push = years(rm.get("pushed_at"))
    if rm.get("archived"): x["dead"] = True; x["archived"] = True; x["status"] = x["status"] or "archived"
    if d.get("status") in ("deprecated", "removed"): x["dead"] = True; x["status"] = d["status"]
    x["dormant"] = (not x["dead"]) and x["rel_age"] is not None and x["rel_age"] > 3 and (push is None or push > 1)
    x["advisories"] = d.get("advisories") or 0
    x["dependents"] = d.get("dependent_repos_count") or 0
    x["downloads"] = d.get("downloads") or 0
    x["funding"] = x["funding"] or bool(d.get("funding_links") or rm.get("funding"))
    x["owner_kind"] = rm.get("owner_kind"); x["enriched"] = True
    if rm.get("owner"): x["owner"] = rm["owner"].lower()
# org-owned heuristic: single publisher whose login matches the GitHub owner or the npm scope
for n, x in meta.items():
    if x["solo"]:
        l = x["logins"][0].lower()
        kind = x.get("owner_kind")
        if kind:   # enriched: trust GitHub owner kind
            x["org_owned"] = kind == "organization" and (l == x["owner"] or l == x["scope"])
        else:      # long tail: a publisher named like the npm scope is a project account, not a person
            x["org_owned"] = x["scope"] is not None and l == x["scope"]
        if l in ("types",): x["org_owned"] = True

# ---- per repo
per_repo = []
for r in repos:
    pk = [p for p in r["packages"] if p in meta]
    if len(pk) < 20: continue
    n = len(pk)
    solo = [p for p in pk if meta[p]["solo"] and not meta[p]["org_owned"]]
    dead = [p for p in pk if meta[p]["dead"]]
    dorm = [p for p in pk if meta[p]["dormant"]]
    humans = collections.Counter()
    for p in solo: humans[meta[p]["logins"][0]] += 1
    top = humans.most_common(1)[0] if humans else ("", 0)
    per_repo.append(dict(repo=r["full_name"], stars=r["stars"], lockfile=r["lockfile"], packages=n,
                         solo=len(solo), solo_pct=round(100 * len(solo) / n), dead=len(dead), dormant=len(dorm),
                         advisories=sum(1 for p in pk if meta[p]["advisories"]), distinct_publishers=len({l for p in pk for l in meta[p]["logins"]}),
                         top_human=top[0], top_human_alone=top[1], top5_share=round(100 * sum(c for _, c in humans.most_common(5)) / n)))
per_repo.sort(key=lambda x: -x["stars"])

# ---- global: humans across repos
presence = collections.defaultdict(set)     # login -> repos where they carry >=1 solo package
carry = collections.Counter()               # login -> (repo, package) pairs carried alone
pkg_by_login = collections.defaultdict(set)
for r in repos:
    for p in r["packages"]:
        m = meta.get(p)
        if m and m["solo"] and not m["org_owned"]:
            l = m["logins"][0]; presence[l].add(r["full_name"]); carry[l] += 1; pkg_by_login[l].add(p)
nrepos = len(per_repo)
humans_rank = sorted(presence, key=lambda l: (-len(presence[l]), -carry[l]))
top_humans = [dict(login=l, repos=len(presence[l]), repos_pct=round(100 * len(presence[l]) / nrepos), packages_alone=len(pkg_by_login[l]),
                   sample=sorted(pkg_by_login[l], key=lambda p: -meta[p]["dependents"])[:5]) for l in humans_rank[:25]]

# ---- global: packages
all_pk = [p for p in meta]
used = collections.Counter(p for r in repos for p in r["packages"] if p in meta)
dead_pk = sorted([p for p in all_pk if meta[p]["dead"]], key=lambda p: -used[p])[:25]
dorm_pk = sorted([p for p in all_pk if meta[p]["dormant"] and meta[p]["solo"] and not meta[p]["org_owned"]], key=lambda p: -used[p])[:25]
solo_heavy = sorted([p for p in all_pk if meta[p]["solo"] and not meta[p]["org_owned"]], key=lambda p: -used[p])[:25]

# how many repos would a single person's disappearance touch (their solo packages) -> already presence
cover = {}
for k in (1, 5, 10, 25):
    s = set().union(*[presence[l] for l in humans_rank[:k]]) if humans_rank else set()
    cover[k] = round(100 * len(s) / nrepos)

summary = dict(
    generated=now.strftime("%Y-%m-%d"), repos_scanned=nrepos, repos_total_candidates=len(json.load(open("/mnt/user-data/uploads/Busfactor/study/top-repos.json"))),
    unique_packages=len(all_pk), enriched=sum(1 for p in all_pk if meta[p]["enriched"]), lockfiles=collections.Counter(r["lockfile"] for r in per_repo),
    median_packages=sorted(x["packages"] for x in per_repo)[nrepos // 2],
    median_solo_pct=sorted(x["solo_pct"] for x in per_repo)[nrepos // 2],
    repos_with_dead=sum(1 for x in per_repo if x["dead"]), repos_with_dead_pct=round(100 * sum(1 for x in per_repo if x["dead"]) / nrepos),
    repos_with_advisory_pct=round(100 * sum(1 for x in per_repo if x["advisories"]) / nrepos),
    pct_unique_solo=round(100 * sum(1 for p in all_pk if meta[p]["solo"] and not meta[p]["org_owned"]) / len(all_pk)),
    pct_unique_dead=round(100 * sum(1 for p in all_pk if meta[p]["dead"]) / len(all_pk)),
    pct_unique_dormant=round(100 * sum(1 for p in all_pk if meta[p]["dormant"]) / len(all_pk)),
    pct_unique_funding=round(100 * sum(1 for p in all_pk if meta[p]["funding"]) / len(all_pk)),
    coverage_top_humans=cover, top_humans=top_humans,
    dead_packages=[dict(name=p, used_by_repos=used[p], status=meta[p]["status"] or ("archived" if meta[p]["archived"] else ""), dependents=meta[p]["dependents"]) for p in dead_pk],
    dormant_packages=[dict(name=p, used_by_repos=used[p], release_age_years=round(meta[p]["rel_age"], 1), dependents=meta[p]["dependents"], login=meta[p]["logins"]) for p in dorm_pk],
    solo_heavy=[dict(name=p, used_by_repos=used[p], login=meta[p]["logins"][0], dependents=meta[p]["dependents"]) for p in solo_heavy],
    per_repo=per_repo)
json.dump(summary, open("study-results.json", "w"), indent=1, default=list)

# ---- markdown
L = []
A = L.append
A(f"# Who does open source actually depend on? ({summary['generated']})\n")
A(f"Scanned the root lockfile of **{nrepos}** of the {summary['repos_total_candidates']} most-starred JavaScript/TypeScript repositories on GitHub "
  f"({dict(summary['lockfiles'])}). {summary['unique_packages']:,} unique npm packages resolved through ecosyste.ms.\n")
A("## Headline numbers\n")
A(f"- Median project installs **{summary['median_packages']}** packages; a median **{summary['median_solo_pct']}%** of them have a single human publisher account (org-owned packages excluded).")
A(f"- **{summary['pct_unique_solo']}%** of all {summary['unique_packages']:,} unique packages are published by one person alone; {summary['pct_unique_dead']}% are dead (deprecated or archived); {summary['pct_unique_dormant']}% are dormant (no release in 3+ years, no commit in 1+); only {summary['pct_unique_funding']}% carry a funding link.")
A(f"- **{summary['repos_with_dead_pct']}%** of these top repositories ship at least one dead dependency; {summary['repos_with_advisory_pct']}% ship at least one package with a security advisory.")
A(f"- If **one** person stopped publishing, **{cover[1]}%** of these repositories would have an unmaintained dependency; the top 5 people cover **{cover[5]}%**, the top 10 **{cover[10]}%**, the top 25 **{cover[25]}%**.\n")
A("## The 25 humans the most-starred JS/TS projects depend on (packages they publish alone)\n")
A("| # | publisher | repos affected | share | packages alone | most-depended examples |"); A("|---|---|---|---|---|---|")
for i, h in enumerate(top_humans, 1):
    A(f"| {i} | {h['login']} | {h['repos']} | {h['repos_pct']}% | {h['packages_alone']} | {', '.join(h['sample'])} |")
A("\n## Dead packages still shipped by the most repos\n")
A("| package | top repos using it | status | dependent repos (ecosyste.ms) |"); A("|---|---|---|---|")
for p in summary["dead_packages"]: A(f"| {p['name']} | {p['used_by_repos']} | {p['status']} | {p['dependents']:,} |")
A("\n## Dormant, single-publisher packages shipped by the most repos (many are simply finished; the point is that nobody else can publish a fix)\n")
A("| package | top repos using it | last release (years ago) | publisher |"); A("|---|---|---|---|")
for p in summary["dormant_packages"]: A(f"| {p['name']} | {p['used_by_repos']} | {p['release_age_years']} | {', '.join(p['login'])} |")
A("\n## Per-repository (top 40 by stars)\n")
A("| repo | stars | packages | solo % | dead | dormant | top human (alone) |"); A("|---|---|---|---|---|---|---|")
for x in per_repo[:40]: A(f"| {x['repo']} | {x['stars']:,} | {x['packages']} | {x['solo_pct']}% | {x['dead']} | {x['dormant']} | {x['top_human']} ({x['top_human_alone']}) |")
A("\n## Method and caveats\n")
A("- Repos: GitHub search, `language:javascript` and `language:typescript`, sorted by stars, top 600 merged; only repos with a root `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` or `npm-shrinkwrap.json` on the default branch were kept (monorepos with workspace lockfiles are included; repos without a root lockfile are not).")
A("- Package metadata: ecosyste.ms (publisher accounts, release dates, repo archived flag, deprecation status, advisories, funding links). Data freshness is theirs.")
A("- 'Single publisher' = one npm account with publish rights and the package is not owned by a GitHub organization whose name matches the account or scope. A publish account is not the same as an active maintainer; this measures who *can* publish, i.e. who the ecosystem would need to replace.")
A("- Dead = registry deprecated or repository archived. Dormant = no release for 3+ years and no commit for 1+ year (or no repository). Dormant does not mean broken: many tiny packages are finished. It means a security fix would need that one account.")
A("- `nopersonsmodules` is the npm account that holds packages whose original author left the registry; nobody publishes from it.")
A(f"- {summary['enriched']:,} packages (every package used by 5+ repos) were enriched with ecosyste.ms data (archived flag, advisories, dependents, funding); the long tail relies on npm registry data only, so dead/dormant counts are conservative.")
A("- Generated with `npx @genamed/busfactor`; raw results in `study-results.json`.")
open("study-report.md", "w").write("\n".join(L))
print(json.dumps({k: v for k, v in summary.items() if k not in ("per_repo", "top_humans", "dead_packages", "dormant_packages", "solo_heavy")}, indent=1, default=str))
