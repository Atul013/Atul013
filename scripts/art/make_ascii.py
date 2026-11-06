"""One-off: convert a portrait to coloured text art for the banner (scripts/art/portrait.json).
Each character keeps the photo's own colour (quantised to a small palette so the SVG stays small).
Usage: python scripts/art/make_ascii.py [cols=110] [source] [l,t,r,b crop fractions] [boost=1.15]"""
import json
import sys

from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps

cols = int(sys.argv[1]) if len(sys.argv) > 1 else 110
src = sys.argv[2] if len(sys.argv) > 2 else 'scripts/art/me.jpg'
l, t, r, b = map(float, (sys.argv[3] if len(sys.argv) > 3 else '.15,.08,.93,.68').split(','))
boost = float(sys.argv[4]) if len(sys.argv) > 4 else 1.15

img = Image.open(src).convert('RGB')
w, h = img.size
img = img.crop((int(w * l), int(h * t), int(w * r), int(h * b)))
rows = round(cols * (img.height / img.width) * 0.52)  # monospace cells are about twice as tall as wide
img = img.resize((cols, rows), Image.LANCZOS)
img = ImageEnhance.Contrast(img).enhance(1.25)
gray = img.convert('L')
# local contrast: subtract a heavy blur so the face separates from the bright backdrop
local = ImageChops.add(ImageChops.subtract(gray, gray.filter(ImageFilter.GaussianBlur(cols / 9)), 1, 0), Image.new('L', gray.size, 118))
lum = ImageOps.autocontrast(Image.blend(gray, ImageOps.equalize(local), 0.7), cutoff=1)

# photo colours, brightened so they read on a dark background, then quantised
bright = ImageEnhance.Brightness(img).enhance(boost)
pal_img = bright.quantize(colors=20, method=Image.Quantize.MEDIANCUT)
pal = pal_img.getpalette()[:60]
palette = ['#%02x%02x%02x' % tuple(pal[i * 3:i * 3 + 3]) for i in range(20)]

ramp = ' .:-=+*#%@'  # sparse to dense; dark areas stay empty so they melt into the page
out = []
for y in range(rows):
    runs = []
    for x in range(cols):
        v = (lum.getpixel((x, y)) / 255) ** 1.35
        ch = ramp[min(int(v * len(ramp)), len(ramp) - 1)]
        ci = pal_img.getpixel((x, y))
        if ch == ' ' and runs:
            ci = runs[-1][1]  # spaces borrow the previous colour so runs merge
        if runs and runs[-1][1] == ci:
            runs[-1][0] += ch
        else:
            runs.append([ch, ci])
    out.append(runs)
json.dump({'palette': palette, 'rows': out}, open('scripts/art/portrait.json', 'w'))
print(f'{cols}x{rows}, {sum(len(r) for r in out)} runs')
