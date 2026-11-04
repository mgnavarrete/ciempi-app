#!/usr/bin/env python3
"""Recorta los rostros v4 (IA) del Dragón y la Cuncuna para el laboratorio.

Lee los PNG originales de `docs/rediseno-ciempi/revisiones/T0x-*-v4-rostro/ia/` (hojas 2×2 de
expresiones B03 dibujadas sobre un disco naranja plano) y escribe, SIN tocar los recursos v1:
  docs/rediseno-ciempi/laboratorio-transformaciones/recursos/<especie>/v4/
    <expresion>-rostro.webp   capa fija del rostro (hocico, cejas, boca, mejillas…) sin los ojos
    <expresion>-ojo-0.webp    ojo izquierdo (del espectador), para el parpadeo del rig
    <expresion>-ojo-1.webp    ojo derecho
    manifiesto.json           encuadres en unidades de la base (2 px por unidad)
y una lámina de control (`docs/.../T0x-*-v4-rostro/piezas/control-recortes.png`).

Cómo: detecta cada disco (región naranja), lo registra contra la cabeza aprobada
(centro 736,340; borde interior r = 126,5), quita el naranja plano con desmezcla de
alfa (el rostro queda sobre la cabeza vectorial, que sigue tiñéndose con la paleta),
quita el contorno del disco (lo dibuja la cabeza vectorial) y el blanco exterior
(conserva lo que sobresale, como el hocico del Dragón). Los ojos se separan por
componentes conexas cerca de los centros de ojo de la base (rig.js: OJOS_BASE).
No vectoriza ni calca: raster declarado; el maestro IA se conserva.
Uso (desde la raíz): python3 scripts/transformaciones/procesar-rostros-v4.py
"""
import hashlib
import json
import os

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
REV = os.path.join(RAIZ, 'docs/rediseno-ciempi/revisiones')
RECURSOS = os.path.join(RAIZ, 'docs/rediseno-ciempi/laboratorio-transformaciones/recursos')
PX = 2
CALIDAD = 90
CABEZA = (736.0, 340.0)
R_INTERIOR = 126.5           # radio 130 menos medio contorno de 7
R_EXTERIOR = 133.5
ENCUADRE = [596, 196, 320, 290]  # x, y, ancho, alto en unidades: cabeza + hocico que sobresale
OJOS_BASE = [(708, 342), (808, 320)]
NAVY = np.array([36, 62, 91], float)

# Orden pedido en prompts/hoja-N.txt; revisado a ojo: la IA lo respetó en ambas especies.
HOJAS = [['alegre', 'carcajada', 'curioso', 'pensativo'], ['sorprendido', 'dormilon', 'besito', 'guino'],
         ['orgulloso', 'confundido', 'triste', 'enojadito'], ['asustado', 'concentrado', 'alegre-alt', 'sorprendido-alt']]
ESPECIES = {
    'dragon': {'carpeta': 'T01-dragon-v4-rostro', 'propuesta': 'propuesta-d4d-perfil-hocico', 'sobresale': False},  # el hocico apenas pasa el contorno: lo cierra el contorno vectorial
    'cuncuna': {'carpeta': 'T02-cuncuna-v4-rostro', 'propuesta': 'propuesta-c4a-mejillas-pompon', 'sobresale': False},
}
# Elección por expresión cuando hay dos versiones (hoja 4 repite alegre y sorprendido). Se rellena tras revisar.
ELECCION = {'dragon': {}, 'cuncuna': {}}


def sha(ruta):
    return hashlib.sha256(open(ruta, 'rb').read()).hexdigest()[:16]


def hsv(a):
    r, g, b = [a[..., i] / 255.0 for i in range(3)]
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    d = mx - mn + 1e-9
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 0, (mx - mn) / (mx + 1e-9), 0)
    return h, s, mx


def mascara_naranja(a):
    h, s, v = hsv(a)
    return (h > 18) & (h < 42) & (s > 0.55) & (v > 0.78)


