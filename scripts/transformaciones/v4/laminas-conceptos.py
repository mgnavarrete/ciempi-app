#!/usr/bin/env python3
"""Láminas de conceptos IA V4 (T03 Serpiente, T04 Camaleón): conceptos en grande sobre fondo
claro y siluetas a 84 px de alto (tamaño de pista). Solo lee ia/concepto-*.png.
Uso (desde la raíz): python3 scripts/transformaciones/v4/laminas-conceptos.py"""
import glob, os
from PIL import Image, ImageDraw
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
FONDO = (253, 248, 238, 255)
for rev in ['T03-serpiente-v1', 'T04-camaleon-v1']:
    archivos = sorted(glob.glob(os.path.join(RAIZ, 'docs/rediseno-ciempi/revisiones', rev, 'ia', 'concepto-*.png')))
    ims = []
    for f in archivos:
        im = Image.open(f).convert('RGBA'); im = im.crop(im.getbbox())
        ims.append((os.path.basename(f)[9:-4], im))
    # Lámina grande: 2 columnas, 640 px de ancho por concepto.
    W, H = 660, 0
    filas = []
    for nombre, im in ims:
        k = 620 / im.width; filas.append((nombre, im.resize((620, round(im.height * k)), Image.LANCZOS)))
    alto = max(p.height for _, p in filas) + 50
    hoja = Image.new('RGBA', (2 * W + 20, alto * ((len(filas) + 1) // 2) + 20), FONDO)
    d = ImageDraw.Draw(hoja)
    for i, (nombre, p) in enumerate(filas):
        x, y = 20 + (i % 2) * W, 20 + (i // 2) * alto
        d.text((x, y), nombre, fill=(36, 62, 91)); hoja.alpha_composite(p, (x, y + 20))
    dest = os.path.join(RAIZ, 'docs/rediseno-ciempi/revisiones', rev, 'conceptos'); os.makedirs(dest, exist_ok=True)
    hoja.convert('RGB').save(os.path.join(dest, 'lamina-conceptos.png'))
    # Siluetas y color a 84 px de alto.
    tiras = []
    for nombre, im in ims:
        k = 84 / im.height; p = im.resize((round(im.width * k), 84), Image.LANCZOS)
        negro = Image.new('RGBA', p.size, (20, 20, 30, 255)); negro.putalpha(p.getchannel('A'))
        tiras.append((nombre, p, negro))
    hoja = Image.new('RGBA', (sum(p.width + 30 for _, p, _ in tiras) + 30, 260), FONDO)
    d = ImageDraw.Draw(hoja); x = 30
    for nombre, p, n in tiras:
        d.text((x, 10), nombre, fill=(36, 62, 91)); hoja.alpha_composite(p, (x, 35)); hoja.alpha_composite(n, (x, 150)); x += p.width + 30
    hoja.convert('RGB').save(os.path.join(dest, 'siluetas-84px.png'))
    print(rev, len(ims))
