// Shared SVG pieces: semantic colour tokens, embedded Geist fonts, base styles.
// Two accents on warm neutrals: amber for prompts and key numbers, cyan for commands and data.
// Panels use a faint translucent amber tint (tint + fill-opacity) instead of an opaque fill, so they blend into any dark page.
import { readFileSync } from 'node:fs';

export const OUT = process.env.OUT_DIR || 'assets/generated';
export const NAVY = process.env.THEME !== 'tint'; // default: panels are the same solid colour as GitHub's dark page. THEME=tint gives the warm-tinted variant.

export const C = {
  bg: '#0d1117',      // GitHub's dark page, only used for cut-outs (moon, dots) so they match the page
  tint: '#f2b84b',    // panel fill colour; always used with fill-opacity .045
  s1: '#1d1a15',      // raised surface (chips, pills)
  s2: '#26221b',
  s3: '#30363d',      // borders and rules: GitHub's own border colour, so outlines blend in
  text: '#ece7da',    // primary text
  dim: '#b4ae9c',     // secondary text
  amber: '#f2b84b',
  cyan: '#4cc9c0',
  accent: '#4cc9c0',
};

const FONTS = {
  sans600: ['G', 600, 'geist-semibold'],
  sans400: ['G', 400, 'geist-regular'],
  mono: ['GM', 400, 'geistmono-regular'],
};
const face = ([family, weight, file]) => {
  const b64 = readFileSync(new URL(`../fonts/${file}.woff2`, import.meta.url)).toString('base64');
  return `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${b64}) format('woff2')}`;
};

// which: any of 'sans600', 'sans400', 'mono'. Small files only embed what they use.
if (NAVY) Object.assign(C, { s1: '#161b22', s2: '#1c2128', s3: '#30363d', text: '#e6edf3', dim: '#9aa4af' });

export const style = (which = ['sans600', 'sans400', 'mono']) => `
${which.map(k => face(FONTS[k])).join('')}
.g{font-family:G,system-ui,sans-serif}.m{font-family:GM,ui-monospace,Consolas,monospace}
.t{fill:${C.text}}.d{fill:${C.dim}}.a{fill:${C.cyan}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;
export const baseStyle = style();

// Panel background: an opaque base in GitHub's dark colour (so text stays readable on light themes too)
// with a faint warm tint on top. On GitHub's default dark page it blends in; on a white page it reads as a dark card.
export const panel = (w, h, rx) => NAVY
  ? `<rect width="${w}" height="${h}" rx="${rx}" fill="${C.bg}"/>`
  : `<rect width="${w}" height="${h}" rx="${rx}" fill="${C.bg}"/><rect width="${w}" height="${h}" rx="${rx}" fill="${C.tint}" fill-opacity=".045"/>`;
