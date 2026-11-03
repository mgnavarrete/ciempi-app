# Brief común · CIEMPI expansión v3 (2026-11-03)

Repo principal: /mnt/d/Proyectos/ciempi-app (rama main, 3e188ce, v2.4.1). Tiene cambios SIN COMMITEAR de otras personas (armario, auditoría, laboratorios, AGENTS.md, CIEMPI_ART_DIRECTION.md): NO los toques, NO hagas git add/commit/stash/reset en el repo principal. Puedes LEERLO (rutas absolutas) como referencia.

Trabajas en tu propio git worktree (te lo da el harness). Todo tu trabajo va ahí y en tu rama. Al terminar haz `git add` + `git commit` en TU rama del worktree (mensaje en español, terminando con la línea `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`). NUNCA push, NUNCA merge a main, NUNCA despliegue, NUNCA APK, NUNCA tocar el servidor real ciempi.minttu.cl ni datos reales.

Lee primero: AGENTS.md y CIEMPI_ART_DIRECTION.md (están untracked: léelos desde /mnt/d/Proyectos/ciempi-app/), docs/expansion-ciempi/PLAN-MAESTRO-EXPANSION.md (también desde el repo principal, untracked) y docs/expansion-ciempi/contexto/HECHOS-VERIFICADOS.md (rama expansion-v3-continuidad) (hechos verificados).

## Decisiones ya tomadas por el usuario
- Dragón y Cuncuna aprobados para LABORATORIO (no integrar al juego). Cuncuna: idea de recompensa gratis al completar nivel 0; Dragón comprable; precios pendientes de la revisión económica.
- Cabeza: se conserva la geometría principal (círculo centro 736,340 r130), ojos y anclajes; SE PERMITEN cuernos, orejas, crestas, hocicos ilustrados, detalles faciales, materiales y colores propios. No deben parecer el mismo Ciempi con otra textura, y deben seguir siendo compatibles con los accesorios aprobados.
- Crecimiento modular: segmentos repetibles (A→B→C→D→A…), frente único, cola única, patas, texturas, exclusivos. Nunca estirar una imagen completa.
- Compatibilidad: universales / adaptables / exclusivos; lo comprado nunca se pierde (si no se puede usar con una criatura, queda en inventario y se oculta).
- Colecciones aprobadas como primeras temáticas: Fantasía, Naturaleza, Espacio.
- NO implementar tope diario silencioso. NO cambiar precios ni economía real. NO reescribir cuentos 21–40 (solo inventario y propuesta).
- Motor de animación propio se conserva; no añadir librerías si no es imprescindible. Medir antes de optimizar.
- Requiere autorización del usuario (no lo hagas): datos reales, producción, publicar, migraciones irreversibles, servicios de pago/cuentas nuevas, reemplazar recursos artísticos aprobados, cambiar masivamente cuentos.

## Herramientas verificadas
- Generación real de imágenes: Codex CLI 0.165 con image_gen (logueado, incluido en el plan del usuario). Uso headless probado:
  `codex exec --skip-git-repo-check --sandbox workspace-write -C <dir> -i <ref1.png> -i <ref2.png> "<prompt>; save PNG(s) into the current directory as <nombre>.png"`
  Devuelve PNG RGBA ~1254 px con fondo transparente real cuando se pide. Los originales también quedan en ~/.codex/generated_images. Patrón que funcionó antes: "edit first reference, preserve Ciempi exactly…, navy #243e5b outlines". Prompts previos: /mnt/d/Proyectos/ciempi-app/docs/rediseno-ciempi/revisiones/B09-B12-ia-v1/ia/*-prompt.txt y B03-produccion-ia-v1/ia/PROMPT.md. NO dibujes "imágenes" escribiendo SVG a mano y las llames IA.
- Playwright (Node): no está en el repo; usa `NODE_PATH=/home/menta/.npm/_npx/705bc6b22212b352/node_modules` (navegadores en ~/.cache/ms-playwright). No instales dependencias nuevas en package.json sin necesidad; si hace falta algo, dilo.
- Postgres de pruebas: contenedor ciempi-db-1 en 127.0.0.1:5434 (user/pass ciempi). `npm run test:servidor` usa la base ciempi_test. Usa SOLO bases *_test o una nueva tuya (p. ej. ciempi_test_economia) — nunca la base `ciempi` de desarrollo con datos.
- Python3 con PIL disponible. sharp está en node_modules del repo principal (no declarado).
- Para ver HTML: `python3 -m http.server <puerto> --bind 127.0.0.1` desde la raíz del worktree; puertos distintos por agente (economía 8771, arte 8772, animación 8773, tienda 8774).

## Propiedad de archivos (para evitar conflictos al fusionar)
- ECONOMÍA/SEGURIDAD: server/**, src/lectura/monedas.ts(+test), src/lectura/PantallaLectura.tsx, src/datos/** (repositorios, cola), src/App.tsx (solo lo de monedas), docs/expansion-ciempi/economia/**.
- TRANSFORMACIONES (arte): src/ciempi/v2/especie.ts, src/ciempi/v2/compatibilidad.ts (nuevos), docs/rediseno-ciempi/revisiones/T01-dragon-v1/**, T02-cuncuna-v1/**, docs/rediseno-ciempi/laboratorio-transformaciones/**, scripts/transformaciones/**. Puede añadir un parámetro OPCIONAL al final de funciones de src/ciempi/v2/pose.ts y arte/componer.js, con comportamiento por defecto idéntico (probar Ciempi píxel-idéntico).
- ANIMACIÓN: src/ciempi/v2/animacion/**, src/ciempi/v2/CiempiVivo.tsx, src/ciempi/v2/Vestuario.tsx, src/lectura/Ciempi.tsx, docs/expansion-ciempi/animacion/**. Si necesita tocar pose.ts, solo añadir funciones o parámetros opcionales al final. No tocar PantallaLectura.tsx (si lo necesitas, documenta el cambio exacto en tu informe y yo lo integro).
- TIENDA: solo documentos y conceptos: docs/expansion-ciempi/tienda/**, docs/expansion-ciempi/personajes-protegidos/**. No modifica catálogo ni precios.

## Calidad y reporte
- Distingue verificado / inferido / pendiente. No declares terminado ni aprobado artísticamente algo que no inspeccionaste visualmente (usa la herramienta Read sobre los PNG para mirarlos).
- Rúbrica de la guía (5 dimensiones, 1–5, con observación concreta) para piezas artísticas.
- Informe final en español, < 1500 palabras: qué hiciste, rama y commit, archivos, cómo verlo/ejecutarlo, pruebas y resultados, limitaciones, pendientes de aprobación.
