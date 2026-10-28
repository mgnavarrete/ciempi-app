/* Se incorpora al HTML autónomo junto al catálogo y compositor compartidos. */
const selection={...defaults};let category='cabeza';let collection='all'
const preview=document.querySelector('#personaje')
function render(){
 preview.innerHTML=compose(base,selection)
 document.querySelectorAll('[data-item]').forEach(b=>b.setAttribute('aria-pressed',selection[b.dataset.category]===b.dataset.item?'true':'false'))
 document.querySelector('#descripcion').textContent=groups.map(([key,,items])=>items.find(i=>i.id===selection[key])?.nombre).filter(Boolean).join(' · ')
 document.querySelector('#mezclar').hidden=selection.pies!=='pies-aleatorios'
}
function belongs(item){return collection==='all'||collection==='ciempi'&&!item.collection||item.collection===collection||item.collections?.includes(collection)||item.svg===''}
function showCategory(key){
 category=key
 document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tab===key?'true':'false'))
 const [,title,allItems]=groups.find(g=>g[0]===key),items=allItems.filter(belongs)
 document.querySelector('#titulo-categoria').textContent=title
 document.querySelector('#cantidad').textContent=items.length+' opciones · las piezas pueden mezclarse entre colecciones'
 const row=document.querySelector('#opciones');row.replaceChildren()
 if(!items.length){const p=document.createElement('p');p.className='empty';p.textContent='Esta colección no tiene opciones en esta categoría. Elige otra categoría o “Todas las colecciones”.';row.append(p)}
 for(const item of items){
  const b=document.createElement('button');b.type='button';b.className='option';b.dataset.item=item.id;b.dataset.category=key
  let thumb=compose(base,{...selection,[key]:item.id})
  const crop=['cara','ojos','boca','expresion'].includes(key)?'595 245 295 240':key==='cabeza'?'550 50 365 455':key==='pies'&&item.id!=='pies-aleatorios'?'120 450 130 145':null
  if(crop)thumb=thumb.replace('viewBox="0 0 1000 650"',`viewBox="${crop}"`)
  const img=document.createElement('img');img.alt='';img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(thumb);b.append(img)
  const label=document.createElement('span');label.textContent=item.nombre;b.append(label)
  b.onclick=()=>{selection[key]=item.id;if(item.random)selection.seed=(selection.seed+1)>>>0;document.querySelector('#conjuntos').value='';render()}
  row.append(b)
 }
 render()
}
for(const [key,title]of groups){const b=document.createElement('button');b.type='button';b.textContent=title;b.dataset.tab=key;b.onclick=()=>showCategory(key);document.querySelector('#categorias').append(b)}
for(const [i,[name]]of looks.entries()){const opt=document.createElement('option');opt.value=String(i);opt.textContent=name;document.querySelector('#conjuntos').append(opt)}
for(const c of colecciones){const opt=document.createElement('option');opt.value=c.id;opt.textContent=c.nombre;document.querySelector('#colecciones').append(opt)}
document.querySelector('#colecciones').onchange=e=>{collection=e.target.value;document.querySelector('#probar-coleccion').hidden=!colecciones.some(c=>c.id===collection);showCategory(category)}
document.querySelector('#probar-coleccion').onclick=()=>{const c=colecciones.find(c=>c.id===collection);if(!c)return;Object.assign(selection,defaults,c.look);document.querySelector('#conjuntos').value=String(looks.findIndex(([name])=>name===c.nombre));showCategory(category)}
document.querySelector('#conjuntos').onchange=e=>{if(e.target.value==='')return;Object.assign(selection,defaults,looks[Number(e.target.value)][1]);showCategory(category)}
document.querySelector('#reiniciar').onclick=()=>{Object.assign(selection,defaults);collection='all';document.querySelector('#colecciones').value='all';document.querySelector('#probar-coleccion').hidden=true;document.querySelector('#conjuntos').value='';showCategory(category)}
document.querySelector('#mezclar').onclick=()=>{selection.seed=(selection.seed+1)>>>0;render()}
showCategory(category)
