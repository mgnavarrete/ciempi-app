// Copia adaptada para integración; fuente artística intacta en laboratorio.
import {caras} from './lib/armario-ciempi.mjs';
// B04+B05: independent, versioned resources. Does not mutate shared catalog arrays.
const NS='http://www.w3.org/2000/svg';
const parse=s=>{const d=new DOMParser().parseFromString(s,'image/svg+xml');if(d.querySelector('parsererror'))throw Error('Accesorio SVG inválido');return d;};
export async function loadHeadAccessories(get){
 const result={};
 for(const [key,url]of [['lenses','./recursos/lentes/v1/catalogo.json'],['hair','./recursos/peinados/v1/catalogo.json'],['details','./recursos/lentes/v1/detalles.json']]){
  result[key]=await(await get(url)).json();
  for(const item of result[key]){item.fragment=await(await get(item.archivo)).text();parse(item.fragment);item.svg=true;item.hideEyes=!item.opaco?false:true;}
 }
 const old=caras.find(x=>x.id==='cara-cicatriz');
 result.historicalScar={id:'detalle-cicatriz-anterior',nombre:'Cicatriz histórica',estado:'histórico',fragment:`<svg xmlns="${NS}"><g data-plane="back"/><g data-plane="front">${old.svg}</g></svg>`};
 return result;
}
function parts(doc,item,variant){
 const d=parse(item.fragment);
 for(const n of d.querySelectorAll('*'))for(const a of [...n.attributes])if(variant?.colores?.[a.value])n.setAttribute(a.name,variant.colores[a.value]);
 const g=plane=>{const node=doc.createElementNS(NS,'g');node.id=item.id+'-'+plane;node.setAttribute('data-accessory',item.id);const source=d.querySelector(`[data-plane="${plane}"]`);if(plane==='front'){const defs=d.querySelector('defs');if(defs)node.append(doc.importNode(defs,true));}for(const c of source?.children||[])node.append(doc.importNode(c,true));return node;};return [g('back'),g('front')];
}
export function equipHeadAccessories(doc,env,selection){
 const hat=env.groups.find(g=>g[0]==='cabeza')[2].find(x=>x.id===selection.cabeza);
 const blocked=!!(hat?.mask||hat?.fullFace);
 const hair=env.hair.find(x=>x.id===selection.pelo),lens=env.lenses.find(x=>x.id===selection.cara),detail=selection.detalle==='detalle-cicatriz-anterior'?env.historicalScar:env.details.find(x=>x.id===selection.detalle);
 const face=doc.getElementById('face-accessory'),head=doc.getElementById('head');
 if(detail&&!blocked&&selection.cara!=='cara-harry'&&selection.cara!=='cara-cicatriz'){
  const [,front]=parts(doc,detail);head.append(front);
 }
 if(hair&&hair.compatibleGorros.includes(selection.cabeza)){
  const [back,front]=parts(doc,hair);const neck=doc.getElementById('lab-scarf-lab-neck-back');head.parentNode.insertBefore(back,neck||head);face.parentNode.insertBefore(front,face);
 }
 if(lens&&!blocked){
  const variant=lens.variantes.find(x=>x.id===selection.varianteLentes)||lens.variantes[0];
  const [,front]=parts(doc,lens,variant);
  if(lens.opaco){
   const eyes=doc.getElementById('eyes');
   // Historical eyes group contains brows; preserve only that known eyebrow path.
   if(!doc.getElementById('b03-brows')){const brow=[...eyes.querySelectorAll('path')].find(p=>p.getAttribute('d')?.startsWith('M682 293'));if(brow){const g=doc.createElementNS(NS,'g');g.id='b04-preserved-brows';g.append(brow.cloneNode(true));head.append(g);}}
   eyes.replaceChildren();eyes.setAttribute('data-hidden','accessory');
  }
  face.append(front);
 }
 for(const item of [hair,lens,detail].filter(Boolean))doc.querySelector('desc').textContent+=` ${item.nombre}: ${item.estado}.`;
 return {hair,lens,detail,blocked};
}
