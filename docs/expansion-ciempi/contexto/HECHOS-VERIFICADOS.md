# Hechos verificados para el plan de expansión de CIEMPI (2026-11-03)

## Estado del repo
- main en 3e188ce, package.json 2.4.1. Cambios sin commitear ajenos (armario, auditoría, AGENTS.md, CIEMPI_ART_DIRECTION.md, laboratorios) — no tocar.
- Stack: React 19, Vite 8, TS, Tailwind 4, Capacitor 8 Android, server Fastify + PostgreSQL. Vitest (~17 tests src + server/test). Sin Playwright ni regresión visual en el repo. `sharp` presente en node_modules sin declararse.
- Guía artística: CIEMPI_ART_DIRECTION.md v1.7 (decisiones AD-001…AD-016). Skill de proyecto .agents/skills/ciempi-art-director. Rúbrica 5 dimensiones; cambios de identidad requieren aprobación (sección 13). B01–B12 aprobados para laboratorio; animaciones A01–A12/E01–E07 aprobadas e integradas (2.0.0).

## Monedas (verificado en código)
- src/lectura/monedas.ts: MONEDAS_POR_UNIDAD {0:1,1:1,2:1,3:4,4:0}; TOPE_POR_LIBRO {0:10,1:10,2:Inf,3:15,4:0}; HITOS L2 +5 al 100 %, L4 5/10/10/15 a 25/50/75/100 %; RELECTURA {0:1,1:1,2:1,3:2,4:3} una vez al día.
- Pago en PantallaLectura.completar(): solo frase leída por primera vez (fin > leidoHasta), tramo continuo, 80 % a buen ritmo (en L0/L1 solo "sin tropiezo"). Vista previa del adulto no paga.
- Visual: moneda al final de la pista, píldora "+N 🪙" que sube, sonido WebAudio, contador en cabecera; pantalla final A10 Victoria. BUG: en L0/1/3 la pantalla final muestra como "premio" solo la moneda de la última frase (siguienteFrase({monedas: terminaLibro ? ganadas : 0})).
- BUG: relectura nunca paga en L0/1/3 (HITOS vacío ⇒ premioHasta nunca llega a 100 ⇒ yaPremiadoEntero siempre falso).
- Persistencia: POST /api/perfiles/:id/monedas {cantidad} — server/src/app.ts:392: acepta |cantidad| ≤ 100 por llamada, sin límite de llamadas, sin cotejar con progreso; cualquier usuario que pueda ver al niño (incluido el niño). Antiduplicado solo en cliente (leido_hasta / premio_hasta con greatest() en PUT progreso). Sin cola offline: si falla POST, moneda perdida.
- Farmeo posible: L2 sin tope; niño puede borrar y volver a subir su texto (leido_hasta=0).
- 40 cuentos (8 por nivel; 21–40 usan personajes con marca registrada: Spider-Man, Barbie, Harry Potter… riesgo legal antes de publicar). Monedas 1.ª lectura: L0 7–9/cuento (≈65 nivel), L1 10 (80), L2 14 (112), L3 15 (120), L4 40 (320). Total ≈697.
- Docs de economía (docs/integracion-ciempi/plan-maestro-v1/ECONOMIA-Y-BUNDLES.md) desactualizados respecto a 2.4.x.

## Tienda
- Catálogo: src/ciempi/catalogo.ts + tienda.generada.ts (scripts/generar-tienda-ciempi.mjs). 96 piezas + 6 fondos + 10 comidas. Precios 6–32 (escalones Básico 6–12, Común 14–18, Especial 20–26, Obra 28–32; precio por trabajo de construcción). Gestos gratis. Comprar todo ≈1 360 monedas (≈2× lo que dan los 40 cuentos).
- 10 conjuntos con 20 % de descuento sobre lo faltante (Robot, Dragón, Explorador, Pirata, Mago, Espíritu, AraLuz, Ratón, Realeza, Charcos). "Robot" y "Dragón" ya existen como disfraces sobre la silueta de ciempiés.
- Compra validada en servidor (transacción, for update, unique perfil_id+item_id). Equipar valida posesión. Inventario text[]. Hay vista previa, "Volver a lo mío", comprar todo, 4 secciones. NO hay favoritos. Mochilas retiradas (pendiente rediseño).
- Plan maestro v1 propone cotización en servidor con catalogVersion y operationId idempotente — no implementado. Presupuestos: manifiesto <100 KB, personaje equipado ≤1,5 MB, miniatura ≤40 KB, p95 <16,7 ms.

## Personaje y crecimiento
- Cadena: CiempiPersonaje/lectura Ciempi → useEscena → renderCiempi (v2/arte/componer.js) → escena() (v2/pose.ts) → CiempiVivo (rig). catalogo.json 273 KB.
- Base SVG viewBox 1000×650. SVG: lentes, peinados, detalles, expresiones, bufanda. Raster WebP lossless: gorros, máscaras, capas, calzado, superficies (atlas 1536×1024). public/ciempi-v2 = 16 MB; APK 23,4 MB.
- Crecimiento: segmentos = palabras/sílabas leídas en lectura; pose.ts clona roles cola/centro(ciclo 1-2-3)/frente; xs fijos, headX=736. Fuera de lectura 5 segmentos.
- Acoplado a anatomía: ids body, legs-and-sneakers, head, face-accessory, neck-front, back-accessory, antennae, eyes, mouth, jockey; pivotes en rig.js; encuadres de accesorios raster en coords de la base. Otra especie = nueva base con mismos ids + tabla de anclajes por especie + reencuadre de raster de cabeza/espalda/pies.

