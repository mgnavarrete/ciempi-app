# Héroes de Ciempi (2.9.0)

**En 2.9.0 se publican 14 conjuntos completos:** los 10 de la primera serie y Trueno, Relámpago y Místico de
la segunda, más el Arácnido con máscara completa. La segunda serie (12 conjuntos, prompts ya en
`prompts.py`) quedó a medias por el límite de uso de Codex (se renueva el 2026-11-11 22:14): faltan 31
piezas de Pantera (traje), Marino (botas y mochila), Guerreras K-pop Violeta, Rosa y Azul, Unicornio, Hada
Mágica, Sombra y Princesa de Hielo. Sus maestros parciales están en `ia/`, pero no se procesan ni entran
al juego hasta tener las cuatro piezas (`procesar.py` sin argumentos solo toma conjuntos completos). Al
completarlos: `generar.sh`, `procesar.py`, medir botas en `bocas.json`, `aplicar-v4.py`, exportar, tienda,
agregar sus cabezas `b07` a `TAPAN_LA_CARA` (pantera, sombrio, unicornio) y sus mochilas a `catalogo.test.ts`.

Riesgo anotado: el emblema de Relámpago (círculo blanco con rayo) se parece mucho al de un personaje
registrado; se sugirió a la usuaria cambiarlo por un rayo solo o una estrella.

## Primera serie · 10 conjuntos

Diez conjuntos de superhéroe propios, con la misma estructura y el mismo flujo que el Capitán Ciempi
(`docs/expansion-v9/capitan-cometa`). Cuarenta piezas: cabeza, traje (atlas B11), botas (B10 v4.2) y
mochila (B09 v4.2, se vende aparte) o capa (B08 v2, va en el conjunto).

**Estado:** En revisión artística — pendiente de aprobación de la usuaria. Nada está fusionado,
desplegado ni registrado en la guía como aprobado.

| Conjunto | Cabeza | Traje | Botas | Espalda | Precio conjunto |
|---|---|---|---|---|---|
| Ciempi Coloso | Máscara Coloso `b06-ia-coloso` (gorro) | `b11-coloso` | `b10-coloso` | Mochila de Fuerza `b09-coloso` (aparte) | 71 |
| Ciempi Arácnido | Máscara Arácnida `b07-ia-aracnido` | `b11-aracnido` | `b10-aracnido` | Mochila Telaraña `b09-aracnido` (aparte) | 71 |
| Ciempi Ilusionista | Corona Ilusionista `b06-ia-ilusionista` (gorro) | `b11-ilusionista` | `b10-ilusionista` | Capa de Ilusiones `b08-ia-ilusionista` | 93 |
| Ciempi Solar | Antifaz Solar `b07-ia-solar` | `b11-solar` | `b10-solar` | Capa Solar `b08-ia-solar` | 93 |
| Ciempi Nocturno | Máscara Nocturna `b07-ia-nocturno` | `b11-nocturno` | `b10-nocturno` | Capa Nocturna `b08-ia-nocturno` | 93 |
| Ciempi Bromista | Gorro Bromista `b06-ia-bromista` (gorro) | `b11-bromista` | `b10-bromista` | Mochila Sorpresa `b09-bromista` (aparte) | 71 |
| Ciempi Esmeralda | Antifaz Esmeralda `b07-ia-esmeralda` | `b11-esmeralda` | `b10-esmeralda` | Mochila de Energía `b09-esmeralda` (aparte) | 71 |
| Ciempi Araña Sombra | Máscara Sombra `b07-ia-sombra` (completa) | `b11-sombra` | `b10-sombra` | Mochila Sombra `b09-sombra` (aparte) | 71 |
| Ciempi Travieso | Máscara Traviesa `b07-ia-travieso` (completa) | `b11-travieso` | `b10-travieso` | Mochila Aventurera `b09-travieso` (aparte) | 71 |
| Ciempi Garra Salvaje | Máscara Garra `b07-ia-garra` | `b11-garra` | `b10-garra` | Mochila Garra `b09-garra` (aparte) | 71 |

Precios como el Capitán Ciempi: cabeza 32, traje 32, botas 24, mochila 25; capas 28 (como la Capa de
héroe). Conjunto = 20 % menos que las piezas sueltas: 88 → 71, o 116 → 93 con capa.

