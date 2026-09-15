// Terminal report. Plain text tables, ANSI colours only when writing to a TTY
// (so piping to a file or CI log stays clean). No dependencies.

import { describeSuccessor } from "../successors.js";

export function renderTable(result, { color = process.stdout.isTTY, top = 10 } = {}) {
  const c = colours(color);
  const t = result.totals;
  const lines = [];

  lines.push(c.bold(`busfactor - ${result.totals.packages} packages in ${result.lockfile}`));

  if (!result.analysed) {
    lines.push(`${c.yellow(result.ecosystem)} is not yet analysed by busfactor v0 (names parsed only).`);
    pushSuccessors(lines, result, c);
    return lines.join("\n") + "\n";
  }

  lines.push("");
  lines.push(pad("Dead (deprecated or archived)", 46) + c.red(String(t.dead)));
  lines.push(pad("Dormant (>3y no release, >1y no commit)", 46) + c.yellow(String(t.dormant)));
  lines.push(pad("Single publisher account", 46) + c.yellow(`${t.solo}  (${t.soloPercent}%)`) + c.dim(`  of which org-owned? ${t.soloOrgOwned}`));
  lines.push(pad("With a security advisory", 46) + String(t.withAdvisories));
  lines.push(pad("With a funding link", 46) + String(t.withFunding));
  lines.push(pad("Distinct publisher accounts", 46) + String(t.humans));
  if (t.errors) lines.push(pad("Could not fetch", 46) + c.dim(`${t.errors} (see --json)`));

  // Humans
  lines.push("");
  lines.push(c.bold("The humans this project depends on most (packages carried alone)"));
  const humans = result.humans.filter((h) => h.solo > 0).slice(0, top);
  if (!humans.length) lines.push(c.dim("  none: every package has at least two publishers"));
  for (const h of humans) {
    const org = h.orgOwned ? c.dim(" org-owned?") : "";
    const fund = h.fundingLinks[0] ? c.dim(`  ${h.fundingLinks[0]}`) : "";
    lines.push(`  ${pad(h.login, 24)} ${String(h.solo).padStart(3)} alone / ${String(h.packages).padStart(3)} total${org}${fund}`);
  }

  // Dead
  lines.push("");
  lines.push(c.bold(`Dead packages, by how many repositories depend on them`));
  if (!result.dead.length) lines.push(c.dim("  none"));
  for (const p of result.dead.slice(0, top)) {
    lines.push(`  ${pad(p.name, 30)} ${c.red(p.reason)}`);
  }
  if (result.dead.length > top) lines.push(c.dim(`  ... and ${result.dead.length - top} more (see --json)`));

  // Dormant
  lines.push("");
  lines.push(c.bold("Heaviest dormant packages"));
  if (!result.dormant.length) lines.push(c.dim("  none"));
  for (const p of result.dormant.slice(0, top)) {
    const who = p.maintainers.length === 1 ? `1 publisher (${p.maintainers[0]})` : `${p.maintainers.length} publishers`;
    lines.push(`  ${pad(p.name, 30)} ${c.yellow(p.reason)}, ${who}, ${fmt(p.dependentRepos)} dependent repos`);
  }
  if (result.dormant.length > top) lines.push(c.dim(`  ... and ${result.dormant.length - top} more (see --json)`));

  pushSuccessors(lines, result, c);

  lines.push("");
  lines.push(c.dim("Data: packages.ecosyste.ms and the package registry. A publisher account is not always an active person."));
  return lines.join("\n") + "\n";
}

function pushSuccessors(lines, result, c) {
  lines.push("");
  lines.push(c.bold("Known successors (from data/successors.json)"));
  if (!result.successors.length) {
    lines.push(c.dim("  no package in this lockfile has a known successor entry"));
    return;
  }
  for (const s of result.successors) {
    lines.push(`  ${pad(s.package, 30)} ${c.green(describeSuccessor(s))}`);
    lines.push(c.dim(`  ${" ".repeat(30)} ${s.sources[0]}`));
  }
}

export function pad(text, width) {
  const s = String(text);
  return s.length >= width ? s + " " : s + " ".repeat(width - s.length);
}

export function fmt(n) {
  return Number(n || 0).toLocaleString("en-US");
}

function colours(on) {
  const wrap = (code) => (s) => (on ? `\x1b[${code}m${s}\x1b[0m` : s);
  return { bold: wrap(1), dim: wrap(2), red: wrap(31), green: wrap(32), yellow: wrap(33) };
}
