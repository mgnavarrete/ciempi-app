#!/usr/bin/env python3
"""Héroes de Ciempi (10 conjuntos): procesa los maestros IA de docs/expansion-v10/heroes/ia/ al formato
de cada categoría, igual que docs/expansion-v9/capitan-cometa/procesar.py (Capitán Ciempi):

- Antifaz (B07)  → laboratorio/recursos/mascaras/v2/antifaz-<slug>.png (1024 px) y encuadre que alinea
                   las dos aberturas con los ojos de la base (708,342) y (808,320).
- Gorro (B06)    → laboratorio/recursos/gorros/v2/gorro-<slug>.png (1024 px) y encuadre que lleva la caja
                   opaca a la de los gorros v2 aprobados (ancho AJUSTE[slug], centro x 738, borde inferior y).
- Capa (B08)     → laboratorio/recursos/capas/v2/capa-<slug>.png (1024 px), caja opaca como la capa heroica
                   (x 200–700, y 258–490) con giro 12° alrededor de (650,440).
- Traje (B11)    → laboratorio/recursos/superficies/v1/<slug>.png (atlas 3×2, 1536 px).
- Botas (B10)    → laboratorio/recursos/calzado/v1/<slug>.png (recorte ±3 px, 512 px).
- Mochila (B09)  → laboratorio/recursos/mochilas/v1/<slug>.png (768 px) + v4.2 sin manchas sueltas en
                   laboratorio-transformaciones/recursos/accesorios-v4/mochila-<slug>.webp y
                   public/ciempi-v2/mochilas-v4/mochila-<slug>.webp (384 px).
- Conjunto (B12) → laboratorio/recursos/conjuntos/v1 (cabeza + traje + botas [+ capa]; la mochila va aparte).
Escribe medidas.json (px de botas y medidas v4.2 de mochilas). No toca otras piezas.
Uso (desde la raíz): python3 docs/expansion-v10/heroes/procesar.py [slug ...]
"""
import hashlib, json, math, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
IA = os.path.join(RAIZ, 'docs/expansion-v10/heroes/ia')
LAB = os.path.join(RAIZ, 'docs/rediseno-ciempi/laboratorio')
V4 = os.path.join(RAIZ, 'docs/rediseno-ciempi/laboratorio-transformaciones/recursos/accesorios-v4')
PUB = os.path.join(RAIZ, 'public/ciempi-v2/mochilas-v4')
FUENTE = '../../expansion-v10/heroes/ia/'
ESTADO = 'En revisión artística — Pendiente de aprobación del usuario'
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()

