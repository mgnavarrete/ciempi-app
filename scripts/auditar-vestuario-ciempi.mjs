import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import {gorros,caras,zapatos,espaldas,paletas,texturas,expresiones,ojosColores,bocas,compose} from './lib/armario-ciempi.mjs'
import {colecciones} from './lib/colecciones-personajes.mjs'
import './lib/acabados-armario.mjs'
const dir='docs/rediseno-ciempi/auditoria'
mkdirSync(dir,{recursive:true})
const base=readFileSync('docs/rediseno-ciempi/ciempi-ilustracion-v2.svg','utf8')
const defaults={cabeza:'cabeza-nada',cara:'cara-nada',pies:'pies-zapatillas',espalda:'espalda-nada',paleta:'clasica',textura:'liso',expresion:'alegre',ojos:'oscuro',boca:'sonrisa',seed:17}
const groups=[['cabeza','Gorros y máscaras',gorros],['cara','Lentes',caras],['pies','Calzado',zapatos],['espalda','Espalda',espaldas],['paleta','Paletas',paletas],['textura','Texturas',texturas],['expresion','Expresiones',expresiones],['ojos','Ojos',ojosColores],['boca','Bocas',bocas]]
const xml=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;')
const manifest=[]
for(const [key,title,items] of groups){
 const rows=Math.ceil(items.length/4),height=90+rows*300
 let content=`<rect width="1600" height="${height}" fill="#f8f3e8"/><text x="24" y="48" font-family="sans-serif" font-size="30" fill="#243e5b">Auditoría · ${title}</text>`
 for(const [i,item]of items.entries()){
  const x=i%4*400,y=80+Math.floor(i/4)*300
  const crop=key==='cabeza'?'560 60 350 435':['cara','ojos','expresion','boca'].includes(key)?'590 235 300 250':key==='pies'&&item.id!=='pies-aleatorios'?'120 445 135 145':'70 110 840 490'
  const svg=compose(base,{...defaults,[key]:item.id}).replace('viewBox="0 0 1000 650"',`viewBox="${crop}"`).replace('width="1200" height="780"',`x="${x+12}" y="${y+38}" width="370" height="215"`).replace(/id="([^"]+)"/g,`id="audit${i}-$1"`).replace(/url\(#([^)]*)\)/g,`url(#audit${i}-$1)`)
  content+=`<rect x="${x+6}" y="${y}" width="387" height="288" rx="16" fill="#fffdf8"/><text x="${x+18}" y="${y+27}" font-family="sans-serif" font-size="17" fill="#243e5b">${String(i+1).padStart(2,'0')} · ${xml(item.nombre)}</text>${svg}<text x="${x+18}" y="${y+273}" font-family="sans-serif" font-size="12" fill="#516c78">${item.id}</text>`
  manifest.push({categoria:key,id:item.id,nombre:item.nombre,coleccion:item.collection||'ciempi',paleta:item.colors?[item.colors[1],item.colors[4],item.colors[7]]:undefined})
 }
 await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="${height}">${content}</svg>`)).png().toFile(`${dir}/${key}.png`)
}
const hash=async s=>createHash('sha256').update(await sharp(Buffer.from(compose(base,s))).resize(320).raw().toBuffer()).digest('hex')
const checks=[]
for(const theme of ['iron-man','spider-man']){
 const look={...defaults,...colecciones.find(c=>c.id===theme).look},hashes=[]
 for(const p of paletas)hashes.push({id:p.id,hash:await hash({...look,paleta:p.id})})
 checks.push({theme,palettes:hashes.length,distinctImages:new Set(hashes.map(p=>p.hash)).size,groups:Object.values(Object.groupBy(hashes,p=>p.hash)).map(g=>g.map(p=>p.id))})
}
for(const expression of ['guino','feliz','dormilon']){
 const hashes=[];for(const eye of ojosColores)hashes.push({id:eye.id,hash:await hash({...defaults,expresion:expression,ojos:eye.id})})
 checks.push({expression,eyeColors:hashes.length,distinctImages:new Set(hashes.map(p=>p.hash)).size})
}
writeFileSync(`${dir}/inventario.json`,JSON.stringify(manifest,null,2));writeFileSync(`${dir}/verificaciones.json`,JSON.stringify(checks,null,2))
writeFileSync(`${dir}/index.html`,`<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Auditoría del vestuario de Ciempi</title><style>body{font-family:system-ui;background:#f8f3e8;color:#243e5b;max-width:1500px;margin:auto;padding:24px}img{width:100%;height:auto}nav{display:flex;gap:12px;flex-wrap:wrap}a{color:#247586}section{margin-top:35px}</style><h1>Auditoría visual del vestuario</h1><p>122 opciones revisadas sobre una base neutra, sin combinar accesorios que oculten la pieza analizada. Estas láminas son evidencia del estado actual; no son rediseños.</p><nav>${groups.map(([key,title])=>`<a href="#${key}">${title}</a>`).join('')}</nav>${groups.map(([key,title])=>`<section id="${key}"><h2>${title}</h2><img src="${key}.png" alt="Todas las opciones de ${title}" loading="lazy"></section>`).join('')}</html>`)
console.log(JSON.stringify({items:manifest.length,checks},null,2))
