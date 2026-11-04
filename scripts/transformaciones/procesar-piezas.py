#!/usr/bin/env python3
"""Recorta y normaliza las piezas IA de T01 (Dragón) y T02 (Cuncuna) para el laboratorio.

Lee solo los PNG originales de `docs/rediseno-ciempi/revisiones/T0x/ia/` y escribe
`docs/rediseno-ciempi/laboratorio-transformaciones/recursos/<especie>/` (WebP con alfa
a 2 px por unidad de la base + manifiesto.json con encuadres y anclajes) y una lámina
de control de anclajes en `docs/rediseno-ciempi/revisiones/T0x/piezas/`.

No vectoriza ni calca: las piezas son raster declarado (maestro IA conservado).
Uso (desde la raíz): python3 scripts/transformaciones/procesar-piezas.py
"""
import hashlib
import json
import os

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
REV = os.path.join(RAIZ, 'docs/rediseno-ciempi/revisiones')
SALIDA = os.path.join(RAIZ, 'docs/rediseno-ciempi/laboratorio-transformaciones/recursos')
PX = 2  # píxeles por unidad de la base (viewBox 0 0 1000 650): «2×»
CALIDAD = 90


def cargar(ruta):
    return Image.open(ruta).convert('RGBA')


def limpiar(im, umbral=40, minimo=400):
    """Alfa limpio: quita el ruido semitransparente (damero/halo) y las manchas sueltas."""
    a = np.array(im)
    alfa = a[..., 3].astype(np.int32)
    solido = alfa > 128
    et, n = ndimage.label(solido)
    if n:
        tam = ndimage.sum(solido, et, range(1, n + 1))
        grandes = np.isin(et, [i + 1 for i, t in enumerate(tam) if t >= minimo])
        # Conserva el borde antialias de las piezas grandes (2 px), nada más.
        zona = ndimage.binary_dilation(grandes, iterations=2)
    else:
        zona = solido
    alfa = np.where(zona & (alfa > umbral), alfa, 0)
    # Rampa del borde: el halo oscuro semitransparente se vuelve más corto.
    alfa = np.clip((alfa - umbral) * 255 / (255 - umbral), 0, 255)
    a[..., 3] = alfa.astype(np.uint8)
    return Image.fromarray(a)


def partir_columnas(im, minimo_hueco=6):
    """Separa piezas dispuestas en fila por columnas vacías."""
    alfa = np.array(im)[..., 3] > 0
    cols = alfa.any(axis=0)
    trozos, x, W = [], 0, len(cols)
    while x < W:
        if cols[x]:
            x0 = x
            while x < W and (cols[x] or cols[x:x + minimo_hueco].any()):
                x += 1
            trozos.append((x0, x))
        x += 1
    piezas = []
    for x0, x1 in trozos:
        sub = im.crop((x0, 0, x1, im.height))
        caja = sub.getbbox()
        piezas.append(sub.crop(caja))
    return [p for p in piezas if p.width > 30 and p.height > 30]


def hsv(im):
    a = np.array(im).astype(np.float32) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a[..., :3].max(-1), a[..., :3].min(-1)
    d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 0, (mx - mn) / (mx + 1e-6), 0)
    return h, s, mx, a[..., 3]


def caja_color(im, rangos, smin=0.25, vmin=0.35):
    """Caja de los píxeles cuyo tono cae en alguno de los rangos (grados)."""
    h, s, v, a = hsv(im)
    m = np.zeros(h.shape, bool)
    for lo, hi in rangos:
        m |= (h >= lo) & (h <= hi)
    m &= (s > smin) & (v > vmin) & (a > 0.5)
    ys, xs = np.nonzero(m)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def contorno_px(im):
    """Grosor aproximado del contorno azul oscuro (píxeles) en la fila central."""
    h, s, v, a = hsv(im)
    fila = im.height // 2
    oscuro = (v[fila] < 0.42) & (a[fila] > 0.5)
    xs = np.nonzero(oscuro)[0]
    if not len(xs):
        return 6
    run = 1
    while run < len(xs) and xs[run] == xs[0] + run:
        run += 1
    return run


