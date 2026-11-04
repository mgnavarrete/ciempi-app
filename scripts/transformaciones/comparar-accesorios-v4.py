#!/usr/bin/env python3
"""Láminas antes/después V4 (mochilas y calzado): une cada captura de antes/ y despues/
lado a lado, con rótulo (JPEG derivado; las capturas originales son los PNG), en docs/rediseno-ciempi/revisiones/V4-mochilas-zapatos/comparaciones/.
Uso (desde la raíz): python3 scripts/transformaciones/comparar-accesorios-v4.py"""
import os
from PIL import Image, ImageDraw, ImageFont
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
REV = os.path.join(RAIZ, 'docs/rediseno-ciempi/revisiones/V4-mochilas-zapatos')
SAL = os.path.join(REV, 'comparaciones')
os.makedirs(SAL, exist_ok=True)
try:
    fuente = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 28)
except OSError:
    fuente = ImageFont.load_default()
for nombre in sorted(os.listdir(os.path.join(REV, 'antes'))):
    a = Image.open(os.path.join(REV, 'antes', nombre)).convert('RGB')
    d = Image.open(os.path.join(REV, 'despues', nombre)).convert('RGB')
    h = max(a.height, d.height)
    out = Image.new('RGB', (a.width + d.width + 20, h + 50), (255, 255, 255))
    out.paste(a, (0, 50)); out.paste(d, (a.width + 20, 50))
    t = ImageDraw.Draw(out)
    t.text((10, 10), 'ANTES · accesorios v1 (juego)', fill=(160, 40, 40), font=fuente)
    t.text((a.width + 30, 10), 'DESPUÉS · accesorios v4 (laboratorio)', fill=(30, 110, 60), font=fuente)
    destino = os.path.join(SAL, nombre.replace('.png', '.jpg'))
    out.save(destino, quality=86)
    print(os.path.relpath(destino, RAIZ))
