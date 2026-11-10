#!/usr/bin/env python3
"""Hoja de contactos de los maestros IA (fila por conjunto: cabeza, traje, botas, espalda) sobre gris.
Uso: python3 docs/expansion-v10/heroes/contacto.py <salida.png> [slug ...]"""
import os, sys
from PIL import Image, ImageDraw
IA = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ia')
SLUGS = sys.argv[2:] or ['coloso', 'aracnido', 'ilusionista', 'solar', 'nocturno', 'bromista', 'esmeralda', 'sombra', 'travieso', 'garra']
W = 300
out = Image.new('RGB', (W * 4 + 110, W * len(SLUGS)), '#c8c8c8')
d = ImageDraw.Draw(out)
for r, s in enumerate(SLUGS):
    d.text((6, r * W + W // 2), s, fill='#243e5b')
    for c, p in enumerate(['cabeza', 'traje', 'botas', 'espalda']):
        f = os.path.join(IA, f'{s}-{p}.png')
        if not os.path.exists(f):
            continue
        im = Image.open(f).convert('RGBA'); im.thumbnail((W - 8, W - 8))
        bg = Image.new('RGBA', im.size, (200, 200, 200, 255)); bg.alpha_composite(im)
        out.paste(bg, (110 + c * W + (W - im.width) // 2, r * W + (W - im.height) // 2))
out.save(sys.argv[1])
