import { diseno, type AparienciaCiempi } from '../catalogo'
export type Seleccion = Record<string, string | number>
export const BASE: Seleccion = {cabeza:'cabeza-nada',cara:'cara-nada',pies:'pies-zapatillas',espalda:'espalda-nada',cuello:'cuello-nada',variante:'gryffindor',paleta:'clasica',textura:'liso',expresion:'alegre',ojos:'oscuro',boca:'sonrisa',seed:17,pelo:'pelo-nada',detalle:'detalle-nada',varianteLentes:'original',varianteCapa:'original'}
/** La apariencia guardada (ids de la tienda) como selección del compositor. */
export function aSeleccion(a: AparienciaCiempi): Seleccion {
 return {...BASE,paleta:diseno(a.paleta),ojos:diseno(a.ojos),expresion:diseno(a.gesto),cabeza:diseno(a.cabeza),pelo:diseno(a.pelo),detalle:diseno(a.detalle),cara:diseno(a.cara),cuello:diseno(a.cuello),espalda:diseno(a.espalda),pies:diseno(a.pies),textura:diseno(a.textura),
  variante:a.variantes.cuello??BASE.variante,varianteCapa:a.variantes.espalda??BASE.varianteCapa,varianteLentes:a.variantes.cara??BASE.varianteLentes}
}
export interface Pieza {id:string;nombre:string;variantes?:{id:string;nombre:string}[];ocultaRostro?:boolean;mask?:boolean}
export interface Entorno {groups:[string,string,Pieza[]][];sets:{id:string;nombre:string;seleccion:Seleccion}[];masks:Pieza[];hats:Pieza[];surfaces:Pieza[]}
