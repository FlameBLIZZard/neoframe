"""NEOFRAME build step 2: inline the SVG icons from src/index.html and write ./index.html.
Run via:  npm run build   (CSS first, then this script)"""
import re, sys, pathlib
ROOT = pathlib.Path(__file__).parent
ICONS = ROOT / 'node_modules/lucide-static/icons'
GOOGLE = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n  '
          '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  '
          '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&family=Permanent+Marker&family=Space+Mono:wght@400;700&display=swap">')
LOCAL = '<link rel="stylesheet" href="fonts-local.css">'
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
html = html.replace('<!--FONTS-->', LOCAL if '--local-fonts' in sys.argv else GOOGLE)
out = ROOT / ('render/index.html' if '--local-fonts' in sys.argv else 'index.html')
out.parent.mkdir(exist_ok=True); out.write_text(html)
print('wrote', out, len(html), 'bytes')
