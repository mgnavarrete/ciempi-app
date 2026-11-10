#!/usr/bin/env python3
"""Capitán Ciempi (2.8.3; ids «cometa» de 2.8.2 conservados): procesa los maestros IA de docs/expansion-v9/capitan-cometa/ia/
al formato de cada categoría, igual que las piezas Robot:

- B07 antifaz → laboratorio/recursos/mascaras/v2/antifaz-cometa.png (1024 px de ancho, como
  revisiones/B06-B07-B08-ia-v2/preparar.mjs) y encuadre calculado alineando las dos aberturas
  con los ojos de la base (708,342) y (808,320).
- B11 traje   → laboratorio/recursos/superficies/v1/cometa.png (atlas 3×2, 1536 px).
- B10 botas   → laboratorio/recursos/calzado/v1/cometa.png (recorte al objeto ±3 px, 512 px).
- B09 escudo  → laboratorio/recursos/mochilas/v1/cometa.png (recorte ±3 px, 768 px) ; el maestro ya viene
  sin correas (como las mochilas v4.2) → laboratorio-transformaciones/recursos/accesorios-v4/mochila-cometa.webp (768 px,
  como procesar-mochilas-v4.py) + public/ciempi-v2/mochilas-v4/mochila-cometa.webp (384 px).
Agrega las entradas a los catalogo.json del laboratorio (mismo formato que preparar.mjs de
B09-B12) y escribe medidas.json con los datos para mochilas-v4.js. No toca otras piezas.
Uso (desde la raíz): python3 docs/expansion-v9/capitan-cometa/procesar.py
"""
import hashlib, json, math, os
import numpy as np
from PIL import Image
from scipy import ndimage

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
IA = os.path.join(RAIZ, 'docs/expansion-v9/capitan-cometa/ia')
LAB = os.path.join(RAIZ, 'docs/rediseno-ciempi/laboratorio')
V4 = os.path.join(RAIZ, 'docs/rediseno-ciempi/laboratorio-transformaciones/recursos/accesorios-v4')
PUB = os.path.join(RAIZ, 'public/ciempi-v2/mochilas-v4')
FUENTE = '../../expansion-v9/capitan-cometa/ia/'
ESTADO = 'En revisión artística — Pendiente de aprobación del usuario'
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
medidas = {}


def recorte(im, margen_izq=3, margen_der=4):
    a = np.array(im.convert('RGBA'))[..., 3]
    ys, xs = np.nonzero(a > 1)
    x0, y0 = max(0, xs.min() - margen_izq), max(0, ys.min() - margen_izq)
    x1, y1 = min(a.shape[1], xs.max() + margen_der), min(a.shape[0], ys.max() + margen_der)
    return {'left': int(x0), 'top': int(y0), 'width': int(x1 - x0), 'height': int(y1 - y0)}


def agregar(catalogo, item):
    lista = json.load(open(catalogo))
    lista = [x for x in lista if x['id'] != item['id']] + [item]
    json.dump(lista, open(catalogo, 'w'), indent=2, ensure_ascii=False)
    open(catalogo, 'a').write('\n')


def base_b09_b12(fam, slug, nombre, fuente, anterior, crop, dims, batch):
    return {'id': f'{batch.lower()}-{slug}', 'nombre': nombre, 'batch': batch, 'version': '1',
            'tipo': 'atlas-raster-ia' if fam == 'superficies' else 'raster-ia', 'estado': ESTADO,
            'aprobadoParaLaboratorio': False, 'aprobadoParaProduccion': False,
            'archivo': f'./recursos/{fam}/v1/{slug}.png', 'fuente': FUENTE + fuente + '.png',
            'fuenteSha256': sha(os.path.join(IA, fuente + '.png')), 'recorte': crop, 'dimensiones': dims,
            'anterior': anterior, 'novedad': True, 'svg': True, 'collections': ['ciempi-original', slug]}


