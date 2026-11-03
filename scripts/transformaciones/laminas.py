#!/usr/bin/env python3
"""Láminas de revisión de las transformaciones (T01/T02): conceptos y siluetas.

Uso:
  python3 scripts/transformaciones/laminas.py conceptos <salida.png> <img1.png> [img2.png ...]
  python3 scripts/transformaciones/laminas.py siluetas  <salida.png> <img1.png> [img2.png ...]

Solo lee los PNG originales de IA; escribe únicamente la lámina pedida.
"""
import sys
from PIL import Image, ImageDraw, ImageFont

FONDO_CLARO = (253, 248, 238, 255)
FONDO_OSCURO = (36, 46, 64, 255)


def fuente(tam):
    for f in ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/dejavu/DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(f, tam)
        except OSError:
            pass
    return ImageFont.load_default()


def recortar(im, umbral=24):
    """Recorta al contenido visible (alfa > umbral) para comparar a igual altura."""
    a = im.getchannel('A').point(lambda v: 255 if v > umbral else 0)
    caja = a.getbbox()
    return im.crop(caja) if caja else im


def nombre(ruta):
    return ruta.rsplit('/', 1)[-1].rsplit('.', 1)[0]


def conceptos(salida, rutas, alto=420):
    ims = [recortar(Image.open(r).convert('RGBA')) for r in rutas]
    ims = [im.resize((round(im.width * alto / im.height), alto), Image.LANCZOS) for im in ims]
    ancho = max(im.width for im in ims) + 40
    hoja = Image.new('RGBA', (ancho * 2, (alto + 60) * len(ims)), FONDO_CLARO)
    d = ImageDraw.Draw(hoja)
    f = fuente(22)
    for i, (im, r) in enumerate(zip(ims, rutas)):
        y = i * (alto + 60)
        d.rectangle([ancho, y, ancho * 2, y + alto + 60], fill=FONDO_OSCURO)
        hoja.alpha_composite(im, (20, y + 40))
        hoja.alpha_composite(im, (ancho + 20, y + 40))
        d.text((20, y + 8), nombre(r) + ' · fondo claro', fill=(36, 62, 91), font=f)
        d.text((ancho + 20, y + 8), nombre(r) + ' · fondo oscuro', fill=(240, 240, 240), font=f)
    hoja.convert('RGB').save(salida)


def silueta(im):
    a = im.getchannel('A').point(lambda v: 255 if v > 96 else 0)
    negro = Image.new('RGBA', im.size, (0, 0, 0, 255))
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    out.paste(negro, (0, 0), a)
    return out


def siluetas(salida, rutas):
    """Silueta negra de cada propuesta a 84 px de alto (pista de lectura) y 320 px de ancho."""
    filas = []
    for r in rutas:
        s = silueta(recortar(Image.open(r).convert('RGBA')))
        p84 = s.resize((max(1, round(s.width * 84 / s.height)), 84), Image.LANCZOS)
        p320 = s.resize((320, max(1, round(s.height * 320 / s.width))), Image.LANCZOS)
        filas.append((nombre(r), p84, p320))
    alto_fila = max(max(p84.height, p320.height) for _, p84, p320 in filas) + 50
    ancho = 40 + max(p84.width for _, p84, _ in filas) + 60 + 320 + 40
    hoja = Image.new('RGBA', (ancho, alto_fila * len(filas)), (255, 255, 255, 255))
    d = ImageDraw.Draw(hoja)
    f = fuente(18)
    for i, (n, p84, p320) in enumerate(filas):
        y = i * alto_fila
        d.text((20, y + 6), f'{n} · 84 px alto | 320 px ancho', fill=(36, 62, 91), font=f)
        hoja.alpha_composite(p84, (40, y + 34 + (alto_fila - 50 - p84.height)))
        hoja.alpha_composite(p320, (ancho - 360, y + 34))
    hoja.convert('RGB').save(salida)


def alfa(salida, rutas):
    """Quita el fondo crema y la sombra gris de una presentación de la base (solo para comparar siluetas)."""
    from collections import deque
    im = Image.open(rutas[0]).convert('RGBA')
    px = im.load()
    W, H = im.size

    def fondo(x, y):
        r, g, b, _ = px[x, y]
        return (r > 235 and g > 235 and b > 225) or (abs(r - g) < 8 and abs(g - b) < 8 and r > 200)
    # Relleno desde los bordes: el blanco de los ojos (encerrado por el contorno) se conserva.
    visto = bytearray(W * H)
    cola = deque((x, y) for x in range(W) for y in (0, H - 1))
    cola.extend((x, y) for y in range(H) for x in (0, W - 1))
    while cola:
        x, y = cola.popleft()
        i = y * W + x
        if visto[i] or not fondo(x, y):
            continue
        visto[i] = 1
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < W and 0 <= ny < H and not visto[ny * W + nx]:
                cola.append((nx, ny))
    im.save(salida)


if __name__ == '__main__':
    modo, salida, *rutas = sys.argv[1:]
    {'conceptos': conceptos, 'siluetas': siluetas, 'alfa': alfa}[modo](salida, rutas)
    print('lámina', salida)
