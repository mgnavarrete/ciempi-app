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

---

## 6. Estado al cierre de la sesión 2 (3-nov-2026, tarde)

Las cinco líneas están terminadas en sus ramas. Nada se fusionó a `main` y no hubo push, despliegue ni APK. La economía de producción no se modificó.

| Línea | Rama | Commit final | Verificación (repetida por el coordinador) |
|---|---|---|---|
| Seguridad | `worktree-agent-a5e1c8d72e4a5aeb0` | `dcab7d5` | tsc cliente y servidor OK; vitest src 229/229; servidor 36/36 (3 corridas) |
| Economía | `worktree-agent-a925a3794da34fde2` | `76c9367` | El simulador reproduce `resultados.json` byte a byte |
| Dragón/Cuncuna | `worktree-agent-ab5e3926402cffc21` | `bba72d3` | tsc OK; vitest src 199/199; Ciempi idéntico 35/35 (Playwright) |
| Animación | `worktree-agent-a103c0ae8e6a43da3` | `1bf79c6` | tsc OK; vitest src 198/198; 108/108 idénticos píxel a píxel |
| Tienda | `worktree-agent-a4c7575325914c12a` | `da6dc0d` | Solo documentos (sin cambios en esta sesión) |

- **Conflictos:** `git merge-tree` por pares no da conflictos textuales entre las cinco ramas. `pose.ts` lo cambian animación y transformaciones, así que hay que verificar su comportamiento al integrarlas.
- **Revisión de Fable** (Plan con modelo fable, porque `super-planner` no está registrado en esta cuenta): incorporada en ECONOMIA-V3 §13.
- **Preferencias del usuario** (economía, Cuncuna al completar el nivel 0, PIN para textos, sin media tasa ni topes silenciosos, recompensas mixtas, contenido nuevo, límites del reloj del servidor, precios según P0): incorporadas en ECONOMIA-V3. Recomendación: modelo **E2**.
- **El usuario pidió revisar** los resultados, las demos y la propuesta económica **antes de autorizar** la rama `expansion-v3-integracion`. No crearla sin su autorización.
- **Pendiente técnico si se aprueba E2:** reloj del servidor sobre los segundos pagados, en la rama de seguridad. Sin él, un cliente alterado cobra unas 70 monedas por minuto con E2.
- **Pendiente de documentación:** actualizar TIENDA-V3 (condición de la Cuncuna y precios de E2) y PLAN-MAESTRO §6.5 y D4 (tope silencioso rechazado).

---

## 7. PAUSA DE EMERGENCIA (sesión 3, 3-nov-2026): estado exacto

Los cuatro agentes de la sesión 3 **se cortaron por el límite de uso de la API** a mitad de su trabajo. No alcanzaron a escribir sus checkpoints. El coordinador guardó sus cambios tal cual, en commits `checkpoint WIP`, **sin compilar ni probar**. No se modificó `main`, no hubo push, despliegue ni APK, y no se tocaron datos reales ni la economía de producción.

### 7.1 Aprobaciones del usuario (sesión 3), vigentes
- **E2 aprobado** como modelo de referencia, con precios provisionales en dos olas. Antes de llevarlo a producción hay que:
  - verificar las simulaciones;
  - evaluar el impacto en los niveles 3 y 4;
  - conservar los saldos;
  - revisar la relectura y los abusos;
  - corregir las contradicciones entre documentos;
  - no cambiar los precios reales.
- **Seguridad para E2**, autorizada en modo experimental:
  - reloj del servidor, validación de progreso, idempotencia, cola sin conexión, compras simultáneas, restauración y compatibilidad;
  - pruebas con clientes modificados;
  - no desplegar.
- **Textos del niño:** el niño los sigue pudiendo agregar, pero el **adulto los autoriza con PIN**, verificado en el servidor. Corregir el PIN, que hoy no protege nada, sin bloquear funciones legítimas.
- **Cuncuna:** se desbloquea con 6 de los 8 cuentos originales de nivel 0. También valen:
  - una condición equivalente para quien empieza en otros niveles;
  - una alternativa para lectores lentos, que reconozca progreso educativo y no solo tiempo.
  - Se conserva el progreso y hay una celebración especial.
- **AD-017**, registrado en `CIEMPI_ART_DIRECTION.md` del repo principal (sin commitear):
  - **cuerpos** de Dragón d2 y Cuncuna c2 **aprobados** (segmentos, siluetas, patas, texturas, colores, patrones, sombras y crecimiento modular);
  - **rostros NO aprobados**.
- **AD-018:** E08 «Comer» aprobada para la integración experimental, desactivada en producción.
  - Boca inicial: sorprendida. Se conserva la de carcajada para comparar en el laboratorio.
  - Con máscaras que tapan la boca: no dibujar una segunda boca; usar una reacción alternativa (cabeza, cuerpo o efecto) sin cambiar la apariencia equipada.
- **Rama `expansion-v3-integracion` autorizada.** No fusionar a `main`, no hacer push, no desplegar, no cambiar la economía real ni generar APK.
- **Fase artística posterior, PENDIENTE.** No empezar hasta guardar y verificar la integración. Incluye:
  - rostros de Dragón y Cuncuna, con IA real;
  - Serpiente;
  - Camaleón;
  - mochilas (que no parezcan pegadas: correas, volumen, perspectiva, anclajes, sombra de contacto);
  - zapatos (que el pie entre de verdad: abertura, tobillo, suela, orientación, crecimiento);
  - todo en un laboratorio HTML con comparación antes y después.

### 7.2 Ramas, worktrees y commits
Worktrees en `/mnt/d/Proyectos/ciempi-app/.claude/worktrees/<nombre>`. No usar `git worktree remove`.

