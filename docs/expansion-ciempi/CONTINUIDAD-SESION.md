# CIEMPI · Continuidad de sesión: expansión v3

**Pausa controlada:** 3 de noviembre de 2026, alrededor de las 11:45 (America/Santiago).

Este documento permite retomar el trabajo desde una sesión nueva de Claude Code que no conoce la conversación anterior. Todo lo que se cita está guardado en git (en ramas locales) o en disco.

**Qué no se hizo:**
- Nada se fusionó a `main` ni se subió (*push*).
- No se desplegó nada ni se generó APK.
- No se tocaron datos reales ni la economía de producción.

---

## 1. Contexto

### Proyecto
CIEMPI es una app infantil de lectura asistida. Ciempi, un ciempiés, crece al "comer" manzanas a medida que el niño lee. Tiene cinco niveles de lectura: 0 sílabas, 1 palabras, 2 oraciones, 3 párrafos y 4 lectura libre. También tiene monedas, tienda de vestuario y panel de adulto.

| Parte | Tecnología |
|---|---|
| App | React 19 + TypeScript + Vite + Tailwind 4 |
| Android | Capacitor 8 |
| Servidor | Fastify + PostgreSQL en `server/`, desplegado en `ciempi.minttu.cl` |
| Producción | Versión **2.4.1**, commit `3e188ce` en `main` |

### Objetivo de esta fase
1. Una economía **segura y justa**: que los niños de nivel 0 puedan ganar monedas y personalizar a Ciempi, y que no se premie la velocidad.
2. **Ciempi Dragón y Ciempi Cuncuna**, creados con IA y fieles a la dirección artística.
3. Una animación de **comer fruta** durante la lectura.
4. Una **tienda** ampliada con colecciones y transformaciones.

### Documentos de referencia (leerlos antes de trabajar)
Las rutas son relativas a la raíz `/mnt/d/Proyectos/ciempi-app/`. Varios de estos archivos **no están en git**: existen solo en el directorio de trabajo de `main`, como cambios sin commitear de otras personas que hay que conservar.

| Documento | Para qué |
|---|---|
| `AGENTS.md` (sin commitear) | Instrucciones del proyecto |
| `CIEMPI_ART_DIRECTION.md` v1.7 (sin commitear) | Guía artística obligatoria: identidad protegida, jerarquía silueta → integración → detalle, rúbrica de 5 dimensiones, evidencia antes/después, aprobación explícita de cambios de identidad (§13), registro AD-001 a AD-016 |
| `.agents/skills/ciempi-art-director/SKILL.md` (sin commitear) | Flujo de dirección de arte |
| `docs/expansion-ciempi/PLAN-MAESTRO-EXPANSION.md` (sin commitear en `main`; hay copia en la rama de continuidad) | Plan maestro aprobado en su dirección general |
| `docs/expansion-ciempi/contexto/BRIEF-COMUN.md` y `contexto/HECHOS-VERIFICADOS.md` (rama de continuidad) | Las reglas comunes que se dieron a los agentes y los hechos verificados del código |
| `docs/rediseno-ciempi/` | Base aprobada `ciempi-ilustracion-v2.svg` y su `-presentacion.png`, laboratorios, revisiones B01–B12 y auditoría (parte sin commitear) |
| `docs/integracion-ciempi/plan-maestro-v1/` (sin commitear) | Economía y precios anteriores (están desactualizados respecto de la 2.4.x) |

### Restricciones vigentes
Hace falta **autorización explícita del usuario** antes de:
- tocar datos reales;
- desplegar o publicar, generar APK o hacer *push*;
- cambiar la economía real (precios o cantidades);
- hacer migraciones irreversibles;
- contratar servicios de pago o crear cuentas nuevas;
- reemplazar arte aprobado;
- reescribir cuentos en masa.

Además:
- **No fusionar a `main`.**
- **No hacer reset ni borrar** ramas o worktrees.
- **Conservar los cambios sin commitear de `main`** (unas 45 rutas: armario, auditoría, laboratorios, guía…). No pertenecen a esta fase.

