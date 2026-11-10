#!/usr/bin/env python3
"""Héroes de Ciempi: escribe las medidas v4.2 de botas (V4_CALZADO) y mochilas (V4_MOCHILAS y `medidas`)
en src/ciempi/v2/arte/{zapatos,mochilas}-v4.js y en laboratorio-transformaciones/accesorios-v4-datos.js.
Paso 4 del README del Capitán Ciempi, automatizado. Idempotente: reemplaza la línea de cada id.
- BOCAS: abertura de cada bota en px del recurso de 512 px (medida sobre cuadrícula, calibrada con la del
  Capitán Ciempi): izq/der = extremos de la abertura interior a media altura, labio = punto más bajo del
  labio delantero, arriba = borde superior del ribete. `suela` y `px` vienen de medidas.json (procesar.py).
- Mochilas: como el escudo del Capitán (alto 160, centro [-80,-62], giro -10, correas estándar), con el
  color de correa de cada conjunto.
Uso (desde la raíz): python3 docs/expansion-v10/heroes/aplicar-v4.py
"""
import json, os, re

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
med = json.load(open(os.path.join(RAIZ, 'docs/expansion-v10/heroes/medidas.json')))

BOCAS = {  # slug: (ancho, izq, der, labio, arriba)
    'coloso': (84, [55, 48], [275, 48], [165, 77], 4),
    'aracnido': (80, None, None, None, None),
    'ilusionista': (80, [48, 57], [318, 57], [182, 90], 4),
    'solar': (80, [48, 54], [285, 54], [168, 88], 4),
    'nocturno': (80, [45, 49], [295, 49], [170, 80], 5),
    'bromista': (80, [42, 50], [280, 50], [160, 78], 5),
    'esmeralda': (80, [55, 53], [285, 53], [170, 78], 8),
    'sombra': (80, None, None, None, None),
    'travieso': (80, [60, 50], [280, 50], [170, 80], 5),
    'garra': (80, [55, 52], [290, 52], [172, 85], 5),
}
BOCAS_EXTRA = os.path.join(RAIZ, 'docs/expansion-v10/heroes/bocas.json')  # medidas posteriores (aracnido, sombra)
if os.path.exists(BOCAS_EXTRA):
    for k, v in json.load(open(BOCAS_EXTRA)).items():
        BOCAS[k] = tuple(v)
CORREA = {'coloso': '#23252d', 'aracnido': '#2a6fdb', 'bromista': '#4fae3f', 'esmeralda': '#23252d',
          'sombra': '#23252d', 'travieso': '#5a5f6b', 'garra': '#23252d', 'relampago': '#c42a26', 'marino': '#1f9a6b',
          'kpopvioleta': '#7a3dd8', 'kpoprosa': '#23252d', 'kpopazul': '#25c4d6', 'sombrio': '#23252d'}


def poner(texto, clave, linea, ancla):
    """Reemplaza la línea de `clave` o la agrega después de la línea que contiene `ancla`."""
    patron = re.compile(r"^  '" + re.escape(clave) + r"': .*\n", re.M)
    if patron.search(texto):
        return patron.sub(linea + '\n', texto)
    i = texto.index(ancla)
    i = texto.index('\n', i) + 1
    return texto[:i] + linea + '\n' + texto[i:]


def calzado(texto, ancla):
    for s, (ancho, izq, der, labio, arriba) in BOCAS.items():
        if izq is None or s not in med.get('botas', {}):
            continue
        b = med['botas'][s]
        linea = f"  'b10-{s}': {{ px: {json.dumps(b['px']).replace(',', ', ')}, suela: {b['suela']}, ancho: {ancho}, boca: {{ izq: {izq}, der: {der}, labio: {labio}, arriba: {arriba} }} }},".replace("[", "[").replace(",  ", ", ")
        linea = re.sub(r'\[(\d+),\s*(\d+)\]', r'[\1, \2]', linea)
        texto = poner(texto, f'b10-{s}', linea, ancla)
        ancla = f"'b10-{s}'"
    return texto


def mochilas(texto, ancla):
    for s, m in med.get('mochilas', {}).items():
        linea = f"  'b09-{s}': bolsa('{s}', {{ alto: 160, centro: [-80, -62], giro: -10, correas: CORREAS, correa: {{ color: '{CORREA[s]}' }} }}),"
        texto = poner(texto, f'b09-{s}', linea, ancla)
        ancla = f"'b09-{s}'"
    return texto


def medidas_const(texto, var):
    # const medidas = {...} (una línea JSON) en mochilas-v4.js; en accesorios-v4-datos.js lee medidas.json.
    m = re.search(r'^const medidas = (\{.*\})$', texto, re.M)
    if not m:
        return texto
    d = json.loads(m.group(1))
    for s, v in med.get('mochilas', {}).items():
        d[s] = v
    return texto[:m.start(1)] + json.dumps(d, ensure_ascii=False) + texto[m.end(1):]


z = os.path.join(RAIZ, 'src/ciempi/v2/arte/zapatos-v4.js')
t = calzado(open(z).read(), "'b10-cometa'")
open(z, 'w').write(t)
mo = os.path.join(RAIZ, 'src/ciempi/v2/arte/mochilas-v4.js')
t = mochilas(medidas_const(open(mo).read(), 'medidas'), "'b09-cometa'")
open(mo, 'w').write(t)
lab = os.path.join(RAIZ, 'docs/rediseno-ciempi/laboratorio-transformaciones/accesorios-v4-datos.js')
t = open(lab).read()
t = calzado(t, "'b10-cometa'")
t = mochilas(t, "'b09-cometa'")
open(lab, 'w').write(t)
print('botas', [s for s, b in BOCAS.items() if b[1] is not None and s in med.get('botas', {})], 'mochilas', list(med.get('mochilas', {})))