| Línea | Rama | Worktree | Último bueno (probado) | Checkpoint WIP (sin probar) |
|---|---|---|---|---|
| Seguridad + E2 + reloj + Cuncuna | `worktree-agent-a5e1c8d72e4a5aeb0` | `agent-a5e1c8d72e4a5aeb0` | `dcab7d5` | `da87153`: monedas.ts, premios.ts, repositoriosApi.ts |
| PIN para textos (nueva) | `expansion-v3-pin-textos` (desde `dcab7d5`) | `pin-textos` | — | `f1c9401`: `server/sql/014_pin_textos_propios.sql`, `server/src/autorizacion.ts`, app.ts, premios.ts, api.test.ts |
| Economía | `worktree-agent-a925a3794da34fde2` | `agent-a925a3794da34fde2` | `76c9367` | `e4e6d3b`: `simulador/sensibilidad.mjs` y `.json`; simular.mjs y resultados.json modificados |
| Animación | `worktree-agent-a103c0ae8e6a43da3` | `agent-a103c0ae8e6a43da3` | `1bf79c6` | `da13860`: `animacion/boca.ts`, animaciones, motor, rig, CiempiVivo, Vestuario, Ciempi.tsx, pose.ts (`FormaEscena` + `escenaCreciente` con `forma`), `v2-antes/` |
| Dragón y Cuncuna | `worktree-agent-ab5e3926402cffc21` | `agent-ab5e3926402cffc21` | `bba72d3` | — (sin cambios en la sesión 3) |
| Tienda | `worktree-agent-a4c7575325914c12a` | `agent-a4c7575325914c12a` | `da6dc0d` | — (TIENDA-V3 sin corregir aún) |
| Continuidad | `expansion-v3-continuidad` | `continuidad` | este commit | — |
| **Integración** | `expansion-v3-integracion` (desde `3e188ce`) | `integracion` | `bfd83c4` | — |

**Integración (`bfd83c4`):** fusionó los commits *probados* `dcab7d5`, `76c9367`, `bba72d3`, `1bf79c6`, `da6dc0d` y `de61950`, sin conflictos.
- **Pruebas combinadas (verificadas):** tsc del cliente y del servidor OK; `vitest run src` **254/254** (186 base + 43 seguridad + 13 especies + 12 animación); servidor **36/36** contra la base `ciempi_test_integracion`.
- **NO incluye** los checkpoints WIP de la tabla.
- Tiene enlaces `node_modules` y `server/node_modules`, ignorados por git.

### 7.3 Problema conocido: crecimiento optimizado frente a especies
En `pose.ts` combinado, `roles`, `posiciones` y `escena` aceptan `forma?` (especies), pero **`escenaCreciente(svg, nMax, prefix)` no**. Por eso Dragón y Cuncuna no pueden usar el modo `revelar` (`CRECIMIENTO_REVELAR = true`) ni E08 con crecimiento: el laboratorio de especies usa `escena` con recomposición.
- El WIP de animación `da13860` empieza a resolverlo: agrega una interfaz estructural `FormaEscena` en pose.ts y `escenaCreciente(..., forma?)`.
- **Falta:**
  - compilar;
  - comprobar que `FormaCuerpo` (de `especie.ts`) se puede asignar a `FormaEscena`;
  - aplicar `pieDeRol`, `xMaestro`, `siempreClonar` y `margenCola` en `encuadre`;
  - repetir `capturas.mjs` (108/108 sin `forma`);
  - probar las especies con `revelar` comparando contra `escena(…, forma)`.
- **Al fusionar hay conflicto probable en pose.ts** entre `FormaEscena` (animación) y `import type {FormaCuerpo}` (especies): unificar en un solo tipo.

### 7.4 Tareas por línea
**Seguridad / E2 (WIP `da87153`):**
- Hecho: cambios iniciales en monedas.ts, premios.ts y repositoriosApi.ts, **sin revisar**.
- Falta todo lo demás:
  - E2 detrás de una bandera (`ECONOMIA=e2`), con 2.4.1 por defecto y una prueba que lo verifique;
  - reloj del servidor sobre los segundos pagados (ráfaga ~1 h);
  - dificultad real del texto y premio por terminar uno por huella;
  - desbloqueo de la Cuncuna en el servidor, con la migración `013_*.sql` (no destructiva), idempotente, retroactivo y con un estado «por celebrar»;
  - pruebas de abuso con clientes modificados;
  - actualizar SEGURIDAD-MONEDAS.md;
  - correr los 4 comandos.
- Parámetros: ECONOMIA-V3 §6.3 (rama de economía).

**PIN (WIP `f1c9401`):**
- Hecho: migración 014, módulo `autorizacion.ts`, inicio de los cambios en app.ts, premios.ts y api.test.ts. **Sin compilar.**
- Falta:
  - documentar el flujo actual con archivos y líneas;
  - terminar las rutas;
  - pantallas del cliente: el niño agrega un texto que queda pendiente y el adulto lo aprueba con PIN;
  - PIN con hash `crypto.scrypt`, límite de intentos y verificación en el servidor;
  - un texto pendiente no paga, y al aprobarse empieza a pagar sin pagar dos veces;
  - textos existentes tratados como autorizados;
  - pruebas que intenten eludir el PIN;
  - base `ciempi_test_pin`;
  - capturas a 390 px;
  - `docs/expansion-ciempi/seguridad/PIN-TEXTOS.md`.
- Las dos ramas tocan app.ts y premios.ts: **es probable que choquen** con la de seguridad.

**Economía (WIP `e4e6d3b`):**
- Hecho: script de sensibilidad (parcial).
- Falta:
  - comprobar que el simulador sigue reproduciendo las cifras: `simular.mjs` cambió, así que repetirlo con la semilla 20261103 y comparar con `76c9367`;
  - auditoría y sensibilidad (ritmos ±30 %, tropiezos, duración, ritmos de referencia);
  - impacto en los niveles 3 y 4 (de 67 a 24 y de 120 a 27) con una mitigación simulada;
  - conservación de saldos;
  - revisión de relectura y abusos;
  - **corregir TIENDA-V3** en la rama de la tienda: Cuncuna 6/8 de nivel 0 con alternativas, precios E2 provisionales y Dragón a 80;
  - **corregir PLAN-MAESTRO** §6.5, D4 y §17, en la rama de continuidad;
  - regenerar index.html;
  - cotejar los parámetros con la implementación de E2.

**Animación (WIP `da13860`):**
- Hecho (sin probar):
  - `boca.ts` (variantes sorprendido y carcajada);
  - lógica de máscaras en animaciones, motor y rig;
  - `escenaCreciente` con `forma`;
  - respaldo del estado anterior en `v2-antes/`.
