"""Lámina de imágenes con rótulo: python3 lamina.py <salida.png> <columnas> <ancho_celda> <titulo> img1[:rótulo] ..."""
import sys
from PIL import Image, ImageDraw, ImageFont

salida, cols, ancho, titulo, *items = sys.argv[1:]
cols, ancho = int(cols), int(ancho)
try:
    fuente = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
    grande = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
except OSError:
    fuente = grande = ImageFont.load_default()
celdas = []
for it in items:
    ruta, _, rotulo = it.partition('::')
    im = Image.open(ruta).convert('RGB')
    im = im.resize((ancho, round(im.height * ancho / im.width)), Image.LANCZOS)
    celdas.append((im, rotulo or ruta.rsplit('/', 1)[-1]))
alto = max(c[0].height for c in celdas)
filas = (len(celdas) + cols - 1) // cols
m, cab, pie = 24, 64, 40
L = Image.new('RGB', (m + cols * (ancho + m), cab + filas * (alto + pie + m)), '#fbf6ec')
d = ImageDraw.Draw(L)
d.text((m, 16), titulo, fill='#243e5b', font=grande)
for i, (im, rot) in enumerate(celdas):
    x, y = m + (i % cols) * (ancho + m), cab + (i // cols) * (alto + pie + m)
    L.paste(im, (x, y))
    d.text((x, y + im.height + 8), rot, fill='#243e5b', font=fuente)
L.save(salida, optimize=True)
print(salida, L.size)