def discos(a):
    """Discos naranjas de la imagen: (cx, cy, r_interior, color clave) en píxeles."""
    m = ndimage.binary_closing(mascara_naranja(a), iterations=2)
    et, n = ndimage.label(m)
    out = []
    for i in range(1, n + 1):
        zona = et == i
        if zona.sum() < a.shape[0] * a.shape[1] * 0.04:
            continue
        lleno = ndimage.binary_fill_holes(zona)
        ys, xs = np.nonzero(lleno)
        top, bot, left = ys.min(), ys.max(), xs.min()
        r = (bot - top + 1) / 2
        cy = (top + bot) / 2
        cx = left + r
        # Ajuste fino por mínimos cuadrados al borde interior del contorno (la IA no dibuja un círculo perfecto).
        borde = lleno & ~ndimage.binary_erosion(lleno)
        by, bx = np.nonzero(borde)
        for _ in range(4):
            d = np.hypot(bx - cx, by - cy)
            ok = np.abs(d - r) < max(3, 0.03 * r)
            A = np.c_[2 * bx[ok], 2 * by[ok], np.ones(ok.sum())]
            sol = np.linalg.lstsq(A, bx[ok] ** 2 + by[ok] ** 2, rcond=None)[0]
            cx, cy = sol[0], sol[1]
            r = np.sqrt(sol[2] + cx ** 2 + cy ** 2)
        clave = np.median(a[zona][:, :3], axis=0)
        out.append((cx, cy, r, clave))
    return sorted(out, key=lambda d: (round(d[1] / (a.shape[0] / 3)), d[0]))


def registrar(img, cx, cy, r):
    """Remuestrea la imagen IA al encuadre en unidades de la base (2 px por unidad)."""
    k = r / R_INTERIOR  # píxeles IA por unidad
    w, h = ENCUADRE[2] * PX, ENCUADRE[3] * PX
    # px_ia = cx + (u - 736) * k, con u = E0 + x_out / PX
    a = k / PX
    c = cx + (ENCUADRE[0] - CABEZA[0]) * k
    f = cy + (ENCUADRE[1] - CABEZA[1]) * k
    return img.convert('RGB').transform((w, h), Image.AFFINE, (a, 0, c, 0, a, f), resample=Image.BICUBIC, fillcolor=(255, 255, 255))


def desmezclar(p, clave, t0, t1):
    d = np.linalg.norm(p - clave, axis=-1)
    alfa = np.clip((d - t0) / (t1 - t0), 0, 1)
    f = (p - (1 - alfa[..., None]) * clave) / np.maximum(alfa[..., None], 1e-3)
    return np.clip(f, 0, 255), alfa


