#!/usr/bin/env python3
"""Ojos k3 «Atardecer» del Camaleón como capa compartida (V5, AD-020).

Recorta las dos torretas del concepto k3 (T04-camaleon-v1/ia/concepto-k3-atardecer.png)
SIN redibujarlas: misma forma, volumen, anillos en relieve, perspectiva y proporción.
El ojo (blanco + pupila) se sustituye por un «párpado» del color del anillo frontal:
encima va el ojo vectorial B03 (que parpadea con el rig y cambia con cada expresión);
con el ojo cerrado se ve ese párpado, nunca el ojo viejo del concepto.

Salida (nueva, no sobrescribe nada): recursos/camaleon/ojos-k3/{torreta-izq,torreta-der}.webp
+ manifiesto.json con el encuadre en coordenadas de la cabeza (736,340 r130) y el centro y
radios del ojo de cada torreta.
Uso: python3 scripts/transformaciones/v5/procesar-ojos-k3.py
"""
import json, hashlib, pathlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as nd

RAIZ = pathlib.Path(__file__).resolve().parents[3]
FUENTE = RAIZ / 'docs/rediseno-ciempi/revisiones/T04-camaleon-v1/ia/concepto-k3-atardecer.png'
SALIDA = RAIZ / 'docs/rediseno-ciempi/laboratorio-transformaciones/recursos/camaleon/ojos-k3'
# Cabeza del concepto (medida sobre el contorno): centro y radio del trazo, en px.
CABEZA_PX, RADIO_PX = (1135.0, 508.0), 212.0
U = 130.0 / RADIO_PX            # unidades de la base por px del concepto
PX_POR_U = 2                    # como el resto de recursos: 2 px por unidad
# Torretas: caja de recorte, semilla dentro del anillo y caja del blanco del ojo (medidas).
TORRETAS = {
    'torreta-izq': dict(caja=(930, 395, 1195, 615), semilla=(985, 505), ojo=(1056, 448, 1166, 566)),
    'torreta-der': dict(caja=(1225, 345, 1395, 515), semilla=(1270, 430), ojo=(1296, 392, 1369, 483), limite=(1312, 432, 75)),
}

