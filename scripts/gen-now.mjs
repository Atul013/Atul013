// assets/generated/now.svg (stack chips + what I'm learning as a terminal) and contact-*.svg pills.
// Static data, so this only needs to run when it changes. All animation is CSS (reduced-motion safe).
// Usage: node scripts/gen-now.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { C, style, panel, OUT } from './lib/svg.mjs';

const STACK = ['Python', 'TypeScript', 'JavaScript', 'C++', 'React', 'FastAPI', 'scikit-learn', 'Docker', 'Git', 'Linux'];
const LEARNING = ['llm security', 'financial literacy', 'closed-loop control'];
const CW = 7.8, W = 720;

// two complete rows of five equal-width chips
const COLS = 5, GAP = 10, CHIP_W = (W - 56 - GAP * (COLS - 1)) / COLS;
let chips = '', y = 84;
STACK.forEach((name, i) => {
  const col = i % COLS, row = Math.floor(i / COLS);
  const x = 28 + col * (CHIP_W + GAP);
  y = 84 + row * 40;
  chips += `<g class="chip" style="animation-delay:${(0.4 + i * 0.1).toFixed(2)}s">
  <rect x="${x}" y="${y}" width="${CHIP_W}" height="30" rx="15" fill="#fff" fill-opacity=".05" stroke="${C.s3}"/>
  <circle class="dot" cx="${x + 16}" cy="${y + 15}" r="4" fill="${C.cyan}" style="animation-delay:${(i * 0.3).toFixed(1)}s"/>
  <text x="${x + 29}" y="${y + 19.5}" class="g t" font-size="13">${name}</text></g>`;
});
const ly = y + 70;
const lineY = i => ly + 26 + i * 22;
const H = lineY(LEARNING.length) + 24;
const css = [];
const learn = LEARNING.map((l, i) => {
  const n = ('  ' + l).length, start = 2.0 + i * 1.2, dur = n * 0.04;
  css.push(`@keyframes l${i}{from{transform:scaleX(0)}to{transform:scaleX(1)}}.l${i}{transform-origin:28px 0;animation:l${i} ${dur.toFixed(2)}s steps(${n},end) ${start}s both}`);
  return `<clipPath id="l${i}"><rect class="l${i}" x="28" y="${lineY(i) - 15}" width="${(n * CW).toFixed(0)}" height="22"/></clipPath>
  <text x="28" y="${lineY(i)}" class="m" font-size="13" fill="${C.text}" xml:space="preserve" clip-path="url(#l${i})">  ${l}</text>`;
}).join('\n');
const cursorStart = (2.0 + LEARNING.length * 1.2).toFixed(1);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Stack: ${STACK.join(', ')}. Currently learning: ${LEARNING.join(', ')}.">
<style>${style(['sans400', 'mono'])}
@keyframes pop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.chip{animation:pop .5s cubic-bezier(.22,1,.36,1) both}
@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}.dot{animation:pulse 3.5s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}.cur{animation:blink 1s step-end ${cursorStart}s infinite}
@keyframes curin{from{opacity:0}to{opacity:1}}.curin{animation:curin .01s linear ${cursorStart}s both}
${css.join('\n')}</style>
${panel(W, H, 16)}<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="15.5" fill="none" stroke="${C.s3}"/>
<circle cx="34" cy="30" r="5" fill="${C.amber}"/><circle cx="52" cy="30" r="5" fill="${C.cyan}"/><circle cx="70" cy="30" r="5" fill="#6e7681"/>
<text x="90" y="34" class="m d" font-size="12">atul@sea: ~/stack</text>
<text x="28" y="68" class="m" font-size="13"><tspan fill="${C.amber}">$ </tspan><tspan fill="${C.cyan}">ls stack/</tspan></text>
${chips}
<text x="28" y="${ly}" class="m" font-size="13"><tspan fill="${C.amber}">$ </tspan><tspan fill="${C.cyan}">cat learning.txt</tspan></text>
${learn}
<g class="curin"><rect class="cur" x="${28 + 2 * CW}" y="${lineY(LEARNING.length) - 12}" width="7" height="14" fill="${C.amber}"/></g>
</svg>`;
mkdirSync(OUT, { recursive: true });
writeFileSync(`${OUT}/now.svg`, svg);

// contact pills: logo plus label, 44px tall (touch target), brand logos from Simple Icons (CC0) in the text colour
const ICONS = JSON.parse(readFileSync(new URL('./art/icons.json', import.meta.url), 'utf8'));
const CONTACT = [['gmail', 'Email', 'email'], ['linkedin', 'LinkedIn', 'linkedin'], ['portfolio', 'Portfolio', 'portfolio'], ['huggingface', 'Hugging Face', 'hugging face'], ['discord', 'Discord', 'discord'], ['instagram', 'Instagram', 'instagram']];
// the portfolio pill has no brand logo, so it gets a simple globe drawn in the same 24px box
const GLOBE = `<g fill="none" stroke="${C.text}" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9.2"/><ellipse cx="12" cy="12" rx="4.2" ry="9.2"/><path d="M2.8 12h18.4"/></g>`;
CONTACT.forEach(([key, label, text], i) => {
  const w = Math.round(text.length * CW + 64);
  const icon = key === 'portfolio' ? GLOBE : `<path d="${ICONS[key]}" fill="${C.text}"/>`;
  writeFileSync(`${OUT}/contact-${i + 1}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="44" viewBox="0 0 ${w} 44" role="img" aria-label="${label}">
<style>${style(['mono'])}</style>
<rect x=".5" y=".5" width="${w - 1}" height="43" rx="21.5" fill="#fff" fill-opacity=".05" stroke="${C.s3}"/>
<g transform="translate(15 12) scale(.8333)">${icon}</g>
<text x="42" y="26.5" class="m t" font-size="13">${text}</text></svg>`);
});

