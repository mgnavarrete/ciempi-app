"""Voz de Ciempi con las voces neuronales de Microsoft (edge-tts, gratis y sin cuenta).

Uso: echo "texto" | python decir.py es-CL-LorenzoNeural +0%  > audio.mp3
Lee el texto de la entrada y escribe el audio (MP3) en la salida. Lo llama el
servidor (server/src/voz.ts); el servidor guarda cada audio, así que cada
texto se pide una sola vez.
"""

import asyncio
import sys

import edge_tts


async def main() -> None:
    voz, velocidad = sys.argv[1], sys.argv[2]
    texto = sys.stdin.read().strip()
    if not texto:
        sys.exit("sin texto")
    salida = sys.stdout.buffer
    async for parte in edge_tts.Communicate(texto, voz, rate=velocidad).stream():
        if parte["type"] == "audio":
            salida.write(parte["data"])
    salida.flush()


asyncio.run(main())
