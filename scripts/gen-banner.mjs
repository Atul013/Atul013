// assets/generated/banner.svg
// Left: the owner's photo as coloured text art. Right: a terminal that types out live data
// (latest commit on a featured project, last played track, sea mood) over a sea that follows real activity.
// Every animation is CSS, so prefers-reduced-motion shows the finished static frame.
// Usage: GITHUB_TOKEN=... node scripts/gen-banner.mjs [login]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fetchProfile, esc } from './lib/github.mjs';
import { C, style, panel, OUT } from './lib/svg.mjs';

const FEATURED = ['OrchestrateX', 'forge-room-ide', 'ngo-eligibility-analyzer', 'Pazham'];
const SEA = ['#0f2c34', '#123a45', '#17505c'];
const login = process.argv[2] || 'Atul013';
const u = await fetchProfile(login, process.env.GITHUB_TOKEN, { latestFrom: FEATURED });
const ascii = s => String(s).replace(/[^\x20-\x7E]/g, '').trim();
const clip = (s, n) => (s.length > n ? s.slice(0, n - 3) + '...' : s);

let track = 'silence';
try { track = ascii((await (await fetch('https://raw.githubusercontent.com/Atul013/ytm-widget/main/state.json')).json()).title) || track; } catch {}

const ist = new Date(Date.now() + 5.5 * 36e5).getUTCHours();
const phase = ist >= 6 && ist < 17 ? 'day' : ist >= 17 && ist < 20 ? 'dusk' : 'night';
const mood = u.commitsLast7 >= 10 ? 'calm' : u.commitsLast7 >= 3 ? 'breezy' : 'stormy';
const amp = { calm: 5, breezy: 9, stormy: 16 }[mood];
const speed = { calm: 16, breezy: 11, stormy: 6 }[mood];
const sea = { calm: 'calm sea', breezy: 'light breeze', stormy: 'rough water, ship something' }[mood];

const W = 1000, H = 420;
const css = [];          // keyframes and rules collected as we go

// ---------- text art ----------
// scripts/art/portrait.json: rows of [chars, paletteIndex] runs sampled from the photo, so colours stay realistic.
const { palette, rows: artRows } = JSON.parse(readFileSync(new URL('./art/portrait.json', import.meta.url), 'utf8'));
const COLS = artRows[0].reduce((n, [t]) => n + t.length, 0);
const AX = 24, AY = 16, AW = 396;
const FS = +(AW / (COLS * 0.6)).toFixed(2), LH = +(FS * 1.15).toFixed(2);
const rows = artRows.map((runs, i) => {
  const spans = runs.map(([t, c]) => `<tspan fill="${palette[c]}">${esc(t)}</tspan>`).join('');
  const glitch = i % 14 === 3 ? ` style="animation:gl ${7 + (i % 3)}s linear ${i % 5}s 24"` : '';
  return `<g class="row" style="animation-delay:${(i * 0.045).toFixed(2)}s"><text class="art" x="${AX}" y="${(AY + i * LH).toFixed(1)}" font-size="${FS}" xml:space="preserve"${glitch}>${spans}</text></g>`;
}).join('\n');

// ---------- terminal ----------
const TX = 470, FS_T = 13, MAXC = 62, CWT = FS_T * 0.6;
const lines = [
  ['$ ', 'whoami', null],
  ['  ', 'Atul Biju', 'out'],
  ['  ', 'cse-ai @ asiet. builds ai systems.', 'out'],
  ['$ ', 'git log -1', null],
  ['  ', clip(u.latest ? ascii(u.latest.msg) : 'nothing yet, suspicious', MAXC - 2), 'out'],
  ['$ ', 'tail sea.log', null],
  ['  ', `${sea}. ${u.commitsLast7} commits this week.`, 'out'],
  ['$ ', 'now_playing', null],
  ['  ', clip(track, 40), 'music'],
];
const DT = 0.035, GAP = 0.45, HOLD = 6;
let t = 1.6; // let the portrait start drawing first
const timed = lines.map(([pre, body, kind]) => {
  const n = (pre + body).length, step = kind ? DT * 0.6 : DT, start = t;
  t += n * step + GAP;
  return { pre, body, kind, n, start, end: start + n * step };
});
const CYCLE = +(t + HOLD).toFixed(2);
const pc = s => (s / CYCLE * 100).toFixed(3) + '%';

