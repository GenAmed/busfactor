# Who does open source actually depend on? (2026-09-15)

Scanned the root lockfile of **433** of the 600 most-starred JavaScript/TypeScript repositories on GitHub ({'pnpm-lock.yaml': 149, 'package-lock.json': 200, 'yarn.lock': 81, 'npm-shrinkwrap.json': 3}). 27,184 unique npm packages resolved through ecosyste.ms.

## Headline numbers

- Median project installs **945** packages; a median **50%** of them have a single human publisher account (org-owned packages excluded).
- **45%** of all 27,184 unique packages are published by one person alone; 5% are dead (deprecated or archived); 24% are dormant (no release in 3+ years, no commit in 1+); only 24% carry a funding link.
- **98%** of these top repositories ship at least one dead dependency; 100% ship at least one package with a security advisory.
- If **one** person stopped publishing, **99%** of these repositories would have an unmaintained dependency; the top 5 people cover **100%**, the top 10 **100%**, the top 25 **100%**.

## The 25 humans the most-starred JS/TS projects depend on (packages they publish alone)

| # | publisher | repos affected | share | packages alone | most-depended examples |
|---|---|---|---|---|---|
| 1 | sindresorhus | 430 | 99% | 513 | supports-color, camelcase, to-fast-properties, wrap-ansi, merge-descriptors |
| 2 | isaacs | 426 | 98% | 76 | fs.realpath, sax, chownr, minipass, fs-minipass |
| 3 | juliangruber | 413 | 95% | 21 | isarray, balanced-match, array-filter, builtins, constants-browserify |
| 4 | ljharb | 405 | 94% | 152 | resolve, object.getownpropertydescriptors, deep-equal, util.promisify, regexp.prototype.flags |
| 5 | kevva | 401 | 93% | 31 | dir-glob, astral-regex, strict-uri-encode, shebang-command, executable |
| 6 | qix | 400 | 92% | 5 | color-string, color, simple-swizzle, color-convert, is-arrayish |
| 7 | satazor | 399 | 92% | 5 | cross-spawn, request-progress, spark-md5, cross-spawn-async, deep-for-each |
| 8 | vitaly | 396 | 91% | 31 | argparse, js-yaml, pako, mdurl, markdown-it |
| 9 | lukeed | 394 | 91% | 46 | escalade, kleur, klona, resolve.exports, clsx |
| 10 | esp | 388 | 90% | 9 | fast-deep-equal, fast-json-stable-stringify, json-schema-traverse, ajv-errors, json-source-map |
| 11 | nopersonsmodules | 381 | 88% | 59 | indexes-of, text-table, wordwrap, commondir, json-buffer |
| 12 | webreflection | 373 | 86% | 12 | html-escaper, flatted, circular-json, @ungap/promise-all-settled, @ungap/structured-clone |
| 13 | tootallnate | 371 | 86% | 28 | util-deprecate, @tootallnate/once, https-proxy-agent, agent-base, http-proxy-agent |
| 14 | ai | 368 | 85% | 36 | browserslist, caniuse-lite, postcss, autoprefixer, nanoid |
| 15 | feross | 367 | 85% | 17 | queue-microtask, run-parallel, typedarray-to-buffer, buffer, ieee754 |
| 16 | kael | 367 | 85% | 3 | ignore, comment-json, array-timsort |
| 17 | alexeyraspopov | 366 | 85% | 1 | picocolors |
| 18 | lydell | 365 | 84% | 14 | source-map-resolve, source-map-url, resolve-url, urix, js-tokens |
| 19 | stefanpenner | 362 | 84% | 17 | get-caller-file, ensure-posix-path, matcher-collection, blank-object, ember-cli-get-component-path-option |
| 20 | jridgewell | 361 | 83% | 8 | @jridgewell/resolve-uri, @jridgewell/trace-mapping, @jridgewell/sourcemap-codec, @jridgewell/gen-mapping, @jridgewell/set-array |
| 21 | chalker | 352 | 81% | 2 | safer-buffer, @exodus/bytes |
| 22 | mathias | 348 | 80% | 10 | jsesc, regenerate, cssesc, css.escape, is-potential-custom-element-name |
| 23 | jensyt | 346 | 80% | 1 | imurmurhash |
| 24 | troygoode | 342 | 79% | 1 | require-directory |
| 25 | jbgutierrez | 341 | 79% | 1 | path-parse |

## Dead packages still shipped by the most repos

