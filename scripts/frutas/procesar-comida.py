#!/usr/bin/env python3
"""Recorta la hoja IA de 10 comidas (5x2) y exporta un WebP con alfa por comida.

Uso: python3 scripts/frutas/procesar-comida.py <hoja.png> <salida_dir> [id=hoja_alternativa.png:celda ...]

- Fondo: usa el alfa de la hoja si es real; si no, inunda desde los bordes el
  color plano del fondo (se detiene en el contorno azul oscuro) y erosiona 1 px
  para no dejar halo claro.
- Cada comida: componente(s) dentro de su celda de la cuadrícula, recorte al
  contenido, escala uniforme para que su lado mayor ocupe CONTENIDO px de un
  lienzo LADO x LADO, centrada (margen uniforme).
- Reemplazos: `comida-pelota=otra.png:0` toma la comida de la celda 0 de otra
  hoja (regeneraciones individuales, una comida por imagen -> celda 0).
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

IDS = ['comida-manzana', 'comida-frutilla', 'comida-platano', 'comida-sandia', 'comida-galleta',
       'comida-pelota', 'comida-dona', 'comida-cupcake', 'comida-pizza', 'comida-helado']
LADO = 192
CONTENIDO = 172  # + contorno exterior de 2 px por lado = 176: margen uniforme de 8 px
GROSOR = 2  # contorno exterior extra (la IA lo dibuja fino; a 24-40 px se pierde)


def alfa_de(im: Image.Image) -> np.ndarray:
    a = np.asarray(im.getchannel('A'), dtype=np.uint8)
    if (a < 250).mean() > 0.2:  # alfa real
        return a
    rgb = np.asarray(im.convert('RGB'), dtype=np.int16)
    h, w, _ = rgb.shape
    bordes = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    fondo = np.median(bordes, axis=0)
    cerca = np.abs(rgb - fondo).sum(axis=2) < 60
    vis = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if cerca[y, x] and not vis[y, x]:
                vis[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if cerca[y, x] and not vis[y, x]:
                vis[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and cerca[ny, nx] and not vis[ny, nx]:
                vis[ny, nx] = True; q.append((ny, nx))
    m = Image.fromarray(np.where(vis, 0, 255).astype(np.uint8))
    m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
    return np.asarray(m)


def celdas(im: Image.Image, filas: int, cols: int):
    a = alfa_de(im)
    rgba = np.asarray(im.convert('RGBA')).copy()
    rgba[..., 3] = np.minimum(rgba[..., 3], a)
    h, w = a.shape
    for i in range(filas * cols):
        f, c = divmod(i, cols)
        y0, y1, x0, x1 = f * h // filas, (f + 1) * h // filas, c * w // cols, (c + 1) * w // cols
        sub = rgba[y0:y1, x0:x1].copy()
        sub[sub[..., 3] < 8, 3] = 0
        yield sub


NAVY = np.array([36, 62, 91], float)


def contorno_navy(sub: np.ndarray) -> np.ndarray:
    """La IA dibuja el contorno casi negro (#0f1b2c): lo lleva al azul de Ciempi #243e5b."""
    rgb = sub[..., :3].astype(float)
    v = rgb.max(axis=2)
    w = np.clip((110 - v) / 60, 0, 1)[..., None]
    sub = sub.copy()
    sub[..., :3] = np.round(rgb * (1 - w) + NAVY * w).astype(np.uint8)
    return sub


def exportar(sub: np.ndarray, destino: Path):
    sub = contorno_navy(sub)
    ys, xs = np.nonzero(sub[..., 3] > 8)
    sub = sub[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    # Píxeles totalmente transparentes en negro-azul: sin halo blanco al escalar.
    sub[sub[..., 3] == 0, :3] = (36, 62, 91)
    im = Image.fromarray(sub, 'RGBA')
    k = CONTENIDO / max(im.size)
    # Escalar en alfa premultiplicado para que el borde no tome el color del fondo.
    pm = im.convert('RGBa').resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS).convert('RGBA')
    lienzo = Image.new('RGBA', (LADO, LADO), (36, 62, 91, 0))
    lienzo.alpha_composite(pm, ((LADO - pm.width) // 2, (LADO - pm.height) // 2))
    # Engrosar el contorno: silueta dilatada en azul Ciempi detrás del dibujo.
    sil = lienzo.getchannel('A').point(lambda v: 255 if v > 100 else 0).filter(ImageFilter.MaxFilter(2 * GROSOR + 1)).filter(ImageFilter.GaussianBlur(0.8))
    fondo = Image.new('RGBA', (LADO, LADO), (36, 62, 91, 255))
    fondo.putalpha(sil)
    fondo.alpha_composite(lienzo)
    lienzo = fondo
    destino.parent.mkdir(parents=True, exist_ok=True)
    lienzo.save(destino, 'WEBP', quality=82, alpha_quality=90, method=6)
    return destino.stat().st_size


def main():
    hoja, salida = Path(sys.argv[1]), Path(sys.argv[2])
    reemplazos = {}
    for arg in sys.argv[3:]:
        id_, resto = arg.split('=')
        ruta, celda = resto.rsplit(':', 1)
        reemplazos[id_] = (Path(ruta), int(celda))
    subs = list(celdas(Image.open(hoja).convert('RGBA'), 2, 5))
    for i, id_ in enumerate(IDS):
        if id_ in reemplazos:
            ruta, celda = reemplazos[id_]
            sub = list(celdas(Image.open(ruta).convert('RGBA'), 1, 1))[celda]
        else:
            sub = subs[i]
        print(f'{id_}: {exportar(sub, salida / f"{id_}.webp")} B')


if __name__ == '__main__':
    main()