# slug: nombre del conjunto, historia, (tipo de cabeza, nombre), traje, botas, (tipo de espalda, nombre)
HEROES = {
    'coloso': ('Ciempi Coloso', 'Un héroe forzudo en verde intenso y morado oscuro: gorro con mechones negros, traje de músculos redondos con pantalón rasgado y botas grandes. La mochila de roca se vende aparte.',
               ('gorro', 'Máscara Coloso'), 'Traje Coloso', 'Botas Coloso', ('mochila', 'Mochila de Fuerza')),
    'aracnido': ('Ciempi Arácnido', 'Un héroe trepador en rojo y azul eléctrico: antifaz con telaraña, traje con emblema propio de ocho patas curvas y botas rojas. La mochila telaraña se vende aparte.',
                 ('antifaz', 'Máscara Arácnida'), 'Traje Arácnido', 'Botas Arácnidas', ('mochila', 'Mochila Telaraña')),
    'ilusionista': ('Ciempi Ilusionista', 'Un mago elegante en verde esmeralda y dorado: casco con adornos curvos y gema, traje satinado con rombos dorados, botas de ribete dorado y capa de interior dorado.',
                    ('gorro', 'Corona Ilusionista'), 'Traje Ilusionista', 'Botas Ilusionista', ('capa', 'Capa de Ilusiones')),
    'solar': ('Ciempi Solar', 'Un héroe luminoso en azul intenso, rojo y dorado: antifaz con sol de ocho rayos, traje elástico con soles pequeños, botas rojas y capa al viento.',
              ('antifaz', 'Antifaz Solar'), 'Traje Solar', 'Botas Solares', ('capa', 'Capa Solar')),
    'nocturno': ('Ciempi Nocturno', 'Un héroe de la noche en negro, gris y amarillo: máscara con orejas triangulares, traje grafito con emblema de alas y cinturón, botas negras y capa de cinco ondas.',
                 ('antifaz', 'Máscara Nocturna'), 'Traje Nocturno', 'Botas Nocturnas', ('capa', 'Capa Nocturna')),
    'bromista': ('Ciempi Bromista', 'Un bromista elegante en morado, verde y blanco: gorro con mechones y pompones, traje de chaqueta con solapas y botones, botas con cordones. La mochila sorpresa se vende aparte.',
                 ('gorro', 'Gorro Bromista'), 'Traje Bromista', 'Botas Bromistas', ('mochila', 'Mochila Sorpresa')),
    'esmeralda': ('Ciempi Esmeralda', 'Un héroe de energía en verde brillante, negro y blanco: antifaz con círculo luminoso, traje con cristal hexagonal y botas con líneas de energía. La mochila de energía se vende aparte.',
                  ('antifaz', 'Antifaz Esmeralda'), 'Traje Esmeralda', 'Botas Esmeralda', ('mochila', 'Mochila de Energía')),
    'sombra': ('Ciempi Araña Sombra', 'Un héroe sigiloso en negro y rojo eléctrico: máscara con marcos ovalados rojos, traje con telarañas y símbolo de rombo, botas de suela roja. La mochila sombra se vende aparte.',
               ('antifaz', 'Máscara Sombra'), 'Traje Araña Sombra', 'Botas Sombra', ('mochila', 'Mochila Sombra')),
    'travieso': ('Ciempi Travieso', 'Un héroe travieso en rojo carmesí, negro y gris: máscara de tela con parches ovalados, traje con paneles y cinturón, botas de puntera roja. La mochila aventurera se vende aparte.',
                 ('antifaz', 'Máscara Traviesa'), 'Traje Travieso', 'Botas Traviesas', ('mochila', 'Mochila Aventurera')),
    'garra': ('Ciempi Garra Salvaje', 'Un héroe salvaje en amarillo intenso y azul oscuro: máscara con adornos en diagonal, traje con franjas y costuras, botas reforzadas. La mochila escudo se vende aparte.',
              ('antifaz', 'Máscara Garra'), 'Traje Garra Salvaje', 'Botas Garra', ('mochila', 'Mochila Garra')),
    'trueno': ('Ciempi Trueno', 'Un guerrero de las tormentas en azul oscuro, plata y rojo: casco con alas y aberturas para los ojos, traje con discos plateados y rayos dorados, botas con rayos y capa roja con un martillo de juguete.',
               ('antifaz', 'Casco Trueno'), 'Traje Trueno', 'Botas Trueno', ('capa', 'Capa Trueno')),
    'relampago': ('Ciempi Relámpago', 'Un héroe veloz en rojo, amarillo y blanco: máscara completa con rayos a los lados, traje con zigzag, botas amarillas. La mochila de velocidad se vende aparte.',
                  ('antifaz', 'Máscara Relámpago'), 'Traje Relámpago', 'Botas Relámpago', ('mochila', 'Mochila de Velocidad')),
    'pantera': ('Ciempi Pantera', 'Un guardián felino en negro, violeta eléctrico y plata: cabeza completa con orejas y bigotes, traje de triángulos violetas, botas y capa corta semicircular.',
                ('completa', 'Máscara Pantera'), 'Traje Pantera', 'Botas Pantera', ('capa', 'Capa Pantera')),
    'mistico': ('Ciempi Místico', 'Un mago aventurero en azul profundo, rojo y dorado: diadema con gema, traje con círculos mágicos, botas de cuero y capa de cuello alto.',
                ('gorro', 'Diadema Mística'), 'Traje Místico', 'Botas Místicas', ('capa', 'Capa Mística')),
    'marino': ('Ciempi Marino', 'Un guardián del océano en naranja dorado, esmeralda y oro: corona de olas, traje de escamas y botas esmeralda. La mochila concha con tridente se vende aparte.',
               ('gorro', 'Corona Marina'), 'Traje Marino', 'Botas Marinas', ('mochila', 'Mochila Oceánica')),
    'kpopvioleta': ('Ciempi Guerrera K-pop Violeta', 'Una cantante guerrera en violeta, negro y plata: peluca con trenza, traje de escenario con estrellas y botas con correas. La mochila con espada de juguete se vende aparte.',
                    ('gorro', 'Peinado Violeta'), 'Traje Violeta', 'Botas Violeta', ('mochila', 'Mochila Guardiana Violeta')),
    'kpoprosa': ('Ciempi Guerrera K-pop Rosa', 'Una guerrera musical en fucsia, negro y dorado: peluca con dos moños y estrellas, traje brillante y botas fucsia. La mochila corazón con abanicos se vende aparte.',
                 ('gorro', 'Peinado Rosa'), 'Traje Rosa', 'Botas Rosa', ('mochila', 'Mochila Estelar Rosa')),
    'kpopazul': ('Ciempi Guerrera K-pop Azul', 'Una artista guardiana en turquesa, azul eléctrico y plata: peluca con coleta alta, traje con rombos y botas blancas. La mochila musical con cintas se vende aparte.',
                 ('gorro', 'Peinado Azul'), 'Traje Azul', 'Botas Azules', ('mochila', 'Mochila Musical Azul')),
    'unicornio': ('Ciempi Unicornio', 'Un disfraz mágico y tierno en blanco nacarado y pastel: cabeza con cuerno dorado y orejas, traje de peluche con estrellas, botitas lilas y cola arcoíris.',
                  ('antifaz', 'Cabeza Unicornio'), 'Traje Unicornio', 'Botas Unicornio', ('capa', 'Cola Arcoíris')),
    'hada': ('Ciempi Hada Mágica', 'Un hada de fantasía en rosa, lila y menta: corona de flores, traje floral, botitas con lazo y alas transparentes.',
             ('gorro', 'Corona de Hada'), 'Traje Hada', 'Botas Hada', ('capa', 'Alas Mágicas')),
    'sombrio': ('Ciempi Sombra', 'Una criatura de sombras misteriosa pero amigable en negro y blanco: cabeza completa con gran sonrisa, traje con manchas blancas y botas brillantes. La mochila gota se vende aparte.',
                ('completa', 'Cabeza Sombra'), 'Traje Sombra', 'Botas de Sombra', ('mochila', 'Mochila de Sombras')),
    'hielo': ('Ciempi Princesa de Hielo', 'Una princesa de invierno en celeste, blanco y plata: corona de cristales con peinado y trenza, traje de copos, botitas de cristal y capa translúcida.',
              ('gorro', 'Corona de Hielo'), 'Traje de Hielo', 'Botas de Cristal', ('capa', 'Capa Invernal')),
}
# Gorros: ancho de la caja opaca (u. de la base) y altura y del vértice del arco interior (el borde
# inferior del gorro en su centro) sobre la cabeza (círculo 736,340 r 130, tope y 210). Calibrado con la lámina.
AJUSTE_GORRO = {'coloso': (290, 240), 'ilusionista': (340, 242), 'bromista': (310, 268),
                'mistico': (290, 250), 'marino': (300, 245), 'hada': (290, 245), 'hielo': (300, 250),
                'kpopvioleta': (330, 262), 'kpoprosa': (330, 262), 'kpopazul': (330, 262)}