### Decisiones aprobadas por el usuario
- **Dragón y Cuncuna**, solo en laboratorio; integrarlos al juego requiere su aprobación artística.
- **Cabeza:** se conserva la geometría principal (círculo con centro 736,340 y radio 130), los ojos y los anclajes. Se permiten cuernos, orejas, crestas, hocicos, detalles faciales, materiales y colores propios. No debe parecer el mismo Ciempi con otra textura, y tiene que seguir siendo compatible con los accesorios aprobados.
- **Crecimiento modular:** segmentos repetibles (A→B→C→D→A…), frente y cola únicos, patas y elementos exclusivos. Nunca estirar imágenes completas.
- **Compatibilidad** universal, adaptable o exclusiva. Lo comprado nunca se pierde: si no aplica a una criatura, queda en el inventario y se oculta.
- **Colecciones iniciales:** Fantasía, Naturaleza y Espacio.
- **Concepto:** Cuncuna gratis al completar el nivel 0 y Dragón comprable. **Los precios se definen después de la revisión económica.**
- **No implementar un tope diario silencioso.** Primero estudiar si hace falta y qué alternativas visibles hay.
- **Nivel 0:** no aprobar automáticamente la fórmula "2 monedas por frase, tope 10"; compararla con alternativas. No pagar por toque de sílaba.
- **Cuentos 21–40 (personajes con marca registrada):** no reescribirlos. Solo inventario y propuesta; la decisión se toma aparte.
- **Motor de animación propio:** se conserva. No agregar librerías si no hace falta, y medir antes de optimizar.

---

## 2. Git: ramas, worktrees y commits

Todas las ramas salen de `3e188ce` (`main`, 2.4.1). Los worktrees viven dentro del repositorio, en `.claude/worktrees/`. Los `node_modules` de cada worktree son enlaces al del repo principal y están ignorados por git.

| # | Línea de trabajo | Rama | Worktree | Último commit | Sin commitear | Estado |
|---|---|---|---|---|---|---|
| 1 | Seguridad de monedas y registro de premios | `worktree-agent-a5e1c8d72e4a5aeb0` | `.claude/worktrees/agent-a5e1c8d72e4a5aeb0` | `a8b6e68` checkpoint | 0 | Parcial: servidor listo, cliente sin compilar |
| 2 | Auditoría económica y simulaciones | `worktree-agent-a925a3794da34fde2` | `.claude/worktrees/agent-a925a3794da34fde2` | `4b35d1c` checkpoint | 0 | Casi lista: falta el informe escrito |
| 3 | Dragón y Cuncuna | `worktree-agent-ab5e3926402cffc21` | `.claude/worktrees/agent-ab5e3926402cffc21` | `a839b3e` checkpoint | 0 | Parcial: conceptos y piezas listos; sin laboratorio |
| 4 | Animación de comer y rendimiento | `worktree-agent-a103c0ae8e6a43da3` | `.claude/worktrees/agent-a103c0ae8e6a43da3` | `03d6067` checkpoint | 0 | Parcial: E08 y optimización hechas, sin medir "después" ni demo |
| 5 | Tienda y personajes protegidos | `worktree-agent-a4c7575325914c12a` | `.claude/worktrees/agent-a4c7575325914c12a` | `da6dc0d` | 0 | Terminada (documentos y conceptos) |
| — | Este documento y su contexto | `expansion-v3-continuidad` | `.claude/worktrees/continuidad` | ver `git log` | 0 | Documentación |

**Respaldos adicionales** en `.claude/respaldos-pausa-20261103/`, sin seguimiento de git. Son un *patch* y un tar de archivos nuevos por worktree, hechos antes de los commits de checkpoint (26 MB). Los commits de checkpoint ya los contienen, así que son redundantes; se pueden conservar o borrar cuando el usuario lo decida.

**Imágenes originales de Codex:** están en `~/.codex/generated_images/` (22 carpetas). Las que se usan se copiaron a los worktrees y quedaron en los commits.

### Comprobar el estado
```bash
cd /mnt/d/Proyectos/ciempi-app
git worktree list
for b in worktree-agent-a5e1c8d72e4a5aeb0 worktree-agent-a925a3794da34fde2 worktree-agent-ab5e3926402cffc21 worktree-agent-a103c0ae8e6a43da3 worktree-agent-a4c7575325914c12a expansion-v3-continuidad; do echo "== $b"; git log --oneline 3e188ce..$b; done
```
Algunos worktrees aparecen como *locked*: es un bloqueo del gestor de agentes anterior. Para trabajar en uno basta `cd` a su ruta. Para quitar el bloqueo: `git worktree unlock <ruta>`. No usar `git worktree remove`.

