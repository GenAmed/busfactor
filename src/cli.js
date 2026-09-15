#!/usr/bin/env node
// Command-line entry point. Parses flags, runs the scan, prints one report.
//
//   busfactor [path] [--json | --md | --svg] [--offline] [--fail-on dead|solo-critical] [--top N]
//
// "path" is a folder containing a lockfile, or a lockfile itself. Default: current folder.

import { writeFileSync } from "node:fs";
import { scan, VERSION } from "./scan.js";
import { renderTable } from "./report/table.js";
import { renderMarkdown } from "./report/md.js";
import { renderSvg } from "./report/svg.js";
import { cacheDir } from "./cache.js";
import { parseArgs } from "./args.js";

const HELP = `busfactor ${VERSION} - which humans does your project actually depend on?

Usage: busfactor [path] [options]

  path               folder with a lockfile, or the lockfile itself (default: .)
                     supported: package-lock.json, poetry.lock, requirements.txt,
                     uv.lock, Cargo.lock, go.sum

Output (default is a terminal table):
  --json             full machine-readable result
  --md               markdown card (README section, PR comment, job summary)
  --svg              800x420 SVG card with the headline numbers
  --out <file>       write the report to a file instead of stdout
  --top <n>          how many rows per list (default 10, 5 for --md/--svg)

Behaviour:
  --offline          never touch the network; use the cache only (${cacheDir()})
  --fail-on <rule>   exit 1 when the rule matches, for CI:
                       dead           at least one dead package
                       solo-critical  at least one package that is dead or dormant
                                      AND has a single (non-org) publisher
  --no-color         plain output (colours are off anyway when not a TTY)
  -h, --help         this text
  -v, --version      print the version
`;

main().catch((err) => {
  console.error(`busfactor: ${err.message}`);
  process.exit(2);
});

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) return process.stdout.write(HELP);
  if (opts.version) return process.stdout.write(VERSION + "\n");

  // Progress line on stderr so it never pollutes --json output.
  const quiet = !process.stderr.isTTY;
  const onProgress = quiet ? () => {} : (done, total) => process.stderr.write(`\r  fetching ${done}/${total} packages...`);

  const result = await scan({ target: opts.path, offline: opts.offline, onProgress });
  if (!quiet) process.stderr.write("\r" + " ".repeat(40) + "\r");

  let output;
  if (opts.format === "json") output = JSON.stringify(result, null, 2) + "\n";
  else if (opts.format === "md") output = renderMarkdown(result, { top: opts.top ?? 5 });
  else if (opts.format === "svg") output = renderSvg(result, { top: opts.top ?? 5 });
  else output = renderTable(result, { color: opts.color && process.stdout.isTTY && !opts.out, top: opts.top ?? 10 });

  if (opts.out) {
    writeFileSync(opts.out, output);
    if (!quiet) console.error(`wrote ${opts.out}`);
  } else {
    process.stdout.write(output);
  }

  // CI gate
  if (opts.failOn === "dead" && result.totals.dead > 0) {
    console.error(`busfactor: --fail-on dead: ${result.totals.dead} dead package(s)`);
    process.exit(1);
  }
  if (opts.failOn === "solo-critical" && result.totals.soloCritical > 0) {
    console.error(`busfactor: --fail-on solo-critical: ${result.totals.soloCritical} package(s) are dead or dormant with a single publisher`);
    process.exit(1);
  }
}
