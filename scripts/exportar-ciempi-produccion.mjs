// Exportación reproducible de los maestros aprobados. No modifica el laboratorio.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const lab='docs/rediseno-ciempi/laboratorio',out='public/ciempi-v2',code='src/ciempi/v2/arte';
await fs.mkdir(out,{recursive:true});await fs.mkdir(code+'/lib',{recursive:true});
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const evidence=[];
async function image(file,hue){
 const input=await fs.readFile(file);let src=sharp(input);
 if(hue!==undefined){const {data:a,info}=await src.ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let i=0;i<a.length;i+=4){if(!a[i+3])continue;const r=a[i]/255,g=a[i+1]/255,b=a[i+2]/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;if(!d||max!==r)continue;const h=((g-b)/d*60+360)%360;if(h>16&&h<340)continue;const s=d/(1-Math.abs(2*l-1));if(s<.35)continue;const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(hue/60%2-1)),m=l-c/2;const rgb=hue<60?[c,x,0]:hue<120?[x,c,0]:hue<180?[0,c,x]:hue<240?[0,x,c]:hue<300?[x,0,c]:[c,0,x];const w=Math.min(1,(s-.35)/.2);for(let j=0;j<3;j++)a[i+j]=Math.round(a[i+j]*(1-w)+(rgb[j]+m)*255*w);}src=sharp(a,{raw:info});}
 const png=await src.png().toBuffer();const buffer=await sharp(png).webp({lossless:true,effort:6}).toBuffer();const target=hash(buffer).slice(0,16)+'.webp';await fs.writeFile(out+'/'+target,buffer);
 const original=await sharp(png).ensureAlpha().raw().toBuffer(),decoded=await sharp(buffer).ensureAlpha().raw().toBuffer();let visibleEqual=true;for(let i=0;i<original.length;i+=4)if(original[i+3]!==decoded[i+3]||(original[i+3]>0&&(original[i]!==decoded[i]||original[i+1]!==decoded[i+1]||original[i+2]!==decoded[i+2]))){visibleEqual=false;break;}if(!visibleEqual)throw Error('Pérdida visible '+file);
 evidence.push({source:file,sha256:hash(input),hue: hue??null,target,sourceBytes:input.length,bytes:buffer.length,visiblePixelsIdentical:visibleEqual});return '/ciempi-v2/'+target;
}
const data={base:await fs.readFile('docs/rediseno-ciempi/ciempi-ilustracion-v2.svg','utf8')};
for(const [key,family,version] of [['facial','expresiones',1],['lenses','lentes',1],['hair','peinados',1],['hats','gorros',2],['masks','mascaras',2],['capes','capas',2],['bags','mochilas',1],['footwear','calzado',1],['surfaces','superficies',1],['characters','personajes',1]]){
 data[key]=await read(`${lab}/recursos/${family}/v${version}/catalogo.json`);
 for(const item of data[key]){const file=path.resolve(lab,item.archivo||item.svgFile);if(file.endsWith('.svg')){item.fragment=await fs.readFile(file,'utf8');item.svg=true;}else{item.image=await image(file);item.images={original:item.image};if(item.variantes)for(const v of item.variantes)if(v.tono!==null)item.images[v.id]=await image(file,v.tono);}}
}
data.details=await read(lab+'/recursos/lentes/v1/detalles.json');for(const x of data.details)x.fragment=await fs.readFile(path.resolve(lab,x.archivo),'utf8');
data.masks.push(...data.characters);
data.ajustes=await read(lab+'/recursos/paletas-cuerpo/v1/ajustes-aprobados.json');
data.sets=await read(lab+'/recursos/conjuntos/v1/catalogo.json');
const catalog=await read(lab+'/catalogo.json');data.scarf=catalog.recursos.find(x=>x.id==='bufanda-calco32');data.scarf.master=await fs.readFile(path.resolve(lab,data.scarf.maestro),'utf8');data.scarf.variantes=await read(path.resolve(lab,data.scarf.paletas));
// La aprobación explícita B01–B12 precede a esta integración experimental.
for(const key of ['facial','lenses','hair','hats','masks','capes','bags','footwear','surfaces','characters','details','sets'])for(const item of data[key]){item.aprobadoParaLaboratorio=true;item.aprobadoParaProduccion=false;item.estado='Arte aprobado para laboratorio; integración técnica experimental 1.6.0';}
await fs.writeFile(out+'/catalogo.json',JSON.stringify(data));
for(const file of ['armario-ciempi.mjs','colecciones-personajes.mjs','acabados-armario.mjs'])await fs.copyFile('scripts/lib/'+file,code+'/lib/'+file);
for(const file of ['accesorios-cuerpo.js','accesorios-cabeza.js','accesorios-disfraces.js','expresiones.js']){const src=(await fs.readFile(lab+'/'+file,'utf8')).replaceAll('../../../../scripts/lib/','./lib/');await fs.writeFile(code+'/'+file,'// Copia adaptada para integración; fuente artística intacta en laboratorio.\n'+src);}
const original=await fs.readFile(lab+'/cargar-catalogo.js','utf8');const functions=original.slice(original.indexOf("const NS='http://www.w3.org/2000/svg';"));
await fs.writeFile(code+'/componer.js',`import {compose,gorros,ojosColores} from './lib/armario-ciempi.mjs';\nimport './lib/colecciones-personajes.mjs';\nimport './lib/acabados-armario.mjs';\nimport {prepareFace,finishFace} from './expresiones.js';\nimport {equipWardrobe} from './accesorios-cuerpo.js';\nimport {equipHeadAccessories} from './accesorios-cabeza.js';\nimport {equipCostumes} from './accesorios-disfraces.js';\n`+functions);
await fs.writeFile('docs/integracion-ciempi/ejecucion-v1/pruebas/exportacion.json',JSON.stringify({files:evidence,totalBytes:evidence.reduce((s,x)=>s+x.bytes,0)},null,2));console.log('Exportados',evidence.length,'derivados sin pérdida visible.');