def guardar(im, especie, nombre, escala):
    """Escala la pieza a PX px/unidad y la guarda en WebP; devuelve (archivo, ancho, alto en px)."""
    w, h = round(im.width * escala * PX), round(im.height * escala * PX)
    out = im.resize((w, h), Image.LANCZOS)
    os.makedirs(os.path.join(SALIDA, especie), exist_ok=True)
    archivo = f'{nombre}.webp'
    out.save(os.path.join(SALIDA, especie, archivo), 'WEBP', quality=CALIDAD, alpha_quality=100, method=6)
    return archivo, out


def sha(ruta):
    return hashlib.sha256(open(ruta, 'rb').read()).hexdigest()[:16]


def pieza(especie, nombre, im, cx, cy, escala, rol, fuente, notas=''):
    """Registra una pieza con su encuadre local: (cx, cy) en píxeles del recorte es el origen de la pieza."""
    archivo, out = guardar(im, especie, nombre, escala)
    x, y = -cx * escala, -cy * escala
    return {
        'id': nombre, 'rol': rol, 'archivo': archivo, 'tipo': 'raster-ia', 'formato': 'webp',
        'px': [out.width, out.height], 'pxPorUnidad': PX,
        'encuadre': [round(x, 2), round(y, 2), round(im.width * escala, 2), round(im.height * escala, 2)],
        'fuente': os.path.relpath(fuente, RAIZ), 'fuenteSha256': sha(fuente), 'notas': notas,
    }


def cabeza(im, rango_disco):
    """Ubica el disco naranja que hace de cabeza: (cx, cy, rx, ry) del relleno en px.

    Se mide el componente naranja más grande (el disco), no todos los naranjas."""
    h, s, v, a = hsv(im)
    # Naranja del disco (#f7941d ≈ 33°); el coral (≈13°) y el amarillo (≈47°) del penacho quedan fuera.
    m = (h >= 20) & (h <= 40) & (s > 0.55) & (v > 0.45) & (a > 0.5)
    et, n = ndimage.label(m)
    tam = ndimage.sum(m, et, range(1, n + 1))
    disco = et == (int(np.argmax(tam)) + 1)
    disco = ndimage.binary_fill_holes(disco)
    ys, xs = np.nonzero(disco)
    return (xs.min() + xs.max() + 1) / 2, (ys.min() + ys.max() + 1) / 2, (xs.max() + 1 - xs.min()) / 2, (ys.max() + 1 - ys.min()) / 2


def rasgos_cabeza(im, cx, cy, rx, ry, contorno, conservar_dentro):
    """Quita el disco (relleno y anillo de contorno) y todo lo que está bajo su centro; deja cuernos, orejas o penacho."""
    a = np.array(im)
    H, W = a.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    dist = np.hypot((xx - cx) / rx, (yy - cy) / ry)  # 1 = borde del relleno
    h, s, v, al = hsv(im)
    naranja = (h >= 20) & (h <= 40) & (s > 0.55) & (v > 0.45)
    oscuro = v < 0.45
    borde = (contorno + 4) / min(rx, ry)
    quitar = (dist <= 1.02) & naranja
    quitar |= (dist > 0.96) & (dist <= 1 + borde) & oscuro
    if not conservar_dentro:
        quitar |= dist <= 1 + borde * 0.5
    quitar |= yy > cy  # los rasgos están en la mitad superior
    a[..., 3] = np.where(quitar, 0, a[..., 3])
    return limpiar(Image.fromarray(a), minimo=150)


def solo_mayor(im):
    """Conserva el componente opaco más grande (descarta antenas IA: se usan las vectoriales del rig)."""
    a = np.array(im)
    h, s, v, al = hsv(im)
    # Penacho = mechones amarillos/coral (no menta) y su contorno inmediato; los tallos y pompones se quitan.
    color = (al > 0.5) & (s > 0.35) & (v > 0.5) & ~((h > 120) & (h < 185))
    mayor = ndimage.binary_dilation(color, iterations=12)
    a[..., 3] = np.where(mayor, a[..., 3], 0)
    return limpiar(Image.fromarray(a), minimo=800)


