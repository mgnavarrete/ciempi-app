import type { AparienciaCiempi } from '../catalogo'
export type Seleccion = Record<string,string|number>
export const BASE: Seleccion={cabeza:'cabeza-nada',cara:'cara-nada',pies:'pies-zapatillas',espalda:'espalda-nada',cuello:'cuello-nada',variante:'gryffindor',paleta:'clasica',textura:'liso',expresion:'alegre',ojos:'oscuro',boca:'sonrisa',seed:17,pelo:'pelo-nada',detalle:'detalle-nada',varianteLentes:'original',varianteCapa:'original'}
const maps:Record<string,Record<string,string>>={paleta:{'paleta-clasica':'clasica','paleta-oceano':'oceano','paleta-bosque':'bosque','paleta-noche':'noche'},ojos:{'ojos-normales':'oscuro','ojos-azules':'azul','ojos-verdes':'verde','ojos-miel':'miel','ojos-guino':'oscuro','ojos-dormilones':'oscuro'},cabeza:{'cabeza-nada':'cabeza-nada','cabeza-antenas':'cabeza-nada','cabeza-jockey':'b06-ia-jockey','cabeza-mago':'b06-ia-mago','cabeza-corona':'b06-ia-corona','cabeza-pirata':'b06-ia-pirata'},cara:{'cara-nada':'cara-nada','cara-lentes':'b04-lector','cara-lentes-sol':'b04-sol','cara-lentes-corazon':'b04-corazones'},pies:{'pies-clasicos':'pies-zapatillas','pies-botas':'b10-lluvia'}}
/** Solo representación: no guarda ni concede compras, ni cambia identificadores persistidos. */
export function desdeGuardada(a:AparienciaCiempi):Seleccion|null{
 if(a.forma!=='forma-circulo'||a.diseno!=='diseno-liso')return null
 const s={...BASE};for(const [field,map]of Object.entries(maps)){const value=map[a[field as keyof AparienciaCiempi] as string];if(!value)return null;s[field]=value;}
 if(a.ojos==='ojos-guino')s.expresion='b03-guino';if(a.ojos==='ojos-dormilones')s.expresion='b03-dormilon';return s
}
export interface Pieza {id:string;nombre:string;variantes?:{id:string;nombre:string}[];ocultaRostro?:boolean;mask?:boolean}
export interface Entorno {groups:[string,string,Pieza[]][];sets:{id:string;nombre:string;seleccion:Seleccion}[];masks:Pieza[];hats:Pieza[];surfaces:Pieza[]}
