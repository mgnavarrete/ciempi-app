#!/usr/bin/env python3
"""Recorta los rostros IA de la iteración 2 de T03 Serpiente y T04 Camaleón.

Mismo método que los rostros v4 de Dragón/Cuncuna (`rostros_base.py`, copia de
`procesar-rostros-v4.py` de la rama expansion-v4-rostros): hojas 2×2 con las
expresiones B03 dibujadas sobre un disco naranja plano; se registra el disco
contra la cabeza aprobada (736,340; r interior 126,5), se quita el naranja con
desmezcla de alfa y se separan capas. Diferencias:
- Serpiente: ojos más altos y separados (centros de búsqueda propios); capa
  `rostro` (cejas, boca, lengüita, marcas) y una capa por ojo (parpadean).
- Camaleón: las torretas SOBRESALEN del contorno: se conservan las partes de fuera
  del disco conectadas con la zona de cada ojo. Capa `torretas` (cono + ojo, NO
  parpadea: el rig no las aplasta) y capa `rostro` (boca, mejillas de escamas).
Escribe recursos/<especie>/rostro-v2/ (WebP con alfa, 2 px/u, manifiesto.json) y
revisiones/T0x-*-v2/piezas/control-recortes.png. No toca recursos de otras especies.
Uso (desde la raíz): python3 scripts/transformaciones/v4/procesar-rostros-criaturas.py [--propuestas]
"""
import glob
import json
import os
import shutil
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import rostros_base as rb  # noqa: E402

ESPECIES = {
    'serpiente': {'carpeta': 'T03-serpiente-v2', 'ojos': [(700, 318), (812, 300)], 'encuadre': [596, 196, 320, 290], 'torretas': False,
                  'hojas': [['alegre', 'carcajada', 'curioso', 'pensativo'], ['sorprendido', 'dormilon', 'besito', 'guino'],
                            ['orgulloso', 'confundido', 'triste', 'enojadito'], ['asustado', 'concentrado', 'alegre-sinlengua', 'carcajada-sinlengua']]},
    'camaleon': {'carpeta': 'T04-camaleon-v2', 'ojos': [(688, 318), (830, 305)], 'encuadre': [560, 160, 380, 330], 'torretas': True,
                 'radioTorreta': (105, 80),
                 'hojas': [['alegre', 'carcajada', 'curioso', 'pensativo'], ['sorprendido', 'dormilon', 'besito', 'guino'],
                           ['orgulloso', 'confundido', 'triste', 'enojadito'], ['asustado', 'concentrado', 'alegre-alt', 'sorprendido-alt']]},
}
ELECCION = {'serpiente': {}, 'camaleon': {}}


def configurar(cfg):
    rb.ENCUADRE = list(cfg['encuadre'])
    rb.OJOS_BASE = list(cfg['ojos'])


def torretas(reg, clave, cfg):
    """Capa de torretas: dentro de la zona de cada torreta se toma la imagen IA completa
    (desmezcla del naranja dentro del disco y del blanco fuera), y se queda la componente
    conexa que toca el centro de la torreta. Así el cono conserva sus anillos y su contorno
    aunque cruce el borde de la cabeza (`rb.recortar` borra la franja del borde)."""
    p = np.array(reg, float)
    H, W = p.shape[:2]
    E = rb.ENCUADRE
    yy, xx = np.mgrid[0:H, 0:W]
    ux, uy = E[0] + (xx + 0.5) / rb.PX, E[1] + (yy + 0.5) / rb.PX
    dist = np.hypot(ux - rb.CABEZA[0], uy - rb.CABEZA[1])
    f_n, a_n = rb.desmezclar(p, clave, 14, 40)
    f_b, a_b = rb.desmezclar(p, np.array([255.0, 255, 255]), 6, 30)
    dentro = dist < rb.R_INTERIOR + 1
    # Fuera del disco, solo el blanco conectado con el borde es fondo (el blanco del ojo en la punta del cono no).
    casi_blanco = np.linalg.norm(p - 255, axis=-1) < 40
    borde = np.zeros_like(casi_blanco); borde[0, :] = borde[-1, :] = borde[:, 0] = borde[:, -1] = True
    fondo = ndimage.binary_propagation(borde & casi_blanco, mask=casi_blanco)
    rgb = np.where(dentro[..., None], f_n, np.where(fondo[..., None], f_b, p))
    alfa = np.where(dentro, a_n, np.where(fondo, a_b, 1.0))
    zona = np.zeros(alfa.shape, bool)
    semillas = np.zeros(alfa.shape, bool)
    for (ox, oy), r in zip(cfg['ojos'], cfg['radioTorreta']):
        d = np.hypot(ux - ox, uy - oy)
        zona |= d < r
        semillas |= d < 26
    solido = (alfa > 0.3) & zona
    et, n = ndimage.label(solido)
    ids = set(np.unique(et[semillas & solido])) - {0}
    torre = ndimage.binary_fill_holes(np.isin(et, list(ids)))
    torre = ndimage.binary_dilation(torre, iterations=2) & zona
    # Arcos del contorno IA de la cabeza que la zona arrastra junto al borde: el azul de la
    # franja del borde solo se conserva pegado a colores del cono (lima, rosa, blanco del ojo).
    navy = np.linalg.norm(p - rb.NAVY, axis=-1) < 95
    color = torre & ~navy & (alfa > 0.5)
    franja = (dist > rb.R_INTERIOR - 8) & (dist < rb.R_EXTERIOR + 16)
    pegado = ndimage.binary_dilation(color, iterations=9)
    torre &= ~(franja & navy & ~pegado)
    # Quita los restos sueltos que queden.
    et, n = ndimage.label(torre & (alfa > 0.3))
    if n:
        tam = ndimage.sum(torre, et, range(1, n + 1))
        torre &= ndimage.binary_dilation(np.isin(et, [i + 1 for i, t in enumerate(tam) if t >= 400]), iterations=2)
    return rgb, alfa, torre


