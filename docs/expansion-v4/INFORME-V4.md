# Informe de la expansión artística V4 (3–4 de noviembre de 2026)

Rama **`expansion-v4-arte`** (worktree `.claude/worktrees/arte-v4`). Parte de la integración V3 (`b1c1d87`) y de los recursos artísticos copiados desde `main` (`7ca0748`, ver `importado/README.md`).
Todo es **laboratorio**. En `src/` solo se añadieron las formas de Serpiente y Camaleón (`especie.ts`, `compatibilidad.ts` y sus pruebas), que el juego no usa; `public/`, el servidor, la economía, los inventarios y producción no cambian. `main` no se tocó. No hubo push, despliegue ni APK.

## 1. Cómo probarlo

```bash
cd /mnt/d/Proyectos/ciempi-app/.claude/worktrees/arte-v4
node scripts/transformaciones/construir-laboratorio.mjs
python3 -m http.server 8830 --bind 127.0.0.1
```

Abrir **http://127.0.0.1:8830/docs/expansion-v4/**: índice con enlaces directos al laboratorio interactivo, láminas y comparaciones.

Parámetros del laboratorio (`docs/rediseno-ciempi/laboratorio-transformaciones/`):

| Parámetro | Valores | Qué hace |
|---|---|---|
| `especie` | `ciempi`, `dragon`, `cuncuna`, `serpiente`, `camaleon` | Elige la criatura |
| `rostro` | `v1` (antes), `v4` (1.ª iteración), `v4b` (final) | Rostro de Dragón y Cuncuna |
| `accesorios` | `v1` (juego actual), `v4` (corregidos v4.2) | Versión de mochilas y zapatos |
| `iter` | `v1` | Muestra la primera iteración de Serpiente y Camaleón |
| `n` | 0–40 | Número de segmentos |
| `sel` | selección JSON | Vestuario; además hay controles de animación, expresiones, comparación A/B, tamaños y fondo |

## 2. Qué se entrega

| # | Pieza | Estado | Dónde |
|---|---|---|---|
| 1 | **Dragón, rostro v4b**: hocico 3/4 dentro de la cabeza, narinas, colmillitos, ojos ámbar y 14 expresiones propias. Cuerpo idéntico. | Hecho con IA (2 iteraciones) | `revisiones/T01-dragon-v4-rostro/` |
| 2 | **Cuncuna, rostro v4b**: mejillas de pompón, ojos propios, cejas con contorno y 14 expresiones. Cuerpo idéntico. | Hecho con IA (2 iteraciones) | `revisiones/T02-cuncuna-v4-rostro/` |
| 3 | **Serpiente v2**: cuerpo coral y amarillo, rostro propio (ojos dorados ovalados, rombo en la frente, boca ancha), lengüita opcional, sin patas y **una zapatilla en la cola** (AD-019). | Completa | `revisiones/T03-serpiente-v1/` y `-v2/` |
| 4 | **Camaleón v2**: 4 propuestas IA más un prototipo completo con torretas con volumen, patas gruesas, boca de reptil y camuflaje según el conjunto. | Prototipo completo | `revisiones/T04-camaleon-v1/` y `-v2/` |
| 5 | **Mochilas v4.2**: bolsa en el flanco trasero, 2 correas finas del material de cada bolsa, sombra de contacto; sigue el crecimiento y la animación. Las 5 bolsas se regeneraron con IA. | Hecho (2 iteraciones) | `revisiones/V4-mochilas-zapatos/` |
| 6 | **Zapatos v4.2**: la pata entra en el zapato (labio delantero), sombra de contacto, zapatos de luna más cortos. | Hecho | ídem |
| 7 | **Laboratorio HTML** con selectores v1/v4/v4b, accesorios v1/v4 y 5 criaturas. | Funciona | `docs/expansion-v4/index.html` |
| 8 | **Comparaciones antes/después**: cada carpeta `revisiones/*` tiene `antes/`, láminas `-it2` y `comparaciones(-v4.2)/`. | — | — |

Generación IA: Codex CLI `image_gen` mediante `scripts/transformaciones/generar-ia.mjs`. Cada carpeta guarda los prompts y `generaciones*.json`, y los descartes van en `ia/descartes/`. Ninguna pieza se sustituyó en silencio por SVG.

## 3. Pruebas de compatibilidad (verificadas sobre el árbol final, `git archive` aislado)

