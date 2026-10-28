import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import sharp from 'sharp'
import { gorros, caras, zapatos, mochilas, ropas, capas, paletas, texturas, expresiones, ojosColores, bocas, compose } from './lib/armario-ciempi.mjs'
const dir='docs/rediseno-ciempi/armario'
mkdirSync(dir,{recursive:true})
const base=readFileSync('docs/rediseno-ciempi/ciempi-ilustracion-v2.svg','utf8')
const defaults={cabeza:'cabeza-jockey',cara:'cara-nada',pies:'pies-zapatillas',espalda:'espalda-nada',ropa:'ropa-nada',capa:'capa-nada',paleta:'clasica',textura:'liso',expresion:'alegre',ojos:'oscuro',boca:'sonrisa',seed:17}
const groups=[['cabeza','Gorros',gorros],['cara','Lentes',caras],['pies','Calzado',zapatos],['espalda','Mochilas',mochilas],['ropa','Ropa',ropas],['capa','Capas',capas],['paleta','Colores',paletas],['textura','Texturas',texturas],['expresion','Gestos',expresiones],['ojos','Ojos',ojosColores],['boca','Bocas',bocas]]
const looks=[
 ['Cabeza redonda',{cabeza:'cabeza-nada'}],
 ['Fiesta aurora',{cabeza:'cabeza-tiara',cara:'cara-lentes-corazon',ropa:'ropa-falda',pies:'pies-bailarina',espalda:'espalda-estrella',paleta:'rosa'}],
 ['Guardián del cielo',{cabeza:'cabeza-guardian',cara:'cara-antifaz',ropa:'ropa-camiseta',capa:'capa-guardian',pies:'pies-espaciales'}],
 ['Magia celeste',{cabeza:'cabeza-mago',cara:'cara-lentes-estrella',espalda:'espalda-libro',capa:'capa-celeste',paleta:'noche',textura:'estrellas'}],
 ['Flores y arcoíris',{cabeza:'cabeza-sol',cara:'cara-lentes-arcoiris',pies:'pies-botas',espalda:'espalda-nube',textura:'pecas'}],
 ['Cada pie, una aventura',{cabeza:'cabeza-audifonos',cara:'cara-lentes-fuego',pies:'pies-aleatorios',ropa:'ropa-poleron'}],
 ['Viaje a las estrellas',{cabeza:'cabeza-astronauta',cara:'cara-visor',espalda:'espalda-cohete',pies:'pies-espaciales',paleta:'oceano'}],
 ['Jardín encantado',{cabeza:'cabeza-mariposa',espalda:'espalda-nube',ropa:'ropa-falda',expresion:'guino',ojos:'verde',textura:'corazones'}],
 ['Un cuento y una sonrisa',{cabeza:'cabeza-gorro-lana',ropa:'ropa-poleron',pies:'pies-pantuflas',expresion:'feliz',boca:'risa'}],
]
let board='<rect width="1500" height="1600" fill="#f8f3e8"/><text x="50" y="65" font-family="sans-serif" font-size="38" font-weight="bold" fill="#243e5b">El armario de Ciempi · Nuevas aventuras</text><text x="50" y="105" font-family="sans-serif" font-size="20" fill="#536b79">Cabeza redonda · prendas, colores y expresiones para combinar libremente</text>'
for(const [i,[nombre,changes]] of looks.entries()){
 const svg=compose(base,{...defaults,...changes})
 writeFileSync(`${dir}/conjunto-${i+1}.svg`,svg)
 const x=30+(i%3)*490,y=140+Math.floor(i/3)*480
 const nested=svg.replace(/id="([^"]+)"/g,`id="look${i}-$1"`).replace(/url\(#([^)]*)\)/g,`url(#look${i}-$1)`).replace('width="1200" height="780"',`x="${x+8}" y="${y+65}" width="450" height="350"`)
 board+=`<rect x="${x}" y="${y}" width="465" height="450" rx="24" fill="#fffdf8" stroke="#e7e0d3"/><text x="${x+24}" y="${y+42}" font-family="sans-serif" font-size="22" font-weight="bold" fill="#243e5b">${nombre}</text>${nested}`
}
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="1600">${board}</svg>`)).png().toFile(`${dir}/coleccion-ampliada.png`)
const source=readFileSync('scripts/lib/armario-ciempi.mjs','utf8').replace(/export (?=(const|function)\b)/g,'')
const client=readFileSync('scripts/lib/armario-probador.js','utf8')
const js=`${source}\nconst base=${JSON.stringify(base)};const defaults=${JSON.stringify(defaults)};const groups=${JSON.stringify(groups)};const looks=${JSON.stringify(looks)};\n${client}`
writeFileSync(`${dir}/index.html`,`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>El armario de Ciempi</title><style>
*{box-sizing:border-box}body{margin:0;background:#f8f3e8;color:#243e5b;font-family:system-ui,sans-serif}main{max-width:1320px;margin:auto;padding:28px 24px}h1{font-size:clamp(28px,4vw,44px);letter-spacing:-.04em;margin:8px 0}p{line-height:1.6}.lead{color:#516c78;margin-bottom:20px}.layout{display:grid;grid-template-columns:1.15fr 1fr;gap:24px;align-items:start}.stage{position:sticky;top:20px;background:#fffdf8;border:1px solid #e4ddce;border-radius:28px;padding:18px;text-align:center}#personaje svg{display:block;width:100%;height:auto}#descripcion{font-size:13px;min-height:40px;color:#516c78}fieldset{margin:16px 0 0;border:1px solid #e4ddce;background:#fffdf8;border-radius:20px;padding:16px}legend{font-weight:750;padding:0 8px}.options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}button{font:inherit;font-size:14px;min-height:44px;padding:9px 12px;border:1px solid #c9d6d4;background:white;border-radius:14px;color:#243e5b;cursor:pointer}button[aria-pressed=true]{background:#d7eee4;border:2px solid #287d84;padding:8px 11px;font-weight:700}button:focus-visible,select:focus-visible{outline:3px solid #eead34;outline-offset:3px}.option img{display:block;width:100%;height:74px;object-fit:contain}.option{padding:8px;min-width:0}.option[aria-pressed=true]{padding:7px}.tabs{display:flex;flex-wrap:wrap;gap:6px}.tabs button{font-size:13px}a{color:#287d84}.badge{font-size:12px;letter-spacing:.13em;text-transform:uppercase;color:#287d84;font-weight:750}.note{font-size:13px;color:#516c78}.actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}select{font:inherit;max-width:100%;padding:10px;border:1px solid #c9d6d4;background:white;color:#243e5b;border-radius:12px}label{display:block;font-size:13px;margin:8px 0}#mezclar[hidden]{display:none}.count{font-size:12px;color:#647d85}@media(max-width:760px){.layout{grid-template-columns:1fr;gap:14px}.stage{position:static;padding:10px}main{padding:20px 14px}.options{grid-template-columns:repeat(3,minmax(0,1fr))}.option img{height:62px}#descripcion{font-size:12px}.stage svg{max-height:280px}}
</style><main><div class="badge">Estudio de vestuario · Colección ampliada</div><h1>El armario de Ciempi</h1><p class="lead">Combina tus prendas favoritas, cambia sus colores y dale una expresión.</p><div class="layout"><section class="stage" aria-label="Vista del personaje"><div id="personaje"></div><p id="descripcion" aria-live="polite"></p><div class="actions"><button id="reiniciar" type="button">Volver al conjunto original</button><button id="mezclar" type="button" hidden>Volver a mezclar zapatos</button></div><label for="conjuntos">Ideas de conjuntos</label><select id="conjuntos"><option value="">Elige una idea</option></select></section><section aria-label="Personalización"><nav id="categorias" class="tabs" aria-label="Categorías del armario"></nav><fieldset><legend id="titulo-categoria">Gorros</legend><div id="opciones" class="options"></div></fieldset><p class="count" id="cantidad"></p></section></div><p class="note">Todas las prendas son para todos. Vista de diseño: estas elecciones no compran objetos ni cambian tu inventario. <a href="coleccion-ampliada.png">Ver nueve conjuntos</a>.</p></main><script>${js.replaceAll('</script','<\\/script')}</script></html>`)
let count=0
// Cobertura de cada opción, pares gorro/lentes y mezclas. No se afirma exhaustividad.
const check=selection=>{const svg=compose(base,{...defaults,...selection});const ids=[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);if(new Set(ids).size!==ids.length)throw Error('IDs duplicados');if(!svg.includes('id="legs-and-sneakers"')||!svg.includes('id="head"'))throw Error('Anatomía perdida');count++;return svg}
for(const [key,,items] of groups)for(const item of items)check({[key]:item.id})
for(const h of gorros)for(const f of caras)check({cabeza:h.id,cara:f.id})
for(let seed=1;seed<=12;seed++){const svg=check({pies:'pies-aleatorios',seed});if(svg!==check({pies:'pies-aleatorios',seed}))throw Error('Mezcla inestable')}
console.log(`${count} casos de composición verificados. ${groups.map(([k,,v])=>k+': '+v.length).join(', ')}`)
