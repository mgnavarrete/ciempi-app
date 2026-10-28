import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import sharp from 'sharp'
import { gorros, caras, zapatos, mochilas, compose, replaceGroup } from './lib/armario-ciempi.mjs'
const dir='docs/rediseno-ciempi/armario'
mkdirSync(dir,{recursive:true})
const base=readFileSync('docs/rediseno-ciempi/ciempi-ilustracion-v2.svg','utf8')
const looks=[
 ['Explorador','cabeza-jockey','cara-nada','pies-zapatillas','espalda-explorador'],
 ['Tarde de lectura','cabeza-gorro-lana','cara-lentes','pies-pantuflas','espalda-nada'],
 ['Flores y lluvia','cabeza-flor','cara-nada','pies-botas','espalda-nada'],
 ['Magia entre páginas','cabeza-mago','cara-nada','pies-zapatillas','espalda-nada'],
 ['Viaje espacial','cabeza-astronauta','cara-nada','pies-zapatillas','espalda-nada'],
 ['Un cuento real','cabeza-corona','cara-lentes','pies-zapatillas','espalda-nada'],
]
let board='<rect width="1500" height="1120" fill="#f8f3e8"/><text x="50" y="65" font-family="sans-serif" font-size="38" font-weight="bold" fill="#243e5b">El armario de Ciempi</text><text x="50" y="105" font-family="sans-serif" font-size="20" fill="#536b79">Primera colección · prendas combinables sobre el personaje aprobado</text>'
for(const [i,[nombre,cabeza,cara,pies,espalda]] of looks.entries()){
 const svg=compose(base,{cabeza,cara,pies,espalda})
 writeFileSync(`${dir}/conjunto-${i+1}.svg`,svg)
 const x=30+(i%3)*490,y=140+Math.floor(i/3)*480
 const nested=svg.replace(/id="([^"]+)"/g,`id="look${i}-$1"`).replace(/url\(#([^)]*)\)/g,`url(#look${i}-$1)`).replace('width="1200" height="780"',`x="${x+8}" y="${y+65}" width="450" height="350"`)
 board+=`<rect x="${x}" y="${y}" width="465" height="450" rx="24" fill="#fffdf8" stroke="#e7e0d3"/><text x="${x+24}" y="${y+42}" font-family="sans-serif" font-size="24" font-weight="bold" fill="#243e5b">${nombre}</text>${nested}`
}
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1120">${board}</svg>`)).png().toFile(`${dir}/coleccion-inicial.png`)
const js=`const base=${JSON.stringify(base)};const gorros=${JSON.stringify(gorros)};const caras=${JSON.stringify(caras)};const zapatos=${JSON.stringify(zapatos)};const mochilas=${JSON.stringify(mochilas)};${replaceGroup.toString()};${compose.toString()};
const selection={cabeza:'cabeza-jockey',cara:'cara-nada',pies:'pies-zapatillas',espalda:'espalda-nada'};
const groups=[['cabeza','Gorros',gorros],['cara','Lentes',caras],['pies','Calzado',zapatos],['espalda','Mochilas',mochilas]];
function render(){document.querySelector('#personaje').innerHTML=compose(base,selection); document.querySelectorAll('[data-item]').forEach(b=>b.setAttribute('aria-pressed',selection[b.dataset.category]===b.dataset.item?'true':'false'));document.querySelector('#descripcion').textContent=groups.map(([key,,items])=>items.find(i=>i.id===selection[key]).nombre).join(' · ')}
for(const [key,title,items]of groups){const field=document.createElement('fieldset');const legend=document.createElement('legend');legend.textContent=title;field.append(legend);const row=document.createElement('div');row.className='options';for(const item of items){const b=document.createElement('button');b.type='button';b.textContent=item.nombre+(item.nuevo?' · Nuevo':'');b.dataset.item=item.id;b.dataset.category=key;b.onclick=()=>{selection[key]=item.id;render()};row.append(b)}field.append(row);document.querySelector('#opciones').append(field)}document.querySelector('#reiniciar').onclick=()=>{Object.assign(selection,{cabeza:'cabeza-jockey',cara:'cara-nada',pies:'pies-zapatillas',espalda:'espalda-nada'});render()};render();`
writeFileSync(`${dir}/index.html`,`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>El armario de Ciempi</title><style>
*{box-sizing:border-box}body{margin:0;background:#f8f3e8;color:#243e5b;font-family:system-ui,sans-serif}main{max-width:1280px;margin:auto;padding:32px 24px}h1{font-size:clamp(28px,4vw,44px);letter-spacing:-.04em;margin:8px 0}p{line-height:1.6}.lead{color:#516c78;margin-bottom:24px}.layout{display:grid;grid-template-columns:1.25fr 1fr;gap:24px;align-items:start}.stage{position:sticky;top:24px;background:#fffdf8;border:1px solid #e4ddce;border-radius:28px;padding:24px;text-align:center}#personaje svg{display:block;width:100%;height:auto}#descripcion{font-size:14px;min-height:44px;color:#516c78}fieldset{margin:0 0 18px;border:1px solid #e4ddce;background:#fffdf8;border-radius:20px;padding:18px}legend{font-weight:750;padding:0 8px}.options{display:flex;flex-wrap:wrap;gap:8px}button{font:inherit;font-size:14px;min-height:44px;padding:10px 15px;border:1px solid #c9d6d4;background:white;border-radius:14px;color:#243e5b;cursor:pointer}button[aria-pressed=true]{background:#d7eee4;border:2px solid #287d84;padding:9px 14px;font-weight:700}button:focus-visible{outline:3px solid #eead34;outline-offset:3px}a{color:#287d84}.badge{font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:#287d84;font-weight:750}.note{font-size:13px;color:#516c78}@media(max-width:760px){.layout{grid-template-columns:1fr}.stage{position:static;padding:10px}main{padding:20px 14px}}
</style><main><div class="badge">Estudio de vestuario · Primera colección</div><h1>El armario de Ciempi</h1><p class="lead">Elige un gorro, cambia los zapatos y prueba tus combinaciones.</p><div class="layout"><section class="stage" aria-label="Vista del personaje"><div id="personaje"></div><p id="descripcion" aria-live="polite"></p><button id="reiniciar" type="button">Volver al conjunto original</button></section><section id="opciones" aria-label="Prendas disponibles"></section></div><p class="note">Vista de diseño: las elecciones no compran objetos ni modifican tu inventario. <a href="coleccion-inicial.png">Ver seis conjuntos</a>.</p></main><script>${js.replaceAll('</script','<\\/script')}</script></html>`)
// Verificar cada combinación mediante composición: IDs únicos y grupos presentes.
let count=0
for(const h of gorros)for(const f of caras)for(const s of zapatos)for(const b of mochilas){
 const svg=compose(base,{cabeza:h.id,cara:f.id,pies:s.id,espalda:b.id})
 const ids=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1])
 if(new Set(ids).size!==ids.length)throw Error('IDs duplicados')
 if(!svg.includes('id="legs-and-sneakers"')||!svg.includes('id="head"'))throw Error('Anatomía perdida')
 count++
}
console.log(`${count} combinaciones compuestas; lámina y probador generados en ${dir}`)