| Prueba | Resultado |
|---|---|
| `npx tsc --noEmit -p .` | OK |
| `npx vitest run src` | **292/292** (30 archivos) |
| Ciempi idéntico a 2.4.1 (`probar-laboratorio.cjs`) | **35/35**, consola limpia |
| Ciempi idéntico con crecimiento optimizado (`capturas.mjs`) | **108/108** |
| Serpiente y Camaleón: `escenaCreciente` + `rig.crecer` frente a `escena` (`comprobar-fusion-v4.mjs`) | **306/306** idénticos; 0 bocas sobre máscaras en 102 recorridos |
| Laboratorio V4 (`probar-laboratorio-v4.cjs`) | 27/27 |
| Combinado (`probar-combinado-v4.cjs`): 5 criaturas × rostro v1/v4/v4b × accesorios v1/v4 × 4 conjuntos × N 1/12 | **240 casos, 0 errores** |
| Cuerpos aprobados de Dragón y Cuncuna (17 WebP), `pose.ts` y `public/` | **Sin cambios** frente a `7ca0748` (sha256 y git) |
| Cuerpo con la cabeza oculta, v1 frente a v4b | 75/75 idénticos |
| Máscara gatita sobre el Dragón y la Cuncuna v4b | Los ojos quedan dentro de los agujeros (revisado a ojo) |

El combinado detectó un fallo de integración: `rostro=v4` rompía Serpiente y Camaleón. Está corregido.

## 4. Evaluación artística honesta

La hizo un revisor independiente (Fable) en dos rondas, mirando las imágenes, más mi propia revisión. Son orientativas y **no sustituyen tu aprobación**.

**1.ª ronda:** nada estaba listo.
- Las mochilas parecían «barriles a rayas».
- Serpiente y Camaleón tenían la cara de Ciempi.
- El Dragón tenía el hocico de perfil.
- La Cuncuna tenía ojos de anime.

**2.ª ronda (final):**

| Pieza | Coh. | Cal. | Int. | Leg. 84 px | Orig. | Veredicto |
|---|---|---|---|---|---|---|
| Dragón v4b | 4 | 4 | 4 | 3 | 4 | Aprobable con ajustes menores |
| Cuncuna v4b | 4 | 4 | 4 | 3 | 4 | Aprobable con ajustes menores |
| Serpiente v2 | 4 | 4 | 4 | 3 | 4 | Aprobable con ajustes menores |
| Camaleón v2 | 4 | 4 | 4 | **2** | 4 | Aprobable con ajustes; si no, otra iteración |
| Mochilas y zapatos v4.2 | 4 | 4 | 4 | 3 | 3 | **Listo para aprobar** (retoques opcionales) |

Ajustes menores pendientes:
- **Dragón:** el hocico grande se come la boca en los gestos tristes; Triste, Confundido y Pensativo se parecen a 84 px.
- **Cuncuna:** cejas de otro tono (coral o marrón), porque se pierden contra el penacho amarillo. Los ojos bajaron solo un 8 % de diámetro (se pidió un 15 %).
- **Serpiente:** reducir la zapatilla de la cola un 15–20 % y orientarla para que se lea calzada; a 84 px solo se reconocen la de mago y la de lluvia. A 84 px la cabeza se lee como una bola roja con sonrisa.
- **Camaleón:** simplificar las torretas a 2 anillos (hoy «ojos hipnóticos» a 84 px). No parpadea con el rig. Restos de contorno IA junto a las torretas. El calzado se ve pequeño frente a sus patas.
- **Mochilas:** el Propulsor parece flotar en algunos cuadros de tropezar; al Bolso Luna le falta una bandolera visible. Con N = 1 la bolsa sobresale (igual que en v1).
- **Generales:** el iris y la paleta de ojos no tiñen los rostros IA; los lentes B04 quedan bajos en la Serpiente; el «tap» de la zapatilla al caminar no se hizo porque requiere tocar el rig compartido.

**Riesgo de personajes protegidos** (piezas del catálogo existentes, no de V4):
- máscara robot + Propulsor rojo y dorado → **Iron Man (alto)**;
- máscara «Gatita de porcelana» → **Hello Kitty (medio)**, confirmado al verla de cerca;
- Bolso Ratón Atlas → **Mickey (medio-bajo)**.

Se recomienda rediseñarlas antes de publicar. Las criaturas V4 no presentan parecidos relevantes: el de Knuckles quedó resuelto en la Serpiente v2.

## 5. Decisiones registradas y pendientes

- **AD-019 (aprobada por la usuaria el 4-nov-2026):** Serpiente sin patas y una sola zapatilla en la cola. Está registrada en la copia de la guía de esta rama; **falta sincronizarla con la guía de `main`**.
- **Pendiente de tu aprobación (§13):**
  - rostros v4b de Dragón y Cuncuna;
  - diseño de la Serpiente v2;
  - Camaleón v2;
  - mochilas regeneradas y construcción v4.2;
  - zapatos v4.2.
- Nada está integrado en el juego. Llevarlo al juego requiere pasar los posprocesos del laboratorio al compositor (`renderCiempi`) detrás de una opción, y conectar `useEscenaCreciente` con la especie (pendiente de V3).

## 6. Ramas

| Rama | Commit | Contenido |
|---|---|---|
| `expansion-v4-arte` | ver `git log -1` | Integración V4 (este informe) |
| `expansion-v4-rostros` | `222e0c1` | Rostros v4 y v4b |
| `expansion-v4-criaturas` | `e0ffd10` | Serpiente y Camaleón v1 y v2 |
| `expansion-v4-accesorios` | `1eeb864` | Mochilas y zapatos v4.1 y v4.2 |
