// Builds preview.html with the generated SVGs inlined and seeked to a fixed time, for deterministic screenshots.
// Usage: node scripts/preview.mjs [seconds]  (omit for live playback)
import { readFileSync, writeFileSync } from 'node:fs';

const t = process.argv[2] === undefined ? null : Number(process.argv[2]); // omit for live playback
const files = ['banner', 'tide'];
const body = files.map(f => readFileSync(`assets/generated/${f}.svg`, 'utf8').replace('<svg ', '<svg style="width:900px;height:auto" ')).join('\n');
writeFileSync('preview.html', `<!doctype html><meta charset="utf-8"><title>preview</title>
<body style="background:#0d1117;margin:0;padding:24px;display:flex;flex-direction:column;gap:20px;align-items:center">
${body}
${t === null ? '' : `<script>
addEventListener('load', () => {
  document.querySelectorAll('svg').forEach(s => { s.pauseAnimations(); s.setCurrentTime(${t}); });
  document.getAnimations().forEach(a => { try { a.finish(); } catch {} });
});
</script>`}</body>`);
console.log('preview.html written');