def recortar(im_reg, clave, sobresale):
    p = np.array(im_reg, float)
    H, W = p.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    ux, uy = ENCUADRE[0] + (xx + 0.5) / PX, ENCUADRE[1] + (yy + 0.5) / PX
    dist = np.hypot(ux - CABEZA[0], uy - CABEZA[1])
    f_n, a_n = desmezclar(p, clave, 14, 40)
    f_b, a_b = desmezclar(p, np.array([255.0, 255, 255]), 6, 30)
    dentro = dist < R_INTERIOR - 2.5
    banda = (dist >= R_INTERIOR - 2.5) & (dist < R_EXTERIOR + 4)
    fuera = dist >= R_EXTERIOR + 4
    # Fondo blanco: solo el conectado con el borde del encuadre (el crema encerrado por un contorno no es fondo).
    casi_blanco = np.linalg.norm(p - 255, axis=-1) < 40
    borde = np.zeros_like(casi_blanco); borde[0, :] = borde[-1, :] = borde[:, 0] = borde[:, -1] = True
    fondo = ndimage.binary_propagation(borde & casi_blanco, mask=casi_blanco)
    rgb = np.where(dentro[..., None], f_n, np.where(fondo[..., None], f_b, p))
    alfa = np.where(dentro, a_n, np.where(fondo, a_b, 1.0))
    if sobresale:
        # Lo que sobresale a la derecha (hocico) y toca el contorno de la cabeza; el resto de fuera (celdas vecinas) se quita.
        opaco = (fuera | banda) & ~fondo
        et, n = ndimage.label(opaco)
        toca = set(np.unique(et[(dist < R_INTERIOR + 1) & opaco])) - {0}
        lados = [i for i in range(1, n + 1) if i in toca]
        conectado = np.isin(et, lados) & (ux > CABEZA[0] + 40)
        claro = np.linalg.norm(p - NAVY, axis=-1) > 110
        # En la banda del contorno queda solo lo claro del hocico (el azul del contorno lo dibuja la cabeza vectorial).
        alfa = np.where(banda, np.where(conectado & claro & (dist < R_EXTERIOR + 4), 1.0, 0.0), alfa)
        rgb = np.where(banda[..., None], p, rgb)
        alfa = np.where(fuera & ~(conectado & ~fondo), np.where(fuera & conectado, alfa, 0.0), alfa)
        # Fuera: solo lo que pertenece a esa región conectada de la derecha (con su borde antialias).
        cerca = ndimage.binary_dilation(conectado & fuera, iterations=2)
        alfa = np.where(fuera & ~cerca, 0.0, alfa)
    else:
        alfa = np.where(fuera | banda, 0.0, alfa)
    # Restos del contorno IA junto al borde (la IA no dibuja un círculo perfecto): arcos azules DELGADOS
    # pegados al borde en los últimos 7 unidades. Lo grueso (boca, narinas) se conserva.
    oscuro = (np.linalg.norm(rgb - NAVY, axis=-1) < 90) & (alfa > 0.3) & (dist > R_INTERIOR - 7)
    et, n = ndimage.label(oscuro)
    if n:
        grosor = ndimage.maximum(ndimage.distance_transform_edt(oscuro), et, range(1, n + 1))
        al_borde = set(np.unique(et[oscuro & (dist > R_INTERIOR - 4)])) - {0}
        finos = [i for i in al_borde if grosor[i - 1] <= 4.5]
        resto = np.isin(et, finos)
        alfa = np.where(ndimage.binary_dilation(resto, iterations=1) & (dist > R_INTERIOR - 8), 0.0, alfa)
    # Franja del borde: solo se conserva lo que pertenece a un rasgo que entra en el rostro
    # (hocico, boca); los restos del contorno IA y su halo, no.
    solido = alfa > 0.12
    et, n = ndimage.label(solido)
    if n:
        hondos = set(np.unique(et[solido & (dist < R_INTERIOR - 14)])) - {0}
        superficial = solido & ~np.isin(et, list(hondos)) & (dist > R_INTERIOR - 14)
        alfa = np.where(ndimage.binary_dilation(superficial, iterations=1) & (dist > R_INTERIOR - 15), 0.0, alfa)
    # Franja de 10 unidades junto al borde: solo queda lo que rodea al crema del hocico
    # (su contorno, la boca y las narinas que llegan al borde); el resto es contorno IA.
    _, sat, val = hsv(rgb)
    hocico = mascara_hocico(rgb, alfa)
    crema = hocico
    protegido = ndimage.binary_dilation(hocico, iterations=10)
    # Manchas gruesas (boca abierta, lengua): la apertura morfológica borra lo delgado (arcos del contorno).
    grueso = ndimage.binary_opening((alfa > 0.5) & ~crema & (dist < R_INTERIOR - 12), iterations=5)
    eg, ng = ndimage.label(grueso)
    if ng:  # solo manchas dentro del hocico (la boca), no cejas ni trozos del contorno IA pegados al borde
        grueso = np.isin(eg, list(set(np.unique(eg[grueso & (dist < R_INTERIOR - 22) & ndimage.binary_dilation(hocico, iterations=25)])) - {0}))
    protegido |= ndimage.binary_dilation(grueso, iterations=7)
    alfa = np.where((dist > R_INTERIOR - 10) & ~protegido, 0.0, alfa)
    # Sin manchas sueltas.
    solido = alfa > 0.5
    et, n = ndimage.label(solido)
    if n:
        tam = ndimage.sum(solido, et, range(1, n + 1))
        chicas = np.isin(et, [i + 1 for i, t in enumerate(tam) if t < 30])
        alfa = np.where(ndimage.binary_dilation(chicas, iterations=1) & ~ndimage.binary_dilation(solido & ~chicas, iterations=1), 0, alfa)
    return rgb, alfa