### Retomar de forma segura
- **Opción A (recomendada): continuar cada línea en su worktree.** Hacer `cd` a la ruta, revisar el `CHECKPOINT-*.md` de la línea y seguir commiteando en esa misma rama.
- **Opción B: rama de integración** para probar todo junto, **sin tocar `main`**:
  ```bash
  git worktree add .claude/worktrees/integracion -b expansion-v3-integracion 3e188ce
  cd .claude/worktrees/integracion
  git merge --no-ff worktree-agent-a4c7575325914c12a   # tienda (solo docs)
  git merge --no-ff worktree-agent-a925a3794da34fde2   # economía (solo docs y simulador)
  git merge --no-ff worktree-agent-a5e1c8d72e4a5aeb0   # seguridad (server, datos, lectura)
  git merge --no-ff worktree-agent-a103c0ae8e6a43da3   # animación (animacion/*, CiempiVivo, Vestuario, pose.ts, lectura/Ciempi.tsx)
  git merge --no-ff worktree-agent-ab5e3926402cffc21   # transformaciones (especie, compatibilidad, pose.ts, laboratorio)
  ```
  **Conflicto esperado en `src/ciempi/v2/pose.ts`:**
  - La animación agrega `escenaCreciente` (componer una vez con el total de manzanas).
  - Transformaciones agrega un parámetro opcional final, `forma`.
  - Hay que conservar ambos, sin cambiar el comportamiento por defecto.

  El resto de los archivos está repartido entre líneas y no debería chocar. Para `node_modules` en el worktree nuevo: `ln -s ../../../node_modules node_modules`.

---

## 3. Estado de cada línea de trabajo

### 3.1 Economía: seguridad de monedas (rama `worktree-agent-a5e1c8d72e4a5aeb0`, `a8b6e68`)
Detalle y pasos en `docs/expansion-ciempi/economia/CHECKPOINT-SEGURIDAD.md`, dentro del worktree.

**El problema original (verificado):** `POST /api/perfiles/:id/monedas` aceptaba ±100 por llamada, sin límite y sin cotejo con el progreso (`server/src/app.ts:392`, versión 2.4.1). El antiduplicado solo existía en el cliente.

**Lo que está hecho (servidor terminado y probado):**
- `server/sql/012_registro_de_premios.sql`: migración nueva que no borra nada.
- `server/src/premios.ts`: registro de premios calculado en el servidor, idempotente por `operationId`, con plausibilidad temporal y el resto de las reglas de la sección 3 del pedido.
- `src/lectura/premios.ts`: cálculo puro, compartido por el servidor y el modo local.
- `src/lectura/monedas.ts`: reglas en una sola tabla, con **los mismos valores de 2.4.1**.
- `server/src/app.ts` y `server/test/api.test.ts` adaptados.
- **Cliente:**
  - `src/datos/colaPremios.ts`: cola offline idempotente.
  - `src/datos/repositorios.ts`, `api/repositoriosApi.ts` y `localStorage/repositoriosLocales.ts` adaptados.
  - `src/lectura/PantallaLectura.tsx`, con los dos bugs corregidos: la pantalla final muestra lo ganado en toda la lectura, y la relectura se detecta en todos los niveles.
- **Pruebas del servidor:** `test:servidor` dio 36 de 36 contra la base `ciempi_test_economia`, creada en el contenedor local `ciempi-db-1` (127.0.0.1:5434). Cubren solicitudes repetidas, cantidades alteradas, concurrencia con dos dispositivos, compras simultáneas, APK antigua (endpoint legado), plausibilidad, borrar y volver a subir textos, y saldo nunca negativo.
- `tsc` del servidor pasaba antes de los últimos cambios del cliente; hay que repetirlo.

**Lo que falta:**
1. `src/App.tsx:195` todavía pasa `alGanarMonedas`; la pantalla ahora usa `alPedirPremio`. **El cliente no compila hasta adaptarlo.**
2. Pruebas del cliente: la cola, `premios.ts`, el modo local y `fetch` simulado.
3. Escribir `docs/expansion-ciempi/economia/SEGURIDAD-MONEDAS.md`: amenaza, qué verifica el servidor y qué no, diseño, migración, compatibilidad y despliegue con plan de vuelta atrás.
4. Correr los cuatro comandos: `npx tsc --noEmit -p .`, `(cd server && npx tsc --noEmit)`, `npx vitest run src` (la línea base era 186/186) y `npm run test:servidor`, este último con `DATABASE_URL` apuntando a `ciempi_test_economia` o a `ciempi_test`.

