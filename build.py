"""NEOFRAME build step 2: inline the SVG icons from src/index.html and write ./index.html.
Run via:  npm run build:site   (CSS first, then this script). `python build.py --local` writes _local.html for offline testing."""
import re, sys, pathlib
ROOT = pathlib.Path(__file__).parent
ICONS = ROOT / 'node_modules/lucide-static/icons'
GOOGLE = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n  '
          '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  '
          '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&family=Permanent+Marker&family=Space+Mono:wght@400;700&display=swap">')
html = (ROOT / 'src/index.html').read_text()
def icon(m):
    name, cls = m.group(1), m.group(2)
    svg = (ICONS / f'{name}.svg').read_text()
    inner = re.search(r'<svg[^>]*>(.*)</svg>', svg, re.S).group(1)
    inner = re.sub(r'\s*\n\s*', ' ', inner).strip()
    return (f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{inner}</svg>')
html = re.sub(r'<i-con name="([\w-]+)" class="([^"]*)"></i-con>', icon, html)
assert '<i-con' not in html
local = '--local' in sys.argv
GSAP = 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/'
PLUGINS = ['gsap', 'ScrollTrigger', 'SplitText', 'Flip', 'Draggable', 'InertiaPlugin', 'DrawSVGPlugin', 'CustomEase']
libs = [(('node_modules/gsap/dist/' if local else GSAP) + f'{n}.min.js') for n in PLUGINS]
libs += ['node_modules/lenis/dist/lenis.min.js' if local else 'https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js',
         'node_modules/canvas-confetti/dist/confetti.browser.js' if local else 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/dist/confetti.browser.js']
tags = '\n  '.join(f'<script src="{u}" defer></script>' for u in libs)
if local:
    tags = '<script>window.NF_OGL_URL = "/node_modules/ogl/src/index.js";</script>\n  ' + tags
html = html.replace('<!--LIBS-->', tags)
html = html.replace('<!--FONTS-->', '<link rel="stylesheet" href="_local/fonts-local.css">' if local else GOOGLE)
out = ROOT / ('_local.html' if local else 'index.html')
out.write_text(html)
(ROOT / 'motion.js').write_text((ROOT / 'src/motion.js').read_text())
print('wrote', out, len(html), 'bytes')
