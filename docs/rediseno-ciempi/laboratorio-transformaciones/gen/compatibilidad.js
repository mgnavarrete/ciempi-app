// Generado por scripts/transformaciones/construir-laboratorio.mjs desde src/ciempi/v2/compatibilidad.ts. No editar.
/**
* Compatibilidad de la apariencia con una especie (LABORATORIO — no integrado).
*
* Decide qué piezas equipadas se ven y cuáles se ocultan en una especie, con el
* motivo. Nunca modifica la apariencia ni el inventario: lo comprado y
* equipado se conserva y vuelve a verse al cambiar a una especie compatible.
*
* - universal: cuelga de la cabeza o el cuello (iguales en todas las especies) → se ve igual.
* - adaptable: pies, espalda, paleta y textura → se ve, ajustado a la especie.
* - exclusivo: pieza propia de una especie → solo se ve en ella.
*/
import { EXCLUSIVOS, especie as buscarEspecie } from './especie.js';
/** Partes del personaje (fondo y comida no se dibujan sobre él, pero son universales). */
export const PARTES_PERSONAJE = [
	"paleta",
	"ojos",
	"gesto",
	"cabeza",
	"pelo",
	"detalle",
	"cara",
	"cuello",
	"espalda",
	"pies",
	"textura",
	"fondo",
	"comida"
];
/** Valor «sin nada» de cada parte, con el formato de la tienda. */
export const NINGUNO = {
	cabeza: "cabeza:cabeza-nada",
	pelo: "pelo:pelo-nada",
	detalle: "detalle:detalle-nada",
	cara: "cara:cara-nada",
	cuello: "cuello:cuello-nada",
	espalda: "espalda:espalda-nada",
	pies: "pies:pies-zapatillas",
	textura: "textura:liso",
	paleta: "paleta:clasica",
	gesto: "gesto:b03-alegre",
	ojos: "ojos:oscuro"
};
const exclusivoDe = (id) => EXCLUSIVOS.find((x) => x.id === id);
/** Tipo de compatibilidad de una pieza en una especie, sin mirar si está oculta. */
export function tipoDe(parte, id, especie = "ciempi") {
	const e = typeof especie === "string" ? buscarEspecie(especie) : especie;
	if (exclusivoDe(id)) return "exclusivo";
	if (esNinguno(parte, id)) return "universal";
	return e.adaptables[parte] ? "adaptable" : "universal";
}
const esNinguno = (parte, id) => NINGUNO[parte] === id;
/** Etiqueta de una pieza concreta en una especie (también para lo no equipado, p. ej. en una tienda). */
export function etiquetar(parte, id, especie = "ciempi") {
	const e = typeof especie === "string" ? buscarEspecie(especie) : especie;
	const tipo = tipoDe(parte, id, e);
	const ex = exclusivoDe(id);
	if (ex && ex.especie !== e.id) return {
		parte,
		id,
		tipo,
		visible: false,
		motivo: `Exclusivo de ${buscarEspecie(ex.especie).nombre}: se guarda y se verá al volver a esa especie.`
	};
	if (ex && ex.parte !== parte) return {
		parte,
		id,
		tipo,
		visible: false,
		motivo: "Pieza exclusiva en una parte que no le corresponde."
	};
	const parteOculta = e.partesOcultas?.[parte];
	if (parteOculta && !esNinguno(parte, id)) return {
		parte,
		id,
		tipo,
		visible: false,
		motivo: parteOculta
	};
	const oculta = e.ocultas.find((o) => o.id === id);
	if (oculta) return {
		parte,
		id,
		tipo,
		visible: false,
		motivo: oculta.motivo
	};
	if (tipo === "adaptable" && !esNinguno(parte, id)) return {
		parte,
		id,
		tipo,
		visible: true,
		motivo: e.adaptables[parte]?.como
	};
	return {
		parte,
		id,
		tipo,
		visible: true
	};
}
/**
* Resuelve qué se ve de una apariencia en una especie. No modifica `apariencia`.
* Las partes ocultas se dibujan con su valor «sin nada»; las demás tal cual.
*/
export function resolver(apariencia, especie = "ciempi") {
	const e = typeof especie === "string" ? buscarEspecie(especie) : especie;
	const visibles = {};
	const ocultos = [];
	const etiquetas = {};
	for (const parte of PARTES_PERSONAJE) {
		const id = apariencia[parte];
		if (id === undefined) continue;
		const et = etiquetar(parte, id, e);
		etiquetas[parte] = et;
		if (et.visible) visibles[parte] = id;
		else {
			ocultos.push(et);
			visibles[parte] = NINGUNO[parte] ?? id;
		}
	}
	const rasgosOcultos = new Set();
	for (const r of e.rasgosOcultosCon) {
		const id = visibles[r.parte];
		if (!id || esNinguno(r.parte, id)) continue;
		if (r.ids === "*" || r.ids.includes(id)) for (const x of r.rasgos) rasgosOcultos.add(x);
	}
	return {
		especie: e.id,
		visibles,
		ocultos,
		etiquetas,
		rasgosOcultos: [...rasgosOcultos]
	};
}
