import {createContext,useContext,useEffect,useId,useMemo,useRef,useState,type ReactNode} from 'react'
import type {AparienciaCiempi} from '../catalogo'
import {load} from './arte/cargar.js'
import {renderCiempi} from './arte/componer.js'
import {conMochila} from './arte/mochilas-v4.js'
import {aSeleccion,type Entorno} from './seleccion'
import {tapaBoca} from './animacion/boca'
import {escena,escenaCreciente,posiciones,type Escena,type EscenaCreciente} from './pose'
import {componerCriatura,criaturaLista,formaDe,prepararCriatura} from './criaturas/base'
import type {FormaCuerpo} from './especie'
interface Estado{env:Entorno|null;error:string}
const Context=createContext<Estado>({env:null,error:''})
/** Carga una vez el vestuario del nuevo Ciempi (manifiesto local de public/ciempi-v2/). */
export function VestuarioProvider({children}:{children:ReactNode}){
 const [env,setEnv]=useState<Entorno|null>(null),[error,setError]=useState('')
 useEffect(()=>{let active=true;load().then(e=>{if(active)setEnv(e)},e=>{if(active)setError(e.message)});return()=>{active=false}},[])
 return <Context.Provider value={{env,error}}>{children}</Context.Provider>
}
/** El vestuario cargado (null mientras carga). */
export const useEntornoCiempi=()=>useContext(Context)
/** La escena y lo que necesita la animación: el conjunto y sus expresiones B03. */
export interface EscenaViva extends Escena {prefijo:string;clave:string;cabeza:string;expresion:string;rostro:(expresion:string)=>string
 /** La pieza de cabeza tapa la boca (`ocultaRostro` del catálogo): E08 no dibuja boca y usa la reacción alternativa (AD-018). */
 bocaTapada:boolean
 /** Posiciones de los segmentos con la forma de la criatura (solo criaturas; Ciempi usa las de pose.ts). */
 posiciones?:(n:number)=>{role:number;x:number;y:number}[]}
/** La criatura puesta (`variante:<id>`) o null (Ciempi). Tolerante: la apariencia antigua no la trae. */
export const criaturaPuesta=(a:AparienciaCiempi):string|null=>(a as AparienciaCiempi&{criatura?:string|null}).criatura??null
/**
 * Prepara la criatura de la apariencia (asíncrono, con caché) y dice cuál dibujar:
 * la criatura si está lista; mientras carga, la que se estaba dibujando (escena
 * anterior); si falla, null (Ciempi). Con `criatura` null siempre devuelve null.
 */
export function useCriatura(criatura:string|null):string|null{
 const [,listo]=useState(0),[fallida,setFallida]=useState<string|null>(null)
 const lista=!!criatura&&criaturaLista(criatura)
 useEffect(()=>{if(!criatura||lista)return;let activo=true
  prepararCriatura(criatura).then(()=>{if(activo)listo(x=>x+1)},e=>{console.error('Criatura de Ciempi:',e);if(activo)setFallida(criatura)})
  return()=>{activo=false}},[criatura,lista])
 const previa=useRef<string|null>(null)
 const usar=!criatura?null:lista?criatura:fallida===criatura?null:previa.current
 previa.current=usar
 return usar
}
interface Composicion{svg:string|null;rostro:(exp:string)=>string;forma:FormaCuerpo|undefined;key:string}
/** El SVG del conjunto y sus expresiones: Ciempi (`renderCiempi`, el camino de siempre) o la criatura. */
function useComposicion(env:Entorno|null,a:AparienciaCiempi):Composicion{
 const s=aSeleccion(a),usar=useCriatura(criaturaPuesta(a));const key=usar?JSON.stringify(s)+'|'+usar:JSON.stringify(s)
 const svg=useMemo(()=>{try{return env?conMochila(usar?componerCriatura(s,usar):renderCiempi(env,s),s):null}catch(e){console.error("Composición Ciempi:",e);return null}},[env,key]) // composición solo cuando cambia selección
 // El mismo conjunto con otra expresión, para que la animación cambie el gesto (se compone una vez por expresión).
 const rostro=useMemo(()=>{const cache=new Map<string,string>();return (exp:string)=>{if(!cache.has(exp))cache.set(exp,conMochila(usar?componerCriatura({...s,expresion:exp},usar):renderCiempi(env!,{...s,expresion:exp}),s));return cache.get(exp)!}},[env,key])
 return {svg,rostro,forma:usar?formaDe(usar):undefined,key}
}
export function useEscena(a:AparienciaCiempi,n:number):EscenaViva|null{
 const state=useContext(Context),id=useId().replace(/[^\w-]/g,'');const s=aSeleccion(a)
 const {svg,rostro,forma,key}=useComposicion(state.env,a)
 return useMemo(()=>{try{return svg?{...escena(svg,n,id,forma),prefijo:id+'-',clave:key,cabeza:String(s.cabeza),expresion:String(s.expresion),rostro,bocaTapada:tapaBoca(state.env,s.cabeza),...(forma?{posiciones:(k:number)=>posiciones(k,forma)}:{})}:null}catch(e){console.error("Pose Ciempi:",e);return null}},[svg,n,id])
}
/** Escena creciente: se compone una vez para `nMax` segmentos y el rig muestra `n` (ver `escenaCreciente`). */
export interface EscenaVivaCreciente extends EscenaViva {nMax:number;encuadre:EscenaCreciente['encuadre'];posiciones:EscenaCreciente['posiciones']}
/**
 * Como `useEscena`, pero sin recomponer con cada unidad leída: la escena solo
 * cambia con el vestuario o con `nMax` (las manzanas de la frase). `left` es el
 * encuadre que tendría `useEscena(a, n)`. Con `nMax` null se comporta como
 * `useEscena` (recompone con cada n): sirve para comparar ambos caminos.
 */
export function useEscenaCreciente(a:AparienciaCiempi,n:number,nMax:number|null):{escena:EscenaViva|EscenaVivaCreciente;left:number}|null{
 const state=useContext(Context),id=useId().replace(/[^\w-]/g,'');const s=aSeleccion(a)
 const {svg,rostro,forma,key}=useComposicion(state.env,a)
 const datos=(e:{viewBox:string;left:number})=>({...e,prefijo:id+'-',clave:key,cabeza:String(s.cabeza),expresion:String(s.expresion),rostro,bocaTapada:tapaBoca(state.env,s.cabeza),...(forma?{posiciones:(k:number)=>posiciones(k,forma)}:{})})
 // Si llegan más unidades que manzanas (no debería), se recompone con más capacidad.
 const capacidad=nMax===null?null:Math.max(nMax,n,0)
 const viva=useMemo<EscenaVivaCreciente|null>(()=>{try{if(!svg||capacidad===null)return null;const e=escenaCreciente(svg,capacidad,id,forma);return {...e,...datos(e.encuadre(capacidad)),html:e.html}}catch(e){console.error("Pose Ciempi:",e);return null}},[svg,capacidad,id])
 const porN=useMemo<EscenaViva|null>(()=>{try{if(!svg||capacidad!==null)return null;const e=escena(svg,n,id,forma);return {...e,...datos(e)}}catch(e){console.error("Pose Ciempi:",e);return null}},[svg,capacidad===null?n:-1,id])
 return useMemo(()=>viva?{escena:viva,left:viva.encuadre(n).left}:porN?{escena:porN,left:porN.left}:null,[viva,porN,n])
}
