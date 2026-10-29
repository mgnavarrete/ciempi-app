// Copia adaptada para integración; fuente artística intacta en laboratorio.
// B03: composition adapter restricted to this experimental laboratory.
// Swappable facial fragments; original head/cheeks/lighting are never replaced.
import {replaceGroup} from './lib/armario-ciempi.mjs';
const parse=s=>{const d=new DOMParser().parseFromString(s,'image/svg+xml');if(d.querySelector('parsererror'))throw Error('Fragmento facial SVG inválido');return d;};
export async function loadExpressions(get){
 const items=await(await get('./recursos/expresiones/v1/catalogo.json')).json();
 if(new Set(items.map(x=>x.id)).size!==items.length)throw Error('Expresiones duplicadas');
 for(const item of items){
  item.fragment=await(await get(item.svgFile)).text();const d=parse(item.fragment);
  for(const id of ['eyes','b03-brows','mouth'])if(d.querySelectorAll(`[id="${id}"]`).length!==1)throw Error('Componente facial ausente o duplicado');
 }
 return items;
}
export function prepareFace(base,item,color){
 const d=parse(item.fragment),serialize=n=>`<g id="${n.id}">${[...n.childNodes].map(c=>new XMLSerializer().serializeToString(c)).join('')}</g>`;
 for(const node of d.querySelectorAll('[data-iris]'))node.setAttribute('fill',color);
 let out=replaceGroup(base,'eyes',serialize(d.getElementById('eyes')));
 out=replaceGroup(out,'mouth',serialize(d.getElementById('mouth')));
 // Brows outside the ocular group: opaque glasses hide eyes, not eyebrows.
 out=out.replace('<g id="mouth"',serialize(d.getElementById('b03-brows'))+'<g id="mouth"');
 return out;
}
export function finishFace(doc,item,hat){
 if(hat?.mask||hat?.fullFace)doc.getElementById('b03-brows')?.remove();
 doc.documentElement.setAttribute('data-expression',item.id);
 doc.querySelector('desc').textContent+=` Expresión: ${item.nombre}. ${item.estado}.`;
}
