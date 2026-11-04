#!/usr/bin/env python3
"""Recorta y normaliza las piezas IA de T03 (Serpiente) y T04 (Camaleón) para el laboratorio.

Reutiliza (sin modificarlo) `scripts/transformaciones/procesar-piezas.py`: mismo
formato de salida (WebP con alfa a 2 px por unidad de la base, `manifiesto.json`
con encuadres y anclajes) y misma lámina de control de anclajes. Solo escribe
`recursos/serpiente/`, `recursos/camaleon/` y `revisiones/T03|T04/piezas/`;
no toca Dragón ni Cuncuna.

Novedades frente a T01/T02 (documentadas en cada pieza del manifiesto):
- `cabeza-piel`: piel IA de la cabeza (disco con hocico/garganta, sin rostro), que
  se pone bajo los ojos/boca vectoriales B03; registrada contra el contorno del disco.
- `casco` (camaleón): lo que sobresale del disco, aparte, para guardarlo bajo gorros.
- `lengua` (serpiente): lengüita bífida; origen = centro de su borde superior.
- `torreta-izq` / `torreta-der` (camaleón): párpados en torreta; origen = centro del hueco.
Sin calco ni vectorización: raster declarado (maestro IA conservado en ia/).
Uso (desde la raíz): python3 scripts/transformaciones/v4/procesar-piezas-v4.py
"""
import importlib.util
import json
import os

import numpy as np
from PIL import Image
from scipy import ndimage

AQUI = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('pp', os.path.join(AQUI, '..', 'procesar-piezas.py'))
pp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pp)  # solo define funciones: su bloque principal no se ejecuta
RAIZ, REV, SALIDA, PX, CALIDAD = pp.RAIZ, pp.REV, pp.SALIDA, pp.PX, pp.CALIDAD


def recortar(im):
    return im.crop(im.getbbox())


def disco_por_contorno(im):
    """Círculo exterior (contorno incluido) de una pieza cuya bola está abajo a la derecha.

    El punto más a la derecha está a la altura del centro y el más bajo bajo el
    centro: así un casco o una cola arriba a la izquierda no desplazan la medida."""
    a = np.array(im)[..., 3] > 128
    ys, xs = np.nonzero(a)
    xr = xs.max()
    cy = ys[xs >= xr - 2].mean()
    yb = ys.max()
    r = yb - cy
    cx = xr - r
    return float(cx), float(cy), float(r)


def bola(im):
    """Bola de un segmento: caja del alfa (las piezas A–D y frente son solo la bola)."""
    x0, y0, x1, y1 = im.getbbox()
    return (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0), (y1 - y0)


def segmentos(especie, ia, cfg, piezas, control):
    f = os.path.join(ia, f'pieza-{especie}-segmentos.png')
    trozos = pp.partir_columnas(pp.limpiar(pp.cargar(f)))
    assert len(trozos) == 5, f'{especie}: {len(trozos)} segmentos'
    for im, nombre in zip(trozos, ['seg-a', 'seg-b', 'seg-c', 'seg-d', 'frente']):
        cx, cy, w, h = bola(im)
        objetivo = cfg['frente'] if nombre == 'frente' else cfg['ancho']
        esc = objetivo / w
        rol = {'seg-a': 1, 'seg-b': 2, 'seg-c': 3, 'seg-d': 5, 'frente': 4}[nombre]
        piezas.append(pp.pieza(especie, nombre, im, cx, cy, esc, rol, f, 'Origen = centro de la bola (caja del alfa); ancho de bola normalizado.'))
        control.append((nombre, im, cx, cy))


def cola(especie, ia, cfg, piezas, control):
    f = os.path.join(ia, f'pieza-{especie}-cola.png')
    im = recortar(pp.limpiar(pp.cargar(f)))
    cx, cy, r = disco_por_contorno(im)
    piezas.append(pp.pieza(especie, 'cola', im, cx, cy, cfg['cola'] / (2 * r), 0, f,
                           'Bola medida por su contorno derecho e inferior; la cola sale arriba a la izquierda.'))
    control.append(('cola', im, cx, cy))