def lamina(especie_dir, items):
    """Lámina de control: cada pieza recortada con su origen (cruz roja)."""
    alto = 300
    filas = []
    for nombre, im, cx, cy in items:
        k = alto / max(im.height, im.width * 0.8)
        p = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        filas.append((nombre, p, cx * k, cy * k))
    W = sum(p.width + 40 for _, p, _, _ in filas) + 40
    hoja = Image.new('RGBA', (W, alto + 120), (253, 248, 238, 255))
    d = ImageDraw.Draw(hoja)
    x = 40
    for nombre, p, cx, cy in filas:
        hoja.alpha_composite(p, (x, 50))
        d.line([(x + cx - 10, 50 + cy), (x + cx + 10, 50 + cy)], fill=(220, 0, 0), width=3)
        d.line([(x + cx, 50 + cy - 10), (x + cx, 50 + cy + 10)], fill=(220, 0, 0), width=3)
        d.text((x, 20), nombre, fill=(36, 62, 91))
        x += p.width + 40
    os.makedirs(especie_dir, exist_ok=True)
    hoja.convert('RGB').save(os.path.join(especie_dir, 'anclajes-piezas.png'))


def procesar(especie, rev, cfg):
    ia = os.path.join(REV, rev, 'ia')
    piezas, control = [], []

    # ── Segmentos A–D y frente: misma anchura de bola y misma altura de unión.
    f = os.path.join(ia, f'pieza-{especie}-segmentos.png')
    trozos = partir_columnas(limpiar(cargar(f)))
    assert len(trozos) == 5, f'{especie}: {len(trozos)} segmentos'
    for i, (im, nombre) in enumerate(zip(trozos, ['seg-a', 'seg-b', 'seg-c', 'seg-d', 'frente'])):
        x0, y0, x1, y1 = caja_color(im, cfg['bola'])
        o = contorno_px(im)
        ancho_bola = (x1 - x0) + 2 * o
        cx = (x0 + x1) / 2
        cy = im.height - ancho_bola * cfg['proporcion'] / 2  # la base de la bola es la base del recorte
        objetivo = cfg['frente'] if nombre == 'frente' else cfg['ancho']
        esc = objetivo / ancho_bola
        piezas.append(pieza(especie, nombre, im, cx, cy, esc, {'seg-a': 1, 'seg-b': 2, 'seg-c': 3, 'seg-d': 5, 'frente': 4}[nombre], f,
                            'Origen = centro de la bola; ancho de bola normalizado.'))
        control.append((nombre, im, cx, cy))

    # ── Cola: la bola está a la derecha del recorte (su lado derecho lo tapa el segmento siguiente).
    f = os.path.join(ia, f'pieza-{especie}-cola.png')
    im = limpiar(cargar(f))
    im = im.crop(im.getbbox())
    o = contorno_px(im)
    ancho_bola = im.width * cfg['cola_fraccion']
    cx = im.width - ancho_bola / 2
    cy = im.height - ancho_bola * cfg['proporcion'] / 2
    piezas.append(pieza(especie, 'cola', im, cx, cy, cfg['cola'] / ancho_bola, 0, f, f'Bola = {cfg["cola_fraccion"]:.2f} del ancho del recorte (medido sobre la lámina de anclajes).'))
    control.append(('cola', im, cx, cy))

    # ── Pata y pie: el pie se ancla como las zapatillas (suela en y=+22, talón en x=-44).
    f = os.path.join(ia, f'pieza-{especie}-pata.png')
    pata, pie = partir_columnas(limpiar(cargar(f)))
    esc = cfg['pata_ancho'] / pata.width
    # Origen del grupo de cada pata = punto de apoyo del pie; la pierna llega hasta y=-15 (dentro del pie).
    alto_u = pata.height * esc
    piezas.append(pieza(especie, 'pierna', pata, 0, 0, esc, 'pierna', f,
                        'Origen = pie; la pierna baja hasta y=-15 (dentro del pie) y su extremo superior queda oculto dentro del cuerpo.'))
    # Centrada en x=-8 (eje de las piernas de Ciempi, entre -24 y +9).
    piezas[-1]['encuadre'] = [round(-8 - cfg['pata_ancho'] / 2, 2), round(-15 - alto_u, 2), round(cfg['pata_ancho'], 2), round(alto_u, 2)]
    control.append(('pierna', pata, pata.width * 0.55, pata.height))
    esc = cfg['pie_ancho'] / pie.width
    piezas.append(pieza(especie, 'pie', pie, 0, 0, esc, 'pie', f, 'Encuadre igual al calzado B10: suela en y=+22, talón en x=-44.'))
    piezas[-1]['encuadre'] = [-44, round(22 - pie.height * esc, 2), round(cfg['pie_ancho'], 2), round(pie.height * esc, 2)]
    control.append(('pie', pie, 0, pie.height))

    # ── Rasgos de cabeza: se registran contra el disco (centro 736,340; relleno r=126,5).
    f = os.path.join(ia, f'pieza-{especie}-cabeza.png')
    im = limpiar(cargar(f))
    cx, cy, rx, ry = cabeza(im, (12, 42))
    o = contorno_px(im)
    rasgos = rasgos_cabeza(im, cx, cy, rx, ry, o, cfg['rasgos_delante'])
    if cfg.get('solo_mayor'):
        rasgos = solo_mayor(rasgos)
    caja = rasgos.getbbox()
    rasgos = rasgos.crop(caja)
    esc = 126.5 / ((rx + ry) / 2)
    print(especie, 'disco', round(cx), round(cy), round(rx), round(ry), 'escala', round(esc, 3))
    p = pieza(especie, 'cabeza-rasgos', rasgos, cx - caja[0], cy - caja[1], esc, 'cabeza', f,
              'Registrado contra el disco naranja de la imagen IA; el disco y su contorno se quitaron.')
    p['encuadre'][0] += 736
    p['encuadre'][1] += 340
    p['plano'] = 'delante' if cfg['rasgos_delante'] else 'detras'
    piezas.append(p)
    control.append(('cabeza-rasgos', rasgos, cx - caja[0], cy - caja[1]))

    # ── Alas (exclusivo opcional del Dragón): raíz en la base de la V.
    if cfg.get('alas'):
        f = os.path.join(ia, f'pieza-{especie}-alas.png')
        im = limpiar(cargar(f))
        im = im.crop(im.getbbox())
        a = np.array(im)[..., 3] > 0
        fila = a[-int(im.height * 0.06):].any(axis=0).nonzero()[0]
        rx, ry = fila.mean(), im.height * 0.9
        esc = cfg['alas']['ancho'] / im.width
        p = pieza(especie, 'alas', im, rx, ry, esc, 'alas', f, 'Origen = raíz de las alas (se esconde tras el segmento delantero).')
        p['encuadre'][0] += cfg['alas']['raiz'][0]
        p['encuadre'][1] += cfg['alas']['raiz'][1]
        piezas.append(p)
        control.append(('alas', im, rx, ry))

    lamina(os.path.join(REV, rev, 'piezas'), control)
    total = sum(os.path.getsize(os.path.join(SALIDA, especie, x['archivo'])) for x in piezas)
    manifiesto = {
        'especie': especie, 'version': 'v1', 'estado': 'laboratorio — pendiente de aprobación del usuario',
        'unidades': 'viewBox de la base (0 0 1000 650)',
        'formato': f'raster WebP con alfa, {PX} px por unidad, calidad {CALIDAD}; maestros IA en {os.path.relpath(ia, RAIZ)}',
        'bytesTotales': total, 'piezas': piezas,
        'origenes': {
            'segmentos/cola': 'centro de la bola; el grupo del segmento se traslada a (x, y) de pose.ts',
            'pierna/pie': 'punto de apoyo del pie (grupo translate de cada pata); pie dentro del giro rotate(g -10 -32)',
            'cabeza-rasgos': 'coordenadas absolutas de la base (cabeza 736,340 r130)',
            'alas': 'coordenadas absolutas de la base',
        },
    }
    with open(os.path.join(SALIDA, especie, 'manifiesto.json'), 'w') as fh:
        json.dump(manifiesto, fh, indent=1, ensure_ascii=False)
    print(especie, 'piezas', len(piezas), 'bytes', total)


CONFIG = {
    'dragon': dict(rev='T01-dragon-v1', bola=[(140, 185)], proporcion=1.0, ancho=172, frente=196, cola=172, cola_fraccion=0.70,
                   pata_ancho=46, pie_ancho=92, rasgos_delante=False, alas=dict(ancho=240, raiz=(560, 336))),
    'cuncuna': dict(rev='T02-cuncuna-v1', bola=[(130, 175), (245, 300)], proporcion=1.0, ancho=166, frente=190, cola=166, cola_fraccion=0.66,
                    pata_ancho=40, pie_ancho=88, rasgos_delante=True, solo_mayor=True),
}

if __name__ == '__main__':
    for esp, cfg in CONFIG.items():
        procesar(esp, cfg['rev'], cfg)