- Falta:
  - compilar y corregir;
  - selector de boca en la demo y en la hoja;
  - revisar todas las máscaras de boca tapada usando los metadatos del catálogo;
  - interrupciones (varias frutas, tropezar, celebrar, victoria, cambio de vestuario, N de 0 a 2, modo tranquilo);
  - medición intercalada a 4× y 6×;
  - hoja de cuadros nueva, inspeccionada, con la rúbrica;
  - reconstruir `demo-comer/dist`;
  - actualizar RESULTADOS.md.
- `COMER_ANIMADO` sigue en `false`.

### 7.5 Pruebas pendientes
- tsc y vitest en los cuatro WIP.
- Servidor contra `*_test*`.
- Pruebas combinadas después de la nueva fusión.
- Playwright del laboratorio de especies y de la demo E08 en la rama de integración.
- Android real, Firefox y Safari, y una APK antigua contra el servidor nuevo.

### 7.6 Otros problemas conocidos
- **Nivel 2 sin tope por libro en 2.4.1:** E2 lo resuelve, pero está apagado.
- **Monedas que se pueden perder:** libro quitado con la cola pendiente, o cola borrada al reinstalar.
- **Máscara «Gatita»:** riesgo alto de parecerse a Hello Kitty; decisión aparte.
- **Dragón:** monótono con N ≥ 12.
- **Cuncuna:** los penachos laterales quedan recortados.
- **A10 Victoria:** sale del encuadre.

---

## PROMPT PARA CONTINUAR DESDE LA PAUSA DE EMERGENCIA (sesión 4)

```text
Proyecto CIEMPI (/mnt/d/Proyectos/ciempi-app, WSL; React+TS+Vite+Capacitor, servidor Fastify+PostgreSQL).
Producción = 2.4.1, commit 3e188ce en main. Estoy retomando la expansión v3 después de una pausa de emergencia
por límite de créditos. NO conoces la conversación anterior: reconstruye el estado SOLO desde los archivos.

1. Recupera el contexto. Lee:
   - docs/expansion-ciempi/CONTINUIDAD-SESION.md de la rama expansion-v3-continuidad
     (worktree .claude/worktrees/continuidad), COMPLETO, en especial §6 y §7.
   - AGENTS.md y CIEMPI_ART_DIRECTION.md del repo principal (sin commitear; registro AD-017 y AD-018).
   - ECONOMIA-V3.md (rama worktree-agent-a925a3794da34fde2) y SEGURIDAD-MONEDAS.md
     (rama worktree-agent-a5e1c8d72e4a5aeb0).

2. Verifica los checkpoints: `git worktree list`; `git log --oneline -3 <rama>` en cada rama de la tabla §7.2;
   `git status` limpio en cada worktree. Los commits "checkpoint WIP" NO están probados.

3. Retoma las tareas incompletas de §7.4, cada una en SU worktree y rama, con subagentes en paralelo:
   a) Seguridad/E2/reloj/Cuncuna (worktree agent-a5e1c8d72e4a5aeb0, migración 013).
   b) PIN para textos (worktree pin-textos, rama expansion-v3-pin-textos, migración 014).
   c) Economía: verificación, sensibilidad, niveles 3 y 4, saldos, TIENDA-V3 (rama de la tienda) y
      PLAN-MAESTRO (rama de continuidad).
   d) Animación: bocas, máscaras, escenaCreciente+forma, interrupciones, rendimiento, demo.
   Empieza cada una compilando el WIP y corrigiéndolo. Usa SOLO bases *_test* del contenedor ciempi-db-1
   (127.0.0.1:5434, ciempi/ciempi). Playwright: NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules.

4. Integra en expansion-v3-integracion (worktree .claude/worktrees/integracion, hoy en bfd83c4):
   fusiona con --no-ff, en este orden: seguridad, PIN, economía, especies, animación, tienda, continuidad.

5. Resuelve los conflictos. Probables: server/src/app.ts y premios.ts (seguridad vs PIN) y src/ciempi/v2/pose.ts
   (FormaEscena de animación vs FormaCuerpo de especies: unificar el tipo). Comportamiento por defecto de
   Ciempi idéntico.

6. Ejecuta las pruebas COMBINADAS:
   - npx tsc --noEmit -p . ; (cd server && npx tsc --noEmit) ; npx vitest run src ;
   - DATABASE_URL=postgres://ciempi:ciempi@localhost:5434/ciempi_test_integracion npx vitest run server/test ;
   - Ciempi idéntico (capturas.mjs 108/108 y la comparación de escena de especies 35/35);
   - Dragón y Cuncuna con crecimiento revelar y E08;
   - Playwright de los laboratorios sin errores de consola.
   No declares nada funcionando solo porque las ramas compilan por separado.

7. Prepara la demostración integrada: laboratorio de Dragón y Cuncuna, demo E08 con selector de boca y
   máscaras, celebración de la Cuncuna y flujo de PIN.

8. Entrégame para aprobación:
   - la rama integrada y la lista de commits;
   - las pruebas de app y servidor, y las de crecimiento y accesorios;
   - la demo E08, el laboratorio de especies y el informe E2;
   - los pendientes, los riesgos antes del despliegue y las instrucciones para revisar.
   Distingue lo verificado, lo inferido y lo pendiente.

Prohibido sin mi autorización: tocar main (tiene cambios sin commitear ajenos que hay que conservar),
merge a main, push, desplegar, ciempi.minttu.cl, datos reales, economía o precios reales, APK, borrar
ramas o worktrees, limpieza destructiva de git.

La FASE ARTÍSTICA sigue PENDIENTE y NO se empieza hasta que la integración esté guardada, verificada
y entregada: rostros de Dragón y Cuncuna (IA real con Codex image_gen, sin cambiar los cuerpos aprobados
en AD-017), Serpiente, Camaleón, mochilas y zapatos.
```

---

## 8. SESIÓN 4 (3-nov-2026): integración experimental V3 TERMINADA

Los cuatro WIP de §7 se completaron, se probaron por línea y se integraron. Nada en `main`, sin push, despliegue ni APK, sin cambios en la economía ni en los precios reales.

