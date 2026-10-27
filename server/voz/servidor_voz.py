"""
Voz de Ciempi: genera el audio de una palabra o frase con Piper (voz neuronal,
sin internet). Solo escucha en 127.0.0.1: lo usa el servidor de Ciempi
(GET /api/voz), que además guarda lo generado.

    GET /voz?texto=despacio&voz=nino&velocidad=1.0  →  audio/wav

Instalación y servicio: deploy/instalar-voz.sh.
"""

import io
import os
import threading
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

import numpy as np
from piper import PiperVoice, SynthesisConfig

CARPETA = os.path.dirname(os.path.abspath(__file__))
MODELOS = os.environ.get('VOZ_MODELOS', os.path.join(CARPETA, 'modelos'))
PUERTO = int(os.environ.get('VOZ_PUERTO', '3201'))
# Voz de hombre si Ciempi es niño, de mujer si es niña (las dos de México: no hay voces chilenas).
VOCES = {'nino': 'es_MX-ald-medium', 'nina': 'es_MX-claude-high'}
LARGO_MAXIMO = 300


class Voz:
    def __init__(self, nombre):
        self.piper = PiperVoice.load(os.path.join(MODELOS, f'{nombre}.onnx'))
        self.candado = threading.Lock()

    def wav(self, texto, velocidad):
        salida = io.BytesIO()
        with self.candado, wave.open(salida, 'wb') as w:
            self.piper.synthesize_wav(texto, w, syn_config=SynthesisConfig(length_scale=1 / velocidad))
        return recortar_silencio(salida.getvalue())


def recortar_silencio(datos, umbral=300, margen_ms=15):
    """Piper deja silencio al inicio y al final: quitarlo hace que la palabra suene justo cuando el dedo llega."""
    with wave.open(io.BytesIO(datos)) as w:
        params = w.getparams()
        muestras = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    sonido = np.nonzero(np.abs(muestras) > umbral)[0]
    if len(sonido) == 0:
        return datos
    margen = params.framerate * margen_ms // 1000
    recorte = muestras[max(0, sonido[0] - margen) : sonido[-1] + margen]
    salida = io.BytesIO()
    with wave.open(salida, 'wb') as w:
        w.setparams(params)
        w.writeframes(recorte.tobytes())
    return salida.getvalue()


voces = {clave: Voz(nombre) for clave, nombre in VOCES.items()}


class Pedido(BaseHTTPRequestHandler):
    def do_GET(self):
        url = urlparse(self.path)
        if url.path == '/salud':
            return self.responder(200, b'ok', 'text/plain')
        if url.path != '/voz':
            return self.responder(404, b'no existe', 'text/plain')
        q = parse_qs(url.query)
        texto = q.get('texto', [''])[0].strip()
        voz = voces.get(q.get('voz', ['nino'])[0])
        try:
            velocidad = min(1.5, max(0.5, float(q.get('velocidad', ['1'])[0])))
        except ValueError:
            velocidad = 1.0
        if not texto or len(texto) > LARGO_MAXIMO or voz is None:
            return self.responder(400, b'pedido invalido', 'text/plain')
        self.responder(200, voz.wav(texto, velocidad), 'audio/wav')

    def responder(self, codigo, cuerpo, tipo):
        self.send_response(codigo)
        self.send_header('Content-Type', tipo)
        self.send_header('Content-Length', str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def log_message(self, *args):
        pass  # Sin registro por palabra (y sin guardar lo que leen los niños).


if __name__ == '__main__':
    print(f'Voz de Ciempi en http://127.0.0.1:{PUERTO} ({", ".join(VOCES.values())})', flush=True)
    ThreadingHTTPServer(('127.0.0.1', PUERTO), Pedido).serve_forever()
