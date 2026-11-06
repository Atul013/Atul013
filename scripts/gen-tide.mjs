// assets/generated/tide.svg: 52 weeks of commits drawn as a tide line. One accent line, amber for the peak.
// All animation is CSS, so prefers-reduced-motion shows the finished chart.
// Usage: GITHUB_TOKEN=... node scripts/gen-tide.mjs [login]
import { writeFileSync, mkdirSync } from 'node:fs';
import { fetchProfile } from './lib/github.mjs';
import { C, style, panel, OUT } from './lib/svg.mjs';

const login = process.argv[2] || 'Atul013';
const u = await fetchProfile(login, process.env.GITHUB_TOKEN);
const W = 720, H = 216, L = 56, R = 40, T = 84, B = 180;
const max = Math.max(...u.weekly, 1);
const total = u.weekly.reduce((a, b) => a + b, 0);
const pts = u.weekly.map((v, i) => [L + (i * (W - L - R)) / 51, B - (v / max) * (B - T)]);
let d = `M${pts[0][0]} ${pts[0][1]}`;
for (let i = 1; i < pts.length; i++) {
  const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = (x0 + x1) / 2;
  d += ` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
}
const peak = u.weekly.indexOf(max), [px, py] = pts[peak];
const [nx, ny] = pts[51];
const peakDate = new Date(Date.now() - (51 - peak) * 7 * 864e5).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// month ticks: label the first week that starts a new month
const ticks = [];
let lastMonth = -1;
u.weekly.forEach((_, i) => {
  const dt = new Date(Date.now() - (51 - i) * 7 * 864e5);
  if (dt.getMonth() !== lastMonth) { lastMonth = dt.getMonth(); if (i > 0 && i < 50) ticks.push([pts[i][0], dt.toLocaleDateString('en-US', { month: 'short' })]); }
});
const LABEL = `class="m" fill="${C.text}" fill-opacity=".78"`; // axis text: brighter than the generic dim grey
const grid = [0, 0.5, 1].map(f => {
  const y = B - f * (B - T);
  return `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="${C.dim}" stroke-opacity="${f ? 0.25 : 0}" stroke-dasharray="2 6"/><text x="${L - 10}" y="${y + 4}" text-anchor="end" ${LABEL} font-size="13">${Math.round(max * f)}</text>`;
}).join('');
const months = ticks.map(([x, m]) => `<line x1="${x}" x2="${x}" y1="${B}" y2="${B + 5}" stroke="${C.s3}"/><text x="${x}" y="${B + 22}" text-anchor="middle" ${LABEL} font-size="13">${m}</text>`).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Commits per week over the last year: ${total} commits in total, the busiest week had ${max} commits around ${peakDate}.">
<style>${style(['sans600', 'sans400', 'mono'])}
@keyframes rev{from{transform:scaleX(0)}to{transform:scaleX(1)}}.rev{transform-origin:0 0;animation:rev 2.6s cubic-bezier(.22,1,.36,1) both}
@keyframes show{from{opacity:0}to{opacity:1}}.show{animation:show .5s ease-out 2.4s both}
@keyframes ring{0%{r:4;opacity:.8}100%{r:15;opacity:0}}.ring{animation:ring 2.4s ease-out infinite}
@media (prefers-reduced-motion:reduce){.ring{display:none}}
</style>
<defs>
  <linearGradient id="fill" gradientUnits="userSpaceOnUse" x1="0" y1="${T}" x2="0" y2="${B}"><stop offset="0" stop-color="${C.cyan}" stop-opacity=".22"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></linearGradient>
  <clipPath id="clip"><rect class="rev" x="0" y="0" width="${W}" height="${H}"/></clipPath>
</defs>
${panel(W, H, 16)}<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="15.5" fill="none" stroke="${C.s3}"/>
<text x="${L}" y="44" class="g t" font-size="16" font-weight="600">Tide chart</text>
<text x="${L}" y="64" class="g" fill="${C.text}" fill-opacity=".78" font-size="14">Commits per week over the last year</text>
<text x="${W - R}" y="44" text-anchor="end" class="g" font-size="22" font-weight="600" fill="${C.amber}">${total}</text>
<text x="${W - R}" y="64" text-anchor="end" class="g" fill="${C.text}" fill-opacity=".78" font-size="14">commits in 12 months</text>
${grid}
<g clip-path="url(#clip)">
  <path d="${d} L${nx} ${B} L${pts[0][0]} ${B} Z" fill="url(#fill)"/>
  <path d="${d}" fill="none" stroke="${C.cyan}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
</g>
<line x1="${L}" y1="${B}" x2="${W - R}" y2="${B}" stroke="${C.s3}"/>
${months}
<g class="show">
  <line x1="${px}" x2="${px}" y1="${py + 6}" y2="${B}" stroke="${C.amber}" stroke-opacity=".5" stroke-dasharray="3 4"/>
  <circle class="ring" cx="${px}" cy="${py}" r="4" fill="none" stroke="${C.amber}" stroke-width="1.5"/>
  <circle cx="${px}" cy="${py}" r="4.5" fill="${C.amber}" stroke="${C.bg}" stroke-width="1.5"/>
  <text x="${px - 12}" y="${py - 4}" text-anchor="end" class="m t" font-size="14" font-weight="600">${max} commits</text>
  <text x="${px - 12}" y="${py + 12}" text-anchor="end" ${LABEL} font-size="13">best week, ${peakDate}</text>
  <circle class="ring" cx="${nx}" cy="${ny}" r="4" fill="none" stroke="${C.cyan}" stroke-width="1.5" style="animation-delay:1.2s"/>
  <circle cx="${nx}" cy="${ny}" r="4" fill="${C.cyan}" stroke="${C.bg}" stroke-width="1.5"/>
  <text x="${nx + 4}" y="${B + 22}" text-anchor="end" class="m a" font-size="13" font-weight="600">now</text>
</g>
</svg>`;
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/tide.svg`, svg);
console.log(`tide: total ${total}, peak ${max} (${peakDate})`);