**Riesgo detectado:** el nivel 2 no tiene tope por libro. Con textos propios, un script solo queda limitado por la velocidad de lectura, unas 4 500 monedas por hora en el peor caso. Esto se resuelve en la economía.

### 3.2 Economía: auditoría y simulaciones (rama `worktree-agent-a925a3794da34fde2`, `4b35d1c`)
Detalle en `docs/expansion-ciempi/economia/CHECKPOINT-ECONOMIA.md`.

**Lo que está hecho:**
- Auditoría con el código real.
- **Simulador reproducible** en `docs/expansion-ciempi/economia/simulador/`:
  - `simular.mjs` y `generar-informe.mjs`;
  - extractores que usan el troceo real: `extraer-cuentos.mts`, `extraer-catalogo.mts` y `verificar-abusos.mts`;
  - datos en `datos/`: `cuentos.json`, `catalogo.json`, `abusos.json`, `resultados.json` y `tablas.md`.
- **Página `docs/expansion-ciempi/economia/index.html`** con tablas y gráficos, verificada con Playwright en claro, oscuro, 1280 y 390 px.
- Cinco perfiles de lector (P0 a P4), sesiones de 10, 15, 20 y 30 min y los modelos A–E.

**Resultados clave** (mediana de monedas por sesión de 15 min con cuentos nuevos; **son estimaciones con supuestos, no datos de niños**):

| Modelo | P0 | P1 | P2 | P3 | P4 | Brecha por minuto |
|---|---:|---:|---:|---:|---:|---:|
| Actual 2.4.1 | 8 | 25 | 43 | 67 | 120 | 15× |
| Propuesta previa (nivel 0 = 2 por frase, tope 10) | 11 | 25 | 43 | 67 | 120 | 11× |
| **E · híbrido (recomendado)** | 23 | 28 | 27 | 31 | 29 | **1,35×** |

- **P0 hoy:** en 144 sesiones junta unas 59 monedas, así que nunca llega a un conjunto. Un tropiezo quita la moneda de esa frase y no se recupera.
- **Un cuento que tarda unos 20 min:** da 7 monedas hoy y 25 con el modelo E.
- **Fugas comprobadas en 2.4.1:**
  - un texto propio en nivel 2 da 305 monedas (unas 36 por minuto);
  - un texto de una sola frase en nivel 4 da 40.
  - Con el modelo E, el peor abuso baja a unas 2,3 por minuto, lo mismo que leer de verdad.
- **Totales:** los 40 cuentos dan **703** monedas en primera lectura (el nivel 2 da 118). El catálogo actual completo cuesta **1 350**.

**Lo que falta:**
1. Redactar `docs/expansion-ciempi/economia/ECONOMIA-V3.md`: diagnóstico, comparación de niveles, simulaciones, modelos, el **modelo E con sus parámetros exactos** listo para `monedas.ts`, cómo prevenir abusos sin un tope invisible, tabla de esfuerzo por artículo (sesiones necesarias), rangos de precio para Dragón y Cuncuna, y la telemetría mínima. Las tablas ya están en `simulador/datos/tablas.md`, y los parámetros de E en `simular.mjs`.
2. Opcional, pedido por el usuario: que el **Super Planner de Fable** revise los modelos A–E y valide la recomendación. Requiere que la cuenta tenga acceso a Fable; si no lo tiene, usar el agente `planner`.
3. Llevar la regla del nivel 2 (tope o modelo E) al código de seguridad (§3.1).

**Decisiones pendientes del usuario:** aprobar el modelo económico (E u otro), sus parámetros, la regla de relectura, el tratamiento del nivel 2 y los precios. Nada de esto está aplicado en la economía real.

### 3.3 Personajes: Dragón y Cuncuna (rama `worktree-agent-ab5e3926402cffc21`, `a839b3e`)
Detalle en `docs/rediseno-ciempi/revisiones/CHECKPOINT-TRANSFORMACIONES.md`.

**Lo que está hecho:**
- **6 conceptos con IA real** (Codex `image_gen`), 3 direcciones por criatura, siempre editando sobre la referencia aprobada.
  - Prompts, PNG y registros: `docs/rediseno-ciempi/revisiones/T01-dragon-v1/ia/` y `T02-cuncuna-v1/ia/`.
  - Láminas de concepto en claro y oscuro, más siluetas a 84 y 320 px: `T0x/conceptos/`.
