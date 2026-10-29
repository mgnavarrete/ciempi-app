import {paletas,ojosColores} from './lib/armario-ciempi.mjs';
import './lib/colecciones-personajes.mjs';
import './lib/acabados-armario.mjs';
export const defaults={cabeza:'cabeza-nada',cara:'cara-nada',pies:'pies-zapatillas',espalda:'espalda-nada',cuello:'cuello-nada',variante:'gryffindor',paleta:'clasica',textura:'liso',expresion:'alegre',ojos:'oscuro',boca:'sonrisa',seed:17,pelo:'pelo-nada',detalle:'detalle-nada',varianteLentes:'original',varianteCapa:'original'};
let pending;
export function load(){return pending??=fetch('/ciempi-v2/catalogo.json').then(r=>{if(!r.ok)throw Error('No se pudo cargar Ciempi');return r.json();}).then(env=>{
 for(const x of env.ajustes.paletas)paletas.find(p=>p.id===x.id).colors=x.colors;
 const p=env.scarf,d=new DOMParser().parseFromString(p.master,'image/svg+xml');const art=[...d.documentElement.children].filter(n=>n.localName==='g').map(n=>new XMLSerializer().serializeToString(n)).join('');const cut=p.adaptacion.corteY,t=p.adaptacion.transform;
 p.svg=`<defs><g id="master-art">${art}</g><clipPath id="master-back"><rect width="1200" height="${cut}"/></clipPath><clipPath id="master-front"><rect y="${cut}" width="1200" height="${780-cut}"/></clipPath></defs><g transform="${t}"><use href="#master-art" clip-path="url(#master-back)"/></g>`;
 p.frontSvg=`<g transform="${t}"><use href="#master-art" clip-path="url(#master-front)"/></g>`;
 env.neck=[{id:'cuello-nada',nombre:'Sin bufanda',svg:'',frontSvg:''},p];
 const none=(id,nombre)=>({id,nombre});
 env.groups=[['paleta','Colores',paletas],['expresion','Expresiones',[none('alegre','Original'),...env.facial]],['ojos','Color de ojos',ojosColores],['cabeza','Gorros y máscaras',[none('cabeza-nada','Sin gorro'),...env.hats,...env.masks]],['cara','Lentes',[none('cara-nada','Sin lentes'),...env.lenses]],['pelo','Peinados',[none('pelo-nada','Sin peinado'),...env.hair]],['detalle','Detalle facial',[none('detalle-nada','Sin detalle'),...env.details]],['cuello','Bufandas',env.neck],['espalda','Capas y mochilas',[none('espalda-nada','Sin accesorio'),...env.capes,...env.bags]],['pies','Calzado',[none('pies-zapatillas','Original'),...env.footwear]],['textura','Superficies',[none('liso','Sin textura'),...env.surfaces]]];return env;
}).catch(e=>{pending=undefined;throw e;});}
