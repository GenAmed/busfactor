"""Step B: query ecosyste.ms for every unique package, with an on-disk cache so the run can be resumed."""
import json, re, os, sys, time, urllib.request, urllib.parse, concurrent.futures as cf, threading

names = [x for x in json.load(open("shared-packages.json")) if re.match(r"^(@[a-z0-9._-]+/)?[a-z0-9._-]+$", x)]
os.makedirs("cache", exist_ok=True)
UA = {"User-Agent": "busfactor-study/0.1 (+https://github.com/GenAmed/busfactor)"}
KEEP = ["name", "status", "latest_release_published_at", "dependent_packages_count", "dependent_repos_count",
        "downloads", "maintainers", "funding_links", "advisories", "repo_metadata"]
lock = threading.Lock(); done = [0]; errors = [0]

def path(n): return "cache/" + urllib.parse.quote(n, safe="") + ".json"

def slim(d):
    o = {k: d.get(k) for k in KEEP}
    rm = d.get("repo_metadata") or {}
    o["repo_metadata"] = {k: rm.get(k) for k in ["archived", "pushed_at", "owner", "funding", "full_name"]}
    if rm.get("owner_record"): o["repo_metadata"]["owner_kind"] = (rm["owner_record"] or {}).get("kind")
    o["maintainers"] = [{"login": m.get("login"), "packages_count": m.get("packages_count")} for m in (d.get("maintainers") or [])]
    o["advisories"] = len(d.get("advisories") or [])
    return o

def get(n):
    p = path(n)
    if os.path.exists(p): return
    time.sleep(0.75)
    url = "https://packages.ecosyste.ms/api/v1/registries/npmjs.org/packages/" + urllib.parse.quote(n, safe="")
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40) as r:
                json.dump(slim(json.load(r)), open(p, "w")); break
        except urllib.error.HTTPError as e:
            if e.code == 404: json.dump({"name": n, "_missing": True}, open(p, "w")); break
            if e.code == 429: time.sleep(15 * (attempt + 1)); continue
            time.sleep(2)
        except Exception:
            time.sleep(2)
    else:
        with lock: errors[0] += 1
    with lock:
        done[0] += 1
        if done[0] % 500 == 0: print(f"{done[0]}/{len(names)} done, {errors[0]} errors", flush=True)

todo = [n for n in names if not os.path.exists(path(n))]
print(f"{len(names)} packages, {len(todo)} to fetch", flush=True)
with cf.ThreadPoolExecutor(int(sys.argv[1]) if len(sys.argv) > 1 else 8) as ex:
    list(ex.map(get, todo))
print("finished", done[0], "errors", errors[0], flush=True)