# ── B07 antifaz ──
src = os.path.join(IA, 'capitan-antifaz.png')
raw = Image.open(src).convert('RGBA')
W, H = raw.size
out = raw.resize((1024, round(H * 1024 / W)), Image.LANCZOS) if W > 1024 else raw
out.save(os.path.join(LAB, 'recursos/mascaras/v2/antifaz-cometa.png'), optimize=True)
# Aberturas: zonas transparentes que no tocan el borde (en px del maestro).
alfa = np.array(raw)[..., 3] < 40
et, n = ndimage.label(alfa)
borde = set(np.unique(np.concatenate([et[0], et[-1], et[:, 0], et[:, -1]])))
huecos = [(int(ndimage.sum(alfa, et, i)), i) for i in range(1, n + 1) if i not in borde]
huecos = sorted(huecos, reverse=True)[:2]
cs = []
for _, i in huecos:
    ys, xs = np.nonzero(et == i)
    cs.append((xs.mean(), ys.mean(), xs.max() - xs.min(), ys.max() - ys.min()))
cs.sort()  # izquierda primero
(hx1, hy1, hw1, hh1), (hx2, hy2, hw2, hh2) = cs
ojo1, ojo2 = (708, 342), (808, 320)
s = math.dist(ojo1, ojo2) / math.dist((hx1, hy1), (hx2, hy2))
giro = math.degrees(math.atan2(ojo2[1] - ojo1[1], ojo2[0] - ojo1[0]) - math.atan2(hy2 - hy1, hx2 - hx1))
cx, cy = (ojo1[0] + ojo2[0]) / 2, (ojo1[1] + ojo2[1]) / 2
mx, my = (hx1 + hx2) / 2, (hy1 + hy2) / 2
x, y = cx - mx * s, cy - my * s
print('antifaz: aberturas (u. base)', [round(v * s, 1) for v in (hw1, hh1, hw2, hh2)], 'escala', round(s, 4), 'giro', round(giro, 2))
agregar(os.path.join(LAB, 'recursos/mascaras/v2/catalogo.json'), {
    'id': 'b07-ia-cometa', 'nombre': 'Antifaz Capitán Ciempi', 'batch': 'B07', 'version': '2', 'estado': ESTADO,
    'aprobadoParaLaboratorio': False, 'aprobadoParaProduccion': False, 'tipo': 'raster-ia',
    'archivo': './recursos/mascaras/v2/antifaz-cometa.png', 'fuente': FUENTE + 'capitan-antifaz.png', 'fuenteSha256': sha(src),
    'dimensionesMaestro': [W, H], 'encuadre': [round(x, 2), round(y, 2), round(W * s, 2), round(H * s, 2)], 'splitY': None,
    'rotation': round(giro, 2), 'centroRotacion': [cx, cy], 'anterior': 'b07-cometa', 'novedad': True,
    'collections': ['ciempi-original', 'cometa'], 'antenna': True, 'svg': True, 'compatiblePelo': False,
    'mask': True, 'fullFace': False, 'ocultaRostro': False})

# ── B11 traje (atlas) ──
src = os.path.join(IA, 'capitan-traje.png')
im = Image.open(src).convert('RGB')
crop = {'left': 0, 'top': 0, 'width': im.width, 'height': im.height}
im = im.resize((1536, round(im.height * 1536 / im.width)), Image.LANCZOS) if im.width > 1536 else im
im.save(os.path.join(LAB, 'recursos/superficies/v1/cometa.png'), optimize=True)
it = base_b09_b12('superficies', 'cometa', 'Traje Capitán Ciempi', 'capitan-traje', 'cometa', crop, list(im.size), 'B11')
it.update({'paneles': [0, 1, 2, 3, 4], 'coloresFijos': True})
agregar(os.path.join(LAB, 'recursos/superficies/v1/catalogo.json'), it)

# ── B10 botas ──
src = os.path.join(IA, 'capitan-botas.png')
im = Image.open(src).convert('RGBA')
crop = recorte(im)
im = im.crop((crop['left'], crop['top'], crop['left'] + crop['width'], crop['top'] + crop['height']))
im = im.resize((512, round(im.height * 512 / im.width)), Image.LANCZOS)
im.save(os.path.join(LAB, 'recursos/calzado/v1/cometa.png'), optimize=True)
it = base_b09_b12('calzado', 'cometa', 'Botas Capitán Ciempi', 'capitan-botas', 'pies-cometa', crop, list(im.size), 'B10')
it.update({'ancho': 88, 'x': -43, 'suelo': 24})
agregar(os.path.join(LAB, 'recursos/calzado/v1/catalogo.json'), it)
medidas['botas'] = {'px': list(im.size)}