def main():
    im = np.array(Image.open(FUENTE).convert('RGBA')).astype(np.int32)
    SALIDA.mkdir(parents=True, exist_ok=True)
    rgb = im[..., :3]; alfa = im[..., 3]
    oscuro = (alfa > 100) & (rgb.mean(-1) < 85)
    man = {'especie': 'camaleon', 'capa': 'ojos-k3', 'estado': 'laboratorio V5 — ojos k3 compartidos por todas las variantes (AD-020)',
           'unidades': 'viewBox de la base (0 0 1000 650); coordenadas absolutas de la cabeza (736,340 r130)',
           'fuente': str(FUENTE.relative_to(RAIZ)), 'fuenteSha256': hashlib.sha256(FUENTE.read_bytes()).hexdigest()[:16],
           'metodo': 'recorte del concepto sin redibujar; ojo sustituido por párpado del color del anillo frontal', 'torretas': {}}
    for nombre, t in TORRETAS.items():
        x0, y0, x1, y1 = t['caja']
        sub = im[y0:y1, x0:x1].copy(); osc = oscuro[y0:y1, x0:x1]
        # 1) Interior de la torreta: relleno desde la semilla, limitado por el contorno oscuro.
        lab, _ = nd.label(~osc)
        sx, sy = t['semilla'][0] - x0, t['semilla'][1] - y0
        region = lab == lab[sy, sx]
        yy, xx = np.mgrid[0:sub.shape[0], 0:sub.shape[1]]
        if 'limite' in t:  # la torreta derecha toca la piel de la cabeza: se limita a su círculo
            lx, ly, lr = t['limite']
            region &= (xx - (lx - x0)) ** 2 + (yy - (ly - y0)) ** 2 <= lr ** 2
        region = nd.binary_fill_holes(region | (nd.binary_dilation(region, iterations=2) & osc))
        # 2) Más el contorno propio (oscuro a ≤ 8 px del interior), con borde suave.
        mascara = region | (nd.binary_dilation(region, iterations=8) & osc)
        mascara = nd.binary_fill_holes(mascara)
        # Contorno navy continuo en el borde de la silueta donde el concepto no lo traza
        # (la torreta derecha se funde con la piel de la cabeza en el concepto).
        borde = mascara & ~nd.binary_erosion(mascara, iterations=6) & ~osc
        sub[..., :3] = np.where(borde[..., None], np.array([36, 62, 91]), sub[..., :3])
        # 3) Párpado: elipse del ojo (blanco + su contorno) pintada con el anillo frontal.
        ex0, ey0, ex1, ey1 = [v - o for v, o in zip(t['ojo'], (x0, y0, x0, y0))]
        cx, cy, rx, ry = (ex0 + ex1) / 2, (ey0 + ey1) / 2, (ex1 - ex0) / 2, (ey1 - ey0) / 2
        d = ((xx - cx) / (rx + 9)) ** 2 + ((yy - cy) / (ry + 9)) ** 2
        anillo = (d > 1.15) & (d < 1.6) & region & ~osc
        color = np.median(sub[anillo][:, :3], axis=0)
        dentro = d <= 1.0
        # Sombreado del párpado: más oscuro arriba (pliegue), brillo suave abajo; contorno navy fino.
        k = np.clip((yy - (cy - ry)) / (2 * ry + 1), 0, 1)
        tono = color[None, None, :] * (0.82 + 0.22 * k[..., None])
        # Contorno del párpado antialiasado (dibujado a 4x y reducido).
        S4 = 4
        aro = Image.new('L', (sub.shape[1] * S4, sub.shape[0] * S4), 0)
        dr = ImageDraw.Draw(aro)
        caja4 = [(cx - rx - 9) * S4, (cy - ry - 9) * S4, (cx + rx + 9) * S4, (cy + ry + 9) * S4]
        dr.ellipse(caja4, fill=255)
        relleno = np.array(aro.resize((sub.shape[1], sub.shape[0]), Image.LANCZOS)) / 255.0
        dr.ellipse([caja4[0] + 6 * S4, caja4[1] + 6 * S4, caja4[2] - 6 * S4, caja4[3] - 6 * S4], fill=0)
        linea = np.array(aro.resize((sub.shape[1], sub.shape[0]), Image.LANCZOS)) / 255.0
        base = sub[..., :3].astype(float)
        base = base * (1 - relleno[..., None]) + np.clip(tono, 0, 255) * relleno[..., None]
        base = base * (1 - linea[..., None]) + np.array([36, 62, 91]) * linea[..., None]
        sub[..., :3] = base
        sub[..., 3] = np.where(mascara, 255, 0)
        img = Image.fromarray(sub.astype(np.uint8), 'RGBA')
        a = img.getchannel('A').filter(ImageFilter.GaussianBlur(0.8)); img.putalpha(a)
        bb = a.getbbox(); img = img.crop(bb)
        ox, oy = x0 + bb[0], y0 + bb[1]
        f = PX_POR_U * U
        img = img.resize((round(img.width * f), round(img.height * f)), Image.LANCZOS)
        img.save(SALIDA / f'{nombre}.webp', 'WEBP', quality=92, method=6)
        aU = lambda px, py: [round(736 + (px - CABEZA_PX[0]) * U, 2), round(340 + (py - CABEZA_PX[1]) * U, 2)]
        man['torretas'][nombre] = {
            'archivo': f'{nombre}.webp', 'px': list(img.size),
            'encuadre': aU(ox, oy) + [round(img.width / PX_POR_U, 2), round(img.height / PX_POR_U, 2)],
            'ojo': aU(x0 + cx, y0 + cy) + [round(rx * U, 2), round(ry * U, 2)],
            'colorParpado': '#%02x%02x%02x' % tuple(int(c) for c in color),
        }
    (SALIDA / 'manifiesto.json').write_text(json.dumps(man, ensure_ascii=False, indent=1) + '\n')
    print(json.dumps(man['torretas'], indent=1))

if __name__ == '__main__':
    main()
