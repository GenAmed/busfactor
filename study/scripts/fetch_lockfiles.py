"""Step A: for each top repo, fetch a root lockfile from raw.githubusercontent.com and extract package names."""
import json, re, sys, os, urllib.request, concurrent.futures as cf

repos = json.load(open("/mnt/user-data/uploads/Busfactor/study/top-repos.json"))
UA = {"User-Agent": "busfactor-study/0.1 (+https://github.com/GenAmed/busfactor)"}
LOCKS = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "npm-shrinkwrap.json"]
os.makedirs("locks", exist_ok=True)

def fetch(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
            return r.read().decode("utf-8", "replace")
    except Exception:
        return None

def names_from_package_lock(txt):
    d = json.loads(txt); out = set()
    if "packages" in d:
        for k in d["packages"]:
            if "node_modules/" in k: out.add(k.split("node_modules/")[-1])
    else:
        def walk(deps):
            for n, v in (deps or {}).items():
                out.add(n); walk(v.get("dependencies"))
        walk(d.get("dependencies"))
    return out

def names_from_yarn(txt):
    out = set()
    for line in txt.splitlines():
        if not line or line[0] in " #\t" or not line.rstrip().endswith(":"): continue
        for spec in line.rstrip(":").split(","):
            spec = spec.strip().strip('"')
            if not spec: continue
            i = spec.rfind("@")
            name = spec[:i] if i > 0 else spec
            if name and not name.startswith("__"): out.add(name)
    return out

def names_from_pnpm(txt):
    out = set(); inpk = False
    for line in txt.splitlines():
        if re.match(r"^(packages|snapshots):\s*$", line): inpk = True; continue
        if line and not line.startswith(" ") : inpk = False
        if inpk:
            m = re.match(r"^  ['\"]?/?((?:@[^/@'\"]+/)?[^/@'\"\s]+)@[^:]*['\"]?:\s*$", line)
            if m: out.add(m.group(1))
    return out

def one(r):
    full, br = r["full_name"], r["branch"]
    for lf in LOCKS:
        txt = fetch(f"https://raw.githubusercontent.com/{full}/{br}/{lf}")
        if not txt: continue
        try:
            names = {"package-lock.json": names_from_package_lock, "npm-shrinkwrap.json": names_from_package_lock,
                     "yarn.lock": names_from_yarn, "pnpm-lock.yaml": names_from_pnpm}[lf](txt)
        except Exception as e:
            return {**r, "lockfile": lf, "error": str(e)[:80]}
        if len(names) < 5: continue
        return {**r, "lockfile": lf, "packages": sorted(names)}
    return {**r, "lockfile": None}

with cf.ThreadPoolExecutor(8) as ex:
    res = list(ex.map(one, repos))
json.dump(res, open("repos-with-deps.json", "w"))
ok = [r for r in res if r.get("packages")]
allnames = set().union(*[set(r["packages"]) for r in ok]) if ok else set()
print(f"{len(ok)}/{len(res)} repos with a root lockfile; {len(allnames)} unique packages")
import collections; print(collections.Counter(r.get("lockfile") for r in res))
json.dump(sorted(allnames), open("unique-packages.json", "w"))
