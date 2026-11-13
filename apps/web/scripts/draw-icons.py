"""Draws the app's icons: the desktop's pixel shirt on the theme's yellow plaid.

Run from apps/web with Pillow installed (`python scripts/draw-icons.py`). The PNGs it
writes are committed, so a build never runs this. pixelarticons are rectangles only, so
the shirt is drawn from its SVG's paths without an SVG renderer.
"""
import re
from pathlib import Path

from PIL import Image, ImageDraw

WEB = Path(__file__).resolve().parent.parent
SHIRT = WEB / 'node_modules' / 'pixelarticons' / 'svg' / 'shirt.svg'
OUT = WEB / 'public'

PLAID = (247, 215, 49)
LINE = (0, 0, 0, 56)
THREAD = (255, 255, 255, 115)
INK = (40, 18, 48)
FILL = (236, 95, 164)


def rectangles(svg: str):
    """Every rectangle in pixelarticons' paths: `M x y h w v h H x z`, absolute or relative."""
    rects = []
    for d in re.findall(r'd="([^"]+)"', svg):
        x = y = 0.0
        start = (0.0, 0.0)
        for command, numbers in re.findall(r'([MmHhVvz])([^MmHhVvz]*)', d):
            values = [float(n) for n in re.findall(r'-?\d+(?:\.\d+)?', numbers)]
            if command == 'M':
                x, y = values[0], values[1]
                start = (x, y)
                corner = (x, y)
            elif command == 'm':
                x, y = start[0] + values[0], start[1] + values[1]
                start = (x, y)
                corner = (x, y)
            elif command == 'h':
                x += values[0]
            elif command == 'H':
                x = values[0]
            elif command == 'v':
                y += values[0]
            elif command == 'V':
                y = values[0]
            elif command == 'z':
                # The far corner is the furthest point the path reached from its start.
                pass
            if command in 'hHvV':
                far = (x, y)
                if command in 'vV':
                    rects.append((min(corner[0], far[0]), min(corner[1], far[1]),
                                  max(corner[0], far[0]), max(corner[1], far[1])))
        x, y = start
    return rects


def plaid(size: int) -> Image.Image:
    image = Image.new('RGBA', (size, size), PLAID + (255,))
    overlay = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    band = max(2, size // 12)
    for offset in range(0, size, size // 4):
        draw.rectangle([offset, 0, offset + band, size], fill=LINE)
        draw.rectangle([0, offset, size, offset + band], fill=LINE)
        thin = max(1, size // 96)
        draw.rectangle([offset + band * 2, 0, offset + band * 2 + thin, size], fill=THREAD)
        draw.rectangle([0, offset + band * 2, size, offset + band * 2 + thin], fill=THREAD)
    return Image.alpha_composite(image, overlay)


def icon(size: int, shirt_share: float) -> Image.Image:
    """The plaid, with the shirt centred and taking `shirt_share` of the side."""
    image = plaid(size)
    draw = ImageDraw.Draw(image)
    cell = size * shirt_share / 24
    left = (size - cell * 24) / 2
    top = (size - cell * 24) / 2
    # The shirt's inside, filled so that it reads on the plaid: the shoulders between the
    # sleeves, and the body below them. Then its pixel outline over it.
    def cells(x0, y0, x1, y1, colour):
        draw.rectangle([left + x0 * cell, top + y0 * cell, left + x1 * cell - 1, top + y1 * cell - 1],
                       fill=colour)

    cells(4, 5, 20, 9, FILL)
    cells(8, 9, 16, 19, FILL)
    for x0, y0, x1, y1 in rectangles(SHIRT.read_text(encoding='utf-8')):
        cells(x0, y0, x1, y1, INK)
    return image


def main() -> None:
    (OUT / 'icons').mkdir(parents=True, exist_ok=True)
    icon(192, 0.8).save(OUT / 'icons' / 'icon-192.png')
    icon(512, 0.8).save(OUT / 'icons' / 'icon-512.png')
    # Maskable: everything that matters inside the central 80% circle a launcher may cut to.
    icon(512, 0.56).save(OUT / 'icons' / 'icon-maskable-512.png')
    icon(180, 0.72).convert('RGB').save(OUT / 'icons' / 'apple-touch-icon-180.png')
    icon(64, 0.9).save(OUT / 'favicon.png')
    print('icons written to', OUT)


if __name__ == '__main__':
    main()