| package | top repos using it | status | dependent repos (ecosyste.ms) |
|---|---|---|---|
| path-is-absolute | 305 | deprecated | 2,056,731 |
| inflight | 304 | deprecated | 2,061,276 |
| json-buffer | 276 | archived | 1,083,541 |
| require-from-string | 276 | archived | 1,639,741 |
| mimic-fn | 274 | deprecated | 1,520,693 |
| doctrine | 226 | archived | 1,377,829 |
| pkg-dir | 213 | deprecated | 1,644,522 |
| xtend | 209 | archived | 1,446,059 |
| xmlchars | 185 | archived | 1,779,785 |
| saxes | 185 | archived | 1,780,495 |
| prop-types | 183 | archived | 2,311,807 |
| through | 175 | archived | 829,588 |
| whatwg-encoding | 174 | deprecated | 2,120,358 |
| stackback | 173 | archived | 24,614 |
| regenerator-runtime | 170 | archived | 4,404,245 |
| is-windows | 160 | archived | 1,041,662 |
| node-int64 | 159 | archived | 1,430,044 |
| p-finally | 158 | deprecated | 782,912 |
| find-cache-dir | 143 | deprecated | 1,812,888 |
| @babel/plugin-proposal-private-property-in-object | 139 | deprecated | 1,660,697 |
| loader-utils | 138 | archived | 1,708,802 |
| read-pkg-up | 136 | deprecated | 4,757 |
| cross-env | 135 | archived | 573,085 |
| no-case | 130 | deprecated | 2,491,087 |
| lower-case | 130 | deprecated | 2,498,991 |

## Dormant, single-publisher packages shipped by the most repos (many are simply finished; the point is that nobody else can publish a fix)

| package | top repos using it | last release (years ago) | publisher |
|---|---|---|---|
| has-flag | 399 | 5.2 | sindresorhus |
| shebang-regex | 398 | 5.1 | sindresorhus |
| shebang-command | 397 | 7.0 | kevva |
| path-key | 394 | 5.4 | sindresorhus |
| escape-string-regexp | 390 | 5.4 | sindresorhus |
| fast-deep-equal | 383 | 6.3 | esp |
| json-schema-traverse | 380 | 5.8 | esp |
| path-exists | 379 | 5.1 | sindresorhus |
| wrappy | 363 | 10.3 | isaacs |
| get-caller-file | 361 | 7.5 | stefanpenner |
| fast-json-stable-stringify | 351 | 6.8 | esp |
| imurmurhash | 346 | 13.1 | jensyt |
| util-deprecate | 346 | 10.9 | tootallnate |
| resolve-from | 344 | 7.4 | sindresorhus |
| require-directory | 342 | 11.3 | troygoode |
| uri-js | 341 | 5.7 | garycourt |
| path-parse | 341 | 5.3 | jbgutierrez |
| safer-buffer | 339 | 8.4 | chalker |
| fast-levenshtein | 322 | 6.2 | hiddentao |
| buffer-from | 318 | 5.1 | linusu |
| deep-is | 318 | 5.0 | thlorenz |
| type-check | 317 | 6.5 | gkz |
| levn | 317 | 6.5 | gkz |
| supports-preserve-symlinks-flag | 303 | 4.7 | ljharb |
| json-stable-stringify-without-jsonify | 302 | 9.8 | samn |

## Per-repository (top 40 by stars)

