// Reads package names out of Python dependency files.
//
// requirements.txt: one requirement per line, e.g.
//   requests==2.31.0
//   Django>=4,<5 ; python_version >= "3.8"
//   celery[redis]
//   -r other.txt          (skipped: we only read this file)
//   git+https://...       (skipped: not a registry package)
//   # comments            (skipped)
//
// poetry.lock / uv.lock: TOML files with blocks like
//   [[package]]
//   name = "requests"
//   version = "2.31.0"
// We do not need a TOML parser for that: we just look for name = "..." lines
// inside [[package]] blocks.

// PyPI treats "Foo_Bar", "foo-bar" and "foo.bar" as the same name.
// This is the official normalisation rule (PEP 503).
export function normalizePypiName(name) {
  return name.toLowerCase().replace(/[-_.]+/g, "-");
}

export function parseRequirementsTxt(text) {
  const names = new Set();
  for (let raw of text.split(/\r?\n/)) {
    let line = raw.replace(/(^|\s)#.*$/, "").trim(); // strip comments
    if (!line || line.startsWith("-")) continue; // empty, or an option like -r / -e / --index-url
    if (/^(https?|git|file|svn|hg)[+:]/.test(line)) continue; // URLs, not registry packages
    line = line.split(";")[0]; // drop environment markers
    if (line.includes(" @ ")) line = line.split(" @ ")[0]; // "name @ url" form
    // The name is everything before the first version operator, bracket or space.
    const match = line.match(/^([A-Za-z0-9][A-Za-z0-9._-]*)/);
    if (match) names.add(normalizePypiName(match[1]));
  }
  return [...names].sort();
}

export function parsePoetryLock(text) {
  const names = new Set();
  let inPackage = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("[[package]]")) { inPackage = true; continue; }
    if (line.startsWith("[")) { inPackage = false; continue; } // any other table ends the block
    const match = inPackage && line.match(/^name\s*=\s*"([^"]+)"/);
    if (match) names.add(normalizePypiName(match[1]));
  }
  return [...names].sort();
}

// uv.lock uses the same [[package]] / name = "..." layout as poetry.lock.
export const parseUvLock = parsePoetryLock;
