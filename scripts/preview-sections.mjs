// Builds preview-top.html and preview-bottom.html with SVGs inlined and seeked to a late frame, for review screenshots.
// Usage: node scripts/preview-sections.mjs [seconds=20]
import { readFileSync, writeFileSync } from 'node:fs';

const t = Number(process.argv[2] ?? 20);
const svg = (f, style = 'width:100%;height:auto') => readFileSync(`assets/generated/${f}.svg`, 'utf8').replace('<svg ', `<svg style="${style}" `);
const page = body => `<!doctype html><meta charset="utf-8"><body style="background:#0d1117;margin:0;padding:24px;display:flex;justify-content:center">
<div style="width:900px;display:flex;flex-direction:column;gap:16px;align-items:center">${body}</div>
<script>addEventListener('load',()=>{document.querySelectorAll('svg').forEach(s=>{s.pauseAnimations();s.setCurrentTime(${t})});document.getAnimations().forEach(a=>{try{a.pause();a.currentTime=${t}*1000}catch{}})})</script></body>`;
const half = f => `<div style="width:49%">${svg(f)}</div>`;
const pill = f => svg(f, 'height:44px;width:auto');
writeFileSync('preview-top.html', page(`${svg('banner')}<p style="color:#c9d1d9;font:16px system-ui;text-align:center;margin:4px 0">B.Tech CSE (AI) at ASIET, Kerala, class of 2027. I build AI systems, with a focus on adversarial ML and LLM security.</p>${svg('tide')}`));
writeFileSync('preview-bottom.html', page(`<div style="display:flex;flex-wrap:wrap;justify-content:space-between;row-gap:12px;width:100%">${[1, 2, 3, 4].map(i => half(`proj-${i}`)).join('')}</div>${svg('now')}<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">${[1, 2, 3, 4, 5, 6].map(i => pill(`contact-${i}`)).join('')}</div>`));
console.log('preview-top.html, preview-bottom.html written');