def patas(especie, ia, cfg, piezas, control, f=None, sufijo=''):
    f = f or os.path.join(ia, f'pieza-{especie}-pata.png')
    pata, pie = pp.partir_columnas(pp.limpiar(pp.cargar(f)))
    esc = cfg['pata_ancho'] / pata.width
    alto_u = pata.height * esc
    p = pp.pieza(especie, 'pierna' + sufijo, pata, 0, 0, esc, 'pierna', f, 'Origen = pie; la pierna baja hasta y=-15 (dentro del pie).')
    p['encuadre'] = [round(-8 - cfg['pata_ancho'] / 2, 2), round(-15 - alto_u, 2), round(cfg['pata_ancho'], 2), round(alto_u, 2)]
    piezas.append(p)
    control.append(('pierna' + sufijo, pata, pata.width * 0.55, pata.height))
    esc = cfg['pie_ancho'] / pie.width
    p = pp.pieza(especie, 'pie' + sufijo, pie, 0, 0, esc, 'pie', f, 'Encuadre igual al calzado B10: suela en y=+22, talón en x=-44.')
    p['encuadre'] = [-44, round(22 - pie.height * esc, 2), round(cfg['pie_ancho'], 2), round(pie.height * esc, 2)]
    piezas.append(p)
    control.append(('pie' + sufijo, pie, 0, pie.height))


def cabeza(especie, ia, cfg, piezas, control, f=None, sufijo=''):
    """Piel de la cabeza (dentro del disco) y, si hay, lo que sobresale (casco)."""
    f = f or os.path.join(ia, f'pieza-{especie}-cabeza.png')
    im = recortar(pp.limpiar(pp.cargar(f)))
    cx, cy, r = disco_por_contorno(im)
    a = np.array(im)
    H, W = a.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    dist = np.hypot(xx - cx, yy - cy)
    # Escala: radio exterior del disco IA → 133,5 (círculo r130 con contorno de 7).
    esc = 133.5 / r
    print(especie, 'disco', round(cx), round(cy), round(r), 'escala', round(esc, 3))
    piel = a.copy()
    piel[..., 3] = np.where(dist <= r + 1, piel[..., 3], 0)
    piel = Image.fromarray(piel)
    caja = piel.getbbox()
    piel = piel.crop(caja)
    p = pp.pieza(especie, 'cabeza-piel' + sufijo, piel, cx - caja[0], cy - caja[1], esc, 'cabeza', f,
                 'Piel de cabeza sin rostro (IA), registrada por el contorno del disco; se recorta al círculo #face bajo ojos, cejas, rubor y boca B03.')
    p['encuadre'][0] += 736
    p['encuadre'][1] += 340
    piezas.append(p)
    control.append(('cabeza-piel' + sufijo, piel, cx - caja[0], cy - caja[1]))
    if cfg.get('casco') and not sufijo:
        cas = a.copy()
        # Lo que queda fuera del disco (con un margen para no arrastrar el contorno del disco).
        cas[..., 3] = np.where(dist > r - 2, cas[..., 3], 0)
        cas = pp.limpiar(Image.fromarray(cas), minimo=600)
        # Solo el componente mayor (descarta restos del anillo del contorno).
        al = np.array(cas)[..., 3] > 128
        et, n = ndimage.label(al)
        tam = ndimage.sum(al, et, range(1, n + 1))
        mayor = ndimage.binary_dilation(et == (int(np.argmax(tam)) + 1), iterations=3)
        c2 = np.array(cas)
        c2[..., 3] = np.where(mayor, c2[..., 3], 0)
        cas = Image.fromarray(c2)
        caja = cas.getbbox()
        cas = cas.crop(caja)
        p = pp.pieza(especie, 'casco', cas, cx - caja[0], cy - caja[1], esc, 'cabeza', f,
                     'Casco: parte de la imagen fuera del disco; va detrás de la cabeza (su base queda tapada por el contorno).')
        p['encuadre'][0] += 736
        p['encuadre'][1] += 340
        p['plano'] = 'detras'
        piezas.append(p)
        control.append(('casco', cas, cx - caja[0], cy - caja[1]))


def lengua(especie, ia, cfg, piezas, control):
    f = os.path.join(ia, f'pieza-{especie}-lengua.png')
    im = recortar(pp.limpiar(pp.cargar(f)))
    # Solo la mitad inferior (la horquilla): la lengua IA entera es demasiado larga para asomar de la boca.
    im = recortar(im.crop((0, round(im.height * cfg['lengua_corte']), im.width, im.height)))
    esc = cfg['lengua_ancho'] / im.width
    p = pp.pieza(especie, 'lengua', im, im.width / 2, 0, esc, 'lengua', f,
                 f'Mitad inferior de la lengua IA (corte al {cfg["lengua_corte"]:.0%}). Origen = centro del borde superior; se mete detrás de la boca B03 (primer hijo de #mouth).')
    piezas.append(p)
    control.append(('lengua', im, im.width / 2, 0))


