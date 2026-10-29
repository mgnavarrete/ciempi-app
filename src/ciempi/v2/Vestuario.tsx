import {createContext,useContext,useEffect,useId,useMemo,useState,type ReactNode} from 'react'
import type {AparienciaCiempi} from '../catalogo'
import {load} from './arte/cargar.js'
import {renderCiempi} from './arte/componer.js'
import {BASE,desdeGuardada,type Entorno,type Seleccion} from './seleccion'
import {escena,type Escena} from './pose'
interface Estado{env:Entorno|null;error:string;prueba:Seleccion|null;clasico:boolean;setPrueba:(s:Seleccion|null)=>void;setClasico:(v:boolean)=>void}
const Context=createContext<Estado>({env:null,error:'',prueba:null,clasico:false,setPrueba:()=>{},setClasico:()=>{}})
export function VestuarioProvider({children}:{children:ReactNode}){
 const [env,setEnv]=useState<Entorno|null>(null),[error,setError]=useState(''),[prueba,setPrueba]=useState<Seleccion|null>(null),[clasico,setClasico]=useState(false)
 useEffect(()=>{let active=true;load().then(e=>{if(active)setEnv(e)},e=>{if(active)setError(e.message)});return()=>{active=false}},[])
 return <Context.Provider value={{env,error,prueba,setPrueba,clasico,setClasico}}>{children}</Context.Provider>
}
/** La escena y lo que necesita la animación: el conjunto y sus expresiones B03. */
export interface EscenaViva extends Escena {prefijo:string;clave:string;cabeza:string;expresion:string;rostro:(expresion:string)=>string}
export function useEscena(a:AparienciaCiempi,n:number):EscenaViva|null{
 const state=useContext(Context),id=useId().replace(/[^\w-]/g,'');const s=state.clasico?null:state.prueba||desdeGuardada(a);const key=JSON.stringify(s)
 const svg=useMemo(()=>{try{return state.env&&s?renderCiempi(state.env,s):null}catch(e){console.error("Composición Ciempi:",e);return null}},[state.env,key]) // composición solo cuando cambia selección
 // El mismo conjunto con otra expresión, para que la animación cambie el gesto (se compone una vez por expresión).
 const rostro=useMemo(()=>{const cache=new Map<string,string>();return (exp:string)=>{if(!cache.has(exp))cache.set(exp,renderCiempi(state.env!,{...s!,expresion:exp}));return cache.get(exp)!}},[state.env,key])
 return useMemo(()=>{try{return svg&&s?{...escena(svg,n,id),prefijo:id+'-',clave:key,cabeza:String(s.cabeza),expresion:String(s.expresion),rostro}:null}catch(e){console.error("Pose Ciempi:",e);return null}},[svg,n,id])
}
export function useRestaurarVestuario(){
 const {setPrueba,setClasico}=useContext(Context);return ()=>{setPrueba(null);setClasico(false)}
}
export function ControlesVestuario(){
 const {env,error,prueba,setPrueba,clasico,setClasico}=useContext(Context)
 if(error)return <p role="status">No se pudo cargar el vestuario nuevo. El personaje clásico sigue disponible.</p>
 if(!env)return <p role="status">Preparando el nuevo Ciempi…</p>
 const s=prueba||BASE,head=[...env.hats,...env.masks].find(x=>x.id===s.cabeza)
 const change=(key:string,value:string)=>{setClasico(false);setPrueba({...s,[key]:value,...(key==='pelo'&&value!=='pelo-nada'?{cabeza:'cabeza-nada'}:{})})}
 return <details className="mx-5 my-2 rounded-2xl border border-petroleo/20 bg-white p-3 max-h-[45vh] overflow-y-auto shrink-0" data-testid="vestuario-v2"><summary className="cursor-pointer font-bold text-petroleo">Nuevo Ciempi · probar vestuario</summary>
 <p className="my-2 text-sm">Esta prueba acompaña la lectura durante esta sesión. No compra ni guarda accesorios y no cambia tus monedas. Al recargar vuelves a tu apariencia guardada.</p>
 <div className="flex flex-wrap gap-2"><button className="rounded-xl bg-crema px-3 py-2" onClick={()=>{setPrueba(null);setClasico(false)}}>Volver a mi apariencia</button><button className="rounded-xl bg-crema px-3 py-2" onClick={()=>{setPrueba(null);setClasico(!clasico)}} aria-pressed={clasico}>Ver Ciempi clásico</button></div>
 <label className="my-2 block">Conjunto <select data-testid="conjunto-v2" className="campo ml-2" value="" onChange={e=>{const set=env.sets.find(x=>x.id===e.target.value);if(set){setClasico(false);setPrueba({...BASE,...set.seleccion})}}}><option value="">Probar un conjunto…</option>{env.sets.map(x=><option key={x.id} value={x.id}>{x.nombre}</option>)}</select></label>
 <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{env.groups.map(([key,title,items])=><label key={key} className="text-sm">{title}<select className="campo w-full" data-v2={key} value={String(s[key])} disabled={!!head?.ocultaRostro&&['expresion','ojos'].includes(key)||!!head?.mask&&['cara','pelo','detalle'].includes(key)} onChange={e=>change(key,e.target.value)}>{items.map(x=><option key={x.id} value={x.id}>{x.nombre}</option>)}</select></label>)}</div>
 {(['cuello','cara','espalda'] as const).map((key)=>{const item=env.groups.find(x=>x[0]===key)?.[2].find(x=>x.id===s[key]);const variant=key==='cuello'?'variante':key==='cara'?'varianteLentes':'varianteCapa';return item?.variantes?<label className="mr-3 inline-block text-sm" key={key}>Variante {key}<select className="campo" value={String(s[variant])} onChange={e=>change(variant,e.target.value)}>{item.variantes.map(v=><option key={v.id} value={v.id}>{v.nombre}</option>)}</select></label>:null})}
 {head&&!head.mask&&s.pelo!=='pelo-nada'&&<p className="text-sm">El gorro tiene prioridad sobre los peinados incompatibles. Elegir un peinado retira el gorro.</p>}
 {head?.mask&&<p className="text-sm">La máscara oculta lentes y pelo; al retirarla recuperas tu selección.{head.ocultaRostro?' El rostro de esta máscara tiene gesto y ojos fijos.':''}</p>}
 {env.surfaces.some(x=>x.id===s.textura)&&<p className="text-sm">El material corporal tiene colores propios; la paleta cambia la cabeza descubierta.</p>}
 </details>
}
