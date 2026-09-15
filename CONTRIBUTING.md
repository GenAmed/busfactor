# Contributing

Thank you. The most useful contribution is a new, sourced entry in the
successor map. Code changes are welcome too, but the map is what other tools
depend on, so it gets the strictest rules.

## Adding an entry to `data/successors.json`

**One pull request = one entry.** Small PRs are reviewed the same day; a PR
with ten entries waits until someone has an hour.

1. Copy an existing entry and edit it. Fields (all are checked by
   `data/schema.json`):
   - `ecosystem`: `npm`, `pypi`, `cargo`, `go`, `rubygems` or `packagist`.
   - `package`: the exact registry name (npm scope included, full Go module path, `vendor/name` for Packagist).
   - `status`: `archived`, `deprecated`, `unmaintained`, `abandoned` or `sabotaged`. Pick the one your source literally supports.
   - `successor`: the package to use instead, or `null` if there is no single drop-in replacement.
   - `successor_kind`: `fork`, `rewrite`, `stdlib`, `different-api`, or `null`.
   - `since`: `YYYY-MM` when known; leave the field out otherwise.
   - `sources`: at least one public URL that shows the status *and* the successor. Good sources, in order of preference: the registry page or deprecation message, a security advisory (RustSec, GitHub Advisory, OSV), the README of the old or new project, an official announcement. "I remember reading it somewhere" is not a source.
   - `notes`: one or two plain sentences: what happened and what to do.
2. Run the checks locally:
   ```sh
   npm run validate     # schema, duplicates, and "does it exist on the registry?"
   npm test
   ```
3. Open the PR. Title it `map: <ecosystem> <package> -> <successor>`. The same validation runs in CI and blocks merging if it fails.

What we do **not** accept in the map:

- "Package X is smaller / faster than Y." That is not abandonment. For npm, send it to [e18e/module-replacements](https://github.com/e18e/module-replacements).
- Entries where the "successor" is your own package and the old one is still maintained.
- Packages that had a quiet year. Dormancy is computed by the CLI; the map is for packages whose maintainers said (or showed) they stopped.

## Fixing an entry

Packages get renamed, forks get abandoned in turn, and a weekly CI job
(`.github/workflows/revalidate.yml`) opens an issue when a lookup fails.
Fixing an entry follows the same one-PR-one-entry rule.

## Adding an ecosystem to the CLI

The CLI is written so that a non-specialist can follow it. Every file has a
comment at the top saying what it does. To add, say, Gemfile.lock:

1. `src/lockfiles/rubygems.js`: export a function that takes the file text and returns a sorted array of unique package names. Look at `cargo.js` for a 20-line example.
2. `src/lockfiles/index.js`: add a line to `LOCKFILES` with the file name, the ecosystem, the parser and `analysed: false` (names only) or `true` (full analysis).
3. `src/sources.js`: if `ECOSYSTEMS_REGISTRY` does not have the ecosystem yet, add the ecosyste.ms registry host name.
4. `scripts/validate.mjs`: add the registry URL in `registryUrl()` if it is missing.
5. `test/fixtures/`: add a small lockfile, and a test in `test/lockfiles.test.js`.
6. Update the table in `README.md`.

## Code changes

- Zero runtime dependencies. If a change needs a package, discuss it in an issue first.
- Keep files small and comment each step in plain English. If a trick saves five lines but needs a paragraph to explain, write the five lines.
- `npm test` must pass on Node 20 and 22 (CI runs both).
- Scan output is consumed by scripts: do not rename JSON fields without bumping the major version.

## Reporting a wrong result

If busfactor says a package is dead or solo and it is not, open an issue with
the package name and the output of `npx @genamed/busfactor --json` for a lockfile that
contains only that package. Most of the time the fix is on the data side
(ecosyste.ms), and we will say so.