| Línea | Commit final de la rama | Pruebas de la línea |
|---|---|---|
| Seguridad + E2 + reloj + Cuncuna (`worktree-agent-a5e1c8d72e4a5aeb0`) | `21910b1` | tsc OK; src 242/242; servidor 59/59 (`ciempi_test_seguridad`) |
| PIN (`expansion-v3-pin-textos`) | `3401161` | tsc OK; src 231/231; servidor 55/55 (`ciempi_test_pin`); 11 capturas a 390 px |
| Economía (`worktree-agent-a925a3794da34fde2`) | `548ba79` | simulador reproducible (semilla 20261103); ECONOMIA-V3 §18 |
| Tienda (`worktree-agent-a4c7575325914c12a`) | `ef867b3` | TIENDA-V3 corregida |
| Animación (`worktree-agent-a103c0ae8e6a43da3`) | `e1945c5` | tsc OK; 208/208; capturas 108/108 |
| Continuidad | `e22ca61` (PLAN-MAESTRO) y este commit | — |

**Integración `expansion-v3-integracion` → `748959a`** (merges `aac98bf`, `055eccc`, `37c1dd7`, `36860d8`, `f80aa87`, `c1ac6dc`, merge de continuidad, informe).
- Combinadas (verificadas): tsc cliente y servidor OK; `vitest run src` **279/279**; servidor **79/79** (`ciempi_test_integracion`); `capturas.mjs` **108/108**; especies con `escenaCreciente(…, forma)` **234/234**; Ciempi idéntico en el laboratorio **35/35**; demo E08 y hoja sin errores de consola.
- **§7.3 resuelto:** `pose.ts` usa un solo `FormaCuerpo` importado de `especie.ts`. Falta solo conectar `useEscenaCreciente` del juego con la especie.
- Informe: `docs/expansion-ciempi/INFORME-INTEGRACION-V3.md`. Índice de la demo: `docs/expansion-ciempi/demo-integrada.html`.
- Nota: `.gitignore` ignora `dist`; los JS de `demo-comer/dist` se agregaron con `git add -f`.

**Decisiones pendientes de la usuaria:** E2R + «nivel completo» retroactivo; vía lenta de la Cuncuna (60 min + 30 frases implementado, o 45 min, o un marcapáginas); boca definitiva de E08 y la reacción con máscara; «Gatita».

**Pendiente técnico:** pantalla de celebración de la Cuncuna; especie en `useEscenaCreciente`; hitos de sílabas/palabras y nivel completo de E2; avisos al adulto; Android, Firefox, Safari y APK antigua.

**Siguiente: FASE ARTÍSTICA** (autorizada para empezar una vez guardada la integración; los cuerpos de AD-017 no se tocan): rostros de Dragón y Cuncuna, Serpiente, Camaleón, mochilas y zapatos, en un laboratorio HTML con antes y después.

---

## 9. TRASPASO A UNA SESIÓN NUEVA (3-nov-2026, cierre de la sesión 4)

### 9.1 Estado verificado al cerrar
- **`main`** en `3e188ce` (producción 2.4.1), **sin tocar**. Conserva cambios ajenos sin commitear: 20 archivos modificados y 25 entradas sin versionar. La lista exacta está en `contexto/respaldo-main-2026-11-03/estado-main.txt`. **No limpiar, no commitear ni descartar.**
- **No hay agentes activos.** Tampoco procesos de la expansión, salvo un `python3 -m http.server 8772` de una sesión anterior, que es inofensivo. Los procesos MCP de Playwright y rea son de la herramienta.
- Los **9 worktrees** están limpios: ningún cambio sin commitear.

| Rama | Worktree (`.claude/worktrees/…`) | HEAD |
|---|---|---|
| **`expansion-v3-integracion`** (para retomar) | `integracion` | **`5faaf4f`** |
| `expansion-v3-continuidad` | `continuidad` | este commit (ver `git log -1`) |
| `worktree-agent-a5e1c8d72e4a5aeb0` (seguridad/E2/Cuncuna) | `agent-a5e1c8d72e4a5aeb0` | `21910b1` |
| `expansion-v3-pin-textos` | `pin-textos` | `3401161` |
| `worktree-agent-a925a3794da34fde2` (economía) | `agent-a925a3794da34fde2` | `548ba79` |
| `worktree-agent-a4c7575325914c12a` (tienda) | `agent-a4c7575325914c12a` | `ef867b3` |
| `worktree-agent-a103c0ae8e6a43da3` (animación) | `agent-a103c0ae8e6a43da3` | `e1945c5` |
| `worktree-agent-ab5e3926402cffc21` (Dragón/Cuncuna) | `agent-ab5e3926402cffc21` | `bba72d3` |

`5faaf4f` contiene todas las ramas anteriores; las pruebas y los resultados están en §8. Después de este commit, la integración se debe volver a fusionar con `expansion-v3-continuidad` para llevar esta §9.

### 9.2 Archivos NO versionados que hay que conservar (solo en `main`, sin commitear)
- **`CIEMPI_ART_DIRECTION.md`**: guía artística, con el registro AD-001 a AD-018.
- **`AGENTS.md`**: instrucciones del proyecto.

  Hay una copia de ambos en `docs/expansion-ciempi/contexto/respaldo-main-2026-11-03/`, con su sha256. **La fuente de verdad sigue siendo la de `main`.** Si difieren, manda la de `main`.
- Herramientas y evidencia artística:
  - `docs/rediseno-ciempi/laboratorio/`: laboratorio B01–B12, catálogo y aprobaciones;
  - `auditoria/`, `revisiones/` y `laboratorio-animaciones/`;
  - `docs/referencia-artiscita/`;
  - `scripts/auditar-vestuario-ciempi.mjs` y `scripts/lib/acabados-armario.mjs`.
- Además: `docs/integracion-ciempi/…`, `docs/expansion-ciempi/` (la copia antigua en `main`), `.agents/` y `.claude/` (aquí viven los worktrees).

### 9.3 Decisiones aprobadas (vigentes)
- **B01–B12:** aprobados para el laboratorio (AD-011, AD-012 y AD-014). Son la identidad visual de referencia.
- **AD-015 y AD-016:** integración del personaje y animaciones A01–A12/E01–E07 (2.0.0).
- **AD-017, Dragón (d2) y Cuncuna (c2):**
  - Los **cuerpos están aprobados** y **no se rediseñan ni se reemplazan**. Incluye segmentos, siluetas, patas, texturas, colores, patrones, sombras y crecimiento modular A→B→C→D.
  - Los **rostros NO están aprobados**: se parecen demasiado a Ciempi.
  - **Dragón:** debe tener hocico, nariz, boca, colmillos pequeños y ojos propios.
  - **Cuncuna:** mejillas, ojos, boca y expresiones más tiernas.
  - Se hacen con **generación real de imágenes con IA**. Hay libertad de geometría facial siempre que se conserven las expresiones, las animaciones y los accesorios.