| repo | stars | packages | solo % | dead | dormant | top human (alone) |
|---|---|---|---|---|---|---|
| freeCodeCamp/freeCodeCamp | 455,503 | 2232 | 47% | 114 | 438 | sindresorhus (126) |
| openclaw/openclaw | 389,785 | 1533 | 50% | 41 | 191 | sindresorhus (73) |
| nilbuild/developer-roadmap | 367,307 | 56 | 77% | 0 | 2 | esbuild (27) |
| affaan-m/ECC | 259,262 | 206 | 64% | 2 | 40 | wooorm (35) |
| react/react | 250,473 | 1580 | 49% | 92 | 503 | sindresorhus (183) |
| deepseek-ai/deepseek-harness | 225,307 | 1344 | 50% | 20 | 200 | sindresorhus (64) |
| vuejs/vue | 212,804 | 784 | 46% | 57 | 262 | sindresorhus (79) |
| n8n-io/n8n | 204,429 | 3127 | 48% | 108 | 490 | sindresorhus (123) |
| trekhleb/javascript-algorithms | 196,729 | 592 | 49% | 13 | 82 | ljharb (95) |
| microsoft/vscode | 192,567 | 1187 | 51% | 44 | 318 | ljharb (94) |
| Snailclimb/JavaGuide | 158,581 | 625 | 55% | 4 | 92 | wooorm (51) |
| langgenius/dify | 155,848 | 1433 | 55% | 11 | 203 | boshen (91) |
| yangshun/tech-interview-handbook | 142,683 | 1256 | 48% | 60 | 274 | sindresorhus (99) |
| vercel/next.js | 142,332 | 2732 | 45% | 137 | 634 | sindresorhus (197) |
| iptv-org/iptv | 138,712 | 520 | 51% | 6 | 64 | sindresorhus (47) |
| excalidraw/excalidraw | 132,038 | 1240 | 44% | 52 | 191 | ljharb (93) |
| Chalarangelo/30-seconds-of-code | 129,100 | 486 | 57% | 3 | 85 | wooorm (55) |
| shadcn-ui/ui | 123,881 | 1522 | 50% | 24 | 236 | sindresorhus (101) |
| mrdoob/three.js | 115,563 | 239 | 51% | 1 | 40 | sindresorhus (19) |
| immich-app/immich | 114,288 | 2360 | 47% | 80 | 386 | sindresorhus (145) |
| supabase/supabase | 109,325 | 2692 | 48% | 83 | 428 | sindresorhus (120) |
| axios/axios | 109,208 | 630 | 37% | 7 | 135 | sindresorhus (35) |
| google-gemini/gemini-cli | 107,006 | 1111 | 53% | 33 | 174 | sindresorhus (103) |
| earendil-works/pi | 105,651 | 351 | 46% | 14 | 46 | esbuild (27) |
| react/create-react-app | 103,259 | 1765 | 44% | 203 | 466 | sindresorhus (178) |
| angular/angular | 101,008 | 1976 | 49% | 68 | 382 | sindresorhus (133) |
| mui/material-ui | 99,047 | 1789 | 46% | 36 | 267 | sindresorhus (119) |
| tailwindlabs/tailwindcss | 97,570 | 518 | 44% | 2 | 54 | esbuild (27) |
| microsoft/Web-Dev-For-Beginners | 96,685 | 230 | 64% | 11 | 86 | sindresorhus (71) |
| nexu-io/open-design | 96,374 | 1130 | 45% | 23 | 227 | sindresorhus (48) |
| microsoft/playwright | 96,181 | 626 | 50% | 10 | 84 | ljharb (97) |
| puppeteer/puppeteer | 95,580 | 759 | 53% | 18 | 107 | ljharb (88) |
| louislam/uptime-kuma | 91,402 | 1057 | 60% | 26 | 212 | ljharb (84) |
| storybookjs/storybook | 91,063 | 2610 | 47% | 93 | 481 | sindresorhus (124) |
| modelcontextprotocol/servers | 90,364 | 280 | 46% | 7 | 41 | ljharb (18) |
| mermaid-js/mermaid | 90,254 | 1981 | 50% | 51 | 322 | sindresorhus (150) |
| ChatGPTNextWeb/NextChat | 88,769 | 998 | 46% | 44 | 200 | ljharb (64) |
| sveltejs/svelte | 88,131 | 435 | 50% | 7 | 74 | sindresorhus (36) |
| OpenHands/OpenHands | 88,035 | 1336 | 53% | 22 | 188 | ljharb (93) |
| koala73/worldmonitor | 86,461 | 1501 | 44% | 31 | 208 | ljharb (86) |

## Method and caveats

- Repos: GitHub search, `language:javascript` and `language:typescript`, sorted by stars, top 600 merged; only repos with a root `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock` or `npm-shrinkwrap.json` on the default branch were kept (monorepos with workspace lockfiles are included; repos without a root lockfile are not).
- Package metadata: ecosyste.ms (publisher accounts, release dates, repo archived flag, deprecation status, advisories, funding links). Data freshness is theirs.
- 'Single publisher' = one npm account with publish rights and the package is not owned by a GitHub organization whose name matches the account or scope. A publish account is not the same as an active maintainer; this measures who *can* publish, i.e. who the ecosystem would need to replace.
- Dead = registry deprecated or repository archived. Dormant = no release for 3+ years and no commit for 1+ year (or no repository). Dormant does not mean broken: many tiny packages are finished. It means a security fix would need that one account.
- `nopersonsmodules` is the npm account that holds packages whose original author left the registry; nobody publishes from it.
- 10,371 packages (every package used by 5+ repos) were enriched with ecosyste.ms data (archived flag, advisories, dependents, funding); the long tail relies on npm registry data only, so dead/dormant counts are conservative.
- Generated with `npx @genamed/busfactor`; raw results in `study-results.json`.