def mascara_hocico(rgb, alfa):
    """La mayor mancha crema (hocico del Dragón); el blanco de los ojos tiene menos saturación."""
    _, sat, val = hsv(rgb)
    crema = (val > 0.85) & (sat > 0.09) & (sat < 0.35) & (alfa > 0.5)
    et, n = ndimage.label(crema)
    if not n:
        return crema
    tam = ndimage.sum(crema, et, range(1, n + 1))
    i = int(np.argmax(tam))
    return et == i + 1 if tam[i] > 4000 else np.zeros_like(crema)


def separar_ojos(alfa, rgb):
    """Componentes de cada ojo (máscara) cerca de los centros de ojo de la base.
    Las mejillas (pompones coral) que tocan el ojo se quedan en la capa fija: no parpadean."""
    h, sat, v = hsv(rgb)
    mejilla = ((h > 330) | (h < 12)) & (sat > 0.35) & (v > 0.75) & (alfa > 0.5)
    mejilla = ndimage.binary_opening(mejilla, iterations=2)
    mejilla = ndimage.binary_dilation(ndimage.binary_fill_holes(mejilla), iterations=9)
    solido = (alfa > 0.35) & ~mejilla & ~ndimage.binary_dilation(mascara_hocico(rgb, alfa), iterations=6)
    et, n = ndimage.label(solido)
    centros = ndimage.center_of_mass(solido, et, range(1, n + 1)) if n else []
    tam = ndimage.sum(solido, et, range(1, n + 1)) if n else []
    ojos = []
    for ox, oy in OJOS_BASE:
        mejor, mejor_t = None, 0
        for i, (cy, cx) in enumerate(centros):
            ux, uy = ENCUADRE[0] + cx / PX, ENCUADRE[1] + cy / PX
            if abs(ux - ox) < 48 and -36 < uy - oy < 42 and tam[i] > mejor_t and tam[i] > 500:
                mejor, mejor_t = i + 1, tam[i]
        if mejor is None:
            ojos.append(None)
            continue
        m = et == mejor
        m = ndimage.binary_fill_holes(m)
        # Incluye el borde antialias.
        ojos.append(ndimage.binary_dilation(m, iterations=2) & ~ndimage.binary_erosion(mejilla, iterations=8))
    return ojos


def guardar(rgb, alfa, mascara, ruta):
    a = np.where(mascara, alfa, 0)
    ys, xs = np.nonzero(a > 0.01)
    if not len(ys):
        return None
    y0, y1, x0, x1 = max(ys.min() - 2, 0), min(ys.max() + 3, a.shape[0]), max(xs.min() - 2, 0), min(xs.max() + 3, a.shape[1])
    img = np.dstack([rgb, a * 255]).astype(np.uint8)[y0:y1, x0:x1]
    Image.fromarray(img, 'RGBA').save(ruta, 'WEBP', quality=CALIDAD, method=6)
    return [ENCUADRE[0] + x0 / PX, ENCUADRE[1] + y0 / PX, (x1 - x0) / PX, (y1 - y0) / PX]


