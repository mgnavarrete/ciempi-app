import {load,defaults,renderCiempi,colecciones} from './cargar-catalogo.js';
const $=s=>document.querySelector(s),uri=s=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
try{
const env=await load();let selection={...defaults},category='cuello',collection='all';
function image(svg,width){const img=new Image();const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));img.onload=img.onerror=()=>URL.revokeObjectURL(url);img.src=url;img.alt='Ciempi en el probador artístico';if(width)img.width=width;return img;}
function render(){
 const lensAsset=env.lenses.find(x=>x.id===selection.cara),hairAsset=env.hair.find(x=>x.id===selection.pelo),detailAsset=env.details.find(x=>x.id===selection.detalle),costumeAsset=category==='cabeza'?[...env.hats,...env.masks].find(x=>x.id===selection.cabeza):category==='espalda'?[...env.bags,...env.capes].find(x=>x.id===selection.espalda):null;
 const activeAsset=category==='pies'?env.footwear.find(x=>x.id===selection.pies):category==='textura'?env.surfaces.find(x=>x.id===selection.textura):category==='cara'?lensAsset:category==='pelo'?hairAsset:category==='detalle'?detailAsset:costumeAsset;
 const lensControl=$('#lens-variant');lensControl.replaceChildren();for(const v of lensAsset?.variantes||[])lensControl.add(new Option(v.nombre,v.id));lensControl.disabled=!lensAsset||lensAsset.variantes.length<2;if(lensAsset){if(!lensAsset.variantes.some(x=>x.id===selection.varianteLentes))selection.varianteLentes='original';lensControl.value=selection.varianteLentes;}
 const cape=env.capes.find(x=>x.id===selection.espalda),capeControl=$('#cape-variant');capeControl.replaceChildren();for(const v of cape?.variantes||[])capeControl.add(new Option(v.nombre,v.id));capeControl.disabled=!cape?.variantes;if(cape?.variantes){if(!cape.variantes.some(v=>v.id===selection.varianteCapa))selection.varianteCapa='original';capeControl.value=selection.varianteCapa;}
 const expression=env.facial.find(x=>x.id===selection.expresion);
 const piece=env.neck.find(x=>x.id===selection.cuello),variants=piece.variantes||[];
 const controls=$('#variant');controls.replaceChildren();for(const v of variants){controls.add(new Option(v.nombre,v.id));}controls.disabled=variants.length<2;if(variants.length){if(!variants.some(v=>v.id===selection.variante))selection.variante=variants[0].id;controls.value=selection.variante;}
 $('#variant-note').textContent=variants.length?`${variants.length} variante(s) sobre la misma construcción. Estado: ${piece.estado||'histórico'}.`:'Este recurso no tiene variantes registradas.';
 const current=renderCiempi(env,selection),previous=renderCiempi(env,selection,{previous:true,category});
 $('#views').replaceChildren();for(const [name,svg]of ($('#compare').checked?[[(activeAsset||expression)?'Referencia histórica':'Anterior',previous],[activeAsset?(activeAsset.aprobadoParaLaboratorio?'Accesorio aprobado para laboratorio':'Accesorio · en revisión'):expression?'Expresión B03 · aprobada para laboratorio':piece.aprobadoParaLaboratorio?'Actual aprobado para laboratorio':'Actual en revisión',current]]:[['Vista actual',current]])){
 const div=document.createElement('div');div.className='view';const title=document.createElement('p');title.textContent=name;div.append(title);const frame=document.createElement('div');frame.className='artboard';
 let visible=svg;if($('#detail').checked){const d=new DOMParser().parseFromString(svg,'image/svg+xml');d.documentElement.setAttribute('viewBox',['pelo','cabeza'].includes(category)?'525 20 410 490':['cara','detalle','expresion','ojos','boca'].includes(category)?'595 200 290 280':category==='pies'?'100 410 750 190':category==='textura'?'90 280 580 240':category==='espalda'?'330 160 360 370':'440 270 460 320');const vb=d.documentElement.getAttribute('viewBox').split(' ');d.documentElement.setAttribute('width',vb[2]);d.documentElement.setAttribute('height',vb[3]);visible=new XMLSerializer().serializeToString(d);}frame.append(image(visible));div.append(frame);$('#views').append(div);
 }
 $('#sizes').replaceChildren();for(const width of [240,320]){const d=document.createElement('div');d.className='artboard';const p=document.createElement('p');p.textContent=width+' px';d.append(p,image(current,width));$('#sizes').append(d);}
 document.body.classList.toggle('dark',$('#dark').checked);
 $('#status').textContent=`${activeAsset?activeAsset.nombre+' · '+activeAsset.estado+' | ':''}${expression?expression.nombre+' · '+expression.estado+' | ':''}${piece.nombre} · ${piece.estado||'histórico, sin aprobación nueva'}${$('#compare').checked&&!piece.compararCon&&!expression&&!activeAsset?' · No hay reemplazo asociado: ambas vistas muestran la misma versión.':''}`;
 const hat=env.groups.find(g=>g[0]==='cabeza')[2].find(x=>x.id===selection.cabeza);
 const lens=env.groups.find(g=>g[0]==='cara')[2].find(x=>x.id===selection.cara);
 const notes=[];const surface=env.surfaces.find(x=>x.id===selection.textura);if(surface)notes.push('Esta superficie tiene colores propios. La paleta solo cambia la cabeza descubierta; no recolorea el material.');if(surface&&hat?.ocultaRostro)notes.push('La máscara y el traje cubren las zonas de la paleta: el selector de paletas queda desactivado hasta retirar una pieza.');
 if(hairAsset&&!hairAsset.compatibleGorros.includes(selection.cabeza))notes.push('El gorro o peinado histórico oculta el pelo seleccionado: sus encajes son excluyentes. Elige Sin gorro para recuperarlo.');
 if(lensAsset&&!lensAsset.opaco&&!hat?.mask&&!hat?.fullFace)notes.push('Cristales transparentes: conservan ojos, color de iris y expresión.');
 if(detailAsset&&(selection.cara==='cara-harry'||selection.cara==='cara-cicatriz'))notes.push('La cicatriz anterior ya ocupa este espacio; no duplicamos el nuevo detalle.');
 if(hat?.mask||hat?.fullFace)notes.push(!hat.ocultaRostro?'Antifaz con aberturas: conserva ojos y boca. Excluye lentes y peinados para evitar monturas o mechones superpuestos.':'Disfraz completo: fija el rostro y desactiva los controles de gesto e iris ocultos. Conservamos tu expresión y color para recuperarlos al quitarlo.');
 else if(lens?.svg&&lens.hideEyes!==false)notes.push('Estos lentes ocultan los ojos; las cejas y la boca siguen expresando el gesto.');
 else if(expression&&!expression.irisVisible)notes.push('Los ojos están cerrados: el iris no es visible en este gesto.');
 if(expression)notes.push('Esta expresión coordina ojos, cejas y boca. Para mezclar bocas históricas, selecciona una expresión anterior.');
 $('#mask-note').textContent=notes.join(' ');
 document.querySelectorAll('[data-item]').forEach(b=>{b.setAttribute('aria-pressed',selection[category]===b.dataset.item);b.disabled=(category==='cara'&&!!hat?.mask&&b.dataset.item!=='cara-nada')||(category==='boca'&&!!expression)||(category==='paleta'&&!!surface&&!!hat?.ocultaRostro)||(!!hat?.ocultaRostro&&['ojos','expresion','boca'].includes(category));});
 window.__lab={env,selection:{...selection},current,previous,renderCiempi,defaults};document.documentElement.dataset.ready='true';
}
function show(){
 const group=env.groups.find(g=>g[0]===category);$('#category-title').textContent=group[1];$('#options').replaceChildren();
 const items=group[2].filter(x=>!x.historico||$('#history').checked).filter(x=>collection==='new'?x.novedad||x.svg===''||['cabeza-nada','espalda-nada','liso','pies-zapatillas','cuello-nada'].includes(x.id):collection==='all'||['expresion','ojos','boca'].includes(category)||x.collection===collection||x.collections?.includes(collection)||x.svg==='');
 for(const item of items){const b=document.createElement('button');b.className='option';b.dataset.item=item.id;let thumb=renderCiempi(env,{...selection,[category]:item.id,...(category==='pelo'&&item.id!=='pelo-nada'?{cabeza:'cabeza-nada'}:{})});if(['cabeza','cara','pelo','detalle','expresion','ojos','boca'].includes(category)){const d=new DOMParser().parseFromString(thumb,'image/svg+xml');d.documentElement.setAttribute('viewBox',['pelo','cabeza'].includes(category)?'525 20 410 490':'595 200 290 280');d.documentElement.setAttribute('width','290');d.documentElement.setAttribute('height','280');thumb=new XMLSerializer().serializeToString(d);}b.append(image(thumb));const name=document.createElement('span');name.textContent=item.nombre;const state=document.createElement('small');state.textContent=item.estado||'Histórico · no aprobado como rediseño';b.append(name,state);b.onclick=()=>{selection[category]=item.id;if(category==='pelo'&&item.id!=='pelo-nada')selection.cabeza='cabeza-nada';if(category==='cara')selection.varianteLentes='original';render();};$('#options').append(b);}
 if(!items.length)$('#options').textContent='No hay piezas de esta colección en la categoría.';
 document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.category===category));render();
}
for(const [key,title]of env.groups){const b=document.createElement('button');b.textContent=title;b.dataset.category=key;b.onclick=()=>{category=key;show();};$('#categories').append(b);}
for(const c of colecciones)$('#collection').add(new Option(c.nombre,c.id));for(const c of env.catalogo.familiasB12||[])$('#collection').add(new Option(c.nombre,c.id));
$('#collection').add(new Option('Ciempi · originales','ciempi-original'));
$('#collection').add(new Option('Novedades','new'));
$('#history').onchange=show;
$('#cape-variant').onchange=e=>{selection.varianteCapa=e.target.value;render();};
$('#lens-variant').onchange=e=>{selection.varianteLentes=e.target.value;render();};
$('#collection').onchange=e=>{collection=e.target.value;show();};$('#variant').onchange=e=>{selection.variante=e.target.value;render();};
for(const id of ['compare','detail','dark'])$('#'+id).onchange=render;
$('#reset').onclick=()=>{selection={...defaults};collection='all';$('#collection').value='all';for(const id of ['compare','detail','dark','history'])$('#'+id).checked=false;show();};
for(const item of env.catalogo.recursos.filter(x=>x.tipo==='raster')){const a=document.createElement('article'),img=new Image();img.src=item.imagen;img.alt='Propuesta B acolchada, concepto IA';const text=document.createElement('div');const h=document.createElement('h3');h.textContent='B — Acolchada · referencia histórica';const p=document.createElement('p');p.textContent='Concepto raster histórico. '+item.pendiente.join(', ')+'. Las seis variantes del maestro elegido están disponibles en Bufandas.';const link=document.createElement('a');link.href=item.informe;link.textContent='Revisión y evidencia';text.append(h,p,link);a.append(img,text);$('#concepts').append(a);}
for(const set of [...(env.catalogo.coleccionesNuevas||[]),...(env.catalogo.conjuntosB12||[])]){const card=document.createElement('article'),b=document.createElement('button');card.append(image(renderCiempi(env,{...defaults,...set.seleccion})));const h=document.createElement('h3');h.textContent=set.nombre;const p=document.createElement('p');p.textContent=set.historia;b.textContent='Probar conjunto';b.dataset.set=set.id;b.onclick=()=>{selection={...defaults,...set.seleccion};collection='all';category=set.batch==='B12'?'textura':'cabeza';$('#collection').value='all';show();};card.append(h,p,b);$(set.batch==='B12'?'#sets-b12':'#new-sets').append(card);}
for(const batch of env.batches){const a=document.createElement('article');a.textContent=`${batch.id} · ${batch.nombre} — ${batch.estado}`;$('#batches').append(a);}
show();
}catch(e){$('#error').textContent='No se pudo cargar el laboratorio: '+e.message;document.documentElement.dataset.ready='error';console.error(e);}