- **Selección provisional:**
  - **Dragón "bebé con alitas"** (d2);
  - **Cuncuna "penachos"** (c2).
  - Motivo: tienen la silueta más distinta de Ciempi a 84 px.
  - **No hay aprobación artística del usuario.** Los REVISION.md con la rúbrica no están escritos.
- **9 piezas modulares generadas con IA** (segmentos, cola, pata, rasgos de cabeza, alitas); 15 generaciones en total.
  - `scripts/transformaciones/procesar-piezas.py` las corta en WebP 2× y escribe un `manifiesto.json` por criatura en `docs/rediseno-ciempi/laboratorio-transformaciones/recursos/{dragon,cuncuna}/`.
  - Peso: Dragón unos 194 KB y Cuncuna unos 286 KB, dentro del presupuesto de 600 KB.
  - Láminas de anclaje en `T0x/piezas/`.
- **Código:**
  - `src/ciempi/v2/especie.ts` con valores provisionales;
  - `src/ciempi/v2/compatibilidad.ts`, escrito pero **sin pruebas**;
  - `src/ciempi/v2/pose.ts`, con un parámetro final opcional `forma`. **No está comprobado que Ciempi siga idéntico.**
- **Scripts** en `scripts/transformaciones/`, incluido el generador de IA con sus prompts.

**Lo que falta:**
1. Corregir `scripts/transformaciones/construir-laboratorio.mjs`: `ts.ModuleKind` sale *undefined* por la forma de importar `typescript`. Usar `import ts from 'typescript'` o `ts.default.ModuleKind`, o compilar con el `vite` o el `esbuild` que ya están en `node_modules`.
2. Compositor de especies (`especies.js`) que arme la cabeza invariante con sus rasgos, los segmentos A–D en ciclo, el frente, la cola, las patas y los exclusivos. Debe reutilizar `pose.ts` y `componer.js`.
3. **Laboratorio HTML** en `docs/rediseno-ciempi/laboratorio-transformaciones/`. Tiene que permitir: cambiar de criatura, longitud de 0 a 40, colores, expresiones B03, accesorios con su etiqueta universal, adaptable, exclusivo u oculto, conjuntos, animaciones del rig, comparación con Ciempi, tamaños de 84, 96, 240 y 320 px, y fondo claro u oscuro.
4. **Pruebas:**
   - Vitest de `compatibilidad.ts`;
   - Ciempi idéntico en la salida SVG con N = 0, 1, 5, 12 y 40;
   - Playwright del laboratorio sin errores de consola.
5. **Evidencia:** láminas de crecimiento (N = 0, 1, 2, 5, 8, 12, 22 y 40), de accesorios (al menos 8 universales, 2 adaptables y los exclusivos) y comparación con Ciempi a 84, 240 y 320 px en claro y oscuro. Además, `T01-dragon-v1/REVISION.md` y `T02-cuncuna-v1/REVISION.md` con la ficha de la §12 de la guía.
6. `npx tsc --noEmit -p .` y `npx vitest run src`.
7. Presentar al usuario para su aprobación artística, sin integrar al juego.

### 3.4 Animación de comer y rendimiento (rama `worktree-agent-a103c0ae8e6a43da3`, `03d6067`)
Detalle en `docs/expansion-ciempi/animacion/CHECKPOINT-ANIMACION.md`.

**Medición "antes"** en Chromium con la CPU frenada. **Es una aproximación, no un Android real.** Costo de cada actualización de unidad, mediana / p95:

| Freno de CPU | Mediana | p95 | Otros |
|---|---|---|---|
| 1× | 5,9 ms | 10,6 ms | — |
| 4× | 27 ms | 44 ms | — |
| 6× | 54 ms | 106 ms | 17,7 % de cuadros perdidos y 35 tareas largas |

- El cuello de botella principal es `escena()`, que vuelve a parsear y serializar el SVG con cada unidad: unos 55 ms a 6×.
- El segundo es el costo fijo por cuadro (estilo y pintado del SVG).
- Datos: `docs/expansion-ciempi/animacion/medicion/resultados/antes.json`.

**Lo que está hecho:**
- **Optimización:** Ciempi se compone una vez con el total de manzanas (`escenaCreciente` en `pose.ts`), y `rig.crecer(n)` va mostrando los segmentos. La comparación píxel a píxel dio **108 de 108 casos idénticos**.
- **E08 "Comer"** en `animaciones.js`, con la cola `ColaComer` en `motor.js`: se puede interrumpir, y hay como mucho una animación en curso y una pendiente.
  - Archivos modificados: `CiempiVivo.tsx`, `Vestuario.tsx`, `rig.js` y sus `.d.ts`, y `src/lectura/Ciempi.tsx`.
  - Pruebas: `comer.test.ts` y `animaciones.test.ts`. `npx vitest run src/ciempi` dio **35 de 35**.
  - En `src/lectura/Ciempi.tsx` queda apagada: `COMER_ANIMADO = false`.