let y = 86;
const clips = [], text = [];
timed.forEach((l, i) => {
  y += 19; l.y = y;
  const full = +(l.n * CWT).toFixed(1);
  css.push(`@keyframes t${i}{0%{transform:scaleX(0)}${pc(l.start)}{transform:scaleX(0);animation-timing-function:steps(${l.n},end)}${pc(l.end)}{transform:scaleX(1)}100%{transform:scaleX(1)}}`);
  css.push(`.c${i}{transform-origin:${TX}px 0;animation:t${i} ${CYCLE}s linear 11}`);
  clips.push(`<clipPath id="c${i}"><rect class="c${i}" x="${TX}" y="${y - 15}" width="${full}" height="20"/></clipPath>`);
  text.push(`<text x="${TX}" y="${y}" class="m" font-size="${FS_T}" xml:space="preserve" clip-path="url(#c${i})"><tspan fill="${C.amber}">${esc(l.pre)}</tspan><tspan fill="${l.kind ? C.text : C.cyan}">${esc(l.body)}</tspan></text>`);
});
// equaliser bars appear once the music line has typed, then keep moving
const ml = timed.find(l => l.kind === 'music');
const ex = TX + (ml.pre + ml.body).length * CWT + 14, ey = ml.y + 2;
css.push(`@keyframes eqv{0%{opacity:0}${pc(ml.end)}{opacity:1}100%{opacity:1}}.eqv{animation:eqv ${CYCLE}s step-end 11}`);
const eq = Array.from({ length: 5 }, (_, i) => `<rect class="eq" x="${(ex + i * 5).toFixed(1)}" y="${ey - 16}" width="2.5" height="16" rx="1" fill="${C.cyan}" style="animation-duration:${(0.8 + i * 0.13).toFixed(2)}s"/>`).join('');
// blinking prompt once everything has typed
const py = y + 19;
css.push(`@keyframes pv{0%{opacity:0}${pc(t - GAP)}{opacity:1}100%{opacity:1}}.pv{animation:pv ${CYCLE}s step-end 11}`);
const prompt = `<g class="pv"><text x="${TX}" y="${py}" class="m" font-size="${FS_T}" fill="${C.amber}">$ </text><rect class="blink" x="${TX + 2 * CWT}" y="${py - 11}" width="7" height="14" fill="${C.amber}"/></g>`;
// window chrome so the right side reads as one terminal
const chrome = `<circle cx="${TX + 6}" cy="44" r="5" fill="${C.amber}"/><circle cx="${TX + 24}" cy="44" r="5" fill="${C.cyan}"/><circle cx="${TX + 42}" cy="44" r="5" fill="#6e7681"/><text x="${TX + 62}" y="48" class="m d" font-size="12">atul@sea: ~</text><line x1="${TX}" x2="900" y1="64" y2="64" stroke="${C.s3}"/>`;

// ---------- sea, ship, sky ----------
const wave = (yy, a, len) => {
  let d = `M${-len} ${yy}`;
  for (let x = -len; x < W + len * 2; x += len) d += ` q${len / 4} ${-a} ${len / 2} 0 t${len / 2} 0`;
  return d + ` V${H + 20} H${-len} Z`;
};
const SEA_Y = 382;
const layers = [[SEA_Y, 0.7, 340, SEA[0], 1.6], [SEA_Y + 16, 1, 280, SEA[1], 1.1], [SEA_Y + 32, 1.3, 230, SEA[2], 0.8]]
  .map(([yy, k, len, col, f], i) => `<path class="w" d="${wave(yy, amp * k, len)}" fill="${col}" style="--d:${i % 2 ? len : -len}px;animation-duration:${(speed * f * 1.4).toFixed(1)}s"/>`).join('');