## Cómo se hizo (y cómo repetirlo para nuevos diseños)

1. **Prompts:** `prompts.py` escribe `ia/prompts/<slug>-<pieza>.txt` y `ia/encargos.tsv` a partir de
   las plantillas del Capitán (una por tipo: antifaz, gorro, traje-atlas, botas, mochila, capa) y la
   descripción de cada pieza. Para un conjunto nuevo: agregar su entrada a `H` en `prompts.py`.
2. **Generación IA real:** `bash generar.sh [paralelo] [filtro]` llama a
   `scripts/transformaciones/generar-ia.mjs` (Codex CLI `exec` + `image_gen`) por cada encargo sin PNG,
   con la referencia de Ciempi y la de formato de su categoría (`ia/referencias/`). Registro por pieza en
   `ia/<id>-registro.json`.
3. **Procesado:** `python3 procesar.py [slug ...]` recorta y escala como los procesadores originales,
   alinea las aberturas de los antifaces con los ojos de la base, asienta los gorros por el vértice de su
   arco interior (`AJUSTE_GORRO`), coloca las capas en la caja de la capa heroica, genera las mochilas
   v4.2 sin correas pintadas y agrega todo a los `catalogo.json` del laboratorio y a los conjuntos.
4. **Medidas v4.2:** `python3 aplicar-v4.py` escribe `V4_CALZADO` y `V4_MOCHILAS` en el juego y en el
   laboratorio de transformaciones. Las aberturas de las botas (`BOCAS`, `bocas.json`) se midieron sobre
   cuadrícula, calibradas con las del Capitán (mi lectura de las suyas coincidió con ±5 px).
5. `node scripts/exportar-ciempi-produccion.mjs`, luego `git checkout -- src/ciempi/v2/arte/lib`
   (el exportador sobrescribe copias que divergieron), y `node scripts/generar-tienda-ciempi.mjs`.
6. **Verificación:** `lamina.png`, con el camino real del juego:
   `NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules node docs/expansion-v10/heroes/lamina.mjs . docs/expansion-v10/heroes/lamina.png <tmp>`
   (`SOLO=coloso,solar` filtra). `contacto.py` hace la hoja de contactos de los maestros.

### Incidencias de la generación

- **Bloqueos de moderación:** el antifaz y el traje Arácnido y el traje Araña Sombra fueron rechazados
  por el filtro de OpenAI (parecido con un personaje registrado). Se regeneraron con la telaraña como un
  motivo propio de pocos arcos curvos («hamaca tejida»), sin malla densa.
- **Error corregido en `generar-ia.mjs`:** cuando image_gen fallaba, el script adoptaba la imagen más
  reciente de `~/.codex/generated_images`, que en paralelo era de otra pieza (el antifaz Arácnido salió
  igual a la corona Ilusionista). Ahora falla con el motivo y, con `IA_PARALELO=1` (lo pone `generar.sh`),
  nunca adopta imágenes ajenas. Ningún maestro final está duplicado (comprobado por SHA-256).
- **Descarte por parecido:** la primera Máscara Sombra formó con los «tres triángulos conectados» el
  símbolo de la Trifuerza; se regeneró con los triángulos en fila. Evidencia en `ia/descartes/`.
- **Encaje:** la primera colocación de gorros por caja dejaba un hueco sobre la cabeza; se cambió a
  colocación por el arco interior. El Gorro Bromista se subió para no tapar cejas.

## Segunda ronda (pedido de la usuaria)

Evidencia previa en `ia/v1/` (maestros y prompts) y `lamina-v1.png`; descartes en `ia/descartes/`.

- **Máscara completa con los ojos de Ciempi visibles** (plantilla `CAPUCHA`, referencia de formato:
  máscara Robot) para **Travieso** y **Araña Sombra**: la capucha cubre toda la cabeza, deja ver los
  ojos por sus aberturas y la boca libre, así que se conservan gestos e iris. La primera capucha Sombra
  tapaba media boca (`descartes/sombra-capucha-v2-tapa-boca.png`); se regeneró más corta.
  `procesar.py` ignora la abertura de la boca al alinear los ojos.
