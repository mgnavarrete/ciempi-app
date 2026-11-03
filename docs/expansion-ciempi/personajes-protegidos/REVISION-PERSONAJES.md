# CIEMPI · Revisión de personajes y marcas de terceros

**Fecha:** 3 de noviembre de 2026 · **Estado:** inventario y propuesta. **No se reescribió nada**: cuentos, catálogo, recursos y nombres siguen como están.
**No es asesoría legal.** Es un análisis de producto con fuentes públicas. Antes de publicar en Google Play, la decisión debe revisarla una persona con formación jurídica en propiedad intelectual (Chile y los países donde se distribuya).

Marcas: **[V]** verificado en el repositorio · **[F]** según fuente externa citada · **[I]** inferencia o propuesta.

---

## 1. Inventario de elementos afectados

### 1.1 Cuentos 21–40 (`src/contenido/cuentos.ts`, `CUENTOS_DE_PERSONAJES`)

El propio código ya avisa: «son marcas registradas… antes de publicar la app en una tienda hay que quitarlos… o pedir permiso» (línea ~355) [V]. Están en `CUENTOS` y por eso el servidor los siembra en la biblioteca de **todos** los niños (`server/src/cuentos.ts`, `sembrarCuentos` y `darCuentos`) [V]. La versión local los añade con una migración (`repositoriosLocales.ts:194`) [V].

| N.º (id `…0000000000NN`) | Nivel | Título | Personajes y marcas en el texto | Palabras | Frases* |
|---|---|---|---|---:|---:|
| 21 | 0 | Hulk y la bola | Hulk (Marvel) | 29 | 9 |
| 22 | 0 | Thor y la lluvia | Thor, su mazo (Marvel) | 28 | 8 |
| 23 | 0 | Barbie y su gato | Barbie (Mattel) | 35 | 8 |
| 24 | 0 | Harry y su búho | Harry, Ron, el búho blanco con carta (Harry Potter) | 28 | 8 |
| 25 | 1 | Spider-Man y el gatito | Spider-Man (Marvel) | 48 | 11 |
| 26 | 1 | Superman y el barco | Superman (DC) | 42 | 10 |
| 27 | 1 | Barbie va a la playa | Barbie | 45 | 11 |
| 28 | 1 | Iron Man y su robot | Iron Man (Marvel) | 45 | 10 |
| 29 | 2 | Los Avengers van de picnic | Avengers, Capitán América, Thor, Hulk, Iron Man | 87 | 9 |
| 30 | 2 | Spider-Man y la tarea | Spider-Man, Peter Parker, tía May | 96 | 9 |
| 31 | 2 | Hermione y el libro perdido | Hermione, Harry, Ron, Hogwarts | 91 | 9 |
| 32 | 2 | Barbie veterinaria | Barbie | 87 | 9 |
| 33 | 3 | La canción de Spider-Man | Spider-Man (poema) | 76 | 4 |
| 34 | 3 | Harry y el partido de quidditch | Harry, Ron, Hermione, quidditch, snitch, escoba | 149 | 9 |
| 35 | 3 | Superman y el globo rojo | Superman, Metrópolis | 141 | 9 |
| 36 | 3 | Barbie y la obra de teatro | Barbie | 139 | 8 |
| 37 | 4 | Los Avengers y el robot perdido | Avengers, Iron Man, Capitán América, Thor, Hulk, Black Widow | 261 | 13 |
| 38 | 4 | Iron Man aprende a pedir ayuda | Iron Man, Tony Stark, Avengers, Thor, Falcon | 260 | 15 |
| 39 | 4 | Harry Potter y el dragón bebé | Harry, Ron, Hermione, Hagrid, Hogwarts, Norberto, Charlie, Rumania | 264 | 15 |
| 40 | 4 | Barbie astronauta | Barbie | 266 | 15 |

\*Recuento aproximado por puntuación; la cifra real la da `dividirConParrafos` (lo que usa el servidor).

