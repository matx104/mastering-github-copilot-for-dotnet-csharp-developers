#!/usr/bin/env python3
"""Fold a petal into ONE self-contained HTML file (offline.html).

The promise, enacted: a student with no internet keeps the library.
Inline the stylesheet, the module script, and the course JSON into a
single file that opens from a USB stick, a phone, a printed QR code.

    python3 tools/make-offline.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'offline.html'


def main():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')

    css = (ROOT / 'css' / 'styles.css').read_text(encoding='utf-8')
    html = re.sub(
        r'<link rel="stylesheet" href="css/styles\.css[^"]*">',
        '<style>\n' + css.replace('\\', '\\\\') + '\n</style>',
        html, count=1)

    course = json.loads((ROOT / 'content' / 'course.json').read_text(encoding='utf-8'))
    payload = json.dumps(course, ensure_ascii=False).replace('</', '<\\/')

    js = (ROOT / 'js' / 'app.js').read_text(encoding='utf-8')
    inline = ('<script>window.__COURSE__ = ' + payload + ';</script>\n'
              '<script type="module">\n' + js + '\n</script>')
    html = re.sub(
        r'<script type="module" src="js/app\.js[^"]*"></script>',
        inline, html, count=1)

    banner = ('<p style="text-align:center;margin:0;padding:.6rem 1rem;'
              'border-bottom:1px solid rgba(45,106,79,.35);font:600 .78rem/1.4 ui-monospace,monospace;'
              'letter-spacing:.1em;text-transform:uppercase;color:#9CB0A8;">'
              'Offline edition · saved from the living library · '
              'the online copy always knows more</p>')
    html = html.replace('<body>', '<body>\n' + banner, 1)

    OUT.write_text(html, encoding='utf-8')
    print(f'✓ {OUT.name} — {OUT.stat().st_size // 1024} KB, one file, whole course')


if __name__ == '__main__':
    main()
