// Reads crate names out of a Cargo.lock file.
//
// Cargo.lock is TOML with one block per crate:
//   [[package]]
//   name = "serde"
//   version = "1.0.200"
//   source = "registry+https://github.com/rust-lang/crates.io-index"
// Crates without a "source" line are the project's own workspace members; we skip them.

export function parseCargoLock(text) {
  const names = new Set();
  let current = null; // { name, hasSource } for the block we are inside
  const flush = () => { if (current?.name && current.hasSource) names.add(current.name); };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith("[[package]]")) { flush(); current = { name: null, hasSource: false }; continue; }
    if (line.startsWith("[")) { flush(); current = null; continue; }
    if (!current) continue;
    const name = line.match(/^name\s*=\s*"([^"]+)"/);
    if (name) current.name = name[1];
    if (/^source\s*=/.test(line)) current.hasSource = true;
  }
  flush();
  return [...names].sort();
}