- `PantallaLectura.tsx` no necesita cambios.

**Lo que falta:**
1. **Medir "después"** con el modo `revelar` a 1×, 4× y 6×, tres repeticiones cada uno.
   - **Riesgo:** `CRECIMIENTO_REVELAR = true` cambia el camino por defecto del juego sin esa medición. Si no se mide, ponerlo en `false` antes de cualquier fusión.
2. Compilar y probar la demo `docs/expansion-ciempi/animacion/demo-comer/`, ya escrita.
3. Hoja de 8 cuadros de E08 y un video `.webm` opcional; revisarlos visualmente y aplicar la rúbrica de 5 dimensiones.
4. Escribir `docs/expansion-ciempi/animacion/RESULTADOS.md`.
5. `npx tsc --noEmit -p .` y `npx vitest run src` completos.
6. Pendiente sin cubrir: Firefox y Safari, y un Android real.

### 3.5 Tienda y personajes protegidos (rama `worktree-agent-a4c7575325914c12a`, `da6dc0d`): terminada
**Archivos:**
- `docs/expansion-ciempi/tienda/TIENDA-V3.md` y `tienda/index.html` (verificada con Playwright a 390 y 1280 px, en claro y oscuro).
- `tienda/conceptos/`: 4 láminas de concepto IA, de las colecciones Fantasía (2 intentos), Naturaleza y Espacio, con sus prompts y `generaciones.json`.
- `docs/expansion-ciempi/personajes-protegidos/REVISION-PERSONAJES.md`.

**Tienda:**
- **Revisión del catálogo:**
  - las 14 paletas de pago llevan nombres de marcas;
  - hay huecos en mochilas (0), espalda, cuello y pies;
  - hay choques de nombre («Dragón» conjunto contra especie → propone «Draco»; «Robot» → «Lumen»; «Estrellas» repetido).
- **Propuesta:** 23 productos originales (Fantasía 8, Naturaleza 7, Espacio 8), 6 conjuntos, 5 exclusivos de especie y 3 mochilas, estas condicionadas a su rediseño. Cada uno trae ficha y un brief de prompt.
- **Conceptos visuales:**
  - Espacio es el más coherente.
  - Naturaleza es demasiado densa a 84 px.
  - En Fantasía, Codex fundió los segmentos en un tubo las dos veces. **Lección: trajes y capas hay que generarlos como piezas o atlas aislados, no sobre el personaje completo.**
- **Problema de precios:** con la colección propuesta, el catálogo pasa de unas 1 360 a unas 1 840 monedas, unas 2,6 veces lo que dan los 40 cuentos y por encima del techo de 2,4× del plan. Soluciones: dos olas, fusionar las paletas de marca o ajustar la economía (§3.2).
- **Transformaciones en la tienda:**
  - secciones Personajes, Gratis y Favoritos (en JSONB);
  - probar una pieza nunca la guarda;
  - la apariencia se guarda por especie;
  - aviso de compatibilidad «Siguen siendo tuyas».
- **Cuncuna gratis:** se gana al terminar 6 cuentos distintos de nivel 0, o 4 si el niño empieza en nivel 1 o más. Se calcula en el servidor, es idempotente, se entrega de forma retroactiva y se anuncia después de ganarla.
- **Dragón:** entre 60 y 100 monedas, como valor de referencia.
- **Propone quitar** el aviso «Te faltan X 🪙: ¡sigue leyendo!» y el sonido de compra de `PantallaCiempi.tsx`.

**Personajes protegidos:**
- **Inventario completo:** cuentos 21–40, nombres visibles de la tienda, 22 nombres en `pronunciacion.ts` y cadenas de `catalogo.json`.
- **Hallazgo nuevo:**
  - La máscara **«Gatita» (`b07-ia-gatita`) reproduce rasgos de Hello Kitty**. Riesgo alto.
  - El Robot recuerda a Iron Man. Riesgo medio.
