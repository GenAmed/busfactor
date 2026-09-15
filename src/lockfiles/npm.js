// Reads package names out of an npm package-lock.json (lockfileVersion 2 or 3).
//
// In both versions there is a "packages" object whose keys are paths like
//   "node_modules/lodash"                       -> lodash
//   "node_modules/@babel/core"                  -> @babel/core
//   "node_modules/a/node_modules/b"             -> b   (nested duplicate)
//   ""                                          -> the project itself (skipped)
// Some entries carry an explicit "name" (aliases); we prefer that when present.

export function parseNpmLock(text) {
  const lock = JSON.parse(text);
  const version = lock.lockfileVersion;
  if (version !== 2 && version !== 3) {
    throw new Error(`package-lock.json lockfileVersion ${version} is not supported (need 2 or 3). Run "npm install" with npm 7+ to upgrade it.`);
  }
  const names = new Set();
  for (const [key, info] of Object.entries(lock.packages ?? {})) {
    if (key === "") continue; // the root project
    if (info?.link) continue; // workspace symlink, not a registry package
    const name = info?.name ?? key.slice(key.lastIndexOf("node_modules/") + "node_modules/".length);
    if (name) names.add(name);
  }
  return [...names].sort();
}
