"""PNG de IA -> WebP de fondo: recorte a 16:10 (desde abajo, conserva el suelo), 1280 px, calidad 82.
Uso: python3 scripts/fondos/procesar-fondos.py <dir_png> <dir_webp> id1 [id2 ...]
Si un WebP supera 120 KB baja la calidad de a 4 (mínimo 70)."""
import os, sys
from PIL import Image

origen, destino, *ids = sys.argv[1:]
os.makedirs(destino, exist_ok=True)
for id_ in ids:
    im = Image.open(os.path.join(origen, f'{id_}.png')).convert('RGB')
    w, h = im.size
    if w / h > 1.6:  # más ancho: recorta los lados por igual
        nw = round(h * 1.6); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    elif w / h < 1.6:  # más alto: recorta arriba (el suelo queda intacto)
        nh = round(w / 1.6); im = im.crop((0, h - nh, w, h))
    im = im.resize((1280, 800), Image.LANCZOS)
    q, salida = 82, os.path.join(destino, f'{id_}.webp')
    while True:
        im.save(salida, 'WEBP', quality=q, method=6)
        kb = os.path.getsize(salida) / 1024
        if kb <= 120 or q <= 70: break
        q -= 4
    print(f'{id_}: {w}x{h} -> 1280x800 q{q} {kb:.0f} KB')