// intro panel: headline plus a short summary, set in Geist like everything else (the full text is also the alt text)
{
  const W = 720, H = 132;
  const SUMMARY = 'AI tools and the systems around them: a code-debugging model, a rehab wearable, and an agent that reads you.';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="B.Tech CSE (AI) at ASIET, Kerala, class of 2027. ${SUMMARY}">
<style>${style(['sans600', 'sans400'])}
@keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.l1{animation:rise .8s cubic-bezier(.22,1,.36,1) .1s both}.l2{animation:rise .8s cubic-bezier(.22,1,.36,1) .35s both}
</style>
${panel(W, H, 16)}
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="15.5" fill="none" stroke="${C.s3}"/>
<text class="g l1" x="${W / 2}" y="46" text-anchor="middle" font-size="20" font-weight="600" fill="${C.text}">B.Tech CSE (AI) at ASIET, Kerala, class of 2027</text>
<text class="g l2" x="${W / 2}" y="80" text-anchor="middle" font-size="16" fill="${C.text}" fill-opacity=".85">AI tools and the systems around them: a <tspan fill="${C.cyan}" fill-opacity="1">code-debugging model</tspan>,</text>
<text class="g l2" x="${W / 2}" y="103" text-anchor="middle" font-size="16" fill="${C.text}" fill-opacity=".85">a <tspan fill="${C.cyan}" fill-opacity="1">rehab wearable</tspan>, and an <tspan fill="${C.cyan}" fill-opacity="1">agent that reads you</tspan>.</text>
</svg>`;
  writeFileSync(`${OUT}/intro.svg`, svg);
}

// fun fact: a slim panel in the same style (the sentence is also the alt text)
{
  const W = 720, H = 64;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Fun fact: Banging your head against a wall for one hour burns 150 calories.">
<style>${style(['sans600', 'sans400'])}
@keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.f{animation:rise .8s cubic-bezier(.22,1,.36,1) .1s both}
@keyframes zap{0%,40%,72%,100%{opacity:1;transform:scale(1);fill:#f2b84b;stroke:#f2b84b}44%,54%{opacity:0;transform:scale(.8)}48%,58%{opacity:1;transform:scale(1.4);fill:#fff1c2;stroke:#fff1c2}}.bolt{transform-box:fill-box;transform-origin:50% 50%;animation:zap 1.6s linear infinite}
@keyframes glow{0%,40%,72%,100%{opacity:.25;transform:scale(1)}44%,54%{opacity:0}48%,58%{opacity:1;transform:scale(1.6)}}.glow{transform-box:fill-box;transform-origin:50% 50%;animation:glow 1.6s linear infinite}
</style>
${panel(W, H, 16)}
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="15.5" fill="none" stroke="${C.s3}"/>
<defs><filter id="bz" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>
<g transform="translate(86 19) scale(1.05)"><path class="glow" d="M13.5 1.5 4 14h6.2l-1.2 8.5L20 9.5h-6.6z" fill="${C.amber}" filter="url(#bz)"/><path class="bolt" d="M13.5 1.5 4 14h6.2l-1.2 8.5L20 9.5h-6.6z" fill="${C.amber}" stroke="${C.amber}" stroke-width="1" stroke-linejoin="round"/></g>
<text class="g f" x="${W / 2 + 22}" y="39" text-anchor="middle" font-size="15" fill="${C.text}" fill-opacity=".85"><tspan fill="${C.amber}" fill-opacity="1" font-weight="600">Fun fact:</tspan> Banging your head against a wall for one hour burns <tspan fill="${C.amber}" fill-opacity="1" font-weight="600">150 calories</tspan>.</text>
</svg>`;
  writeFileSync(`${OUT}/fact.svg`, svg);
}
console.log('now.svg + contact pills written');
