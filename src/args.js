// Command-line flag parsing, kept apart from cli.js so tests can import it
// without running a scan.

// Minimal flag parser: no dependency, easy to read.
export function parseArgs(argv) {
  const opts = { path: process.cwd(), format: "table", offline: false, failOn: null, top: undefined, out: null, color: true, help: false, version: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      return v;
    };
    if (a === "--json" || a === "--md" || a === "--svg") opts.format = a.slice(2);
    else if (a === "--offline") opts.offline = true;
    else if (a === "--fail-on") {
      opts.failOn = next();
      if (!["dead", "solo-critical"].includes(opts.failOn)) throw new Error(`--fail-on must be "dead" or "solo-critical", got "${opts.failOn}"`);
    } else if (a === "--top") opts.top = Number(next());
    else if (a === "--out") opts.out = next();
    else if (a === "--no-color") opts.color = false;
    else if (a === "-h" || a === "--help") opts.help = true;
    else if (a === "-v" || a === "--version") opts.version = true;
    else if (a.startsWith("-")) throw new Error(`unknown option ${a} (try --help)`);
    else opts.path = a;
  }
  return opts;
}
