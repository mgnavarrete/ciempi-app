#!/usr/bin/env python3
"""Une la lámina antes y después en una comparación vertical. Uso: comparar-comida.py <antes.png> <despues.png> <salida.png>"""
import sys
from PIL import Image, ImageDraw
a, b = (Image.open(p).convert('RGB') for p in sys.argv[1:3])
w = max(a.width, b.width)
out = Image.new('RGB', (w, a.height + b.height + 20), 'white')
out.paste(a, (0, 0)); out.paste(b, (0, a.height + 20))
ImageDraw.Draw(out).line([(0, a.height + 10), (w, a.height + 10)], fill=(36, 62, 91), width=4)
out.save(sys.argv[3])
