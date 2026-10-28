import type { NivelLectura } from '../dominio/tipos.ts'

/**
 * Cuentos de Ciempi: vienen con la app y todo lector nuevo los encuentra en
 * su biblioteca, cada uno en su nivel (cuatro por nivel, del 0 al 4). El servidor los
 * guarda sin dueño (nadie los borra; un adulto sí puede quitárselos a un
 * niño o cambiarle el nivel). Ver server/src/cuentos.ts.
 *
 * Formato del texto: un párrafo por línea y una línea en blanco entre
 * párrafos. En los poemas, un verso por línea y una línea en blanco entre
 * estrofas. Los ids son fijos: si se corrige un cuento, se actualiza en todas
 * las bibliotecas. Un cuento nuevo se agrega a los niños que ya existen.
 */
export interface Cuento {
  id: string
  nivel: NivelLectura
  titulo: string
  texto: string
}

const id = (n: number) => `c1e0a000-0000-4000-8000-${String(n).padStart(12, '0')}`

export const AUTOR_CUENTOS = 'Cuentos de Ciempi'

export const CUENTOS: Cuento[] = [
  // ── Nivel 0: sílabas ────────────────────────────────────────────────────
  // Palabras cortas y de sílabas simples (como en el silabario): se leen
  // sílaba por sílaba, «La ca-sa de Juan».
  {
    id: id(17),
    nivel: 0,
    titulo: 'Mi mamá',
    texto: `Mi mamá me mima.
Yo amo a mi mamá.
Mamá me da la mano.
La mano de mamá es tibia.
Mamá me lee un cuento.
Mamá me da un beso.
¡Te amo, mamá!`,
  },
  {
    id: id(18),
    nivel: 0,
    titulo: 'La casa de Juan',
    texto: `La casa de Juan es muy grande.
La casa es roja.
Juan tiene un gato.
El gato se llama Lalo.
Lalo toma leche.
Lalo se sube a la mesa.
¡Baja, Lalo!
Lalo duerme en la cama.
Juan mima a Lalo.`,
  },
  {
    id: id(19),
    nivel: 0,
    titulo: 'Hola, sol',
    texto: `Sale el sol.
El sol mira la loma.
La luna se va.
Una nube pasa.
Ana sale a jugar.
Ana ve el sol.
¡Hola, sol!
El sol se ríe.`,
  },
  {
    id: id(20),
    nivel: 0,
    titulo: 'Ciempi come fruta',
    texto: `Ciempi ve una uva.
La uva es rica.
Ciempi come la uva.
Ciempi ve una pera.
Ciempi se la come.
¡Ñam, ñam!
Ciempi se toca la panza.
¡Qué panza tan grande!`,
  },
  // ── Nivel 1: palabra ────────────────────────────────────────────────────
  {
    id: id(1),
    nivel: 1,
    titulo: 'Ciempi y la manzana',
    texto: `Ciempi tiene cien pies.
Ciempi tiene hambre.
Ve una manzana roja.
La manzana está en el pasto.
Ciempi camina despacio.
Un pie, dos pies, tres pies.
¡Llegó a la manzana!
Ciempi come un poco.
¡Qué rica está!
Ciempi está feliz.`,
  },
  {
    id: id(2),
    nivel: 1,
    titulo: 'El sol y la luna',
    texto: `Sale el sol.
El sol es amarillo.
El sol da calor.
Los niños juegan en el patio.
Llega la noche.
Sale la luna.
La luna es blanca.
La luna da luz.
Los niños se van a dormir.
Buenas noches, luna.`,
  },
  {
    id: id(3),
    nivel: 1,
    titulo: 'Mi perro Pupo',
    texto: `Tengo un perro.
Mi perro se llama Pupo.
Pupo es café y chico.
Pupo mueve la cola.
Pupo salta y corre.
Pupo juega con la pelota.
A Pupo le gusta el agua.
Pupo se moja todo.
¡Pupo, ven aquí!
Pupo me da un beso.
Yo quiero mucho a Pupo.`,
  },
  {
    id: id(4),
    nivel: 1,
    titulo: 'La lluvia',
    texto: `Cae la lluvia.
Plic, plac, plic.
Mamá abre el paraguas.
Yo me pongo las botas.
Salto en el charco.
¡El agua salta también!
Un sapo canta.
Croac, croac.
Sale el sol.
Mira, un arcoíris.
Tiene muchos colores.`,
  },

  // ── Nivel 2: oración ────────────────────────────────────────────────────
  {
    id: id(5),
    nivel: 2,
    titulo: 'Ciempi va a la escuela',
    texto: `Hoy es el primer día de clases y Ciempi está muy nervioso.
Se puso sus cien zapatos nuevos, uno por uno, con mucho cuidado.
¡Se demoró toda la mañana en amarrarse los cordones!
Cuando llegó a la escuela, la profesora Hormiga lo saludó con una sonrisa.
En la sala había una mariposa, un caracol y dos chinitas.
Todos querían conocer al ciempiés de los cien zapatos.
En el recreo jugaron a la pinta y Ciempi nunca se cansó.
Al final del día, Ciempi ya tenía muchos amigos nuevos.
Mañana volverá a la escuela, pero con zapatos sin cordones.`,
  },
  {
    id: id(6),
    nivel: 2,
    titulo: 'El volantín de Tomás',
    texto: `En septiembre, Tomás y su abuelo fueron al cerro a elevar un volantín.
El volantín era rojo, azul y blanco, con una cola muy larga.
Al principio no había viento y el volantín se caía al pasto.
Tomás corrió con todas sus fuerzas, pero el volantín no subía.
De repente, una brisa fresca empezó a soplar desde el mar.
¡El volantín subió alto, muy alto, más arriba que los pájaros!
El abuelo le enseñó a soltar el hilo de a poquito.
Desde abajo, el volantín parecía una estrella de colores.
Esa tarde, Tomás aprendió que para volar hay que tener paciencia.`,
  },
  {
    id: id(7),
    nivel: 2,
    titulo: 'La semilla de Sofía',
    texto: `Sofía encontró una semilla pequeña en el bolsillo de su chaqueta.
La plantó en un macetero junto a la ventana de su pieza.
Todos los días le daba un poco de agua y le contaba cómo le había ido.
Pasó una semana y no pasó nada, pero Sofía no se rindió.
Una mañana vio una hojita verde que asomaba entre la tierra.
La plantita creció y creció hasta llegar al borde de la ventana.
En primavera se llenó de flores amarillas que miraban al sol.
¡Era un girasol!
Ahora Sofía guarda las semillas para regalarlas a sus amigos.`,
  },
  {
    id: id(8),
    nivel: 2,
    titulo: 'El pingüino que tenía frío',
    texto: `Pedro era un pingüino que vivía en el sur, donde todo era de hielo.
A los pingüinos les gustaba el frío, pero Pedro siempre estaba temblando.
Su abuela le tejió una bufanda de lana con rayas de colores.
Los otros pingüinos se rieron, porque nunca habían visto una bufanda.
Pedro se sintió triste y se fue a nadar solo al mar.
Esa noche llegó una tormenta de nieve muy fuerte.
Pedro les prestó su bufanda a los pingüinos más pequeños.
Desde ese día, la abuela teje bufandas para toda la colonia.
Y ya nadie se ríe de Pedro, el pingüino que tenía frío.`,
  },

  // ── Nivel 3: párrafo y estrofa ──────────────────────────────────────────
  {
    id: id(9),
    nivel: 3,
    titulo: 'Canción de Ciempi',
    texto: `Cien zapatitos tengo yo,
cien zapatitos de color,
camino lento por el jardín
saludando a cada flor.

Uno, dos, tres y cuatro,
me pongo a contar,
y cuando llego a noventa
me tengo que descansar.

La abeja me pregunta
por qué no voy volando,
le digo que mis pies
me llevan paseando.

Y cuando llega la noche
y se apaga el sol,
guardo mis cien zapatos
dentro de un caracol.`,
  },
  {
    id: id(10),
    nivel: 3,
    titulo: 'Mi amigo el mar',
    texto: `Mi amigo el mar
no se queda quieto,
salta y salta todo el día
como un perro inquieto.

Me trae conchitas,
me moja los pies,
y escribe en la arena
palabras al revés.

Las gaviotas lo cuidan
volando en redondo,
y los peces juegan
a la ronda en el fondo.

Cuando llega la tarde
el sol se va a bañar,
y el cielo se pone naranjo
de tanto mirar el mar.`,
  },
  {
    id: id(11),
    nivel: 3,
    titulo: 'La biblioteca secreta',
    texto: `Detrás de la escuela de Martina había una puerta pequeña que nadie abría. Era de madera verde y tenía una manilla con forma de búho. Un martes, mientras todos jugaban en el recreo, Martina vio que la puerta estaba abierta y decidió mirar.

Adentro había una sala llena de libros, desde el suelo hasta el techo. Algunos eran tan grandes como una mesa y otros tan pequeños como una caja de fósforos. En el centro, sentado en un sillón, un señor de barba blanca leía en voz baja.

El señor se llamaba don Aurelio y cuidaba esa biblioteca desde hacía cuarenta años. Le contó a Martina que cada libro de la sala guardaba un viaje. Uno llevaba al fondo del mar, otro a la luna y otro a un castillo de hielo.

Desde ese día, Martina visita la biblioteca secreta todos los martes. Ya leyó el libro del mar y el de la luna. Ahora está leyendo el del castillo de hielo, despacito, porque no quiere que se termine nunca.`,
  },
  {
    id: id(12),
    nivel: 3,
    titulo: 'El huemul perdido',
    texto: `En lo alto de la cordillera, entre bosques de lengas y coigües, vivía un huemul joven llamado Nahuel. Le gustaba explorar, pero su mamá siempre le pedía que no se alejara del arroyo. Un día de niebla, Nahuel siguió a una mariposa y, sin darse cuenta, se perdió.

Caminó y caminó, pero todos los árboles le parecían iguales. Tenía frío y empezó a tener miedo. Entonces escuchó un ruido sobre una rama. Era un chucao, un pajarito café de cola levantada, que lo miraba con curiosidad.

El chucao conocía muy bien el bosque y quiso ayudarlo. Le enseñó a escuchar el agua, porque todos los arroyos bajan hacia el valle. Nahuel paró las orejas y, a lo lejos, oyó un murmullo suave entre las piedras.

Siguiendo el sonido del agua, Nahuel llegó al arroyo justo cuando la niebla se iba. Allí estaba su mamá, esperándolo. Esa noche le contó todo lo que había aprendido. Y desde entonces, cada vez que sale a explorar, primero escucha el bosque.`,
  },

  // ── Nivel 4: lectura libre ──────────────────────────────────────────────
  {
    id: id(13),
    nivel: 4,
    titulo: 'El cóndor y el picaflor',
    texto: `Hace mucho tiempo, en la cordillera de los Andes, vivía un cóndor enorme y orgulloso. Sus alas eran tan largas que, cuando volaba, su sombra cubría los valles enteros. Todos los animales lo admiraban, y el cóndor lo sabía muy bien.

Una mañana, mientras descansaba en la punta de una roca, vio pasar a un picaflor diminuto. El pajarito movía las alas tan rápido que casi no se veían, y zumbaba de flor en flor buscando néctar.

El cóndor se rió y le dijo que, con esas alitas, nunca llegaría a ninguna parte. El picaflor no se enojó. Solo le respondió que cada uno vuela como puede, y siguió su camino.

Pasaron los días y llegó el verano más seco que se recordaba. Los ríos se achicaron, los pastos se pusieron amarillos y los animales tenían sed. Una tarde, un rayo cayó sobre el cerro y empezó un incendio en el bosque.

Los animales corrían asustados. El cóndor subió muy alto para mirar desde lejos, porque pensó que no había nada que hacer. Pero entonces vio algo que lo dejó sorprendido. El picaflor iba y venía desde la laguna con una gota de agua en el pico, y la dejaba caer sobre el fuego.

El cóndor bajó y le preguntó para qué hacía eso, si una gota no podía apagar un incendio tan grande. El picaflor, sin dejar de volar, le contestó que él estaba haciendo su parte.

El cóndor se quedó pensando. Luego abrió sus enormes alas, voló hasta la laguna y llenó su pico con toda el agua que pudo. Al verlos, las vicuñas, los zorros y hasta las ranas empezaron a ayudar como podían. Al anochecer, todos juntos lograron apagar el fuego.

Desde ese día, el cóndor nunca más se burló de nadie por ser pequeño. Y cuando ve pasar un picaflor, inclina la cabeza para saludarlo.`,
  },
  {
    id: id(14),
    nivel: 4,
    titulo: 'El gran viaje de Ciempi',
    texto: `Ciempi vivía feliz en su jardín, entre las lechugas y las margaritas. Conocía cada piedra, cada hoja y cada gota de rocío. Pero una tarde, mirando el cielo, se preguntó qué habría más allá de la reja verde que rodeaba el jardín.

A la mañana siguiente se levantó temprano, se lustró los cien zapatos y se despidió de su amiga la abeja. Ella le regaló un frasquito de miel para el camino y le pidió que volviera a contarle todo lo que viera.

El primer día, Ciempi cruzó un camino de tierra tan ancho que le pareció un desierto. Las bicicletas pasaban como truenos y él tuvo que esperar con mucha paciencia hasta que no viniera ninguna. Cuando por fin llegó al otro lado, estaba tan cansado que se durmió debajo de una piedra.

El segundo día llegó a una laguna. Nunca había visto tanta agua junta. Una rana muy amable le ofreció llevarlo en su espalda hasta la otra orilla. Ciempi se agarró fuerte con sus cien pies, y la rana saltó de hoja en hoja hasta cruzar.

El tercer día subió a una colina muy alta. Desde arriba se veía todo: el camino, la laguna, los techos de las casas y, muy lejos, un puntito verde. Ciempi entrecerró los ojos y lo reconoció. ¡Era su jardín! Desde allí se veía tan pequeño como una hoja.

En ese momento, Ciempi sintió un poco de pena. Había visto cosas maravillosas, pero extrañaba a la abeja, al caracol y a las margaritas. Así que se comió la última gota de miel y emprendió el regreso.

Cuando llegó, sus amigos lo estaban esperando. Esa noche, bajo la luz de la luna, Ciempi les contó su gran viaje. La abeja escuchaba con los ojos muy abiertos, y el caracol, que nunca había salido del jardín, decidió que algún día también iría a ver el mundo. Despacito, claro.`,
  },
  {
    id: id(15),
    nivel: 4,
    titulo: 'La niña que coleccionaba palabras',
    texto: `Amanda tenía una colección muy especial. No juntaba piedras, ni láminas, ni conchitas. Amanda coleccionaba palabras. Cada vez que escuchaba una palabra nueva, la anotaba en una libreta de tapas azules que llevaba siempre en su mochila.

Algunas palabras las encontraba en los libros, como murciélago, que tiene todas las vocales, o caleidoscopio, que suena como un juguete. Otras se las regalaban las personas. Su abuela le enseñó cachureo, que es un montón de cosas viejas. Su tío, que era marinero, le enseñó estribor y babor.

A Amanda le gustaba repetir sus palabras en voz alta antes de dormir. Las decía despacio, sílaba por sílaba, como si fueran caramelos. Algunas eran suaves, como almohada. Otras eran ruidosas, como trueno. Y otras eran tan largas que parecían trenes, como otorrinolaringólogo.

Un día, su compañero Benjamín le preguntó para qué servía coleccionar palabras. Amanda pensó un rato y le respondió que las palabras son como llaves. Con cada palabra nueva se abre una puerta distinta, porque se puede contar algo que antes no se sabía cómo decir.

Benjamín no entendió mucho, pero al día siguiente llegó con una hoja de papel doblada. Adentro había escrito una palabra que le había enseñado su papá: arrebol. Amanda no la conocía. Benjamín le explicó que el arrebol es el color rojo de las nubes cuando se esconde el sol.

Esa tarde, los dos se sentaron en la plaza a mirar el cielo. Las nubes se pusieron rosadas, después naranjas y al final de un rojo intenso. Amanda sonrió y anotó la palabra en su libreta. Era la palabra número quinientos, y la más bonita de todas, porque era la primera que alguien le regalaba sin que ella la pidiera.`,
  },
  {
    id: id(16),
    nivel: 4,
    titulo: 'El faro de la isla',
    texto: `En una isla pequeña del sur, donde el viento sopla casi todo el año, había un faro blanco con una franja roja. Allí vivía don Julián, el guardián del faro, con su gata Canela. Todas las noches, don Julián subía los ciento veinte escalones de la torre para encender la luz.

La luz del faro era muy importante. Giraba y giraba sobre el mar para avisar a los barcos dónde estaban las rocas. Gracias a ella, los pescadores podían volver a casa sin peligro, aunque la noche estuviera muy oscura.

Una tarde de invierno, don Julián se torció un tobillo al salir a buscar leña. No podía caminar, y mucho menos subir la escalera. Afuera se acercaba una tormenta, y en el mar todavía quedaban tres botes de pescadores que no habían vuelto.

Don Julián estaba muy preocupado. Entonces llegó Rosa, su nieta de nueve años, que había venido a visitarlo el fin de semana. Rosa había visto muchas veces cómo su abuelo encendía el faro, pero nunca lo había hecho sola.

Su abuelo le explicó todo con calma. Primero había que subir con la linterna, después abrir la tapa de la lámpara, girar la manilla tres veces y apretar el botón rojo. Rosa respiró hondo y empezó a subir. Canela la siguió escalón por escalón, como si quisiera acompañarla.

Arriba, el viento golpeaba los vidrios con fuerza. A Rosa le temblaban las manos, pero hizo todo tal como le había dicho su abuelo. Giró la manilla una, dos, tres veces, y apretó el botón. La gran luz se encendió y comenzó a girar sobre las olas.

Una hora después, los tres botes entraron al pequeño puerto de la isla. Los pescadores, mojados y felices, subieron hasta el faro para dar las gracias. Don Julián, desde su sillón, les dijo que esa noche la guardiana del faro había sido otra. Rosa se puso colorada, y Canela ronroneó muy orgullosa.`,
  },
]
