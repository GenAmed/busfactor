// Reads module paths out of a go.sum file.
//
// Each line looks like:
//   github.com/pkg/errors v0.9.1 h1:FEBLx1zS214owpjy7qsBeixbURkuhQAwrK5UwLGTwt4=
//   github.com/pkg/errors v0.9.1/go.mod h1:bwawxfHBFNV+L2hUp1rHADufV3IMtnDRdf1r5NINEl0=
// The first word is the module path. The same module appears once per version
// and once for its go.mod, so we de-duplicate.

export function parseGoSum(text) {
  const names = new Set();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const modulePath = line.split(/\s+/)[0];
    if (modulePath) names.add(modulePath);
  }
  return [...names].sort();
}