def limpiar_contorno_ia(reg, clave, alfa):
    """La IA no dibuja un círculo perfecto (a veces un óvalo): su contorno queda dentro o fuera del
    círculo vectorial y aparece doble. Se borra (a) el fondo blanco conectado con el borde de la
    imagen, también dentro del círculo, y (b) el azul que separa ese fondo del naranja del disco
    (el contorno IA de la cabeza). El contorno lo dibuja la cabeza vectorial."""
    p = np.array(reg, float)
    casi_blanco = np.linalg.norm(p - 255, axis=-1) < 40
    borde = np.zeros_like(casi_blanco); borde[0, :] = borde[-1, :] = borde[:, 0] = borde[:, -1] = True
    fondo = ndimage.binary_propagation(borde & casi_blanco, mask=casi_blanco)
    navy = np.linalg.norm(p - rb.NAVY, axis=-1) < 110
    naranja = np.linalg.norm(p - clave, axis=-1) < 45
    cerca_f = ndimage.binary_dilation(fondo, iterations=14)
    cerca_n = ndimage.binary_dilation(naranja, iterations=14)
    linea = navy & cerca_f & cerca_n
    linea = ndimage.binary_dilation(linea, iterations=2) & (navy | ~ndimage.binary_dilation(~navy & ~fondo & ~naranja, iterations=0))
    return np.where(fondo | linea, 0.0, alfa)


def procesar_cara(img, disco, especie, nombre, destino, cfg):
    cx, cy, r, clave = disco
    reg = rb.registrar(img, cx, cy, r)
    rgb, alfa = rb.recortar(reg, clave, False)
    entrada = {'registro': {'centroPx': [round(cx, 1), round(cy, 1)], 'radioInteriorPx': round(r, 1), 'claveNaranja': [int(x) for x in clave]}}
    if cfg['torretas']:
        rgb_t, alfa_t, torre = torretas(reg, clave, cfg)
        rgb = np.where(torre[..., None], rgb_t, rgb)
        alfa = np.where(torre, alfa_t, alfa)
        alfa = limpiar_contorno_ia(reg, clave, alfa)
        entrada['torretas'] = {'archivo': f'{nombre}-torretas.webp', 'encuadre': rb.guardar(rgb, alfa, torre, os.path.join(destino, f'{nombre}-torretas.webp'))}
        entrada['rostro'] = {'archivo': f'{nombre}-rostro.webp', 'encuadre': rb.guardar(rgb, alfa, ~torre, os.path.join(destino, f'{nombre}-rostro.webp'))}
        entrada['ojos'] = []
        return entrada, (rgb, alfa, [torre])
    ojos = rb.separar_ojos(alfa, rgb)
    resto = np.ones_like(alfa, bool)
    for m in ojos:
        if m is not None:
            resto &= ~m
    entrada['rostro'] = {'archivo': f'{nombre}-rostro.webp', 'encuadre': rb.guardar(rgb, alfa, resto, os.path.join(destino, f'{nombre}-rostro.webp'))}
    entrada['ojos'] = []
    for i, m in enumerate(ojos):
        if m is None:
            entrada['ojos'].append(None)
            continue
        enc = rb.guardar(rgb, alfa, m, os.path.join(destino, f'{nombre}-ojo-{i}.webp'))
        cyx = ndimage.center_of_mass(m)
        entrada['ojos'].append({'archivo': f'{nombre}-ojo-{i}.webp', 'encuadre': enc,
                                'centro': [round(rb.ENCUADRE[0] + cyx[1] / rb.PX, 1), round(rb.ENCUADRE[1] + cyx[0] / rb.PX, 1)]})
    return entrada, (rgb, alfa, ojos)