**Elementos asociados a los cuentos**
- **Portadas** `public/portadas/cuento-21.svg` … `cuento-40.svg`: solo usan emojis (💪, 🕷️, 👩‍🚀…), sin logos ni dibujos de los personajes [V]. **El riesgo está en el título que se muestra junto a ellas, no en la imagen.** Se generan con `scripts/portadas.mjs` (línea 27 en adelante).
- **Pronunciación** `src/audio/pronunciacion.ts`, `NOMBRES`: 22 entradas para que la voz lea nombres ingleses (harry→«jarri», hulk→«jolk», spiderman→«espáiderman»…) y sus pruebas en `pronunciacion.test.ts` [V].
- **Autor visible:** «Cuentos de Ciempi» (`AUTOR_CUENTOS`) [V]. Presenta como propios unos cuentos con personajes ajenos.

### 1.2 Tienda: nombres visibles y diseños

Fuente: `tienda.generada.ts` (los nombres que ve el niño), `public/ciempi-v2/catalogo.json` (que se incluye en la web y en la APK), `scripts/generar-tienda-ciempi.mjs` y `src/ciempi/v2/arte/lib/colecciones-personajes.mjs` [V].

| Id interno | Nombre visible hoy | Tipo de riesgo | Nivel [I] |
|---|---|---|---|
| `paleta:spider` | Spider-Man | Nombre de marca | Alto |
| `paleta:iron` | Iron Man | Nombre de marca | Alto |
| `paleta:super` | Superman | Nombre de marca | Alto |
| `paleta:gryffindor` · `slytherin` · `ravenclaw` · `hufflepuff` | Gryffindor · Slytherin · Ravenclaw · Hufflepuff | Nombres de la obra | Alto |
| `paleta:harry` · `paleta:hermione` | Harry · Hermione | Nombres de personaje | Alto |
| `paleta:voldemort` | Voldemort | Nombre de personaje | Alto |
| `paleta:kitty` | Kitty | Nombre de marca (Hello Kitty) | Medio-alto |
| `paleta:barbie` · `paleta:minnie` · `paleta:mickey` | Barbie · Minnie · Mickey | Nombres de marca | Alto |
| `cuello:bufanda-calco32`, variantes `gryffindor`, `slytherin`, `ravenclaw`, `hufflepuff` | Gryffindor · Slytherin · Ravenclaw · Hufflepuff (colores de la bufanda) | Nombre visible; rayas de dos colores | Alto en el nombre, bajo en el diseño |
| `pelo:b05-harry` | Harry | Nombre de personaje | Alto en el nombre, bajo en el diseño |
| `pelo:b05-hermione` · `b05-barbie` · `b05-super` | Rizos · Pelo largo · Copete | Solo en el id interno | Bajo |
| `detalle:b04-cicatriz` | Rayo | Cicatriz en rayo; sumada a Redondos, la bufanda roja y oro y el peinado, recompone a Harry | Bajo por separado, medio en combinación |
| `cara:b04-redondos` | Redondos (en `catalogo.json`: «Redondos · Harry») | Lentes redondos genéricos | Bajo (nombre interno) |
| `cara:b04-corazones`, variante `barbie` | Rosa (en `catalogo.json`: «Rosa Barbie») | Nombre interno | Bajo |
| `cabeza:b07-ia-gatita` | Gatita | **El diseño reproduce los rasgos de Hello Kitty**: cara blanca, lazo rosa sobre la oreja derecha, nariz ovalada amarilla y tres bigotes por lado (inspeccioné `B06-B07-B08-ia-v2/ia/mascara-gatita.png`). Su id anterior era `b07-kitty` | **Alto (diseño)** |
| `cabeza:b07-ia-robot`, `textura:b11-robot`, `pies:b10-robot`, conjunto Robot | Robot / Armadura / Botas robot | Armadura roja y dorada con un núcleo circular cian en el pecho: recuerda a Iron Man. Id anterior `b07-iron` | **Medio (diseño)** |
| `cabeza:b12-araluz` y su conjunto | AraLuz | Héroe original de seda, cobre y petróleo, sin logo de araña. Se diseñó explícitamente como «NOT Spider-Man» | Bajo |
| `cabeza:b12-raton` y su conjunto | Ratón | Ratón explorador original, orejas café, «NOT Mickey» | Bajo |
| `cabeza:b07-ia-espiritu` (conjunto Espíritu) | Espíritu | Hechicero original; `catalogo.json` aclara «no es Voldemort exacto» | Bajo |
| `catalogo.json` (campos `collections`, `nombre`, `anterior`) | No visibles en la tienda | Cadenas «harry-potter», «Barbie · ondas largas», «Harry · mechones libres»… **viajan en la APK** | Bajo |
| `src/ciempi/v2/seleccion.ts` (`variante:'gryffindor'` en BASE), `catalogo.test.ts` | Internos | Ids en el código | Muy bajo |