- **AD-018, E08 «Comer»:**
  - Experimental y apagada en producción (`COMER_ANIMADO=false`).
  - Boca inicial sorprendida; la carcajada se conserva para comparar.
  - Con máscaras que tapan la boca no se dibuja una segunda boca.
- **Economía E2:** aprobada como referencia, con precios provisionales en dos olas (10/16/24/30, sets de 60 a 85, Dragón 80). **No está activada.**
- **Cuncuna:** se desbloquea con 6 de los 8 cuentos de N0, con alternativas para otros niveles y para lectores lentos.
- **PIN del adulto:** aprueba los textos que agrega el niño, con verificación en el servidor.
- **Preferencias de la usuaria (economía):**
  - equidad entre ritmos de lectura;
  - sin media tasa y sin topes silenciosos;
  - nunca monedas por tener la app abierta;
  - recompensas mixtas.

### 9.4 Decisiones artísticas nuevas (fase V4, registradas por pedido de la usuaria)
- **Rostros de Dragón y Cuncuna:** más característicos, adorables y expresivos, hechos con IA real. Los cuerpos quedan intactos.
- **Serpiente:** criatura nueva para desarrollar. **Camaleón:** se explora con propuestas. Las dos respetan la línea gráfica de Ciempi y el crecimiento modular (`FormaCuerpo` de `especie.ts`).
- **Mochilas:** corregir las que parecen pegadas encima del cuerpo. Necesitan correas, volumen, perspectiva, anclajes y sombra de contacto.
- **Zapatos:** corregir los que parecen dibujados sobre las patas. Deben verse puestos de verdad: abertura, tobillo, suela, perspectiva, orientación, movimiento y crecimiento.
- **Reglas para todo:**
  - conservar la identidad y los recursos aprobados B01–B12;
  - usar `CIEMPI_ART_DIRECTION.md` y las herramientas existentes;
  - preservar la evidencia del estado anterior;
  - comparar antes y después;
  - rúbrica de 1 a 5 con observaciones concretas.
  - Un cambio significativo de identidad necesita la aprobación explícita de la usuaria antes de convertirse en referencia.

### 9.5 Decisiones técnicas pendientes (NO activar en producción)
- **Activación de E2.** Hoy la bandera `ECONOMIA` deja 2.4.1 por defecto.
- **E2R** (relectura a 1,5/min en todos los niveles) y el **«nivel completo» retroactivo** (+15).
- **Seguridad de monedas:**
  - abuso «rondar» (~2,1/min);
  - avisos al adulto;
  - apps antiguas que casi no ganan con E2.
- **Desbloqueo de la Cuncuna:**
  - vía lenta: 60 min + 30 frases (implementado), 45 min o un marcapáginas;
  - la pantalla de celebración no existe todavía;
  - la Cuncuna también se desbloquea con 2.4.1, lo que es un cambio visible si se despliega.
- **Especies en el juego real:** `useEscenaCreciente` aún no recibe la especie. Faltan `componerCriatura` y `ESPECIES[id].forma` fuera del laboratorio.
- **Animación de comer:**
  - boca definitiva;
  - la fruta queda delante del labio entre 0,24 y 0,38 s;
  - en modo tranquilo la boca se abre sin fruta.
- **Compatibilidad con máscaras:** la reacción alternativa todavía no está aprobada.
- **Android real, Firefox y Safari;** pruebas con **una APK antigua** contra el servidor nuevo.
- **Personajes protegidos:**
  - «Gatita» (riesgo de parecido con Hello Kitty);
  - revisión de cuentos 21–40 en `personajes-protegidos/REVISION-PERSONAJES.md`.

### 9.6 Riesgos conocidos
- El desbloqueo de la Cuncuna es visible aunque se use la economía por defecto.
- Los textos que agrega el niño no pagan hasta que el adulto cree un PIN.
- Lo «pagado» antes de 2.5 sale de `leido_hasta`, que fijaba el cliente.
- El PIN de 4 dígitos tiene ~0,4 % de acierto al mes por niño.
- **Dragón:** monótono con N ≥ 12. **Cuncuna:** los penachos laterales quedan recortados. **A10 Victoria:** se sale del encuadre.
- `.gitignore` ignora `dist`: los builds de demo se agregan con `git add -f`.

### 9.7 Cómo recuperar los laboratorios (desde el worktree `integracion`)
- **Laboratorio de especies (Dragón/Cuncuna):**
  1. `node scripts/transformaciones/construir-laboratorio.mjs`
  2. `python3 -m http.server 8779 --bind 127.0.0.1`
  3. abrir `/docs/rediseno-ciempi/laboratorio-transformaciones/`
  4. Pruebas: `NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules LAB_URL=http://127.0.0.1:8779/docs/rediseno-ciempi/laboratorio-transformaciones/ node scripts/transformaciones/probar-laboratorio.cjs`. Debe dar Ciempi 35/35.
- **Crecimiento con especies:**
  1. copiar `docs/expansion-ciempi/animacion/fusion-especies/comprobar-crecer.{html,js}` en el laboratorio;
  2. correr `node docs/expansion-ciempi/animacion/fusion-especies/comprobar-fusion.mjs`. Debe dar 234/234.
  3. Hacerlo en una copia (`git archive HEAD`) para no ensuciar el worktree.
