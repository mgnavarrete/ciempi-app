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

/** Portada del cuento (generadas con scripts/portadas.mjs, en public/portadas). */
export const portadaCuento = (id: string) => `/portadas/cuento-${id.slice(-2)}.svg`

const CUENTOS_DE_CIEMPI: Cuento[] = [
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
    titulo: 'Don Ciempiés come fruta',
    texto: `Don Ciempiés ve una uva.
La uva es rica.
Don Ciempiés come la uva.
Don Ciempiés ve una pera.
Don Ciempiés se la come.
¡Ñam, ñam!
Don Ciempiés se toca la panza.
¡Qué panza tan grande!`,
  },
  // ── Nivel 1: palabra ────────────────────────────────────────────────────
  {
    id: id(1),
    nivel: 1,
    titulo: 'Don Ciempiés y la manzana',
    texto: `Don Ciempiés tiene cien pies.
Don Ciempiés tiene hambre.
Ve una manzana roja.
La manzana está en el pasto.
Don Ciempiés camina despacio.
Un pie, dos pies, tres pies.
¡Llegó a la manzana!
Don Ciempiés come un poco.
¡Qué rica está!
Don Ciempiés está feliz.`,
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
    titulo: 'Don Ciempiés va a la escuela',
    texto: `Hoy es el primer día de clases y Don Ciempiés está muy nervioso.
Se puso sus cien zapatos nuevos, uno por uno, con mucho cuidado.
¡Se demoró toda la mañana en amarrarse los cordones!
Cuando llegó a la escuela, la profesora Hormiga lo saludó con una sonrisa.
En la sala había una mariposa, un caracol y dos chinitas.
Todos querían conocer al ciempiés de los cien zapatos.
En el recreo jugaron a la pinta y Don Ciempiés nunca se cansó.
Al final del día, Don Ciempiés ya tenía muchos amigos nuevos.
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
    titulo: 'Canción de Don Ciempiés',
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
    texto: `En lo alto de la cordillera, entre bosques de árboles muy altos, vivía un huemul joven llamado Nahuel. Le gustaba explorar, pero su mamá siempre le pedía que no se alejara del arroyo. Un día de niebla, Nahuel siguió a una mariposa y, sin darse cuenta, se perdió.

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
    titulo: 'El gran viaje de Don Ciempiés',
    texto: `Don Ciempiés vivía feliz en su jardín, entre las lechugas y las margaritas. Conocía cada piedra, cada hoja y cada gota de rocío. Pero una tarde, mirando el cielo, se preguntó qué habría más allá de la reja verde que rodeaba el jardín.

A la mañana siguiente se levantó temprano, se lustró los cien zapatos y se despidió de su amiga la abeja. Ella le regaló un frasquito de miel para el camino y le pidió que volviera a contarle todo lo que viera.

El primer día, Don Ciempiés cruzó un camino de tierra tan ancho que le pareció un desierto. Las bicicletas pasaban como truenos y él tuvo que esperar con mucha paciencia hasta que no viniera ninguna. Cuando por fin llegó al otro lado, estaba tan cansado que se durmió debajo de una piedra.

El segundo día llegó a una laguna. Nunca había visto tanta agua junta. Una rana muy amable le ofreció llevarlo en su espalda hasta la otra orilla. Don Ciempiés se agarró fuerte con sus cien pies, y la rana saltó de hoja en hoja hasta cruzar.

El tercer día subió a una colina muy alta. Desde arriba se veía todo: el camino, la laguna, los techos de las casas y, muy lejos, un puntito verde. Don Ciempiés entrecerró los ojos y lo reconoció. ¡Era su jardín! Desde allí se veía tan pequeño como una hoja.

En ese momento, Don Ciempiés sintió un poco de pena. Había visto cosas maravillosas, pero extrañaba a la abeja, al caracol y a las margaritas. Así que se comió la última gota de miel y emprendió el regreso.

Cuando llegó, sus amigos lo estaban esperando. Esa noche, bajo la luz de la luna, Don Ciempiés les contó su gran viaje. La abeja escuchaba con los ojos muy abiertos, y el caracol, que nunca había salido del jardín, decidió que algún día también iría a ver el mundo. Despacito, claro.`,
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

// ── Cuentos con personajes conocidos ──────────────────────────────────────
// Cuentos originales con personajes de Marvel, DC, Warner (Harry Potter) y
// Mattel (Barbie): son marcas registradas. Están bien para uso privado (terapia,
// alumnos); antes de publicar la app en una tienda hay que quitarlos (borrar
// esta lista y sus portadas) o pedir permiso.
export const CUENTOS_DE_PERSONAJES: Cuento[] = [
  // Nivel 0: sílabas
  {
    id: id(21),
    nivel: 0,
    titulo: 'Hulk y la bola',
    texto: `Hulk es muy alto.
Hulk es verde.
Hulk ve una bola.
La bola es roja.
Hulk da un salto.
¡Pum! La bola sube.
Hulk se ríe.
¡Qué buen día!`,
  },
  {
    id: id(22),
    nivel: 0,
    titulo: 'Thor y la lluvia',
    texto: `Thor es fuerte.
Thor tiene un mazo.
El mazo da luz.
Thor mira el cielo.
Cae la lluvia.
Thor sube al techo.
Thor se moja.
¡Qué frío, Thor!`,
  },
  {
    id: id(23),
    nivel: 0,
    titulo: 'Barbie y su gato',
    texto: `Barbie tiene un gato.
El gato se llama Tom.
Tom toma leche.
Barbie mima a Tom.
Tom se sube a la cama.
Barbie le da un beso.
Tom se va a dormir.
¡Buenas noches, Tom!`,
  },
  {
    id: id(24),
    nivel: 0,
    titulo: 'Harry y su búho',
    texto: `Harry tiene un búho.
El búho es blanco.
El búho vuela.
Lleva una carta.
La carta es de Ron.
Ron lee la carta.
Ron se ríe.
¡Hola, Harry!`,
  },

  // Nivel 1: palabra
  {
    id: id(25),
    nivel: 1,
    titulo: 'Spider-Man y el gatito',
    texto: `Spider-Man vive en la ciudad.
Tiene un traje rojo y azul.
Spider-Man lanza su telaraña.
¡Zas! Sube a un edificio.
Desde arriba mira la calle.
Un gatito está en un árbol.
El gatito tiene miedo.
Spider-Man lo baja con cuidado.
La niña abraza a su gatito.
¡Gracias, Spider-Man!`,
  },
  {
    id: id(26),
    nivel: 1,
    titulo: 'Superman y el barco',
    texto: `Superman tiene una capa roja.
Superman puede volar.
Vuela sobre las nubes.
Vuela sobre el mar.
Ve un barco chiquito.
El barco tiene un hoyo.
Superman empuja el barco.
El barco llega a la playa.
Los niños aplauden.
¡Superman es muy fuerte!`,
  },
  {
    id: id(27),
    nivel: 1,
    titulo: 'Barbie va a la playa',
    texto: `Barbie va a la playa.
Lleva su sombrero rosado.
Lleva un balde y una pala.
Barbie hace un castillo.
El castillo es muy grande.
Llega una ola.
¡Oh, no! El castillo se cae.
Barbie se ríe.
Hace otro castillo más lejos.
¡Ahora sí está seguro!`,
  },
  {
    id: id(28),
    nivel: 1,
    titulo: 'Iron Man y su robot',
    texto: `Iron Man tiene un traje de metal.
El traje vuela muy alto.
Iron Man tiene un robot.
El robot es chiquito.
El robot quiere ayudar.
Toma una escoba.
Barre todo el taller.
¡Qué limpio quedó!
Iron Man le da un premio.
El robot está feliz.`,
  },

  // Nivel 2: oración
  {
    id: id(29),
    nivel: 2,
    titulo: 'Los Avengers van de picnic',
    texto: `Un domingo, los Avengers decidieron ir de picnic al parque.
Capitán América llevó sándwiches y Thor llevó una sandía gigante.
Hulk extendió el mantel, pero era demasiado pequeño para él.
Iron Man llegó volando con jugo para todos.
De pronto, unas nubes negras taparon el sol.
Thor levantó su martillo y le pidió a la lluvia que esperara.
Las nubes se fueron y el sol volvió a brillar.
Todos comieron, jugaron a la pelota y se rieron mucho.
Ese día aprendieron que los héroes también necesitan descansar.`,
  },
  {
    id: id(30),
    nivel: 2,
    titulo: 'Spider-Man y la tarea',
    texto: `Peter Parker tenía que hacer una tarea de ciencias para el lunes.
Pero cada vez que se sentaba a escribir, alguien pedía ayuda.
Primero rescató a un perrito que se había perdido en el metro.
Después ayudó a una señora a subir sus bolsas al quinto piso.
Cuando volvió a casa, ya era de noche y estaba muy cansado.
Su tía May le preparó una taza de leche con chocolate.
Peter se sentó, respiró hondo y terminó su tarea.
El lunes, la profesora le puso un siete.
Ser héroe es difícil, pero estudiar también es importante.`,
  },
  {
    id: id(31),
    nivel: 2,
    titulo: 'Hermione y el libro perdido',
    texto: `En Hogwarts, Hermione pasaba las tardes en la biblioteca.
Un día, Harry y Ron no encontraban el libro de pociones.
Lo buscaron debajo de las mesas y detrás de las velas.
Hermione cerró los ojos y pensó dónde lo había visto.
¡Estaba en la sala común, debajo del gato de Hermione!
El gato dormía sobre el libro como si fuera una almohada.
Los tres amigos se rieron y despertaron al gato con cariño.
Esa tarde estudiaron juntos hasta que salieron las estrellas.
Hermione dijo que leer en compañía es mucho mejor.`,
  },
  {
    id: id(32),
    nivel: 2,
    titulo: 'Barbie veterinaria',
    texto: `Barbie trabaja como veterinaria en un pueblo cerca del bosque.
Una mañana llegó un niño con un conejo que no quería comer.
Barbie lo revisó con cuidado y le miró los dientes.
El conejo tenía un diente muy largo que le dolía.
Barbie se lo arregló con mucha paciencia y cariño.
Después le dio una zanahoria pequeña para probar.
¡El conejo se la comió entera en un minuto!
El niño abrazó a Barbie y le regaló un dibujo.
Barbie lo pegó en la pared de su consulta.`,
  },

  // Nivel 3: párrafo y estrofa
  {
    id: id(33),
    nivel: 3,
    titulo: 'La canción de Spider-Man',
    texto: `Por la ciudad va saltando
un vecino muy amable,
con su traje rojo y azul
y una tela muy durable.

Si un gatito tiene miedo
arriba de un farol,
Spider-Man lo baja
antes de que se esconda el sol.

Nunca deja de ayudar,
aunque esté muy cansado,
porque sabe que un buen héroe
siempre está a tu lado.

Y cuando llega la noche
se sienta en un tejado,
a mirar las estrellas
con su gorro colorado.`,
  },
  {
    id: id(34),
    nivel: 3,
    titulo: 'Harry y el partido de quidditch',
    texto: `Era el primer partido de quidditch del año y Harry estaba muy nervioso. Desde su escoba veía las tribunas llenas de estudiantes con bufandas rojas y amarillas. Ron le gritaba desde abajo que no se preocupara, porque él volaba mejor que nadie.

El partido empezó y la pelota dorada, llamada snitch, desapareció entre las nubes. Harry voló de un lado a otro buscándola, mientras el viento frío le despeinaba el pelo y le empañaba los anteojos.

De pronto vio un brillo cerca de la torre más alta del castillo. Harry se inclinó sobre su escoba y voló tan rápido como pudo, esquivando a dos jugadores del otro equipo que también la habían visto.

Con la punta de los dedos atrapó la snitch y todo el estadio gritó de alegría. Esa noche, en la sala común, Hermione le dijo que lo mejor no había sido ganar, sino no rendirse nunca.`,
  },
  {
    id: id(35),
    nivel: 3,
    titulo: 'Superman y el globo rojo',
    texto: `En la ciudad de Metrópolis había una feria llena de juegos, música y algodón de azúcar. Sofía tenía un globo rojo atado a su muñeca y no lo soltaba por nada del mundo.

De pronto, una ráfaga de viento desató el globo y lo llevó hacia el cielo. Sofía lo vio subir y subir, más alto que los árboles y más alto que los edificios, y se puso a llorar.

En ese momento, algo pasó volando como un rayo azul y rojo. Era Superman, que había escuchado el llanto desde muy lejos. Atrapó el globo justo antes de que se perdiera entre las nubes.

Superman bajó despacio y le devolvió el globo a Sofía, amarrándolo con un nudo doble para que no se volviera a escapar. Ella le dio las gracias y le regaló un poco de su algodón de azúcar.`,
  },
  {
    id: id(36),
    nivel: 3,
    titulo: 'Barbie y la obra de teatro',
    texto: `En la escuela de Barbie iban a presentar una obra de teatro sobre el bosque. A Barbie le tocó ser el árbol más alto, aunque ella quería ser la mariposa que bailaba en el centro.

Al principio se sintió un poco triste, pero después pensó que un árbol también podía ser importante. Se hizo un disfraz con hojas de papel verde y ramas de cartón pintadas de café.

El día de la función, la niña que hacía de mariposa se puso muy nerviosa y no quería salir al escenario. Barbie le tomó la mano y le dijo que el árbol la iba a cuidar todo el tiempo.

La mariposa bailó alrededor del árbol y todos aplaudieron de pie. Al final, la profesora dijo que la obra había salido perfecta, porque cada uno había hecho su parte con el corazón.`,
  },

  // Nivel 4: lectura libre
  {
    id: id(37),
    nivel: 4,
    titulo: 'Los Avengers y el robot perdido',
    texto: `Una mañana de primavera, los Avengers recibieron una señal extraña en la torre: algo pedía ayuda desde el fondo del bosque. Iron Man revisó las pantallas y descubrió que era un pequeño robot de limpieza que se había escapado de un laboratorio.

Capitán América organizó al equipo para buscarlo. Thor volaría sobre los árboles, Black Widow revisaría los caminos y Hulk, que era el más fuerte, movería las rocas grandes por si el robot había quedado atrapado debajo de alguna.

Buscaron durante horas, pero el bosque era enorme y el robot no aparecía por ninguna parte. Cuando ya empezaban a cansarse, Hulk escuchó un pitido muy suave que salía de un tronco hueco, cubierto de hojas secas y de musgo.

Adentro estaba el robot, temblando y con una rueda rota. Tenía miedo, porque pensaba que lo iban a regañar por haberse escapado. Hulk lo tomó con mucho cuidado entre sus manos gigantes, como si fuera un pajarito, y le habló con voz suave.

Iron Man le arregló la rueda en un par de minutos y le preguntó por qué se había ido. El robot explicó que en el laboratorio nadie jugaba con él y que solo quería ver los árboles, los pájaros y el cielo de verdad.

Los Avengers se miraron y tuvieron una idea. Desde ese día, el pequeño robot vive en la torre con ellos: barre el piso por las mañanas y, por las tardes, sale a pasear al parque con Hulk, que se convirtió en su mejor amigo, y juntos recogen hojas secas para hacer montañas donde saltar.`,
  },
  {
    id: id(38),
    nivel: 4,
    titulo: 'Iron Man aprende a pedir ayuda',
    texto: `Tony Stark era uno de los inventores más inteligentes del mundo, y por eso pensaba que podía hacerlo todo solo. Cuando construía una armadura nueva, no dejaba que nadie lo ayudara, aunque pasara días enteros sin dormir en su taller. Sus amigos, los Avengers, le ofrecían ayuda muchas veces, pero él siempre respondía que no la necesitaba.

Un día decidió construir la armadura más grande de todas, capaz de volar hasta la luna y volver en una sola tarde. Trabajó semanas enteras, soldando piezas, conectando cables y escribiendo programas en su computador.

Por fin llegó el día de la prueba. Tony se puso la armadura, encendió los motores y despegó con un rugido. Pero apenas pasó las nubes, una alarma empezó a sonar: uno de los motores se había recalentado y la armadura comenzó a caer.

Tony intentó arreglarla en el aire, pero no podía alcanzar el motor de la espalda. Entonces, por primera vez, presionó el botón de emergencia y llamó a sus amigos. En pocos segundos aparecieron Thor, volando con su martillo, y Falcon, con sus alas metálicas.

Entre los dos sujetaron la armadura y la bajaron despacio hasta un campo de trigo. Thor enfrió el motor con una lluvia suave y Falcon le alcanzó a Tony una herramienta que se le había caído en el camino.

Esa noche, en la torre, Tony les dio las gracias y les mostró los planos de su próximo invento. Esta vez, les dijo, quería construirlo con ellos, porque había aprendido que hasta el inventor más inteligente necesita amigos que lo ayuden.`,
  },
  {
    id: id(39),
    nivel: 4,
    titulo: 'Harry Potter y el dragón bebé',
    texto: `Una tarde de otoño, Harry, Ron y Hermione fueron a visitar a Hagrid a su cabaña, al borde del bosque prohibido. Lo encontraron muy emocionado frente a la chimenea, mirando un huevo enorme y negro que se movía solo sobre las brasas.

Hagrid les contó que lo había ganado en un juego de cartas y que pronto nacería un dragón. Hermione se preocupó, porque sabía que estaba prohibido tener dragones en Hogwarts, pero Hagrid estaba tan feliz que nadie se atrevió a decirle que no.

Esa misma noche, el huevo se rompió con un crujido y salió un dragoncito con alas arrugadas y ojos amarillos. Estornudó una chispa que le quemó la barba a Hagrid, y todos se rieron. Hagrid lo llamó Norberto y le dio un balde de leche tibia.

Pasaron los días y Norberto crecía muy rápido. Ya no cabía en la cabaña, mordía los muebles y una noche casi le prende fuego al techo. Harry y sus amigos entendieron que un dragón necesita mucho espacio, montañas y otros dragones para ser feliz.

Ron le escribió a su hermano Charlie, que cuidaba dragones en Rumania. Charlie respondió que sus amigos podían recoger a Norberto en la torre más alta del castillo, a medianoche, sin que nadie se diera cuenta.

Esa noche, los tres amigos subieron la escalera en silencio, cargando una caja enorme que se movía y echaba humo. Los amigos de Charlie llegaron en escobas y se llevaron a Norberto volando bajo la luna. Hagrid lloró un poco, pero sabía que su pequeño dragón por fin tendría un hogar de verdad.`,
  },
  {
    id: id(40),
    nivel: 4,
    titulo: 'Barbie astronauta',
    texto: `Desde que era pequeña, Barbie soñaba con viajar al espacio. Pasaba las noches mirando las estrellas por la ventana de su pieza y dibujaba cohetes en todos sus cuadernos, con ventanas redondas y llamas de colores saliendo por abajo.

Cuando creció, estudió mucho y entrenó todavía más. Aprendió a flotar en piscinas enormes, a manejar computadores complicados y a comer comida que venía en bolsitas. Algunos días eran muy difíciles, pero cada vez que quería rendirse recordaba los cohetes de sus cuadernos.

Por fin llegó el gran día. Barbie se puso su traje blanco, subió al cohete junto a otros dos astronautas y escuchó la cuenta regresiva, desde diez hasta llegar a cero. El cohete tembló, rugió y subió tan rápido que Barbie sintió que el asiento la abrazaba.

Al llegar a la estación espacial, todo flotaba: el pelo, las cucharas y hasta las gotas de jugo, que parecían pequeñas pelotas brillantes. Barbie se rió mucho intentando atrapar una gota con la boca, y sus compañeros grabaron un video para mandarlo a la Tierra.

Su trabajo era cuidar un pequeño huerto en el espacio, para saber si las plantas podían crecer lejos del planeta. Todos los días regaba las lechugas, medía las hojas y anotaba todo en su cuaderno, igual que cuando era niña.

Después de seis meses, las lechugas estaban grandes y verdes. Barbie volvió a la Tierra con una foto de su huerto flotante y fue a visitar su antigua escuela. Les contó a los niños que los sueños grandes se construyen de a poquito, estudiando, practicando y sin dejar de mirar las estrellas.`,
  },
]

export const CUENTOS: Cuento[] = [...CUENTOS_DE_CIEMPI, ...CUENTOS_DE_PERSONAJES]