# ── B09 escudo ──
src = os.path.join(IA, 'capitan-escudo.png')
im = Image.open(src).convert('RGBA')
crop = recorte(im)
im = im.crop((crop['left'], crop['top'], crop['left'] + crop['width'], crop['top'] + crop['height']))
im = im.resize((768, round(im.height * 768 / im.width)), Image.LANCZOS) if im.width > 768 else im
im.save(os.path.join(LAB, 'recursos/mochilas/v1/cometa.png'), optimize=True)
it = base_b09_b12('mochilas', 'cometa', 'Escudo Capitán Ciempi', 'capitan-escudo', 'espalda-cometa', crop, list(im.size), 'B09')
it['encuadre'] = [370, 250, 205, 205 * im.height / im.width]
agregar(os.path.join(LAB, 'recursos/mochilas/v1/catalogo.json'), it)

# Versión v4.2 sin correas (mismo procedimiento que procesar-mochilas-v4.py).
f = os.path.join(IA, 'capitan-escudo.png')
a = np.array(Image.open(f).convert('RGBA'))
solido = a[..., 3] > 128
et, n = ndimage.label(solido)
tam = ndimage.sum(solido, et, range(1, n + 1))
grande = np.isin(et, [i + 1 for i, t in enumerate(tam) if t >= 0.002 * solido.size])
a[..., 3] = np.where(ndimage.binary_dilation(grande, iterations=3), a[..., 3], 0)
ys, xs = np.nonzero(a[..., 3] > 8)
m = 6
caja = (max(0, xs.min() - m), max(0, ys.min() - m), min(a.shape[1], xs.max() + 1 + m), min(a.shape[0], ys.max() + 1 + m))
im = Image.fromarray(a).crop(caja)
im = im.resize((768, round(im.height * 768 / im.width)), Image.LANCZOS)
im.save(os.path.join(V4, 'mochila-cometa.webp'), 'WEBP', lossless=True)
al = np.array(im)[..., 3] > 128
abajo = np.nonzero(al.any(axis=1))[0].max()
cols = np.nonzero(al[abajo - 25:abajo + 1].any(axis=0))[0]
m4 = {'archivo': 'mochila-cometa.webp', 'px': [im.width, im.height], 'baseInferior': [int((cols.min() + cols.max()) / 2), int(abajo)],
      'fuente': os.path.relpath(f, RAIZ), 'fuenteSha256': sha(f)[:16], 'recorte': [int(c) for c in caja]}
mv = json.load(open(os.path.join(V4, 'medidas.json')))
mv['cometa'] = m4
json.dump(mv, open(os.path.join(V4, 'medidas.json'), 'w'), indent=1, ensure_ascii=False)
mitad = im.resize((im.width // 2, round(im.height / 2)), Image.LANCZOS)
mitad.save(os.path.join(PUB, 'mochila-cometa.webp'), 'WEBP', lossless=True)
medidas['escudo-v4'] = {'archivo': 'mochila-cometa.webp', 'px': list(mitad.size), 'baseInferior': [m4['baseInferior'][0] / 2, m4['baseInferior'][1] / 2]}

# ── B12 conjunto ──
agregar(os.path.join(LAB, 'recursos/conjuntos/v1/catalogo.json'), {
    'id': 'b12-set-cometa', 'nombre': 'Capitán Ciempi',
    'historia': 'Un héroe propio de Ciempi en azul oscuro, blanco y rojo: antifaz con visera y estrella, traje con franjas diagonales y botas rojas. El escudo hexagonal se vende aparte.',
    'batch': 'B12', 'version': '1', 'estado': ESTADO, 'aprobadoParaLaboratorio': False, 'aprobadoParaProduccion': False,
    'seleccion': {'cabeza': 'b07-ia-cometa', 'textura': 'b11-cometa', 'pies': 'b10-cometa', 'espalda': 'b09-cometa'}})

json.dump(medidas, open(os.path.join(IA, '..', 'medidas.json'), 'w'), indent=1, ensure_ascii=False)
print(json.dumps(medidas))