- **Ciempi idéntico:** `node docs/expansion-ciempi/animacion/medicion/capturas.mjs`. Debe dar 108/108; también conviene correrlo en una copia.
- **Demo E08:** `node docs/expansion-ciempi/animacion/demo-comer/servir.mjs`, luego `http://127.0.0.1:8773/` y `/hoja.html?boca=carcajada`.
- **Índice de la demo:** `docs/expansion-ciempi/demo-integrada.html`. Informe: `docs/expansion-ciempi/INFORME-INTEGRACION-V3.md`.
- **Laboratorio de vestuario B01–B12:** `docs/rediseno-ciempi/laboratorio/` en `main` (sin versionar). Auditoría: `scripts/auditar-vestuario-ciempi.mjs`. Ese script **sobrescribe sus láminas**: preservar el estado anterior antes de correrlo.
- **Catálogo de piezas:** `public/ciempi-v2/catalogo.json`, con las claves `bags` (mochilas), `footwear` (zapatos), `masks`, `hats`, `capes` y `surfaces`.
- **IA real:** `scripts/transformaciones/generar-ia.mjs <destino> <id> <prompt.txt> <refs…>`, que usa Codex CLI image_gen (`codex` en `~/.nvm/versions/node/v22.23.4/bin/codex`). Los prompts están en `scripts/transformaciones/prompts/`.
- **Revisiones previas:** `docs/rediseno-ciempi/revisiones/T01-dragon-v1/` y `T02-cuncuna-v1/`, en la rama de integración.
- **Base de datos de pruebas:** contenedor `ciempi-db-1`, 127.0.0.1:5434, ciempi/ciempi. Usar solo bases `*_test*`.
- **Playwright:** `NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules`, Chromium en `~/.cache/ms-playwright/chromium-1248/`.

### 9.8 Próximos pasos
1. La nueva sesión verifica el repositorio (§9.1) y lee el contexto.
2. Crea la rama **`expansion-v4-arte`** desde `expansion-v3-integracion`, en un worktree nuevo `.claude/worktrees/arte-v4`.
3. Hace el laboratorio V4 de la §6 de la petición: rostros de Dragón y Cuncuna, Serpiente, Camaleón, mochilas, zapatos, compatibilidad con expresiones y accesorios, crecimiento dinámico, animaciones y comparación antes y después.
4. Entrega el resultado para su aprobación. Las decisiones técnicas de §9.5 se revisan aparte.

---

## PROMPT PARA NUEVA SESIÓN — EXPANSIÓN ARTÍSTICA V4

```text
Proyecto CIEMPI (/mnt/d/Proyectos/ciempi-app, WSL). App infantil de lectura: React 19 + TS + Vite + Tailwind 4
+ Capacitor 8; servidor Fastify + PostgreSQL. Producción = 2.4.1 = commit 3e188ce en `main`.
NO conoces conversaciones anteriores: reconstruye el estado SOLO desde los archivos. Responde en español.

## 0. Antes de modificar NADA
1. Lee COMPLETO docs/expansion-ciempi/CONTINUIDAD-SESION.md en el worktree
   /mnt/d/Proyectos/ciempi-app/.claude/worktrees/continuidad (rama expansion-v3-continuidad), sobre todo §8 y §9.
2. Lee /mnt/d/Proyectos/ciempi-app/AGENTS.md y /mnt/d/Proyectos/ciempi-app/CIEMPI_ART_DIRECTION.md
   (sin versionar en main; registro AD-001…AD-018; copia de respaldo en
   docs/expansion-ciempi/contexto/respaldo-main-2026-11-03/ de la rama de continuidad).
3. Verifica: `git worktree list`; `git -C .claude/worktrees/integracion log --oneline -3` (debe incluir 5faaf4f
   y luego el merge de la continuidad §9); `git status` limpio en cada worktree; main en 3e188ce con sus cambios
   ajenos (compara con contexto/respaldo-main-2026-11-03/estado-main.txt). Si algo difiere, infórmalo antes de seguir.
4. Lee las revisiones previas: docs/rediseno-ciempi/revisiones/T01-dragon-v1/REVISION.md y T02-cuncuna-v1/REVISION.md
   (rama expansion-v3-integracion), el laboratorio de especies docs/rediseno-ciempi/laboratorio-transformaciones/,
   src/ciempi/v2/especie.ts y pose.ts, y el catálogo public/ciempi-v2/catalogo.json (bags, footwear, masks…).

## 1. Dónde trabajar
Crea la rama `expansion-v4-arte` desde `expansion-v3-integracion` en un worktree nuevo
/mnt/d/Proyectos/ciempi-app/.claude/worktrees/arte-v4 (enlaza node_modules y server/node_modules al repo principal,
como los demás worktrees). Commits frecuentes (checkpoints); termina los mensajes con la línea Co-Authored-By indicada.

## 2. Objetivo: resultados artísticos FUNCIONALES (no solo documentos)
Un laboratorio HTML probable en el navegador con:
 1. Dragón con ROSTRO mejorado (hocico, nariz, boca, colmillos pequeños, ojos propios) y CUERPO ORIGINAL INTACTO.
 2. Cuncuna con ROSTRO mejorado (mejillas, ojos, boca, expresiones tiernas) y CUERPO ORIGINAL INTACTO.
 3. Serpiente nueva (línea gráfica de Ciempi, crecimiento modular con FormaCuerpo).
 4. Propuestas de Camaleón (exploración, varias opciones).
 5. Mochilas corregidas: correas, volumen, perspectiva, anclajes y sombra de contacto (que no parezcan pegadas).
 6. Zapatos rediseñados: abertura, tobillo, suela, perspectiva, orientación; que el pie entre de verdad y acompañen
    el movimiento y el crecimiento.
 7. Compatibilidad con expresiones B03 y accesorios B01–B12 (incluidas máscaras que tapan la boca).
 8. Crecimiento dinámico (N = 0…40, escenaCreciente/rig.crecer con `forma`).
 9. Animaciones (A01–A12, E01–E08) sobre las criaturas.
10. Comparaciones antes/después en cada punto.
Usa GENERACIÓN REAL DE IMÁGENES CON IA: scripts/transformaciones/generar-ia.mjs (Codex CLI image_gen,
`codex` en ~/.nvm/versions/node/v22.23.4/bin/codex), prompts en scripts/transformaciones/prompts/. Si la IA no está
disponible, dilo; no la sustituyas en silencio por SVG simples (AD-010).

## 3. Reglas de dirección artística (obligatorias)
- Los cuerpos de Dragón (d2) y Cuncuna (c2) están APROBADOS (AD-017): no rediseñarlos ni reemplazarlos.
  Verifica que queden idénticos (comparación por píxeles del cuerpo antes/después).
- Conserva la identidad visual de Ciempi y los recursos aprobados B01–B12. Ciempi base debe quedar idéntico
  (capturas.mjs 108/108; probar-laboratorio.cjs 35/35).
- Sigue CIEMPI_ART_DIRECTION.md: silueta y proporciones → integración/expresión/materiales → detalle. Guarda la
  evidencia del estado previo ANTES de cada rediseño (el script de auditoría sobrescribe sus láminas).
- Rúbrica 1–5 (coherencia, calidad, integración, legibilidad, originalidad) con observaciones visuales concretas,
  revisando tú mismo las imágenes. No declares nada terminado solo por pruebas automáticas.
- Cambios de identidad significativos requieren aprobación explícita de la usuaria: preséntalos como propuestas.
  Registra en el registro de la guía solo decisiones que la usuaria apruebe.
- Evita parecidos con personajes protegidos.

## 4. Prohibido sin autorización explícita
Tocar `main` (tiene cambios ajenos sin commitear: conservarlos), merge a main, push, desplegar, ciempi.minttu.cl,
datos reales, economía o precios reales, activar E2/E2R/COMER_ANIMADO, generar APK, borrar ramas o worktrees,
git stash sin etiqueta, reset --hard, clean. Bases de datos solo *_test* (ciempi-db-1, 127.0.0.1:5434).
Las decisiones técnicas pendientes (CONTINUIDAD §9.5: E2, E2R, seguridad, Cuncuna, especies en el juego, E08,
máscaras, Android, APK antigua, personajes protegidos) NO son parte de esta fase salvo que la usuaria lo pida.

## 5. Entrega
Rama y commits; ruta del laboratorio y cómo abrirlo; imágenes IA generadas (con prompts y generaciones.json);
pruebas (Ciempi idéntico, cuerpos aprobados idénticos, crecimiento, accesorios, consola sin errores); rúbrica;
lo verificado, lo inferido y lo pendiente; decisiones que necesita la usuaria. Actualiza CONTINUIDAD-SESION.md.
```