- **Riesgos legales**, con fuentes: la política de propiedad intelectual de Google Play y el art. 9 de la Ley 17.336 de Chile. **No es asesoría legal.**
- **Alternativas originales:** Toto, Lolo, Mila, Memo, Pipo, Tato, AraLuz, Capitán Cometa, Chispa…
- **Impacto educativo:** los nombres en inglés rompen la lectura por sílabas.
- **Estrategia para conservar el progreso:** mantener los ids y **el mismo número de frases por cuento**, porque `leido_hasta` es un índice de frase.
- **Requiere decisión aparte del usuario:** nombres de la tienda, reescribir los cuentos 21–40 y rediseñar Gatita y Robot (eso reemplaza arte aprobado según AD-012).

---

## 4. Decisiones pendientes del usuario (consolidadas)
1. **Modelo económico** (recomendado: E híbrido) con sus parámetros, la regla de relectura, el tratamiento del nivel 2 y la prevención de abusos visible, sin tope silencioso.
2. **Precios:** Dragón, Cuncuna, colecciones nuevas y si se lanza en dos olas.
3. **Despliegue del registro de premios:** endpoint nuevo y APK nueva, manteniendo el endpoint legado acotado durante una versión.
4. **Dirección artística de Dragón (d2) y Cuncuna (c2)**, después de ver el laboratorio y las fichas.
5. **Activar `CRECIMIENTO_REVELAR` y `COMER_ANIMADO`**, después de las mediciones y la demo.
6. **Tienda:** estructura (Personajes, Gratis, Favoritos), definición de la Cuncuna gratis, quitar «Te faltan X» y el sonido, y los renombres Draco, Lumen y Constelación.
7. **Personajes protegidos:** fases 1 a 3 (nombres, cuentos, Gatita y Robot).

---

## 5. Próximos pasos concretos (en orden)
1. Leer este documento, `AGENTS.md`, `CIEMPI_ART_DIRECTION.md`, `PLAN-MAESTRO-EXPANSION.md` y los cuatro `CHECKPOINT-*.md`.
2. **Seguridad (§3.1):** adaptar `App.tsx`, escribir las pruebas del cliente y `SEGURIDAD-MONEDAS.md`, y correr los cuatro comandos. Commitear en su rama.
3. **Economía (§3.2):** escribir `ECONOMIA-V3.md` desde el simulador, revisarlo con el Super Planner si está disponible y llevar la regla del nivel 2 a la seguridad. Commitear.
4. **Animación (§3.4):** medir `revelar`, probar la demo, hacer la hoja de cuadros y la rúbrica y escribir `RESULTADOS.md`. Decidir el valor por defecto de `CRECIMIENTO_REVELAR`.
5. **Transformaciones (§3.3):** corregir el script del laboratorio y construir el compositor y el laboratorio, con pruebas, evidencia y los dos REVISION.md.
6. Opcional: crear la rama `expansion-v3-integracion` (§2, opción B) y verificar todo junto con tsc, vitest, el servidor y los laboratorios.
7. Entregar al usuario las cuatro partes (economía, transformaciones, animación y tienda) con lo implementado, lo probado, lo experimental, lo que requiere aprobación y lo que falta para integrar.

---

## PROMPT PARA NUEVA SESIÓN DE CLAUDE CODE