# Piezas de espalda con caja propia (x0, y0, x1, y1 en u. de la base) y giro; las demás, la caja de la capa heroica.
CAJA_CAPA = {'unicornio': ((20, 250, 210, 420), 0), 'hada': ((430, 120, 640, 400), 0)}


def recorte(im, margen_izq=3, margen_der=4):
    a = np.array(im.convert('RGBA'))[..., 3]
    ys, xs = np.nonzero(a > 1)
    x0, y0 = max(0, xs.min() - margen_izq), max(0, ys.min() - margen_izq)
    x1, y1 = min(a.shape[1], xs.max() + margen_der), min(a.shape[0], ys.max() + margen_der)
    return {'left': int(x0), 'top': int(y0), 'width': int(x1 - x0), 'height': int(y1 - y0)}


def caja_opaca(im, umbral=8):
    return Image.fromarray(np.array(im.convert('RGBA'))[..., 3]).point(lambda a: 255 if a > umbral else 0).getbbox()


def agregar(catalogo, item):
    """Reemplaza la pieza en su lugar (o la agrega) y deja los héroes al final en el orden de HEROES,
    para que reprocesar un conjunto no cambie el orden de la tienda."""
    lista = json.load(open(catalogo))
    lista = [item if x['id'] == item['id'] else x for x in lista]
    if not any(x['id'] == item['id'] for x in lista):
        lista.append(item)
    orden = list(HEROES)
    def clave(par):
        i, x = par
        slug = x['id'].split('-')[-1]
        es_heroe = 'heroes' in x.get('collections', []) or (x['id'].startswith('b12-set-') and slug in HEROES)
        return (1, orden.index(slug), i) if es_heroe and slug in HEROES else (0, i, 0)
    lista = [x for _, x in sorted(enumerate(lista), key=clave)]
    json.dump(lista, open(catalogo, 'w'), indent=2, ensure_ascii=False)
    open(catalogo, 'a').write('\n')