const crest = `<path class="w" d="${wave(SEA_Y, amp * 0.7, 340).replace(/ V.*/, '')}" fill="none" stroke="${C.cyan}" stroke-opacity=".5" style="--d:-340px;animation-duration:${(speed * 1.6 * 1.4).toFixed(1)}s"/>`;
const by = SEA_Y - 4;
const ship = `<g class="sail" style="animation-duration:${speed * 6}s"><g class="bob" style="transform-origin:20px ${by}px;animation-duration:${(speed / 2).toFixed(1)}s"><g transform="translate(0 ${by}) scale(1.3) translate(0 ${-by})">
  <path d="M-2 ${by - 7} h50 l-9 10 h-32 z" fill="${C.text}"/>
  <rect x="22" y="${by - 40}" width="1.6" height="33" fill="${C.text}"/>
  <path d="M23 ${by - 37} q16 6 16 24 q-8 4 -16 0 z" fill="${C.amber}"/><circle cx="31" cy="${by - 24}" r="3.4" fill="none" stroke="${C.bg}" stroke-width="1"/>
  <path d="M22 ${by - 34} q-10 5 -10 19 q5 3 10 0 z" fill="${C.text}" opacity=".85"/></g></g></g>`;
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const stars = Array.from({ length: 18 }, () => `<circle class="tw" cx="${(440 + rnd() * 540).toFixed(0)}" cy="${(rnd() * 330 + 8).toFixed(0)}" r="${rnd() < .2 ? 1.3 : .8}" fill="${C.text}" opacity=".3" style="animation-duration:${(3 + rnd() * 4).toFixed(1)}s;animation-delay:${(rnd() * 4).toFixed(1)}s"/>`).join('');
const orb = phase === 'night'
  ? `<circle cx="944" cy="52" r="15" fill="${C.text}"/><circle cx="951" cy="47" r="14" fill="${C.bg}"/>`
  : `<circle cx="944" cy="${phase === 'dusk' ? 300 : 52}" r="16" fill="${C.amber}" opacity="${mood === 'stormy' ? .3 : 1}"/>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(u.name)}. A text art portrait next to a terminal: ${esc(lines.filter(l => l[2]).map(l => l[1]).join('. '))}">
<defs><style>${style()}
.art{font-family:GM,ui-monospace,Consolas,monospace;white-space:pre}
@keyframes rin{from{opacity:0}to{opacity:1}}.row{animation:rin .25s ease-out both}
@keyframes gl{0%,90%{transform:translateX(0)}92%{transform:translateX(4px)}95%{transform:translateX(-3px)}97%,100%{transform:translateX(0)}}
@keyframes drift{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}.drift{animation:drift 7s ease-in-out 24}
@keyframes scan{from{transform:translateY(-70px)}to{transform:translateY(${H}px)}}.scan{animation:scan 7s linear 2s 24}
@keyframes wv{to{transform:translateX(var(--d))}}.w{animation:wv 20s linear 9}
@keyframes sail{from{transform:translateX(440px)}to{transform:translateX(880px)}}.sail{transform:translateX(660px);animation:sail 60s ease-in-out 3 alternate}
@keyframes bob{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}.bob{animation:bob 5s ease-in-out 36}
@keyframes tw{0%,100%{opacity:.12}50%{opacity:.6}}.tw{animation:tw 4s ease-in-out 45}
@keyframes shoot{0%,70%{opacity:0;transform:translate(900px,40px)}72%{opacity:.9}80%,100%{opacity:0;transform:translate(780px,100px)}}.shoot{opacity:0;animation:shoot 11s linear 16}
@keyframes eq{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}.eq{transform-box:fill-box;transform-origin:50% 100%;animation:eq 1s ease-in-out 180}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}.blink{animation:blink 1s step-end 180}
@media (prefers-reduced-motion:reduce){.scan,.shoot{display:none}}
${css.join('\n')}</style>
<clipPath id="seaarea"><rect x="430" y="0" width="${W - 430}" height="${H}"/></clipPath>
<clipPath id="artclip"><rect x="0" y="0" width="430" height="${H}"/></clipPath>
${clips.join('\n')}</defs>
${panel(W, H, 16)}
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="15.5" fill="none" stroke="${C.s3}"/>
${stars}${orb}
<g class="shoot"><line x1="0" y1="0" x2="-46" y2="22" stroke="${C.text}" stroke-width="1.4" stroke-linecap="round"/></g>
<g clip-path="url(#seaarea)">${layers}${crest}${ship}</g>
<g clip-path="url(#artclip)">
  <g class="drift">${rows}</g>
  <g class="scan"><rect x="${AX}" y="0" width="${AW}" height="46" fill="#fff" opacity=".05"/><rect x="${AX}" y="44" width="${AW}" height="2" fill="#fff" opacity=".14"/></g>
</g>
${chrome}
${text.join('\n')}
<g class="eqv">${eq}</g>
${prompt}
</svg>`;
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/banner.svg`, svg);
console.log(`banner: ${mood}/${phase}, cycle ${CYCLE}s, ${(svg.length / 1024).toFixed(0)}KB, latest=${u.latest?.repo}: ${u.latest?.msg}, track=${track}`);