def main():
    propuestas = '--propuestas' in sys.argv
    pedidas = [a for a in sys.argv[1:] if not a.startswith('--')] or list(ESPECIES)
    for especie in pedidas:
        cfg = ESPECIES[especie]
        configurar(cfg)
        rev = os.path.join(rb.REV, cfg['carpeta'])
        os.makedirs(os.path.join(rev, 'piezas'), exist_ok=True)
        if propuestas:
            caras, tmp = [], os.path.join(rev, 'piezas', 'tmp')
            os.makedirs(tmp, exist_ok=True)
            for f in sorted(glob.glob(os.path.join(rev, 'ia', 'propuesta-*.png'))):
                img = Image.open(f)
                ds = rb.discos(np.array(img.convert('RGB')).astype(float))
                _, datos = procesar_cara(img, ds[0], especie, os.path.basename(f)[:-4], tmp, cfg)
                caras.append((os.path.basename(f)[10:-4], datos))
            rb.control(caras, os.path.join(rev, 'piezas', 'control-propuestas.png'), f'{especie}: propuestas IA recortadas (cian = capa de ojo/torreta; cruz = centro de búsqueda)')
            shutil.rmtree(tmp)
            continue
        destino = os.path.join(rb.RECURSOS, especie, 'rostro-v2')
        os.makedirs(destino, exist_ok=True)
        for f in glob.glob(os.path.join(destino, '*.webp')):
            os.remove(f)
        manifiesto = {'especie': especie, 'version': 'rostro-v2', 'estado': 'laboratorio — iteración 2, pendiente de aprobación del usuario',
                      'unidades': 'viewBox de la base (0 0 1000 650); coordenadas absolutas de la cabeza (736,340 r130)',
                      'formato': f'raster WebP con alfa, {rb.PX} px por unidad, calidad {rb.CALIDAD}; maestros IA en docs/rediseno-ciempi/revisiones/{cfg["carpeta"]}/ia',
                      'capas': ({'rostro': '#mouth (boca, mejillas de escamas)', 'torretas': '#b03-brows (conos y ojo en la punta; no parpadean)'} if cfg['torretas'] else
                                {'rostro': '#mouth (cejas, boca, lengüita, marcas)', 'ojos': '#eyes, eye-i (parpadea) o eyelids'}),
                      'parpadea': not cfg['torretas'], 'porDefecto': 'b03-alegre', 'expresiones': {}, 'fuentes': {}}
        caras = []
        for n, hoja in enumerate(cfg['hojas'], 1):
            ruta = os.path.join(rev, 'ia', f'hoja-{n}.png')
            if not os.path.exists(ruta):
                print('falta', ruta)
                continue
            img = Image.open(ruta)
            ds = rb.discos(np.array(img.convert('RGB')).astype(float))
            if len(ds) != 4:
                print(f'{ruta}: {len(ds)} discos (se esperaban 4)')
            manifiesto['fuentes'][f'hoja-{n}'] = {'archivo': os.path.relpath(ruta, rb.RAIZ), 'sha256': rb.sha(ruta), 'expresiones': hoja}
            for nombre, disco in zip(hoja, ds):
                entrada, datos = procesar_cara(img, disco, especie, nombre, destino, cfg)
                entrada['fuente'] = f'hoja-{n}'
                caras.append((nombre, datos))
                manifiesto['expresiones'][nombre] = entrada
        for nombre in list(manifiesto['expresiones']):
            base = nombre.replace('-alt', '').replace('-sinlengua', '')
            if nombre == ELECCION[especie].get(base, base):
                manifiesto['expresiones'][nombre]['b03'] = 'b03-' + base
        manifiesto['bytesTotales'] = sum(os.path.getsize(os.path.join(destino, f)) for f in os.listdir(destino) if f.endswith('.webp'))
        json.dump(manifiesto, open(os.path.join(destino, 'manifiesto.json'), 'w'), indent=1, ensure_ascii=False)
        rb.control(caras, os.path.join(rev, 'piezas', 'control-recortes.png'), f'{especie}: rostros iteración 2 (cian = capa de ojo/torreta)')
        print(especie, len(caras), 'rostros,', manifiesto['bytesTotales'], 'bytes')


if __name__ == '__main__':
    main()