def a1024(src):
    raw = Image.open(src).convert('RGBA')
    W, H = raw.size
    return raw, (raw.resize((1024, round(H * 1024 / W)), Image.LANCZOS) if W > 1024 else raw)


def base_v2(batch, slug, nombre, fuente, archivo, W, H, encuadre, giro, extra):
    it = {'id': f'{batch.lower()}-ia-{slug}', 'nombre': nombre, 'batch': batch, 'version': '2', 'estado': ESTADO,
          'aprobadoParaLaboratorio': False, 'aprobadoParaProduccion': False, 'tipo': 'raster-ia', 'archivo': archivo,
          'fuente': FUENTE + fuente + '.png', 'fuenteSha256': sha(os.path.join(IA, fuente + '.png')), 'dimensionesMaestro': [W, H],
          'encuadre': [round(v, 2) for v in encuadre], 'splitY': None, 'rotation': round(giro, 2), 'anterior': None, 'novedad': True,
          'collections': ['ciempi-original', 'heroes', slug], 'antenna': True, 'svg': True, 'compatiblePelo': False}
    it.update(extra)
    return it


def base_b09_b12(fam, slug, nombre, fuente, crop, dims, batch):
    return {'id': f'{batch.lower()}-{slug}', 'nombre': nombre, 'batch': batch, 'version': '1',
            'tipo': 'atlas-raster-ia' if fam == 'superficies' else 'raster-ia', 'estado': ESTADO,
            'aprobadoParaLaboratorio': False, 'aprobadoParaProduccion': False,
            'archivo': f'./recursos/{fam}/v1/{slug}.png', 'fuente': FUENTE + fuente + '.png',
            'fuenteSha256': sha(os.path.join(IA, fuente + '.png')), 'recorte': crop, 'dimensiones': dims,
            'anterior': None, 'novedad': True, 'svg': True, 'collections': ['ciempi-original', 'heroes', slug]}


