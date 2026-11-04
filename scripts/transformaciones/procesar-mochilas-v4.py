#!/usr/bin/env python3
"""Recorta y normaliza las mochilas V4 sin correas (maestros IA en
docs/rediseno-ciempi/revisiones/V4-mochilas-zapatos/ia/) para el laboratorio:
alfa limpio (sin manchas sueltas), recorte al objeto con margen, 768 px de ancho, WebP sin pérdida.
Escribe docs/rediseno-ciempi/laboratorio-transformaciones/recursos/accesorios-v4/ y medidas.json.
Uso (desde la raíz): python3 scripts/transformaciones/procesar-mochilas-v4.py"""
import hashlib, json, os
import numpy as np
from PIL import Image
from scipy import ndimage
RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
IA = os.path.join(RAIZ, 'docs/rediseno-ciempi/revisiones/V4-mochilas-zapatos/ia')
SAL = os.path.join(RAIZ, 'docs/rediseno-ciempi/laboratorio-transformaciones/recursos/accesorios-v4')
medidas = {}
for k in ['aventura', 'draco', 'mago', 'raton', 'robot']:
    f = os.path.join(IA, f'mochila-{k}-sin-correas.png')
    a = np.array(Image.open(f).convert('RGBA'))
    solido = a[..., 3] > 128
    et, n = ndimage.label(solido)
    tam = ndimage.sum(solido, et, range(1, n + 1))
    grande = np.isin(et, [i + 1 for i, t in enumerate(tam) if t >= 0.002 * solido.size])
    zona = ndimage.binary_dilation(grande, iterations=3)
    a[..., 3] = np.where(zona, a[..., 3], 0)
    ys, xs = np.nonzero(a[..., 3] > 8)
    m = 6
    caja = (max(0, xs.min() - m), max(0, ys.min() - m), min(a.shape[1], xs.max() + 1 + m), min(a.shape[0], ys.max() + 1 + m))
    im = Image.fromarray(a).crop(caja)
    ancho = 768
    im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    salida = os.path.join(SAL, f'mochila-{k}.webp')
    im.save(salida, 'WEBP', lossless=True)
    al = np.array(im)[..., 3] > 128
    filas = np.nonzero(al.any(axis=1))[0]
    abajo = filas.max()
    cols = np.nonzero(al[abajo - 25:abajo + 1].any(axis=0))[0]
    medidas[k] = {'archivo': f'mochila-{k}.webp', 'px': [im.width, im.height], 'baseInferior': [int((cols.min() + cols.max()) / 2), int(abajo)],
                  'fuente': os.path.relpath(f, RAIZ), 'fuenteSha256': hashlib.sha256(open(f, 'rb').read()).hexdigest()[:16], 'recorte': [int(c) for c in caja]}
    print(k, medidas[k])
json.dump(medidas, open(os.path.join(SAL, 'medidas.json'), 'w'), indent=1, ensure_ascii=False)