def procesar_cara(img, disco, especie, nombre, destino):
    cx, cy, r, clave = disco
    reg = registrar(img, cx, cy, r)
    rgb, alfa = recortar(reg, clave, ESPECIES[especie]['sobresale'])
    ojos = separar_ojos(alfa, rgb)
    resto = np.ones_like(alfa, bool)
    for m in ojos:
        if m is not None:
            resto &= ~m
    entrada = {'rostro': {'archivo': f'{nombre}-rostro.webp', 'encuadre': guardar(rgb, alfa, resto, os.path.join(destino, f'{nombre}-rostro.webp'))}, 'ojos': []}
    for i, m in enumerate(ojos):
        if m is None:
            entrada['ojos'].append(None)
            continue
        enc = guardar(rgb, alfa, m, os.path.join(destino, f'{nombre}-ojo-{i}.webp'))
        cyx = ndimage.center_of_mass(m)
        entrada['ojos'].append({'archivo': f'{nombre}-ojo-{i}.webp', 'encuadre': enc,
                                'centro': [round(ENCUADRE[0] + cyx[1] / PX, 1), round(ENCUADRE[1] + cyx[0] / PX, 1)]})
    entrada['registro'] = {'centroPx': [round(cx, 1), round(cy, 1)], 'radioInteriorPx': round(r, 1), 'pxIaPorUnidad': round(r / R_INTERIOR, 3),
                           'claveNaranja': [int(x) for x in clave]}
    return entrada, (rgb, alfa, ojos)


