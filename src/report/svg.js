// A shareable 800x420 SVG card: four headline numbers and the top 5 humans.
// Hand-written SVG, system fonts only, so it renders the same everywhere
// (GitHub README, social previews, Slack).

const W = 800;
const H = 420;

export function renderSvg(result, { top = 5 } = {}) {
  const t = result.totals;
  const humans = result.humans.filter((h) => h.solo > 0).slice(0, top);
  const maxSolo = Math.max(1, ...humans.map((h) => h.solo));
  const lockName = result.lockfile.split(/[\\/]/).pop();

  const stats = [
    { label: "packages", value: t.packages, colour: "#e5e7eb" },
    { label: "dead", value: t.dead ?? 0, colour: "#f87171" },
    { label: "dormant", value: t.dormant ?? 0, colour: "#fbbf24" },
    { label: "single publisher", value: t.solo === undefined ? "-" : `${t.soloPercent}%`, colour: "#fbbf24" },
  ];

  const statsSvg = stats
    .map((s, i) => {
      const x = 40 + i * 185;
      return `
    <text x="${x}" y="130" font-size="44" font-weight="700" fill="${s.colour}">${esc(s.value)}</text>
    <text x="${x}" y="158" font-size="15" fill="#9ca3af">${esc(s.label)}</text>`;
    })
    .join("");

  // One row per human: name, bar proportional to packages carried alone, count.
  const rows = humans
    .map((h, i) => {
      const y = 225 + i * 32;
      const barW = Math.round(300 * (h.solo / maxSolo));
      const name = h.orgOwned ? `${h.login} (org?)` : h.login;
      return `
    <text x="40" y="${y + 15}" font-size="15" fill="#e5e7eb">${esc(truncate(name, 26))}</text>
    <rect x="300" y="${y}" width="${barW}" height="20" rx="4" fill="#60a5fa"/>
    <text x="${310 + barW}" y="${y + 15}" font-size="14" fill="#9ca3af">${h.solo} alone / ${h.packages} total</text>`;
    })
    .join("");

  const humansTitle = humans.length
    ? "Humans this project depends on most (packages carried alone)"
    : result.analysed
      ? "No package is carried by a single account"
      : `${result.ecosystem}: not yet analysed by busfactor v0`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif">
  <rect width="${W}" height="${H}" rx="16" fill="#111827"/>
  <text x="40" y="52" font-size="22" font-weight="700" fill="#f9fafb">busfactor</text>
  <text x="180" y="52" font-size="16" fill="#9ca3af">${esc(truncate(lockName, 40))}</text>
  <text x="${W - 40}" y="52" font-size="13" fill="#6b7280" text-anchor="end">${esc(result.scannedAt.slice(0, 10))}</text>
  <line x1="40" y1="68" x2="${W - 40}" y2="68" stroke="#374151"/>
${statsSvg}
  <text x="40" y="200" font-size="15" font-weight="600" fill="#f9fafb">${esc(humansTitle)}</text>
${rows}
  <text x="40" y="${H - 20}" font-size="12" fill="#6b7280">github.com/GenAmed/busfactor - data: packages.ecosyste.ms - a publisher account is not always an active person</text>
</svg>
`;
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
