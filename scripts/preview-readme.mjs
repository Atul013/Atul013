// Renders README.md with GitHub's own markdown API and dark styles into preview-readme.html (gitignored).
// Usage: node scripts/preview-readme.mjs   (needs gh auth)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const variant = process.argv[2]; // e.g. 'tint' renders README.md with assets/tint/ (the warm-tint variant) instead of assets/generated/
const readme = readFileSync('README.md', 'utf8').replaceAll('assets/generated/', variant ? `assets/${variant}/` : 'assets/generated/');

const html = execFileSync('gh', ['api', 'markdown', '-X', 'POST', '-F', `text=${readme}`, '-f', 'mode=gfm', '-f', 'context=Atul013/Atul013'], { encoding: 'utf8' });
const out = variant ? `preview-readme-${variant}.html` : 'preview-readme.html';
writeFileSync(out, `<!doctype html><meta charset="utf-8"><title>Atul013 profile preview</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.1/github-markdown-dark.min.css">
<style>body{background:#0d1117;margin:0;padding:32px 16px;font-family:system-ui}.wrap{max-width:900px;margin:0 auto}
.bar{color:#8b949e;font:13px system-ui;margin-bottom:8px}.box{border:1px solid #30363d;border-radius:6px;padding:32px}.markdown-body{background:#0d1117}</style>
<div class="wrap"><div class="bar">Atul013 / README.md (local preview of the redesign branch)</div><div class="box"><article class="markdown-body">${html}</article></div></div>`);
console.log(`${out} written`);
