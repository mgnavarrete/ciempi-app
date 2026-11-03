// Generado por scripts/transformaciones/construir-laboratorio.mjs desde src/ciempi/v2/especie.ts. No editar.
/** Puntos de unión fijos: la cabeza de todas las especies es la de Ciempi. */
export const CABEZA = {
	centro: [736, 340],
	radio: 130
};
/** Forma aprobada de Ciempi: idéntica a las constantes históricas de `pose.ts`. */
export const FORMA_CIEMPI = {
	ciclo: [
		1,
		2,
		3
	],
	cola: 0,
	frente: 4,
	xFrente: 558,
	y: {
		0: 386,
		1: 410,
		2: 414,
		3: 402,
		4: 402
	},
	separacion: {
		0: 102,
		1: 101,
		2: 87,
		3: 81
	},
	xMaestro: {
		0: 187,
		1: 289,
		2: 390,
		3: 477,
		4: 558
	},
	pieDeRol: {
		0: 0,
		1: 1,
		2: 2,
		3: 3,
		4: 4
	},
	siempreClonar: false
};
/**
* Forma de las especies modulares: cola (0), A (1), B (2), C (3), frente (4) y
* D (5, guardado aparte en el maestro). Los cuatro centrales tienen el mismo
* tamaño y altura de unión; D reutiliza la pata de A.
*/
const formaModular = (y, sep, yCola, sepCola, margenCola, ciclo = [
	1,
	2,
	3,
	5
]) => ({
	ciclo,
	cola: 0,
	frente: 4,
	xFrente: 558,
	y: {
		0: yCola,
		1: y,
		2: y,
		3: y,
		4: 402,
		5: y
	},
	separacion: {
		0: sepCola,
		1: sep,
		2: sep,
		3: sep,
		5: sep
	},
	xMaestro: {
		0: 187,
		1: 289,
		2: 390,
		3: 477,
		4: 558,
		5: 289
	},
	pieDeRol: {
		0: 0,
		1: 1,
		2: 2,
		3: 3,
		4: 4,
		5: 1
	},
	siempreClonar: true,
	margenCola
});
/** Máscaras que cubren toda la cabeza (fullFace en el catálogo): tapan rasgos propios de la cabeza. */
export const MASCARAS_COMPLETAS = [
	"cabeza:b07-ia-robot",
	"cabeza:b07-ia-espiritu",
	"cabeza:b12-araluz"
];
const ADAPTABLES_COMUNES = {
	pies: { como: "El calzado se pone sobre la pata propia: mismo tobillo y mismo giro que las zapatillas de Ciempi." },
	espalda: { como: "Capas y mochilas se anclan al cuello y al segmento delantero, que conservan la posición de Ciempi." },
	paleta: { como: "La paleta tiñe el cuerpo propio de la especie con el tono derivado de su color principal (no reemplaza colores uno a uno)." },
	textura: { como: "La superficie se aplica como traje sobre el núcleo de cada segmento, con contorno propio; el pelaje/espinas exteriores quedan a la vista." }
};
export const ESPECIES = {
	ciempi: {
		id: "ciempi",
		item: "especie:ciempi",
		nombre: "Ciempi",
		estado: "aprobada",
		forma: FORMA_CIEMPI,
		adaptables: {},
		exclusivos: [],
		ocultas: [],
		rasgosOcultosCon: []
	},
	dragon: {
		id: "dragon",
		item: "especie:dragon",
		nombre: "Ciempi Dragón",
		estado: "laboratorio — pendiente de aprobación",
		forma: formaModular(402, 92, 400, 104, 175),
		adaptables: ADAPTABLES_COMUNES,
		exclusivos: [{
			id: "espalda:dragon-alas",
			parte: "espalda",
			nombre: "Alitas de dragón",
			especie: "dragon"
		}],
		ocultas: [],
		rasgosOcultosCon: [{
			parte: "cabeza",
			ids: MASCARAS_COMPLETAS,
			rasgos: ["cuernos", "hocico"],
			motivo: "La máscara completa cubre la cabeza: cuernos y hocico quedarían asomando o encima del disfraz."
		}],
		manifiesto: "docs/rediseno-ciempi/laboratorio-transformaciones/recursos/dragon/manifiesto.json"
	},
	cuncuna: {
		id: "cuncuna",
		item: "especie:cuncuna",
		nombre: "Ciempi Cuncuna",
		estado: "laboratorio — pendiente de aprobación",
		forma: formaModular(404, 88, 402, 100, 180, [
			2,
			3,
			5,
			1
		]),
		// Ciclo B→C→D→A: cola y frente son lila, así el primer central es menta y se alterna lila/menta.
		adaptables: ADAPTABLES_COMUNES,
		exclusivos: [],
		ocultas: [],
		rasgosOcultosCon: [{
			parte: "cabeza",
			ids: "*",
			rasgos: ["penacho"],
			motivo: "El penacho ocupa la coronilla: bajo gorros y máscaras se guarda para no atravesarlos."
		}, {
			parte: "pelo",
			ids: "*",
			rasgos: ["penacho"],
			motivo: "Un peinado reemplaza al penacho en la coronilla."
		}],
		manifiesto: "docs/rediseno-ciempi/laboratorio-transformaciones/recursos/cuncuna/manifiesto.json"
	}
};
export const especie = (id) => ESPECIES[id] ?? ESPECIES.ciempi;
/** Todos los exclusivos de todas las especies (para reconocerlos en el inventario). */
export const EXCLUSIVOS = Object.values(ESPECIES).flatMap((e) => e.exclusivos);
