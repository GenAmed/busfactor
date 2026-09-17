# Sample scan output

Produced by `npx @genamed/busfactor examples/package-lock.json` on 2026-09-15, against the
lockfile in this folder (a small app pulling in axios, express, jest, lodash,
moment, react, react-dom and webpack: 410 packages in total).

The numbers move as maintainers come and go; re-run the command to refresh them.

## Terminal output (`--top 12`)

```text
busfactor - 410 packages in examples/package-lock.json

Dead (deprecated or archived)                 4
Dormant (>3y no release, >1y no commit)       51
Single publisher account                      213  (51%)  of which org-owned? 14
With a security advisory                      49
With a funding link                           310
Distinct publisher accounts                   223

The humans this project depends on most (packages carried alone)
  sindresorhus              43 alone /  46 total  https://github.com/sponsors/sindresorhus
  jounqin                   26 alone /  26 total  https://github.com/sponsors/JounQin
  ljharb                    17 alone /  23 total  https://github.com/sponsors/ljharb
  xtuc                      17 alone /  17 total
  isaacs                    14 alone /  18 total  https://github.com/sponsors/isaacs
  devongovett               13 alone /  13 total  https://opencollective.com/parcel
  types                     13 alone /  13 total org-owned?
  jridgewell                 6 alone /   6 total
  esp                        4 alone /   6 total  https://github.com/sponsors/epoberezkin
  toyobayashi                4 alone /   4 total  https://github.com/sponsors/toyobayashi
  ai                         3 alone /   3 total  https://github.com/sponsors/ai
  dougwilson                 2 alone /  34 total  https://opencollective.com/express

Dead packages, by how many repositories depend on them
  pkg-dir                        deprecated: Renamed to `package-directory`.
  require-from-string            repository archived
  mimic-fn                       deprecated: Renamed to mimic-function
  node-int64                     repository archived

Heaviest dormant packages
  setprototypeof                 last release 7y ago, last commit 4y ago, 1 publisher (wesleytodd), 5,068,682 dependent repos
  unpipe                         last release 11y ago, last commit 6y ago, 2 publishers, 5,053,604 dependent repos
  fast-deep-equal                last release 6y ago, last commit 3y ago, 1 publisher (esp), 4,968,905 dependent repos
  fast-json-stable-stringify     last release 7y ago, last commit 3y ago, 1 publisher (esp), 4,957,551 dependent repos
  toidentifier                   last release 5y ago, last commit 3y ago, 4 publishers, 4,368,444 dependent repos
  get-caller-file                last release 8y ago, last commit 3y ago, 1 publisher (stefanpenner), 4,350,442 dependent repos
  require-directory              last release 11y ago, last commit 5y ago, 1 publisher (troygoode), 4,338,986 dependent repos
  convert-source-map             last release 4y ago, last commit 1y ago, 2 publishers, 4,241,143 dependent repos
  slash                          last release 3y ago, last commit 3y ago, 1 publisher (sindresorhus), 4,015,967 dependent repos
  resolve-cwd                    last release 7y ago, last commit 6y ago, 1 publisher (sindresorhus), 3,467,571 dependent repos
  gensync                        last release 11y ago, last commit 4y ago, 1 publisher (loganfsmyth), 2,570,540 dependent repos
  depd                           last release 8y ago, last commit 2y ago, 1 publisher (dougwilson), 2,556,983 dependent repos
  ... and 39 more (see --json)

Known successors (from data/successors.json)
  moment                         deprecated; use luxon (different-api)
                                 https://momentjs.com/docs/#/-project-status/

Data: packages.ecosyste.ms and the package registry. A publisher account is not always an active person.
```

## Markdown card (`--md`)

This is what the GitHub Action writes to the job summary and to PR comments.

## busfactor: 410 packages, examples/package-lock.json

| | |
|---|---:|
| Dead (deprecated or archived) | **4** |
| Dormant (>3y no release, >1y no commit) | **51** |
| Single publisher account | **213** (51%) |
| With a security advisory | 49 |
| With a funding link | 310 |
| Distinct publisher accounts | 223 |

### Humans this project depends on most

| Publisher | Alone | Total | Support |
|---|---:|---:|---|
| sindresorhus | 43 | 46 | [sponsor](https://github.com/sponsors/sindresorhus) |
| jounqin | 26 | 26 | [sponsor](https://github.com/sponsors/JounQin) |
| ljharb | 17 | 23 | [sponsor](https://github.com/sponsors/ljharb) |
| xtuc | 17 | 17 |  |
| isaacs | 14 | 18 | [sponsor](https://github.com/sponsors/isaacs) |

### Dead

- `pkg-dir` - deprecated: Renamed to `package-directory`.
- `require-from-string` - repository archived
- `mimic-fn` - deprecated: Renamed to mimic-function
- `node-int64` - repository archived

### Heaviest dormant

- `setprototypeof` - last release 7y ago, last commit 4y ago, 5,068,682 dependent repos
- `unpipe` - last release 11y ago, last commit 6y ago, 5,053,604 dependent repos
- `fast-deep-equal` - last release 6y ago, last commit 3y ago, 4,968,905 dependent repos
- `fast-json-stable-stringify` - last release 7y ago, last commit 3y ago, 4,957,551 dependent repos
- `toidentifier` - last release 5y ago, last commit 3y ago, 4,368,444 dependent repos
- ... and 46 more

### Known successors

- `moment`: deprecated; use luxon (different-api) ([source](https://momentjs.com/docs/#/-project-status/))

<sub>Generated by [busfactor](https://github.com/GenAmed/busfactor) 0.1.0 on 2026-09-15. Data: packages.ecosyste.ms. A publisher account is not always an active person.</sub>

## SVG card (`--svg`)

![busfactor card](card.svg)
