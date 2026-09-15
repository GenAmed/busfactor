"""Step B2: npm registry for every package (fast, no rate limit): publishers, last release date, deprecation, funding, repo url."""
import json, os, re, sys, time, urllib.request, urllib.parse, concurrent.futures as cf, threading

names = json.load(open("unique-packages.json"))
os.makedirs("npm", exist_ok=True)
UA = {"User-Agent": "busfactor-study/0.1 (+https://github.com/GenAmed/busfactor)"}
lock = threading.Lock(); done = [0]; errors = [0]
def path(n): return "npm/" + urllib.parse.quote(n, safe="") + ".json"

def slim(d):
    latest = (d.get("dist-tags") or {}).get("latest")
    v = (d.get("versions") or {}).get(latest) or {}
    t = d.get("time") or {}
    repo = d.get("repository") or v.get("repository")
    if isinstance(repo, dict): repo = repo.get("url")
    return dict(name=d.get("name"), maintainers=[m.get("name") for m in (d.get("maintainers") or []) if isinstance(m, dict)],
                latest=latest, latest_time=t.get(latest), modified=t.get("modified"), created=t.get("created"),
                deprecated=bool(v.get("deprecated")) or ("deprecated" in d and bool(d.get("deprecated"))),
                deprecated_msg=(v.get("deprecated") if isinstance(v.get("deprecated"), str) else None),
                funding=v.get("funding") or d.get("funding"), repository=repo, versions=len(d.get("versions") or {}))

def get(n):
    p = path(n)
    if os.path.exists(p): return
    url = "https://registry.npmjs.org/" + urllib.parse.quote(n, safe="@").replace("/", "%2F")
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r:
                json.dump(slim(json.load(r)), open(p, "w")); break
        except urllib.error.HTTPError as e:
            if e.code == 404: json.dump({"name": n, "_missing": True}, open(p, "w")); break
            time.sleep(3 * (attempt + 1))
        except Exception:
            time.sleep(3)
    else:
        with lock: errors[0] += 1
    with lock:
        done[0] += 1
        if done[0] % 1000 == 0: print(f"{done[0]} done, {errors[0]} errors", flush=True)

todo = [n for n in names if not os.path.exists(path(n))]
print(f"{len(names)} packages, {len(todo)} to fetch", flush=True)
with cf.ThreadPoolExecutor(12) as ex:
    list(ex.map(get, todo))
print("finished", done[0], "errors", errors[0], flush=True)