Conjuntos: los diez tienen nombres visibles originales (Robot, Dragón, Explorador, Pirata, Mago, Espíritu, AraLuz, Ratón, Realeza, Charcos) [V]. **Los riesgos están en las paletas, en la bufanda, en el peinado «Harry» y en los diseños Gatita y Robot.**

Otros lugares: la documentación de laboratorio y auditoría (`docs/rediseno-ciempi/**`) usa estos nombres sin cesar. Es material interno y no se publica, así que no requiere cambios.

---

## 2. Riesgos legales (resumen, no asesoría)

1. **Política de Google Play sobre propiedad intelectual** [F]: Google Play no permite apps que infrinjan propiedad intelectual ajena, incluidas marcas y derechos de autor. Sobre derechos de autor indica que «modificar contenido protegido puede seguir constituyendo una infracción» y que se puede pedir al desarrollador que demuestre sus derechos. Sobre marcas prohíbe el «uso indebido o no autorizado de una marca idéntica o similar de forma que pueda causar confusión», y prevé la suspensión de la app. Si se tiene autorización, Google recomienda contactar al equipo de Play **antes** del envío y aportar prueba escrita. Fuente: [Google Play · Intellectual Property policy](https://support.google.com/googleplay/android-developer/answer/9888072).
   - Las guías de terceros y los foros de desarrolladores describen rechazos por contenido protegido en capturas y fichas, y afirman que llamar «no oficial» a una app no evita la infracción. Fuentes secundarias: [GoodBarber · rechazo por propiedad intelectual](https://www.goodbarber.com/help/google-rejection-r101/google-rejection-intellectual-property-infringement-a223).
2. **Derechos de autor sobre personajes** [F]: en EE. UU., los personajes «bien delineados» (rasgos, aspecto y poderes constantes) se protegen con independencia de la obra. Superman es el ejemplo clásico. Fuente secundaria: [Copyright protection for fictional characters](https://en.wikipedia.org/wiki/Copyright_protection_for_fictional_characters). Escribir un cuento nuevo con Spider-Man o Harry no lo hace original: es una obra derivada.
3. **Chile, Ley 17.336** [F]: la obra derivada (adaptación o transformación de una obra protegida) corresponde a quien la hace **con autorización del titular de la obra original** (art. 9). La doctrina citada sostiene que solo valen autorizaciones expresas. Fuentes: [Ley 17.336 en WIPO Lex](https://www.wipo.int/wipolex/en/legislation/details/18880) · [art. 9 comentado](https://iura.cl/17336/9).
4. **Marcas** [I]: Spider-Man, Iron Man, Avengers, Hulk, Thor (Marvel/Disney), Superman (DC/Warner), Harry Potter y Hogwarts (Warner/Wizarding World), Barbie (Mattel), Hello Kitty (Sanrio) y Mickey/Minnie (Disney) se explotan como marcas comerciales en juguetes, apps y ropa. **No verifiqué registros concretos en INAPI ni en USPTO.** Usar estos nombres como nombre de producto en una tienda (aunque se pague con monedas virtuales) es el escenario más claro de «uso que puede causar confusión» sobre patrocinio o afiliación.
5. **Agravantes propios de CIEMPI** [I]: es una app infantil (Google Play Familias exige más cuidado); los cuentos se atribuyen a «Cuentos de Ciempi»; las piezas se venden en una tienda, aunque sea con monedas virtuales; y el diseño Gatita reproduce rasgos reconocibles aunque tenga un nombre neutro.
6. **Lo que reduce el riesgo, sin eliminarlo** [I]: las portadas solo usan emojis; no hay logos; las máscaras AraLuz, Ratón y Espíritu ya son originales; el uso privado actual (terapia, alumnos) no es lo mismo que la distribución pública. **No conviene confiar en «uso educativo» ni «parodia» como defensa sin asesoría.**

**Conclusión:** para publicar en Play, lo prudente es **eliminar todo nombre de tercero visible y los diseños que reproducen rasgos protegidos (Gatita, y probablemente la combinación roja y dorada del Robot)**, o conseguir licencias, que en la práctica no es viable para este proyecto.

---

## 3. Alternativas originales (conservan el gancho)

Se proponen personajes del universo Ciempi que mantienen el tema que atrae al niño (superhéroe, mago, muñeca/oficios, robot), con **nombres de sílabas directas** en el nivel 0. Algunos enlazan con piezas o especies que ya existen.

| Original | Gancho | Alternativa propuesta | Por qué |
|---|---|---|---|
| Hulk | Gigante fuerte y bueno | **Toto, el gigante del bosque** | To-to: dos sílabas directas, ideal para nivel 0. Puede ser un oso o gigante de musgo verde |
| Thor | Trueno y lluvia | **Lolo y el tambor del trueno** | Lo-lo; el mazo pasa a ser un tambor que hace truenos |
| Barbie (23, 27, 32, 36, 40) | Muñeca que prueba oficios y moda | **Mila**, amiga que prueba un oficio en cada cuento (veterinaria, actriz, astronauta…) | Mi-la; conserva la serie de oficios; «Mila astronauta» enlaza con la colección Espacio |
| Harry (24, 34, 39) | Niño mago con búho | **Memo, el aprendiz de mago**, con su búho **Pipo** | Me-mo y Pi-po; el búho enlaza con la máscara Búho de la tienda |
| Ron | Amigo del mago | **Tato** | Ta-to |
| Hermione (31) | Niña estudiosa que ama los libros | **Lía, la que lo leía todo** | Refuerza el tema de la lectura |
| Hogwarts / Hagrid | Escuela de magia / guardabosques | **La Escuela de la Torre** / **don Bruno, el guardabosques** | |
| Quidditch / snitch | Deporte en escoba | **Partido de escobas** con la **bolita dorada** | Más fácil de leer |
| Norberto, el dragón bebé (39) | Dragón bebé | **Chispa, el dragón bebé** | Enlaza con la especie Dragón del plan |
| Spider-Man (25, 30, 33) | Superhéroe que trepa y teje | **AraLuz** (ya existe en la tienda) | Reutiliza un personaje original aprobado; «A-ra-Luz» se lee bien desde el nivel 1 |
| Peter Parker / tía May | Identidad secreta y familia | **Ara (Clara)** y **su abuela Tita** | |
| Superman (26, 35) | Héroe volador y fuerte | **Capitán Cometa** | Enlaza con la colección Espacio (Capa cometa) |
| Metrópolis | Ciudad | **la ciudad de Pampa Alta** | |
| Iron Man / Tony Stark (28, 38) | Inventor con armadura | **Teo, el inventor**, y su armadura **Lumen** | Lumen es el nombre de diseño del conjunto Robot |
| Avengers (29, 37) | Equipo de héroes | **La Patrulla del Jardín**: Toto, Lolo, AraLuz, Capitán Cometa y Teo | Mantiene el gancho de un equipo |
| Capitán América / Black Widow / Falcon | Miembros del equipo | **Escudo**, **Sombra** y **Halcón**, nombres comunes y genéricos | Comprobar que no imitan el traje |

**Tienda: nombres visibles nuevos** (ids iguales):

| Id | Hoy | Propuesta |
|---|---|---|
| `paleta:spider` | Spider-Man | Rojo y azul |
| `paleta:iron` | Iron Man | Rojo y oro |
| `paleta:super` | Superman | Azul héroe |
| `paleta:gryffindor` (+ harry, hermione) | Gryffindor / Harry / Hermione | León (una sola tarjeta, con sus variantes) |
| `paleta:slytherin` | Slytherin | Esmeralda |
| `paleta:ravenclaw` | Ravenclaw | Azul y bronce |
| `paleta:hufflepuff` | Hufflepuff | Abeja |
| `paleta:voldemort` | Voldemort | Sombra |
| `paleta:kitty` | Kitty | Algodón |
| `paleta:barbie` (+ minnie) | Barbie / Minnie | Fresa (una sola tarjeta) |
| `paleta:mickey` | Mickey | Botones |
| Bufanda: variantes de casa | Gryffindor… | Rojo y oro · Verde y plata · Azul y bronce · Amarillo y negro |
| `pelo:b05-harry` | Harry | Despeinado |
| `cabeza:b07-ia-gatita` | Gatita | **Rediseño** (§6, fase 2): por ejemplo, gatita atigrada de color, sin lazo en la oreja ni nariz amarilla |
| Conjunto Robot / piezas robot | Robot | Nombre «Lumen». Diseño: estudiar otra combinación de color (por ejemplo, cobre y menta) y un núcleo que no sea un disco central en el pecho [I] |

Además, en `catalogo.json` conviene limpiar los nombres internos que viajan en la APK («Redondos · Harry», «Harry · mechones libres», `collections: harry-potter`…), sin cambiar ids.

---

## 4. Impacto educativo

- **Los nombres ingleses van en contra del método.** El nivel 0 lee por sílabas directas. «Hulk», «Thor», «Barbie» y «Harry» tienen h muda, sílabas cerradas, grupos ajenos al castellano (lk, rr) y diptongos ingleses. Por eso el código necesita `pronunciacion.ts` con divisiones especiales, como harry→`['ja','ri']` o hulk→`['jolk']` [V]. **Un niño que decodifica «H-a-r-r-y» por sílabas en castellano lee mal**, y la app le marca un tropiezo que no es suyo.
- **Toto, Lolo, Mila, Memo, Pipo y Tato** son CV-CV, como «mamá» o «casa» en los cuentos 17–20. **La sustitución mejora la decodificabilidad del nivel 0** [I].
- **Niveles 1–2:** AraLuz, Capitán Cometa y Teo tienen sílabas simples o trabadas frecuentes (tr, pl) adecuadas. «Lía» introduce un hiato, útil en el nivel 2.
- **Niveles 3–4:** el vocabulario («inventor», «guardabosques», «astronauta») mantiene la longitud y riqueza de los originales. Hay que conservar el **número de frases y una longitud parecida** para no alterar las monedas (la paga va por frase y por hitos) ni la dificultad.
- **Motivación:** se pierde el reconocimiento inmediato del personaje famoso. Se compensa con: (a) personajes que **aparecen también en la tienda** (AraLuz, Lumen, Búho, Dragón), lo que crea un universo propio; (b) los mismos temas (superhéroes, magia, oficios, espacio). Habría que comprobarlo con niños; no hay evidencia todavía.
- **Pronunciación:** con nombres castellanos se pueden borrar unas 22 entradas de `NOMBRES` y sus pruebas, y desaparece una fuente de errores de la voz.

---

## 5. Estrategia para conservar progreso, inventario y compras

### 5.1 Cuentos
- **Mantener los ids** `c1e0a000-0000-4000-8000-0000000000NN` (21–40) y el nivel de cada uno. `sembrarCuentos` actualiza el título, el texto, las frases y la portada **sobre la misma fila** (`on conflict (id) do update`) [V]. No crea textos nuevos ni nuevas asignaciones.
- **Las asignaciones no se tocan:** `estado`, `completada_en`, `frase_actual`, `frase_maxima`, `leido_hasta` y `premio_hasta` se conservan [V, `009_premios_por_avance.sql`].
- **Regla crítica:** cada cuento reescrito debe tener **exactamente el mismo número de frases** según `dividirConParrafos`. `leido_hasta` y `frase_actual` son índices de frase: si el texto nuevo tiene menos frases, un niño a mitad de lectura quedaría fuera de rango; si tiene más, se pagarían de nuevo frases «nuevas». Hay que añadir un test que compare el recuento de frases de cada id antes y después.
- Quien terminó el cuento lo sigue teniendo terminado (aparece con el título nuevo). **No se vuelven a pagar** las monedas de los cuentos ya leídos: el pago depende de `leido_hasta`, que no cambia.
- `sesiones_lectura` conserva su historial por `texto_id`. El panel del adulto mostrará el título nuevo; conviene un aviso único en el panel: «Renombramos 20 cuentos con personajes propios de Ciempi».
- Portadas: mismo nombre de archivo (`cuento-NN.svg`). Basta con regenerar las que cambien de emoji.
- Versión local (sin servidor): `darCuentos` (`repositoriosLocales.ts:234`) ya reescribe el texto, el título y la portada de un cuento existente cuando cambian (línea 247) [V]. Pero solo se llama desde las migraciones locales (líneas 171 y 194) y al crear un perfil (línea 360). Por eso hace falta **una migración local nueva** que la invoque para los perfiles existentes [I].

### 5.2 Tienda
- **No cambian ids, inventarios ni apariencias guardadas.** Solo cambian los nombres visibles en `NOMBRES` de `generar-tienda-ciempi.mjs` y `NOMBRES_COLORES`, y se regenera `tienda.generada.ts`.
- **Lo comprado con el nombre antiguo sigue igual, con el nombre nuevo y sin devolución** (instrucción del usuario). A diferencia de las mochilas en 2.2, el objeto no desaparece: solo se renombra, así que no hay pérdida.
- **Rediseño de Gatita (y quizá del Robot):** se mantiene el id; quien lo tenga ve el diseño nuevo. Si el usuario prefiere no reemplazar el arte aprobado, la alternativa es **retirarlo de la venta y mantenerlo en el armario de quien lo compró**. Sin embargo, si la app se publica, seguiría mostrándose, así que para Play no basta.
- Las familias (`FAMILIAS`) se mantienen: comprar «León» sigue dando derecho a las tres paletas antiguas.

---

## 6. Sustitución por fases

| Fase | Contenido | Requiere aprobación del usuario | Pruebas |
|---|---|---|---|
| **0 · Inventario** (este documento) | Lista de elementos, riesgos y alternativas | No (documentación) | — |
| **1 · Nombres visibles de la tienda** | Paletas, colores de bufanda y «Harry»→«Despeinado»; limpiar nombres internos de `catalogo.json` | **Sí**: cambia lo que ven los niños | Test: ids y precios idénticos; las familias siguen funcionando |
| **2 · Cuentos 21–40** | Reescribir los 20 con personajes propios, **mismo número de frases**; actualizar portadas y `pronunciacion.ts` | **Sí, cambio masivo de cuentos** (prohibido sin autorización por el brief) y revisión pedagógica | Recuento de frases por id; monedas por cuento iguales; `test:servidor` en `ciempi_test` con asignaciones a medias |
| **3 · Diseños con rasgos protegidos** | Rediseño de Gatita; estudio de color del Robot/Lumen | **Sí: reemplaza recursos aprobados** (AD-012, guía §13) | Ficha de revisión, guía §11–§12, antes/después |
| **4 · Revisión legal** | Lectura del resultado por un asesor; ficha de Play sin nombres ajenos (capturas incluidas) | Decisión del usuario | Lista de comprobación de la ficha |
| **5 · Publicación** | Solo después de 1–4 | Orden explícita de publicar | — |

**Mientras tanto:** el uso privado actual puede seguir igual. Si se quiere un estado intermedio sin reescribir, existe la opción reversible de **no sembrar** `CUENTOS_DE_PERSONAJES` para niños **nuevos** (sin quitárselos a quien ya los tiene). También requiere aprobación, porque cambia la biblioteca.

## Límites
- No es asesoría legal. No consulté registros de marcas (INAPI/USPTO) ni contratos de licencia.
- El recuento de frases de la tabla es aproximado; el definitivo lo da `dividirConParrafos`.
- Solo inspeccioné visualmente la máscara Gatita y la galería de conjuntos B09–B12. No revisé una por una todas las piezas de las colecciones antiguas de personajes que ya no están en la tienda.
- El efecto motivacional de los personajes originales no se ha probado con niños.