- **Arácnido:** la primera capucha completa fue bloqueada por moderación (`descartes/aracnido-capucha-bloqueo.log`).
  No se insistió con variantes del mismo diseño. En la tercera ronda se cambió el diseño de verdad (mitad
  superior roja, banda azul en las mejillas, ojos de Ciempi visibles, araña en la frente, sin telaraña en la
  cara) y pasó. El antifaz v1 queda en `ia/v1/`.
- **Solar:** emblema propio «S de Solar», una S redondeada roja dentro de un disco solar dorado,
  **sin** el escudo pentagonal del logo registrado, en el antifaz y en el pecho del traje. No se buscó
  reproducir ese logo ni evadir el filtro.
- **Araña Sombra:** araña roja de ocho patas curvas como logo, en el pecho del traje (en lugar del rombo)
  y en la frente de la capucha, al estilo del emblema Arácnido.
- `procesar.py` reemplaza las piezas en su lugar, así que reprocesar no cambia el orden de la tienda.

## Evaluación orientativa del agente (guía §12)

C coherencia · I ilustración · E integración · L legibilidad · O originalidad. Evidencia: `lamina.png`
(conjunto, con espalda, zooms de cabeza y espalda, Dragón, caminar y 120 px en fondo oscuro, tarjetas).

| Conjunto | C | I | E | L | O | Observaciones |
|---|---|---|---|---|---|---|
| Coloso | 4 | 4 | 4 | 5 | 3 | Mechones negros y verde se leen a 120 px; la banda asienta en la cabeza y las antenas salen por los lados. Atlas de músculos redondos con pantalón rasgado, sin cambiar los segmentos. Tema muy reconocible. |
| Arácnido | 4 | 4 | 4 | 4 | 3 | Antifaz redondo amable; arcos escasos en vez de malla. El emblema de ocho patas curvas es propio. Mochila oval con tubos clara. Temática cercana a un personaje conocido, motivo suavizado. |
| Ilusionista | 4 | 4 | 4 | 5 | 3 | Corona con cuernos curvos muy legible; algo grande respecto a la cabeza. La capa tapa parte del traje (aceptado, §7). |
| Solar | 5 | 4 | 5 | 5 | 4 | Antifaz con insignia «S» en disco dorado, legible a 120 px; la misma insignia en el pecho. Capa roja y botas coherentes. |
| Nocturno | 4 | 4 | 4 | 4 | 3 | Orejas triangulares y emblema de alas propio. Negro sobre fondo oscuro pierde algo de lectura a 120 px pese a los brillos azules. |
| Bromista | 4 | 4 | 4 | 4 | 4 | Gorro con pompones y chaqueta con solapas, mochila con resorte y estrella divertida. |
| Esmeralda | 4 | 4 | 4 | 5 | 3 | Antifaz alargado, cristal hexagonal y mochila circular luminosa muy legibles. |
| Araña Sombra | 4 | 4 | 4 | 5 | 4 | Capucha completa negra con marcos rojos y araña en la frente; boca y ojos libres. Ahora se distingue claramente del Arácnido. |
| Travieso | 4 | 4 | 4 | 5 | 3 | Capucha completa carmesí con parches negros; la boca se ve por su abertura. Mochila con bastones de espuma redondeados (no armas). |
| Garra Salvaje | 4 | 4 | 4 | 5 | 3 | Adornos en diagonal y franjas azules muy legibles; mochila escudo con tres adornos de puntas redondas. |

Comprobaciones: aberturas de antifaz alineadas con los ojos de la base en todos los casos; boca y
mejillas libres; botas con la pierna dentro de la abertura en los seis pies; mochilas en el flanco con
correas del juego; capas detrás de la cabeza sin tapar cara ni patas. `vitest` 363/363 y `tsc` limpio.

## Límites y pendientes

- Aprobación artística de la usuaria (no se registró nada en la guía como aprobado).
- **Riesgo de propiedad intelectual:** son homenajes temáticos a superhéroes conocidos (colores y rasgos
  reconocibles), con emblemas propios y sin logos. Conviene revisarlo antes de publicar en Play, como ya
  se anotó para otros personajes del catálogo.
- Raster IA (PNG/WebP), no vectores editables; ~77 derivados en `public/ciempi-v2`.
- No se probó en Android real ni en todas las combinaciones con lentes, peinados y bufanda.
