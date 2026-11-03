import {createContext,useContext,useEffect,useId,useMemo,useState,type ReactNode} from 'react'
import type {AparienciaCiempi} from '../catalogo'
import {load} from './arte/cargar.js'
import {renderCiempi} from './arte/componer.js'
import {aSeleccion,type Entorno} from './seleccion'
import {escena,escenaCreciente,type Escena,type EscenaCreciente} from './pose'
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
export interface EscenaViva extends Escena {prefijo:string;clave:string;cabeza:string;expresion:string;rostro:(expresion:string)=>string}
export function useEscena(a:AparienciaCiempi,n:number):EscenaViva|null{
 const state=useContext(Context),id=useId().replace(/[^\w-]/g,'');const s=aSeleccion(a);const key=JSON.stringify(s)
 const svg=useMemo(()=>{try{return state.env?renderCiempi(state.env,s):null}catch(e){console.error("Composición Ciempi:",e);return null}},[state.env,key]) // composición solo cuando cambia selección
 // El mismo conjunto con otra expresión, para que la animación cambie el gesto (se compone una vez por expresión).
 const rostro=useMemo(()=>{const cache=new Map<string,string>();return (exp:string)=>{if(!cache.has(exp))cache.set(exp,renderCiempi(state.env!,{...s,expresion:exp}));return cache.get(exp)!}},[state.env,key])
 return useMemo(()=>{try{return svg?{...escena(svg,n,id),prefijo:id+'-',clave:key,cabeza:String(s.cabeza),expresion:String(s.expresion),rostro}:null}catch(e){console.error("Pose Ciempi:",e);return null}},[svg,n,id])
}
/** Escena creciente: se compone una vez para `nMax` segmentos y el rig muestra `n` (ver `escenaCreciente`). */
export interface EscenaVivaCreciente extends EscenaViva {nMax:number;encuadre:EscenaCreciente['encuadre']}
/**
 * Como `useEscena`, pero sin recomponer con cada unidad leída: la escena solo
 * cambia con el vestuario o con `nMax` (las manzanas de la frase). `left` es el
 * encuadre que tendría `useEscena(a, n)`. Con `nMax` null se comporta como
 * `useEscena` (recompone con cada n): sirve para comparar ambos caminos.
 */
export function useEscenaCreciente(a:AparienciaCiempi,n:number,nMax:number|null):{escena:EscenaViva|EscenaVivaCreciente;left:number}|null{
 const state=useContext(Context),id=useId().replace(/[^\w-]/g,'');const s=aSeleccion(a);const key=JSON.stringify(s)
 const svg=useMemo(()=>{try{return state.env?renderCiempi(state.env,s):null}catch(e){console.error("Composición Ciempi:",e);return null}},[state.env,key])
 const rostro=useMemo(()=>{const cache=new Map<string,string>();return (exp:string)=>{if(!cache.has(exp))cache.set(exp,renderCiempi(state.env!,{...s,expresion:exp}));return cache.get(exp)!}},[state.env,key])
 const datos=(e:{viewBox:string;left:number})=>({...e,prefijo:id+'-',clave:key,cabeza:String(s.cabeza),expresion:String(s.expresion),rostro})
 // Si llegan más unidades que manzanas (no debería), se recompone con más capacidad.
 const capacidad=nMax===null?null:Math.max(nMax,n,0)
 const viva=useMemo<EscenaVivaCreciente|null>(()=>{try{if(!svg||capacidad===null)return null;const e=escenaCreciente(svg,capacidad,id);return {...e,...datos(e.encuadre(capacidad)),html:e.html}}catch(e){console.error("Pose Ciempi:",e);return null}},[svg,capacidad,id])
 const porN=useMemo<EscenaViva|null>(()=>{try{if(!svg||capacidad!==null)return null;const e=escena(svg,n,id);return {...e,...datos(e)}}catch(e){console.error("Pose Ciempi:",e);return null}},[svg,capacidad===null?n:-1,id])
 return useMemo(()=>viva?{escena:viva,left:viva.encuadre(n).left}:porN?{escena:porN,left:porN.left}:null,[viva,porN,n])
}