def torretas(especie, ia, cfg, piezas, control):
    f = os.path.join(ia, f'pieza-{especie}-torretas.png')
    trozos = pp.partir_columnas(pp.limpiar(pp.cargar(f)))
    assert len(trozos) == 2, f'{especie}: {len(trozos)} torretas'
    for im, nombre, exterior in zip(trozos, ['torreta-izq', 'torreta-der'], cfg['torreta_exterior']):
        al = np.array(im)[..., 3] > 128
        hueco = ndimage.binary_fill_holes(al) & ~al
        et, n = ndimage.label(hueco)
        tam = ndimage.sum(hueco, et, range(1, n + 1))
        hueco = et == (int(np.argmax(tam)) + 1)
        ys, xs = np.nonzero(hueco)
        hx, hy = (xs.min() + xs.max() + 1) / 2, (ys.min() + ys.max() + 1) / 2
        hr = ((xs.max() + 1 - xs.min()) + (ys.max() + 1 - ys.min())) / 4
        # Escala por el radio EXTERIOR: el hueco queda más chico que el ojo B03, que lo tapa con los anillos interiores.
        esc = exterior / ((im.width + im.height) / 4)
        p = pp.pieza(especie, nombre, im, hx, hy, esc, 'torreta', f,
                     f'Origen = centro del hueco (radio {hr * esc:.1f} u); radio exterior {exterior} u; se centra en el ojo B03 y va detrás de #eyes.')
        piezas.append(p)
        control.append((nombre, im, hx, hy))


def procesar(especie, rev, cfg):
    ia = os.path.join(REV, rev, 'ia')
    piezas, control = [], []
    segmentos(especie, ia, cfg, piezas, control)
    cola(especie, ia, cfg, piezas, control)
    if cfg.get('patas'):
        patas(especie, ia, cfg, piezas, control)
    cabeza(especie, ia, cfg, piezas, control)
    if cfg.get('lengua_ancho'):
        lengua(especie, ia, cfg, piezas, control)
    if cfg.get('torreta_exterior'):
        torretas(especie, ia, cfg, piezas, control)
    pp.lamina(os.path.join(REV, rev, 'piezas'), control)
    # Iteración 2 (T0x-*-v2): piezas nuevas con sufijo -v2; las v1 se conservan sin cambios.
    v2 = cfg.get('v2')
    if v2:
        ia2 = os.path.join(REV, v2['rev'], 'ia')
        control2 = []
        if v2.get('cabeza'):
            cabeza(especie, ia2, cfg, piezas, control2, os.path.join(ia2, v2['cabeza']), '-v2')
        if v2.get('pata'):
            patas(especie, ia2, dict(cfg, pata_ancho=v2['pata_ancho'], pie_ancho=v2['pie_ancho']), piezas, control2, os.path.join(ia2, v2['pata']), '-v2')
        pp.lamina(os.path.join(REV, v2['rev'], 'piezas'), control2)
    total = sum(os.path.getsize(os.path.join(SALIDA, especie, x['archivo'])) for x in piezas)
    manifiesto = {
        'especie': especie, 'version': 'v1', 'estado': 'laboratorio — pendiente de aprobación del usuario',
        'unidades': 'viewBox de la base (0 0 1000 650)',
        'formato': f'raster WebP con alfa, {PX} px por unidad, calidad {CALIDAD}; maestros IA en {os.path.relpath(ia, RAIZ)}',
        'bytesTotales': total, 'piezas': piezas,
        'origenes': {
            'segmentos/cola': 'centro de la bola; el grupo del segmento se traslada a (x, y) de pose.ts',
            'pierna/pie': 'punto de apoyo del pie (grupo translate de cada pata); pie dentro del giro rotate(g -10 -32)',
            'cabeza-piel/casco': 'coordenadas absolutas de la base (cabeza 736,340 r130)',
            'lengua': 'centro del borde superior; el compositor lo lleva a la boca de cada expresión',
            'torretas': 'centro del hueco; el compositor lo lleva al centro de cada ojo B03',
        },
    }
    with open(os.path.join(SALIDA, especie, 'manifiesto.json'), 'w') as fh:
        json.dump(manifiesto, fh, indent=1, ensure_ascii=False)
    print(especie, 'piezas', len(piezas), 'bytes', total)


CONFIG = {
    'serpiente': dict(rev='T03-serpiente-v1', ancho=172, frente=194, cola=172, lengua_ancho=19, lengua_corte=0.42,
                      v2=dict(rev='T03-serpiente-v2', cabeza='pieza-serpiente-cabeza-lisa.png')),
    'camaleon': dict(rev='T04-camaleon-v1', ancho=170, frente=192, cola=170, patas=True, pata_ancho=40, pie_ancho=90,
                     casco=True, torreta_exterior=(54, 46),
                     v2=dict(rev='T04-camaleon-v2', pata='pieza-camaleon-pata.png', pata_ancho=50, pie_ancho=104)),
}

if __name__ == '__main__':
    import sys
    for esp in sys.argv[1:] or CONFIG:
        procesar(esp, CONFIG[esp]['rev'], CONFIG[esp])
