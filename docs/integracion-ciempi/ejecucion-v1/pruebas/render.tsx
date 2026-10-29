import React,{useState} from 'react';import{createRoot}from'react-dom/client';
import {VestuarioProvider,ControlesVestuario}from'/src/ciempi/v2/Vestuario';
import{CiempiPersonaje,CiempiClasico}from'/src/ciempi/CiempiPersonaje';
import{Ciempi}from'/src/lectura/Ciempi';import{APARIENCIA_INICIAL}from'/src/ciempi/catalogo';
import{calcularPista,estadoInicial,paso,CONFIG_MOTOR_BASE}from'/src/lectura/motor';
import{load}from'/src/ciempi/v2/arte/cargar.js';import{renderCiempi}from'/src/ciempi/v2/arte/componer.js';import{escena,roles}from'/src/ciempi/v2/pose';import{BASE}from'/src/ciempi/v2/seleccion';
import'/src/index.css';
const a=APARIENCIA_INICIAL,pista=calcularPista(12);
function Test(){const[state,set]=useState(estadoInicial());return <VestuarioProvider><main style={{padding:20,maxWidth:1400,margin:'auto'}}><h1>Integración real · componentes React de producción</h1><ControlesVestuario/><div style={{display:'flex',gap:20}}>{[2,5,12].map(n=><section key={n} style={{width:400}}><h2>{n} segmentos</h2><CiempiPersonaje apariencia={a} segmentos={n} ancho="100%" animado={false}/></section>)}</div><div style={{display:'flex',gap:30}}>{[240,320].map(w=><div key={w} style={{width:w}}><h2>{w}px</h2><CiempiPersonaje apariencia={a} ancho={w} animado={false}/></div>)}<div style={{width:320}}><h2>Anterior · 320px</h2><CiempiClasico apariencia={a} ancho={320} animado={false}/></div></div><section style={{width:320}}><h2>Motor real: {state.palabrasLeidas}/12</h2><Ciempi pista={pista} palabrasLeidas={state.palabrasLeidas} progreso={state.progreso} fase={state.fase} tranquilo apariencia={a}/><button id="crecer" onClick={()=>set(s=>{if(s.fase==='esperando')s=paso(s,{tipo:'tocar',pos:s.progreso,t:0},pista,{...CONFIG_MOTOR_BASE,umbralPalabrasPorSegundo:3,sinLimite:true}).estado;return paso(s,{tipo:'mover',pos:pista.manzanas[s.palabrasLeidas]??1,t:1000*(s.palabrasLeidas+1)},pista,{...CONFIG_MOTOR_BASE,umbralPalabrasPorSegundo:3,sinLimite:true}).estado})}>Leer palabra con motor real</button></section></main></VestuarioProvider>}
createRoot(document.getElementById('root')!).render(<Test/>);
Object.assign(window,{tools:{load,renderCiempi,escena,roles,BASE}});