---

## 10. EXPANSIÓN ARTÍSTICA V4 (3–4 de noviembre de 2026): entregada para aprobación

- **Rama:** `expansion-v4-arte` (worktree `.claude/worktrees/arte-v4`), commit `f724fa6`. Parte de `b1c1d87` y, en `7ca0748`, se le copiaron los recursos artísticos sin versionar de `main`; `main` no se tocó.
- **Sub-ramas:** `expansion-v4-rostros` (`222e0c1`), `expansion-v4-criaturas` (`e0ffd10`) y `expansion-v4-accesorios` (`1eeb864`), en los worktrees `v4-rostros`, `v4-criaturas` y `v4-accesorios`.
- **Informe:** `docs/expansion-v4/INFORME-V4.md`. **Laboratorio:** `docs/expansion-v4/index.html`, que se abre con `python3 -m http.server 8830` desde el worktree.
- **Entregables:**
  - rostros v4b de Dragón y Cuncuna, con los cuerpos intactos;
  - Serpiente v2;
  - Camaleón v2;
  - mochilas y zapatos v4.2.
- **Pruebas:**
  - Generales: tsc OK, vitest 292/292, Ciempi 35/35 y 108/108.
  - Crecimiento de Serpiente y Camaleón: 306/306. Combinado: 240 casos sin errores.
  - Cuerpos aprobados de Dragón y Cuncuna: sin cambios.
- **Revisión independiente (Fable, 2 rondas):**
  - Todo «aprobable con ajustes menores».
  - Mochilas y zapatos: «listo».
  - Camaleón: legibilidad 2 a 84 px.
- **AD-019** (aprobada por la usuaria): Serpiente sin patas, con una sola zapatilla en la cola. Está registrada **solo en la copia de la guía de la rama V4**; falta llevarla a `main`.
- **Riesgos del catálogo existente:** la máscara robot y el Propulsor recuerdan a Iron Man (alto); la gatita, a Hello Kitty (medio); el Bolso Ratón, a Mickey (medio-bajo).
- **Siguiente:**
  1. Aprobación de la usuaria pieza por pieza.
  2. Ajustes menores según el informe §4.
  3. Si se aprueba, llevar las piezas al compositor del juego detrás de una opción.

### 10.1 Variantes V5 (4-nov-2026)
- **AD-020:** la usuaria aprobó Dragón y Cuncuna V4, con el rostro v4b, como diseño base. Se conservan todas las Serpientes, con la zapatilla en la cola. Los Camaleones usan los ojos k3.
- **Catálogo experimental:** 23 variantes en `laboratorio-transformaciones/variantes.js` (`?variante=<id>`), en la rama `expansion-v4-arte`, commit `c347eb7`. Láminas, `catalogo-variantes.md` y `PENDIENTES.md` en `docs/rediseno-ciempi/revisiones/V5-variantes/`.
- **Siguiente:** que la usuaria elija qué variantes pasan a la tienda (gratis, compra o desbloqueo). No hay productos, precios ni inventario reales.
- **AD-021 (4-nov):** el Dragón aprobado usa el rostro **v4 (iteración 1)**, no el v4b; está aplicado al diseño base y a sus 6 variantes (commit `bb4e684`).

## 11. CIEMPI 2.5.0: criaturas en el juego (4-nov-2026)

- **Rama:** `release-2.5-criaturas`, commit `012470c`, en el worktree `.claude/worktrees/release-2.5`. Está publicada en GitHub (`origin/release-2.5-criaturas`). Contiene V3 + V4 + la tienda de criaturas y el render en el juego.
- **APK:** `release/CIEMPI-2.5.0.apk` (33,1 MB), también en el `release/` del repo principal. Apunta a `https://ciempi.minttu.cl`.
- **Precios** (calculados con la economía 2.4.1; hay que revisarlos cuando cambie el modelo económico):
  - Dragón 80, Camaleón 70, Serpiente 60;
  - Cuncuna gratis al leer 6 de los 8 cuentos de N0;
  - variantes a 24 (las de Cuncuna a 20);
  - paquetes con un 20 % de descuento sobre lo que falte.
- **Compras:** confirmación con el desglose especie + variante = total; el servidor rechaza cobrar más que `precioVisto`.
- **WebP:** el tinte horneado ocupa 11 MiB (524 WebP con alfa). Los PNG originales están en `c8e3ea9`.
- **Pruebas:**
  - tsc OK;
  - vitest 318/318;
  - servidor 93/93 (criaturas 14/14 hoy);
  - componentes reales 24/24 (4 especies, 23 variantes, N de 0 a 40, zapatilla en la cola);
  - capturas de Ciempi 108/108 y paridad con el laboratorio 138/138 (antes de WebP).