```text
Proyecto: CIEMPI, app infantil de lectura (React+TS+Vite+Capacitor Android, servidor Fastify+PostgreSQL),
repositorio /mnt/d/Proyectos/ciempi-app (WSL Ubuntu). Producción = versión 2.4.1, commit 3e188ce en main.

Estoy retomando una fase de expansión que quedó en pausa controlada. NO conoces la conversación anterior:
reconstruye el estado SOLO desde los archivos.

1. Lee primero, en este orden:
   - docs/expansion-ciempi/CONTINUIDAD-SESION.md (en el directorio de trabajo de main, y también en la rama
     expansion-v3-continuidad). Es el documento maestro de la pausa.
   - AGENTS.md y CIEMPI_ART_DIRECTION.md (raíz; están sin commitear en main: no los muevas ni los commitees).
   - docs/expansion-ciempi/PLAN-MAESTRO-EXPANSION.md.
   - Los checkpoints de cada rama (usa `git show <rama>:<ruta>` o abre el worktree):
     * worktree-agent-a5e1c8d72e4a5aeb0 → docs/expansion-ciempi/economia/CHECKPOINT-SEGURIDAD.md
     * worktree-agent-a925a3794da34fde2 → docs/expansion-ciempi/economia/CHECKPOINT-ECONOMIA.md
     * worktree-agent-ab5e3926402cffc21 → docs/rediseno-ciempi/revisiones/CHECKPOINT-TRANSFORMACIONES.md
     * worktree-agent-a103c0ae8e6a43da3 → docs/expansion-ciempi/animacion/CHECKPOINT-ANIMACION.md
     * worktree-agent-a4c7575325914c12a → docs/expansion-ciempi/tienda/TIENDA-V3.md (terminada)

2. Verifica el estado de git antes de tocar nada: `git worktree list` y
   `git log --oneline 3e188ce..<rama>` para cada rama. Los worktrees están en
   .claude/worktrees/<nombre>; algunos aparecen "locked" (basta `git worktree unlock <ruta>` si molesta;
   nunca `git worktree remove`).

3. Continúa las cuatro líneas pendientes, cada una en SU worktree y rama, con commits en esa rama:
   a) Seguridad de monedas: adaptar src/App.tsx (alGanarMonedas → alPedirPremio), pruebas del cliente
      (cola offline, premios.ts, modo local), SEGURIDAD-MONEDAS.md, y que pasen:
      npx tsc --noEmit -p . ; (cd server && npx tsc --noEmit) ; npx vitest run src ;
      DATABASE_URL=postgres://ciempi:ciempi@localhost:5434/ciempi_test_economia npx vitest run server/test
      (contenedor docker ciempi-db-1; usa SOLO bases *_test).
   b) Economía: redactar docs/expansion-ciempi/economia/ECONOMIA-V3.md a partir del simulador
      (simulador/datos/tablas.md y simular.mjs). El modelo recomendado es el E (híbrido). Si tengo acceso al
      agente super-planner (Fable), úsalo para revisar los modelos A–E: te confirmo explícitamente
      "usa el super-planner". Si no está disponible, usa planner.
   c) Animación de comer: medir el modo `revelar` (1×/4×/6×), probar demo-comer/, hoja de 8 cuadros,
      rúbrica y RESULTADOS.md. Si no se mide, deja CRECIMIENTO_REVELAR = false. COMER_ANIMADO sigue false.
   d) Dragón y Cuncuna: arreglar scripts/transformaciones/construir-laboratorio.mjs (import de typescript),
      compositor de especies, laboratorio HTML en docs/rediseno-ciempi/laboratorio-transformaciones/,
      pruebas (compatibilidad.ts y Ciempi idéntico con el parámetro `forma` de pose.ts), láminas de
      evidencia y T01/T02 REVISION.md con la rúbrica de la guía. Generación de imágenes: Codex CLI image_gen
      (codex exec --skip-git-repo-check --sandbox workspace-write -C <dir> -i <referencia.png> "<prompt>")
      editando siempre sobre docs/rediseno-ciempi/ciempi-ilustracion-v2-presentacion.png. No escribas SVG
      a mano llamándolo IA.
   Puedes usar subagentes en paralelo, uno por línea, con el reparto de archivos de
   docs/expansion-ciempi/contexto/BRIEF-COMUN.md (rama expansion-v3-continuidad).

4. NO modificar: main (no merge, no commit, no reset, no stash; tiene unos 45 cambios sin commitear de otras
   personas que hay que conservar), producción ni el servidor ciempi.minttu.cl, datos reales, la economía
   real (precios o cantidades), arte aprobado (B01–B12, base v2) ni los cuentos 21–40. No hacer push, no
   generar APK, no instalar servicios de pago ni crear cuentas nuevas, no borrar ramas ni worktrees.
   Pide mi autorización para cualquiera de esas cosas.

5. Entrega al terminar, en español: (1) Economía: diagnóstico, comparación de niveles, simulaciones,
   modelo recomendado con parámetros, cambios de seguridad y sus pruebas, recomendaciones de despliegue;
   (2) Transformaciones: galerías de Dragón y Cuncuna, comparación con Ciempi, laboratorio, crecimiento
   modular, accesorios compatibles, pendientes; (3) Animación: E08 funcionando, demo, pruebas visuales,
   medición de rendimiento, limitaciones; (4) Tienda: resumen de TIENDA-V3 con precios ajustados al
   modelo económico. Cierra con: qué se implementó, qué está probado, qué sigue experimental, qué requiere
   mi aprobación y qué falta para integrarlo al juego. Distingue verificado, inferido y pendiente; no
   declares aprobado artísticamente nada que yo no haya aprobado.
```
