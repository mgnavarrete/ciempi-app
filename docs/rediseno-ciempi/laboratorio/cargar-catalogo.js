import {loadWardrobe,equipWardrobe} from './accesorios-cuerpo.js';
import {loadCostumes,equipCostumes} from './accesorios-disfraces.js';
import {loadHeadAccessories,equipHeadAccessories} from './accesorios-cabeza.js';
import {loadExpressions,prepareFace,finishFace} from './expresiones.js';
import {compose,gorros,caras,zapatos,espaldas,paletas,texturas,expresiones,ojosColores,bocas} from '../../../../scripts/lib/armario-ciempi.mjs';
import {colecciones} from '../../../../scripts/lib/colecciones-personajes.mjs';
import '../../../../scripts/lib/acabados-armario.mjs';
export const defaults={cabeza:'cabeza-jockey',cara:'cara-nada',pies:'pies-zapatillas',espalda:'espalda-nada',cuello:'cuello-nada',variante:'gryffindor',paleta:'clasica',textura:'liso',expresion:'alegre',ojos:'oscuro',boca:'sonrisa',seed:17,pelo:'pelo-nada',detalle:'detalle-nada',varianteLentes:'original'};
export {colecciones};
export async function load(){
 const get=async url=>{const r=await fetch(url);if(!r.ok)throw Error(`${url}: ${r.status}`);return r;};
 const catalogo=await(await get('./catalogo.json')).json(),base=await(await get(catalogo.base)).text(),batches=await(await get('./batches.json')).json();
 // Overrides aprobados, exclusivos del contexto JavaScript de este laboratorio.
 // No se escriben los módulos compartidos ni los datos del juego.
 const ajustes=await(await get('./recursos/paletas-cuerpo/v1/ajustes-aprobados.json')).json();
 const vistos=new Set();
 for(const ajuste of ajustes.paletas){
  if(!['bosque','ravenclaw','voldemort'].includes(ajuste.id)||vistos.has(ajuste.id))throw Error('Ajuste de paleta fuera del alcance');
  const item=paletas.find(x=>x.id===ajuste.id);
  if(!item||ajuste.colors.length!==9||!ajuste.colors.every(x=>/^#[0-9a-f]{6}$/i.test(x)))throw Error('Paleta aprobada inválida');
  item.colors=[...ajuste.colors];vistos.add(ajuste.id);
 }
 if(typeof catalogo.conjuntosB12==='string')catalogo.conjuntosB12=await(await get(catalogo.conjuntosB12)).json();
 const ids=new Set(catalogo.bufandasHistoricas);
 const neck=[{id:'cuello-nada',nombre:'Sin bufanda',svg:'',frontSvg:'',estado:'control'},...espaldas.filter(x=>ids.has(x.id)).map(x=>({...x,estado:'historico'}))];
 for(const item of catalogo.recursos.filter(x=>x.tipo==='vector')){const asset=await(await get(item.geometria)).json();neck.push({...item,...asset});}
 // PNG por planos: recurso raster explícito, cargado una vez y embebido para vistas SVG autónomas.
 for(const item of catalogo.recursos.filter(x=>x.tipo==='raster-capas')){
  if(item.variantes?.length!==1)throw Error('El ensayo raster admite solo la variante original');
  const images={};
  for(const plano of ['posterior','delantera']){
   const response=await get(item.capas[plano]);const blob=await response.blob();
   if(blob.type!=='image/png')throw Error('Capa raster debe ser PNG');
   images[plano]=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
  }
  neck.push({...item,images});
 }
 for(const item of catalogo.recursos.filter(x=>x.tipo==='vector-maestro')){
  const master=parse(await(await get(item.maestro)).text());
  const art=[...master.documentElement.children].filter(x=>x.localName==='g').map(x=>new XMLSerializer().serializeToString(x)).join('');
  if(!art)throw Error('Maestro sin trazados');
  const variants=await(await get(item.paletas)).json();
  const cut=item.adaptacion.corteY,transform=item.adaptacion.transform;
  // Una sola geometría. Dos usos con recortes complementarios, delante y detrás de la cabeza.
  const defs=`<defs><g id="master-art">${art}</g><clipPath id="master-back" clipPathUnits="userSpaceOnUse"><rect x="0" y="0" width="1200" height="${cut}"/></clipPath><clipPath id="master-front" clipPathUnits="userSpaceOnUse"><rect x="0" y="${cut}" width="1200" height="${780-cut}"/></clipPath></defs>`;
  neck.push({...item,variantes:variants,svg:`${defs}<g transform="${transform}"><use href="#master-art" clip-path="url(#master-back)"/></g>`,frontSvg:`<g transform="${transform}"><use href="#master-art" clip-path="url(#master-front)"/></g>`});
 }
 const facial=await loadExpressions(get);
 if(batches.find(x=>x.id==='B03')?.aprobado)for(const item of facial){item.estado='Aprobado artísticamente para el laboratorio';item.aprobadoParaLaboratorio=true;}
 const headAssets=await loadHeadAccessories(get);
 const costumes=await loadCostumes(get);
 for(const item of [...costumes.hats,...costumes.masks,...costumes.capes])if(item.version==='2'&&batches.find(x=>x.id===item.batch)?.aprobado){item.estado='Aprobado artísticamente para el laboratorio';item.aprobadoParaLaboratorio=true;}
 const wardrobe=await loadWardrobe(get);costumes.masks.push(...wardrobe.characters);
 const groups=[['cuello','Bufandas',neck],['espalda','Mochilas y capas',[...wardrobe.bags,...costumes.capes,...espaldas.filter(x=>!ids.has(x.id)).map(x=>({...x,historico:x.id.startsWith('capa-')}))]],['cabeza','Gorros y máscaras',[gorros[0],...costumes.hats,...costumes.masks,...gorros.slice(1).map(x=>({...x,historico:x.id!=='cabeza-jockey'}))]],['cara','Lentes',[caras[0],...headAssets.lenses,...caras.slice(1).map(x=>({...x,nombre:x.nombre+' · anterior'}))]],['pelo','Peinados',[{id:'pelo-nada',nombre:'Sin peinado',svg:'',estado:'control'},...headAssets.hair]],['detalle','Detalles faciales',[{id:'detalle-nada',nombre:'Sin detalle',svg:'',estado:'control'},...headAssets.details]],['pies','Calzado',[...wardrobe.footwear,...zapatos]],['paleta','Colores del cuerpo',paletas],['textura','Superficies y estampados',[...wardrobe.surfaces,...texturas]],['expresion','Expresiones',[...facial,...expresiones.map(x=>({...x,nombre:x.nombre+' · anterior'}))]],['ojos','Ojos',ojosColores],['boca','Bocas',bocas]];
 return {catalogo,base,batches,groups,neck,facial,...headAssets,...costumes,...wardrobe};
}
const NS='http://www.w3.org/2000/svg';
function parse(s){const d=new DOMParser().parseFromString(s,'image/svg+xml');if(d.querySelector('parsererror'))throw Error('SVG inválido');return d;}
// Los dos planos se procesan juntos: conservamos referencias compartidas y aislamos IDs del cuerpo.
function scarfGroups(piece,variant){
 if(piece.tipo==='raster-capas'){
  const d=parse(`<svg xmlns="${NS}"/>`);
  return ['posterior','delantera'].map((plano,index)=>{
   const g=d.createElementNS(NS,'g');g.id='lab-scarf-raster-'+plano;
   const img=d.createElementNS(NS,'image');
   const [x,y,width,height]=piece.encuadre;
   for(const [key,value]of Object.entries({x,y,width,height,href:piece.images[plano],preserveAspectRatio:'xMinYMin meet'}))img.setAttribute(key,value);
   g.append(img);return g;
  });
 }

 const d=parse(`<svg xmlns="${NS}" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="lab-neck-back">${piece.svg||''}</g><g id="lab-neck-front">${piece.frontSvg||''}</g></svg>`);
 const map=new Map();for(const n of d.querySelectorAll('[id]')){if(map.has(n.id))throw Error('ID duplicado en bufanda');map.set(n.id,'lab-scarf-'+n.id);}
 for(const n of d.querySelectorAll('*')){
  if(n.hasAttribute('id'))n.setAttribute('id',map.get(n.id));
  for(const a of [...n.attributes]){let v=a.value;
   if(a.localName==='href'&&v.startsWith('#')){if(!map.has(v.slice(1)))throw Error('Referencia externa al accesorio');v='#'+map.get(v.slice(1));}
   v=v.replace(/url\(#([^)]*)\)/g,(_,id)=>{if(!map.has(id))throw Error('Recurso de bufanda ausente');return `url(#${map.get(id)})`;});
   n.setAttributeNS(a.namespaceURI,a.name,v);
  }
 }
 // Recolores declarativos por función; no se inventan variantes de una geometría sin etiquetar.
 for(const [role,color] of Object.entries(variant?.colores||{})){
  if(!/^#[0-9a-f]{6}$/i.test(color))throw Error('Color inválido');
  const targets=[...d.querySelectorAll('[data-color-role]')].filter(n=>n.getAttribute('data-color-role')===role);
  if(!targets.length)throw Error('Función de color ausente: '+role);
  for(const n of targets)n.setAttribute(n.localName==='stop'?'stop-color':'fill',color);
 }
 return [...d.documentElement.children];
}
export function renderCiempi(env,selection,{previous=false,category}={}){
 const newBag=env.bags?.find(x=>x.id===selection.espalda),newShoe=env.footwear?.find(x=>x.id===selection.pies),newSurface=env.surfaces?.find(x=>x.id===selection.textura);
 const relevant=category==='espalda'?newBag:category==='pies'?newShoe:category==='textura'?newSurface:null;
 if(previous&&relevant)return renderCiempi(env,{...selection,[category]:relevant.anterior||({espalda:'espalda-nada',pies:'pies-zapatillas',textura:'liso'}[category])});
 const newHat=[...env.hats,...env.masks].find(x=>x.id===selection.cabeza),newCape=env.capes.find(x=>x.id===selection.espalda);
 if(previous&&((category==='cabeza'&&newHat)||(category==='espalda'&&newCape))){const key=category;return renderCiempi(env,{...selection,[key]:(key==='cabeza'?newHat:newCape).anterior||(key==='cabeza'?'cabeza-nada':'espalda-nada')});}
 const lens=env.lenses.find(x=>x.id===selection.cara),hair=env.hair.find(x=>x.id===selection.pelo),detail=env.details.find(x=>x.id===selection.detalle);
 const target=category|| (lens?'cara':hair?'pelo':detail?'detalle':null);
 if(previous&&((target==='cara'&&lens)||(target==='pelo'&&hair)||(target==='detalle'&&detail))){
  const old={...selection};
  if(target==='cara'){const variant=lens.variantes.find(x=>x.id===selection.varianteLentes);old.cara=variant?.anterior||lens.anterior||'cara-nada';if(old.cara==='cara-harry')old.detalle='detalle-nada';}
  if(target==='pelo'){old.pelo='pelo-nada';old.cabeza=hair.anterior||'cabeza-nada';}
  if(target==='detalle')old.detalle='detalle-cicatriz-anterior';
  return renderCiempi(env,old);
 }
 const expression=env.facial.find(x=>x.id===selection.expresion);
 const originalColorOnly=selection.expresion==='alegre'&&selection.ojos!=='oscuro';
 const faceItem=expression||(originalColorOnly?env.facial[0]:null);
 let faceBase=env.base,compositionSelection=selection;
 if(expression&&previous){compositionSelection={...selection,...expression.anterior};}
 else if(faceItem){
  const color=(ojosColores.find(x=>x.id===selection.ojos)||ojosColores[0]).color;
  faceBase=prepareFace(env.base,faceItem,color);
  compositionSelection={...selection,expresion:'alegre',ojos:'oscuro',boca:originalColorOnly?selection.boca:'sonrisa'};
 }
 if(newHat)compositionSelection={...compositionSelection,cabeza:'cabeza-nada',...(newHat.mask?{cara:'cara-nada'}:{})};
 if(newBag)compositionSelection={...compositionSelection,espalda:'espalda-nada'};
 if(newShoe)compositionSelection={...compositionSelection,pies:'pies-zapatillas'};
 if(newSurface)compositionSelection={...compositionSelection,textura:'liso'};
 if(newCape)compositionSelection={...compositionSelection,espalda:'espalda-nada'};
 if(lens)compositionSelection={...compositionSelection,cara:'cara-nada'};
 const doc=parse(compose(faceBase,compositionSelection));
 if(faceItem&&!(expression&&previous))finishFace(doc,faceItem,gorros.find(x=>x.id===selection.cabeza));
 let piece=env.neck.find(x=>x.id===selection.cuello);if(!piece)throw Error('Bufanda desconocida');
 if(previous&&!expression&&piece.compararCon)piece=env.neck.find(x=>x.id===piece.compararCon);
 const variants=piece.variantes||[],variant=variants.find(x=>x.id===selection.variante)||variants[0];
 const [back,front]=scarfGroups(piece,variant);
 const head=doc.querySelector('g[id="head"]'),face=doc.querySelector('g[id="face-accessory"]');if(!head||!face)throw Error('Faltan anclajes de la base');
 head.parentNode.insertBefore(doc.importNode(back,true),head);face.parentNode.insertBefore(doc.importNode(front,true),face);
 equipWardrobe(doc,env,selection);
 equipHeadAccessories(doc,env,selection);
 equipCostumes(doc,env,selection);
 doc.querySelector('desc').textContent+=' Bufanda: '+piece.nombre+'.';
 return new XMLSerializer().serializeToString(doc);
}