## Animación
- Rig propio sin librerías: src/ciempi/v2/animacion/ (rig.js setAttribute transform, motor.js rAF con inercia secundaria y reducido 35 %, animaciones.js 19 poses deterministas).
- Usos: A01 reposo, A02 caminar (lectura), E04 tropezar, A03 celebrar frase, A10 victoria, A09 estrenar ropa, A04 saludar (portada al tocar). Sin usar: A05 sorpresa, A06 dormir, A07 tristeza, A11 cariño, E06 estirarse, E07 recompensa (moneda sobre la cabeza).
- Comer fruta: NO existe. La manzana deja de dibujarse y aparece un segmento; cada sílaba/palabra recompone toda la escena (DOMParser, serializar, innerHTML, crearRig) — riesgo de rendimiento en L0 en Android de gama baja (no medido).
- Pendientes de REVISION: efectos posición fija, pata delantera tras la cabeza, capas/mochilas PNG rígidos, corte instantáneo de expresión, Firefox/Safari.

## Presencia por pantalla
- Portada h-64, Ciempi min(80%,380px), reacciona al toque (A04 + "¡Hola!"). Lectura: SVG 84 px alto, cabeza ~35–47 px. Tienda h-72, pointer-events-none. Fin de libro w-64. Panel adulto h-56. No hay pantalla de progreso del niño.

## Laboratorios
- docs/rediseno-ciempi/laboratorio/ (vestuario, 12 batches, comparación, 240/320, recolor, restaurar). laboratorio-animaciones/ (19 animaciones, cuadro a cuadro, velocidad, tamaños 96–320, hoja de 8 cuadros, movimiento reducido; 0,7–1,1 ms/frame en escritorio).

## Generación de imágenes (verificado en esta sesión)
- Codex CLI 0.165 logueado con ChatGPT; feature image_generation = stable/true. Es la herramienta real usada en B03 y B06–B12 (prompts en revisiones/*/ia/, originales en ~/.codex/generated_images). Patrón "edit first reference, preserve Ciempi exactly, navy #243e5b outlines".
- MCP agent-intern: antigravity_image NO operativo en WSL (agy CLI no en PATH). Bridge v0.29.1 (hay v0.34.0).
- Lecciones Illustrator/vectorización (B01): COM Illustrator.Application vía PowerShell -Command + DoJavaScript funciona; diálogo modal "Clipping will be lost on roundtrip to Tiny" bloqueó (usar SVG 1.1); Image Trace = juntas, banding, cientos de parches, sin degradados editables (2/5 vs 4/5 raster). Reconstrucción Bézier intencional funcionó pero plana. Conclusión: raster como maestro para piezas complejas; vectorizar solo con construcción por planos.

## Investigación externa (solo documentación, nada probado)
- Imagen: GPT Image (API background:"transparent", refs múltiples, máscara); Codex image_gen incluido en plan. Gemini Nano Banana Pro/2 hasta 14 refs, sin transparencia documentada, API sin capa gratis (~$0.034–0.134/img), SynthID. Recraft: SVG nativo $0.08, vectorizar $0.01, quitar fondo $0.01, estilos propios; plan gratuito sin uso comercial. FLUX dev no comercial. Midjourney sin API. Local ComfyUI+LoRA requiere GPU 12–24 GB. BiRefNet (MIT) para quitar fondo.
- Vector: vtracer (MIT, imita degradado con capas planas), potrace mono, SVGO. Estrategia híbrida: segmentos/cabezas/partes recoloreables en vector limpio redibujado; accesorios ricos en raster WebP 2× (~512 px) con maestro PNG 1024.
- Illustrator: UXP no público 2026; ExtendScript vía COM; ExportOptionsSVG; MCP comunitario ie3jp/illustrator-mcp-server (194★, MIT, Windows "no probado", WSL no alcanza PowerShell→Illustrator directamente).
- Animación: mantener rig SVG propio + GSAP (100 % gratis incl. plugins, MotionPath) para comer/cadena follow-the-leader/resortes; dotLottie para ráfagas; alternativa Rive (IK, follow path, mesh sobre raster; Cadet $9/mes quita splash; Rive Editor MCP oficial early access); Spine Pro $379 con IK/mesh.
- Skills/plugins verificados (fuentes): Recraft MCP remoto oficial (https://www.recraft.ai/docs/mcp-reference/remote-server.md); anthropics/claude-plugins-official (typescript-lsp, frontend-design, chrome-devtools-mcp); Adobe for creativity plugin (https://www.adobe.com/adobe-connectors/adobe-for-claude.html, alcance poco documentado); ie3jp/illustrator-mcp-server; greensock/gsap-skills (17,8k★, MIT, solo md); LottieFiles/motion-design-skill (MIT, solo md); diffusionstudio/lottie (escribe en su propio proyecto); zhongweili/nanobanana-mcp-server (requiere GEMINI_API_KEY pago); ConechoAI/Nano-Banana-MCP descartado (lee rutas arbitrarias y las envía, clave en texto plano); Comfy-Org/comfy-mcp (AGPL, GPU); Rive Editor MCP (https://rive.app/docs/editor/ai/mcp). Regresión visual: @playwright/test toHaveScreenshot (sin plugin). Android E2E: Maestro soporta WebView/Capacitor.
- Niños: Google Play Families (no tácticas manipuladoras, moneda virtual distinguible), Apple 1.3/3.1.1 (parental gate), ICO Children's Code std 13 (no reward loops/streaks para alargar uso), Deci-Koestner-Ryan 1999 (recompensas tangibles esperadas reducen motivación intrínseca), Marinak & Gambrell 2008 (recompensas cercanas a la lectura).