def antifaz(slug, nombre):
    src = os.path.join(IA, f'{slug}-cabeza.png')
    raw, out = a1024(src)
    W, H = raw.size
    out.save(os.path.join(LAB, f'recursos/mascaras/v2/antifaz-{slug}.png'), optimize=True)
    alfa = np.array(raw)[..., 3] < 40
    et, n = ndimage.label(alfa)
    borde = set(np.unique(np.concatenate([et[0], et[-1], et[:, 0], et[:, -1]])))
    huecos = sorted([(int(ndimage.sum(alfa, et, i)), i) for i in range(1, n + 1) if i not in borde], reverse=True)[:3]
    # Capuchas completas: la abertura de la boca es un tercer hueco grande; los ojos son los dos más altos.
    if len(huecos) == 3 and huecos[2][0] > 0.15 * huecos[0][0]:
        huecos = sorted(huecos, key=lambda h: np.nonzero(et == h[1])[0].mean())[:2]
    else:
        huecos = huecos[:2]
    if len(huecos) < 2:
        raise SystemExit(f'{slug}: el antifaz no tiene dos aberturas cerradas')
    cs = []
    for _, i in huecos:
        ys, xs = np.nonzero(et == i)
        cs.append((xs.mean(), ys.mean(), xs.max() - xs.min(), ys.max() - ys.min()))
    cs.sort()
    (hx1, hy1, *_), (hx2, hy2, *_) = cs
    ojo1, ojo2 = (708, 342), (808, 320)
    s = math.dist(ojo1, ojo2) / math.dist((hx1, hy1), (hx2, hy2))
    giro = math.degrees(math.atan2(ojo2[1] - ojo1[1], ojo2[0] - ojo1[0]) - math.atan2(hy2 - hy1, hx2 - hx1))
    cx, cy = (ojo1[0] + ojo2[0]) / 2, (ojo1[1] + ojo2[1]) / 2
    mx, my = (hx1 + hx2) / 2, (hy1 + hy2) / 2
    print(f'{slug} antifaz: escala {s:.4f} giro {giro:.2f} aberturas', [round(c[2] * s) for c in cs], [round(c[3] * s) for c in cs])
    it = base_v2('B07', slug, nombre, f'{slug}-cabeza', f'./recursos/mascaras/v2/antifaz-{slug}.png', W, H,
                 [cx - mx * s, cy - my * s, W * s, H * s], giro, {'centroRotacion': [cx, cy], 'mask': True, 'fullFace': False, 'ocultaRostro': False})
    agregar(os.path.join(LAB, 'recursos/mascaras/v2/catalogo.json'), it)
    return it['id']


def gorro(slug, nombre):
    src = os.path.join(IA, f'{slug}-cabeza.png')
    raw, out = a1024(src)
    W, H = raw.size
    out.save(os.path.join(LAB, f'recursos/gorros/v2/gorro-{slug}.png'), optimize=True)
    x0, y0, x1, y1 = caja_opaca(raw)
    ancho, yv = AJUSTE_GORRO[slug]
    s = ancho / (x1 - x0)
    # Vértice del arco interior: en la mitad central, el píxel opaco más bajo de cada columna; el más alto de ellos.
    a = np.array(raw)[..., 3] > 128
    pts = [(x, np.nonzero(a[:, x])[0].max()) for x in range(int(x0 + (x1 - x0) * .3), int(x1 - (x1 - x0) * .3), 2) if a[:, x].any()]
    ymin = min(p[1] for p in pts)
    xv = float(np.mean([p[0] for p in pts if p[1] <= ymin + 4]))
    x, y = 742 - xv * s, yv - ymin * s
    print(f'{slug} gorro: escala {s:.4f} vértice', (round(xv), int(ymin)))
    it = base_v2('B06', slug, nombre, f'{slug}-cabeza', f'./recursos/gorros/v2/gorro-{slug}.png', W, H, [x, y, W * s, H * s], 0, {})
    agregar(os.path.join(LAB, 'recursos/gorros/v2/catalogo.json'), it)
    return it['id']