def control(caras, ruta, titulo):
    """Lámina de control: cada rostro sobre la cabeza vectorial simplificada, ojos marcados en cian."""
    W, H = ENCUADRE[2] * PX, ENCUADRE[3] * PX
    cols = 4
    filas = (len(caras) + cols - 1) // cols
    hoja = Image.new('RGB', (cols * (W + 10) + 10, filas * (H + 30) + 40), (250, 247, 238))
    d = ImageDraw.Draw(hoja)
    d.text((10, 10), titulo, fill=(36, 62, 91))
    for k, (nombre, (rgb, alfa, ojos)) in enumerate(caras):
        x0, y0 = 10 + (k % cols) * (W + 10), 40 + (k // cols) * (H + 30)
        fondo = Image.new('RGBA', (W, H), (255, 255, 255, 255))
        dc = ImageDraw.Draw(fondo)
        c = ((CABEZA[0] - ENCUADRE[0]) * PX, (CABEZA[1] - ENCUADRE[1]) * PX)
        dc.ellipse([c[0] - 130 * PX, c[1] - 130 * PX, c[0] + 130 * PX, c[1] + 130 * PX], fill=(255, 158, 50), outline=(36, 62, 91), width=7 * PX)
        capa = np.dstack([rgb, alfa * 255]).astype(np.uint8)
        fondo.alpha_composite(Image.fromarray(capa, 'RGBA'))
        for m in ojos:
            if m is not None:
                borde = m & ~ndimage.binary_erosion(m, iterations=2)
                arr = np.array(fondo)
                arr[borde] = [0, 200, 255, 255]
                fondo = Image.fromarray(arr)
        dc = ImageDraw.Draw(fondo)
        for ox, oy in OJOS_BASE:
            px, py = (ox - ENCUADRE[0]) * PX, (oy - ENCUADRE[1]) * PX
            dc.line([px - 6, py, px + 6, py], fill=(255, 0, 120), width=2)
            dc.line([px, py - 6, px, py + 6], fill=(255, 0, 120), width=2)
        hoja.paste(fondo.convert('RGB'), (x0, y0))
        d.text((x0, y0 + H + 4), nombre, fill=(36, 62, 91))
    hoja.save(ruta)


def main():
    import sys
    solo_propuestas = '--propuestas' in sys.argv
    # Iteración 2 (revisión independiente): hojas en ia/it2, recursos en <especie>/v4b, sin tocar v4.
    it2 = '--it2' in sys.argv
    sub, version, sufijo = ('it2', 'v4b', '-it2') if it2 else ('', 'v4', '')
    if it2:
        ESPECIES['dragon']['propuesta'] = 'it2/propuesta-d5a-hocico-3cuartos'
        ESPECIES['cuncuna']['propuesta'] = 'it2/propuesta-c5a-sobria'
    for especie, cfg in ESPECIES.items():
        rev = os.path.join(REV, cfg['carpeta'])
        os.makedirs(os.path.join(rev, 'piezas'), exist_ok=True)
        if solo_propuestas:
            import glob
            caras = []
            tmp = os.path.join(rev, 'piezas', 'tmp')
            os.makedirs(tmp, exist_ok=True)
            for f in sorted(glob.glob(os.path.join(rev, 'ia', 'propuesta-*.png'))):
                img = Image.open(f)
                ds = discos(np.array(img.convert('RGB')).astype(float))
                _, datos = procesar_cara(img, ds[0], especie, os.path.basename(f)[:-4], tmp)
                caras.append((os.path.basename(f)[10:-4], datos))
            control(caras, os.path.join(rev, 'piezas', 'control-propuestas.png'), f'{especie}: propuestas IA recortadas sobre la cabeza (cian = ojo separado; cruz = centro de ojo del rig)')
            import shutil
            shutil.rmtree(tmp)
            continue
        destino = os.path.join(RECURSOS, especie, version)
        os.makedirs(destino, exist_ok=True)
        manifiesto = {'especie': especie, 'version': version, 'estado': 'laboratorio — rostro v4 pendiente de aprobación del usuario',
                      'unidades': 'viewBox de la base (0 0 1000 650); coordenadas absolutas de la cabeza (736,340 r130)',
                      'formato': f'raster WebP con alfa, {PX} px por unidad, calidad {CALIDAD}; maestros IA en docs/rediseno-ciempi/revisiones/{cfg["carpeta"]}/ia/{sub}',
                      'capas': {'rostro': 'grupo #mouth (hocico, cejas, boca, mejillas; fijo por expresión)',
                                'ojos': 'grupo #eyes, un grupo data-component="eye-i" por ojo abierto (parpadeo del rig) o "eyelids" si la expresión B03 lo cierra'},
                      'diseno': cfg['propuesta'], 'porDefecto': 'b03-alegre', 'expresiones': {}, 'fuentes': {}}
        caras = []
        for n, hoja in enumerate(HOJAS, 1):
            ruta = os.path.join(rev, 'ia', sub, f'hoja-{n}.png')
            if not os.path.exists(ruta):
                print('falta', ruta)
                continue
            img = Image.open(ruta)
            ds = discos(np.array(img.convert('RGB')).astype(float))
            if len(ds) != 4:
                print(f'{ruta}: {len(ds)} discos (se esperaban 4)')
            manifiesto['fuentes'][f'hoja-{n}'] = {'archivo': f'docs/rediseno-ciempi/revisiones/{cfg["carpeta"]}/ia/{sub + "/" if sub else ""}hoja-{n}.png', 'sha256': sha(ruta), 'expresiones': hoja}
            for nombre, disco in zip(hoja, ds):
                entrada, datos = procesar_cara(img, disco, especie, nombre, destino)
                entrada['fuente'] = f'hoja-{n}'
                caras.append((nombre, datos))
                manifiesto['expresiones'][nombre] = entrada
        # Expresiones B03 → recorte elegido (las «-alt» son segundas versiones).
        for nombre in list(manifiesto['expresiones']):
            base = nombre.replace('-alt', '')
            elegido = ELECCION[especie].get(base, base)
            if nombre == elegido:
                manifiesto['expresiones'][nombre]['b03'] = 'b03-' + base
        manifiesto['bytesTotales'] = sum(os.path.getsize(os.path.join(destino, f)) for f in os.listdir(destino) if f.endswith('.webp'))
        json.dump(manifiesto, open(os.path.join(destino, 'manifiesto.json'), 'w'), indent=1, ensure_ascii=False)
        control(caras, os.path.join(rev, 'piezas', f'control-recortes{sufijo}.png'), f'{especie}: rostros {version} recortados (cian = ojo separado para el parpadeo; cruz = centro de ojo del rig)')
        print(especie, len(caras), 'rostros,', manifiesto['bytesTotales'], 'bytes')


if __name__ == '__main__':
    main()
