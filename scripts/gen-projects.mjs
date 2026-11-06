// assets/generated/proj-1..4.svg (big cards) and small-1..3.svg (honourable mentions).
// One neutral border, a muted language dot, no per-language rainbow. A card can be marked hidden
// (private repo): it shows a lock and "repo hidden" and is not linked in the README.
// Usage: GITHUB_TOKEN=... node scripts/gen-projects.mjs [login]
import { writeFileSync, mkdirSync } from 'node:fs';
import { fetchRepos, esc } from './lib/github.mjs';
import { C, style, panel, OUT } from './lib/svg.mjs';

const login = process.argv[2] || 'Atul013';

// Big cards. `repo` is a repo under the login (language comes from GitHub); otherwise `lang` is set by hand.
const BIG = [
  { name: 'MIRA', cmd: 'MIRA', desc: 'Wearable muscle stimulation for hand rehab. I built the edge runtime and safety layer.', foot: 'B.Tech main project', hidden: true },
  { name: 'Mini Project', cmd: 'Mini-Project', desc: 'A 180M-parameter language model for code debugging, with retrieval and verification.', foot: 'B.Tech mini project' },
  { name: 'Lucid', repo: 'Lucid', foot: 'Personal intelligence', desc: 'An AI agent that reads your messages and notes and shows the patterns in how you behave.' },
  { name: 'forge-room-ide', repo: 'forge-room-ide', foot: 'Developer tool', desc: 'A collaborative IDE built on Code OSS, with a team lobby and the Forge Room studio.' },
];
// Smaller cards for honourable mentions; the first one leads.
const SMALL = [
  { name: 'Pazham', repo: 'Pazham', desc: "A random forest that predicts a banana's seed count." },
  { name: 'Cradlix', repo: 'Cradlix', desc: 'Detects baby cries in live audio, with Go and Python.' },
  { name: 'HackQuest25', repo: 'HackQuest25', desc: 'Real-time emergency alerts with Whisper and geofencing.' },
];

const names = [...BIG, ...SMALL].filter(p => p.repo).map(p => p.repo);
const meta = Object.fromEntries((await fetchRepos(login, names, process.env.GITHUB_TOKEN)).map(r => [r.name, r]));
const langOf = r => (r.primaryLanguage?.name === 'Jupyter Notebook' ? 'Python' : (r.primaryLanguage?.name || 'Code'));

const wrap = (text, n) => {
  const out = []; let line = '';
  for (const w of text.split(' ')) { if ((line + ' ' + w).trim().length > n) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); }
  return [...out, line];
};
const LOCK = `<g fill="none" stroke="${C.dim}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></g>`;
mkdirSync(OUT, { recursive: true });

// ---------- big cards ----------
const W = 440, H = 168;
BIG.forEach((p, i) => {
  const r = p.repo ? meta[p.repo] : null;
  const left = p.foot || langOf(r);
  const perim = 2 * (W - 2 + H - 2);
  const desc = wrap(p.desc, 50).map((l, k) => `<text x="28" y="${88 + k * 19}" class="g d" font-size="14">${esc(l)}</text>`).join('');
  const right = p.hidden
    ? `<g transform="translate(${W - 134} ${H - 34}) scale(.75)">${LOCK}</g><text x="${W - 28}" y="${H - 20}" text-anchor="end" class="m d" font-size="12">repo hidden</text>`
    : `<text x="${W - 28}" y="${H - 20}" text-anchor="end" class="m a" font-size="12">view repo</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.name)}, ${esc(left)}. ${esc(p.desc)}${p.hidden ? ' The repository is hidden.' : ''}">
<style>${style()}
@keyframes draw{0%{stroke-dashoffset:${perim};stroke-opacity:.7}65%{stroke-dashoffset:0;stroke-opacity:.7}100%{stroke-dashoffset:0;stroke-opacity:0}}.draw{stroke-opacity:0;stroke-dasharray:${perim};animation:draw 2.6s cubic-bezier(.22,1,.36,1) ${(i * 0.25).toFixed(2)}s both}
@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}.dot{animation:pulse 3s ease-in-out ${(i * 0.4).toFixed(1)}s infinite}
</style>
${panel(W, H, 14)}
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="13" fill="none" stroke="${C.s3}"/>
<rect class="draw" x="1" y="1" width="${W - 2}" height="${H - 2}" rx="13" fill="none" stroke="${C.amber}"/>
<text x="28" y="36" class="m d" font-size="12"><tspan fill="${C.amber}">$ </tspan>cd ${esc(p.cmd || p.repo)}</text>
<text x="28" y="62" class="g t" font-size="20" font-weight="600">${esc(p.name)}</text>
${desc}
<circle class="dot" cx="33" cy="${H - 24}" r="4.5" fill="${C.dim}"/>
<text x="46" y="${H - 20}" class="g t" font-size="13">${esc(left)}</text>
${right}
</svg>`;
  writeFileSync(`${OUT}/proj-${i + 1}.svg`, svg);
});

// ---------- small cards ----------
const SW = 288, SH = 112;
SMALL.forEach((p, i) => {
  const desc = wrap(p.desc, 36).slice(0, 2).map((l, k) => `<text x="22" y="${78 + k * 17}" class="g d" font-size="13">${esc(l)}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}" viewBox="0 0 ${SW} ${SH}" role="img" aria-label="${esc(p.name)}. ${esc(p.desc)}">
<style>${style(['sans600', 'sans400', 'mono'])}</style>
${panel(SW, SH, 14)}
<rect x=".5" y=".5" width="${SW - 1}" height="${SH - 1}" rx="13.5" fill="none" stroke="${C.s3}"/>
<text x="22" y="32" class="m d" font-size="11"><tspan fill="${C.amber}">$ </tspan>cd ${esc(p.repo)}</text>
<text x="22" y="56" class="g t" font-size="17" font-weight="600">${esc(p.name)}</text>
${desc}
</svg>`;
  writeFileSync(`${OUT}/small-${i + 1}.svg`, svg);
});
console.log('projects:', BIG.map(p => p.name).join(', '), '| also:', SMALL.map(p => p.name).join(', '));