def completa(slug, nombre):
    """Cabeza completa con cara propia (como b07-ia-robot): la fila opaca más ancha es el ancho de la cabeza."""
    src = os.path.join(IA, f'{slug}-cabeza.png')
    raw, out = a1024(src)
    W, H = raw.size
    out.save(os.path.join(LAB, f'recursos/mascaras/v2/mascara-{slug}.png'), optimize=True)
    a = np.array(raw)[..., 3] > 128
    anchos = [(np.nonzero(f)[0].max() - np.nonzero(f)[0].min(), y) for y, f in enumerate(a) if f.any()]
    w, yfila = max(anchos)
    xs = np.nonzero(a[yfila])[0]
    s = 272 / w
    x, y = 736 - (xs.min() + xs.max()) / 2 * s, 340 - yfila * s
    print(f'{slug} completa: escala {s:.4f} fila más ancha y={yfila}')
    it = base_v2('B07', slug, nombre, f'{slug}-cabeza', f'./recursos/mascaras/v2/mascara-{slug}.png', W, H, [x, y, W * s, H * s], 0,
                 {'mask': True, 'fullFace': True, 'ocultaRostro': True})
    agregar(os.path.join(LAB, 'recursos/mascaras/v2/catalogo.json'), it)
    return it['id']


def capa(slug, nombre):
    src = os.path.join(IA, f'{slug}-espalda.png')
    raw, out = a1024(src)
    W, H = raw.size
    out.save(os.path.join(LAB, f'recursos/capas/v2/capa-{slug}.png'), optimize=True)
    x0, y0, x1, y1 = caja_opaca(raw)
    (cx0, cy0, cx1, cy1), giro = CAJA_CAPA.get(slug, ((200, 258, 700, 490), 12))  # capa heroica por defecto
    s = min((cx1 - cx0) / (x1 - x0), (cy1 - cy0) / (y1 - y0))
    x, y = (cx0 + cx1) / 2 - (x0 + x1) / 2 * s, cy0 - y0 * s
    it = base_v2('B08', slug, nombre, f'{slug}-espalda', f'./recursos/capas/v2/capa-{slug}.png', W, H, [x, y, W * s, H * s], giro,
                 {'centroRotacion': [650, 440]})
    agregar(os.path.join(LAB, 'recursos/capas/v2/catalogo.json'), it)
    return it['id']


def traje(slug, nombre):
    src = os.path.join(IA, f'{slug}-traje.png')
    im = Image.open(src).convert('RGB')
    crop = {'left': 0, 'top': 0, 'width': im.width, 'height': im.height}
    im = im.resize((1536, round(im.height * 1536 / im.width)), Image.LANCZOS) if im.width > 1536 else im
    im.save(os.path.join(LAB, f'recursos/superficies/v1/{slug}.png'), optimize=True)
    it = base_b09_b12('superficies', slug, nombre, f'{slug}-traje', crop, list(im.size), 'B11')
    it.update({'paneles': [0, 1, 2, 3, 4], 'coloresFijos': True})
    agregar(os.path.join(LAB, 'recursos/superficies/v1/catalogo.json'), it)
    return it['id']


def botas(slug, nombre, medidas):
    src = os.path.join(IA, f'{slug}-botas.png')
    im = Image.open(src).convert('RGBA')
    crop = recorte(im)
    im = im.crop((crop['left'], crop['top'], crop['left'] + crop['width'], crop['top'] + crop['height']))
    im = im.resize((512, round(im.height * 512 / im.width)), Image.LANCZOS)
    im.save(os.path.join(LAB, f'recursos/calzado/v1/{slug}.png'), optimize=True)
    it = base_b09_b12('calzado', slug, nombre, f'{slug}-botas', crop, list(im.size), 'B10')
    it.update({'ancho': 88, 'x': -43, 'suelo': 24})
    agregar(os.path.join(LAB, 'recursos/calzado/v1/catalogo.json'), it)
    a = np.array(im)[..., 3] > 128
    medidas.setdefault('botas', {})[slug] = {'px': list(im.size), 'suela': int(np.nonzero(a.any(axis=1))[0].max())}
    return it['id']


