// Copia adaptada para integración; fuente artística intacta en laboratorio.
// B09–B12, exclusivo del laboratorio: conserva geometrías y anclajes originales.
const NS='http://www.w3.org/2000/svg';
export async function loadWardrobe(get){
 const result={};
 for(const [key,family] of [['bags','mochilas'],['footwear','calzado'],['surfaces','superficies'],['characters','personajes']]){
  result[key]=await(await get(`./recursos/${family}/v1/catalogo.json`)).json();
  await Promise.all(result[key].map(async item=>{const blob=await(await get(item.archivo)).blob();item.image=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)});item.images={original:item.image};}));
 }
 return result;
}
const make=(doc,tag,attrs={})=>{const node=doc.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))node.setAttribute(k,v);return node;};
function master(doc,item){const defs=doc.querySelector('defs'),id=item.id+'-art';const image=make(doc,'image',{id,width:item.dimensiones[0],height:item.dimensiones[1],href:item.image});defs.append(image);return id;}
export function equipWardrobe(doc,env,selection){
 const texture=env.surfaces.find(x=>x.id===selection.textura),shoe=env.footwear.find(x=>x.id===selection.pies),bag=env.bags.find(x=>x.id===selection.espalda);
 if(texture){const id=master(doc,texture);const specs=[['tail',88,85],['mint-back',88,85],['yellow-middle',81,84],['orange-middle',76,89],['mint-front',95,97]],tw=texture.dimensiones[0]/3,th=texture.dimensiones[1]/2;
  specs.forEach(([segment,rx,ry],i)=>{const parent=doc.getElementById(segment),tile=texture.paneles?.[i]??i,group=make(doc,'g',{'data-surface':texture.id,'data-segment':segment,'clip-path':`url(#clip-${segment})`});const viewport=make(doc,'svg',{x:-rx,y:-ry,width:2*rx,height:2*ry,viewBox:`${tile%3*tw} ${Math.floor(tile/3)*th} ${tw} ${th}`,preserveAspectRatio:'xMidYMid slice',overflow:'hidden'});viewport.append(make(doc,'use',{href:'#'+id}));group.append(viewport);parent.insertBefore(group,parent.querySelector('g[clip-path]'));});
  doc.querySelector('desc').textContent+=' Superficie: '+texture.nombre+'. Colores del material fijos; paleta visible en zonas descubiertas.';
 }
 if(shoe){const id=master(doc,shoe),feet=[...doc.getElementById('legs-and-sneakers').children];if(feet.length!==6)throw Error('El calzado B10 requiere la pose de seis pies aprobada');const width=shoe.ancho||88,height=shoe.alto||width*shoe.dimensiones[1]/shoe.dimensiones[0];
  for(const foot of feet){const rotated=[...foot.children].find(n=>n.localName==='g');if(!rotated?.getAttribute('transform')?.startsWith('rotate('))throw Error('Anclaje de calzado desconocido');const use=make(doc,'use',{href:'#'+id,transform:`translate(${shoe.x??-43} ${(shoe.suelo??24)-height}) scale(${width/shoe.dimensiones[0]} ${height/shoe.dimensiones[1]})`,'data-footwear':shoe.id});rotated.replaceChildren(use);}
  doc.querySelector('desc').textContent+=' Calzado: '+shoe.nombre+'. Se conservan las seis piernas y sus giros.';
 }
 if(bag){const head=doc.getElementById('head'),group=make(doc,'g',{id:bag.id+'-equipped','data-bag':bag.id});const [x,y,width,height]=bag.encuadre;group.append(make(doc,'image',{x,y,width,height,href:bag.image,preserveAspectRatio:'xMinYMin meet'}));head.parentNode.insertBefore(group,doc.getElementById('lab-scarf-lab-neck-back')||head);doc.querySelector('desc').textContent+=' Mochila: '+bag.nombre+'. Espalda excluyente con capa.';}
}