- **Migración verificada** sobre una copia 2.4.1 de prueba (`ciempi_test_migra241`): 012–014 tardan menos de 70 ms; saldos, inventarios, apariencias y compras quedan iguales; todos los textos existentes quedan autorizados.

### Para desplegar el servidor (requiere autorización explícita de la usuaria)
El servidor aplica 012–014 al arrancar: libro de premios, desbloqueo de la Cuncuna y PIN de textos. E2 sigue apagado.
1. `pg_dump -Fc ciempi > ciempi-antes-2.5.dump` (respaldo).
2. Restaurar el respaldo en una base de prueba en el servidor y arrancar 2.5.0 contra ella para comprobar que migra (o repetir el script de verificación).
3. `cd /var/www/ciempi-app && git fetch && git checkout release-2.5-criaturas` (o fusionar a `main`).
4. `npm ci && npm run build && npm --prefix server ci --omit=dev`.
5. `sudo systemctl restart ciempi-api` y `curl 127.0.0.1:3200/api/salud`.

Hasta desplegar, la APK 2.5.0 funciona en **modo local** (sin cuenta). Con cuenta, las compras de criaturas fallan contra el servidor 2.4.1.

**Vuelta atrás:** volver a 2.4.1 y restaurar el respaldo.

### Pendiente
- Despliegue autorizado.
- Prueba en un teléfono real (no había ningún Android conectado).
- Revisar los precios si se activa E2.
- PIN de textos (014): el texto que sube el niño queda pendiente hasta que el adulto lo aprueba; confirmar antes de desplegar.
- Máscaras robot y gatita: parecido con personajes protegidos.

## 12. CIEMPI 2.5.1 (4-nov-2026)
- **Textos sin aprobación:** el niño agrega un texto y lo lee de inmediato.
  - La migración 015 autoriza lo que estaba **pendiente**.
  - Lo **rechazado** explícitamente por un adulto no se toca: queda para revisarlo.
  - No es destructiva: las columnas y las rutas del PIN siguen, sin uso.
  - El panel del adulto ya no muestra «Textos por aprobar» ni «PIN de adulto».
- **Catálogo intacto:** la usuaria canceló la idea de retirar las máscaras Robot y Gatita. No se elimina, oculta ni deshabilita ningún producto.
- **Economía sin cambios:** rige la 2.4.1 y E2 está apagado. Los precios de las criaturas no cambian.
- **SIGUIENTE TAREA:** revisión profunda de la economía de monedas y precios, después del despliegue.
- **Despliegue (4-nov-2026):**
  - Producción quedó en **2.5.1** (`2dc35b4`), con las migraciones 012–015 aplicadas.
  - Respaldo previo: `/var/backups/ciempi/ciempi-2026-11-04-1423.dump`, más el que hizo `actualizar.sh` en el segundo intento.
  - Problemas encontrados y corregidos:
    1. La compilación de la web importaba código del servidor (faltaba `@types/pg`).
    2. La API y la CLI de `grabar-cuentos` migraron al mismo tiempo: 012 falló una vez y se aplicó al reiniciar. Ahora las migraciones toman un candado (`4f321d2`, en `main`, sin desplegar; no es urgente).

## 13. CIEMPI 2.5.2 (4-nov-2026)
- **Tienda:**
  - Criaturas es la primera sección (después Cabeza, Cuerpo, Su mundo y Conjuntos).
  - Las tarjetas de gorros, peinados, lentes, detalles, bufandas, capas, mochilas y calzado muestran solo el accesorio (`src/ciempi/v2/MiniaturaAccesorio.tsx`).
- **Cuncuna:** se compra con 40 monedas; leer ya no la regala (`CUNCUNA_POR_LECTURA = false`). Las ya otorgadas se conservan.
- **Mochilas B09:** vuelven a la tienda a su precio de 2.1 (robot 25, demás 20), con la construcción v4.2 (`src/ciempi/v2/arte/mochilas-v4.js`). Los conjuntos no cambian.
- **Inicio:** Ciempi ~18 % más grande y sus frutas (la comida elegida) con un vaivén suave.
- **Economía:** sin cambios; sigue la 2.4.1 (E2 implementado, apagado con la bandera `ECONOMIA`). Activarlo requiere la aprobación de la usuaria y que los niños tengan la APK ≥ 2.5.
- **Capturas:** `docs/expansion-v5/tienda/2.5.2/`.

## 14. CIEMPI 2.5.3 (4-nov-2026): E2 activado por la usuaria
- **Aprobación:** la usuaria aprobó activar E2. Para hacerlo en el servidor se agrega `ECONOMIA=e2` en `/var/www/ciempi-app/server/.env` y se reinicia `ciempi-api`. En la APK sin cuenta, `VITE_ECONOMIA=e2` (`.env.apk`).
- **Saldos:** no se tocan. Lo ya pagado con 2.4.1 se paga como relectura.
- **Cuncuna:** se quitaron los textos «Lee 6 cuentos…» y «Leíste muchos cuentos»; ahora solo se compra con 40 monedas.
- **Pendiente:** revisar los precios con datos reales de E2.

## 15. CIEMPI 2.6.0 (4-nov-2026)
- **Tienda y Mi ropero, separados** (una sola pantalla con `modo`):
  - la tienda muestra solo lo que no se tiene;
  - el ropero, solo lo propio, y se pone al tocarlo.
  - Grilla de 3 columnas con miniaturas más grandes, sello «Nuevo», precio destacado y «Te faltan N».
- **Inicio:** botones Tienda y Mi ropero, y un cartel con el nombre y las monedas. Capturas en `docs/expansion-v6/tienda/2.6/`.
- **Comidas nuevas generadas con IA** (10, WebP de 3–6 KB) en `public/ciempi-v2/comida/`. `Comida` usa la imagen y cae al SVG anterior si falta. Antes y después en `docs/expansion-v6/frutas/`.
- **Sin cambios** en precios, compras, servidor ni economía (sigue E2 si está activado en `server/.env`).