def mochila(slug, nombre, medidas):
    src = os.path.join(IA, f'{slug}-espalda.png')
    im = Image.open(src).convert('RGBA')
    crop = recorte(im)
    im = im.crop((crop['left'], crop['top'], crop['left'] + crop['width'], crop['top'] + crop['height']))
    im = im.resize((768, round(im.height * 768 / im.width)), Image.LANCZOS) if im.width > 768 else im
    im.save(os.path.join(LAB, f'recursos/mochilas/v1/{slug}.png'), optimize=True)
    it = base_b09_b12('mochilas', slug, nombre, f'{slug}-espalda', crop, list(im.size), 'B09')
    it['encuadre'] = [370, 250, 205, 205 * im.height / im.width]
    agregar(os.path.join(LAB, 'recursos/mochilas/v1/catalogo.json'), it)
    # v4.2 (procesar-mochilas-v4.py): sin manchas sueltas, 768 px en el laboratorio y 384 px en el juego.
    a = np.array(Image.open(src).convert('RGBA'))
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
    im.save(os.path.join(V4, f'mochila-{slug}.webp'), 'WEBP', lossless=True)
    al = np.array(im)[..., 3] > 128
    abajo = np.nonzero(al.any(axis=1))[0].max()
    cols = np.nonzero(al[abajo - 25:abajo + 1].any(axis=0))[0]
    m4 = {'archivo': f'mochila-{slug}.webp', 'px': [im.width, im.height], 'baseInferior': [int((cols.min() + cols.max()) / 2), int(abajo)],
          'fuente': os.path.relpath(src, RAIZ), 'fuenteSha256': sha(src)[:16], 'recorte': [int(c) for c in caja]}
    mv = json.load(open(os.path.join(V4, 'medidas.json')))
    mv[slug] = m4
    json.dump(mv, open(os.path.join(V4, 'medidas.json'), 'w'), indent=1, ensure_ascii=False)
    mitad = im.resize((im.width // 2, round(im.height / 2)), Image.LANCZOS)
    mitad.save(os.path.join(PUB, f'mochila-{slug}.webp'), 'WEBP', lossless=True)
    medidas.setdefault('mochilas', {})[slug] = {'archivo': f'mochila-{slug}.webp', 'px': list(mitad.size),
                                                 'baseInferior': [m4['baseInferior'][0] / 2, m4['baseInferior'][1] / 2]}
    return it['id']


ruta_medidas = os.path.join(IA, '..', 'medidas.json')
medidas = json.load(open(ruta_medidas)) if os.path.exists(ruta_medidas) else {}
for slug in sys.argv[1:] or [h for h in HEROES if all(os.path.exists(os.path.join(IA, f'{h}-{p}.png')) for p in ('cabeza', 'traje', 'botas', 'espalda'))]:
    nombre, historia, (tcab, ncab), ntraje, nbotas, (tesp, nesp) = HEROES[slug]
    cab = {'antifaz': antifaz, 'gorro': gorro, 'completa': completa}[tcab](slug, ncab)
    tr = traje(slug, ntraje)
    bo = botas(slug, nbotas, medidas)
    es = capa(slug, nesp) if tesp == 'capa' else mochila(slug, nesp, medidas)
    sel = {'cabeza': cab, 'textura': tr, 'pies': bo, 'espalda': es}
    agregar(os.path.join(LAB, 'recursos/conjuntos/v1/catalogo.json'), {
        'id': f'b12-set-{slug}', 'nombre': nombre, 'historia': historia, 'batch': 'B12', 'version': '1', 'estado': ESTADO,
        'aprobadoParaLaboratorio': False, 'aprobadoParaProduccion': False, 'seleccion': sel})
json.dump(medidas, open(ruta_medidas, 'w'), indent=1, ensure_ascii=False)
print('listo')
