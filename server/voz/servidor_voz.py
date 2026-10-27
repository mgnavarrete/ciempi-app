"""
Voz de Ciempi: genera el audio de una palabra o frase con Kokoro (voz
neuronal, gratis y sin internet). Solo escucha en 127.0.0.1: lo usa el
servidor de Ciempi (GET /api/voz), que además guarda lo generado.

    GET /voz?texto=despacio&voz=nino&velocidad=1.0  →  audio/wav

Instalación y servicio: deploy/instalar-voz.sh.
"""

import glob
import io
import os
import threading
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

import numpy as np
from kokoro_onnx import Kokoro
from kokoro_onnx.config import EspeakConfig

CARPETA = os.path.dirname(os.path.abspath(__file__))
MODELOS = os.environ.get('VOZ_MODELOS', os.path.join(CARPETA, 'modelos'))
PUERTO = int(os.environ.get('VOZ_PUERTO', '3201'))
# espeak-ng del sistema (sudo apt install espeak-ng): el que trae el paquete de Python viene roto.
_instalado = sorted(glob.glob('/usr/lib/*/libespeak-ng.so.1'))
ESPEAK = os.environ.get('VOZ_ESPEAK') or (os.path.dirname(_instalado[0]) if _instalado else '/usr/lib/x86_64-linux-gnu')
# Voz de hombre si Ciempi es niño, de mujer si es niña. Elegidas escuchando muestras.
VOCES = {'nino': 'em_alex', 'nina': 'ef_dora'}
LARGO_MAXIMO = 300

kokoro = Kokoro(
    os.path.join(MODELOS, 'kokoro-v1.0.onnx'),
    os.path.join(MODELOS, 'voices-v1.0.bin'),
    espeak_config=EspeakConfig(lib_path=os.path.join(ESPEAK, 'libespeak-ng.so.1'), data_path=os.path.join(ESPEAK, 'espeak-ng-data')),
)
candado = threading.Lock()


def generar_wav(texto, voz, velocidad):
    with candado:
        muestras, frecuencia = kokoro.create(texto, voice=VOCES[voz], speed=velocidad, lang='es')
    muestras = recortar_silencio((np.clip(muestras, -1, 1) * 32767).astype(np.int16), frecuencia)
    salida = io.BytesIO()
    with wave.open(salida, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(frecuencia)
        w.writeframes(muestras.tobytes())
    return salida.getvalue()


def recortar_silencio(muestras, frecuencia, umbral=300, margen_ms=15):
    """La voz deja silencio al inicio y al final: quitarlo hace que la palabra suene justo cuando el dedo llega."""
    sonido = np.nonzero(np.abs(muestras) > umbral)[0]
    if len(sonido) == 0:
        return muestras
    margen = frecuencia * margen_ms // 1000
    return muestras[max(0, sonido[0] - margen) : sonido[-1] + margen]


class Pedido(BaseHTTPRequestHandler):
    def do_GET(self):
        url = urlparse(self.path)
        if url.path == '/salud':
            return self.responder(200, b'ok', 'text/plain')
        if url.path != '/voz':
            return self.responder(404, b'no existe', 'text/plain')
        q = parse_qs(url.query)
        texto = q.get('texto', [''])[0].strip()
        voz = q.get('voz', ['nino'])[0]
        try:
            velocidad = min(1.5, max(0.5, float(q.get('velocidad', ['1'])[0])))
        except ValueError:
            velocidad = 1.0
        if not texto or len(texto) > LARGO_MAXIMO or voz not in VOCES:
            return self.responder(400, b'pedido invalido', 'text/plain')
        self.responder(200, generar_wav(texto, voz, velocidad), 'audio/wav')

    def responder(self, codigo, cuerpo, tipo):
        self.send_response(codigo)
        self.send_header('Content-Type', tipo)
        self.send_header('Content-Length', str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def log_message(self, *args):
        pass  # Sin registro por palabra (y sin guardar lo que leen los niños).


if __name__ == '__main__':
    print(f'Voz de Ciempi (Kokoro) en http://127.0.0.1:{PUERTO}: niño {VOCES["nino"]}, niña {VOCES["nina"]}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', PUERTO), Pedido).serve_forever()
