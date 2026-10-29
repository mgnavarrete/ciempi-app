// Copia adaptada para integración; fuente artística intacta en laboratorio.
// B06–B08: planes and compatibility confined to the experimental laboratory.
const NS='http://www.w3.org/2000/svg';
function parse(s){const d=new DOMParser().parseFromString(s,'image/svg+xml');if(d.querySelector('parsererror'))throw Error('Disfraz SVG inválido');return d;}
export async function loadCostumes(get){
 const result={};
 for(const [key,family]of [['hats','gorros'],['masks','mascaras'],['capes','capas']]){
  const history=await(await get(`./recursos/${family}/v1/catalogo.json`)).json();
  for(const item of history){item.fragment=await(await get(item.archivo)).text();parse(item.fragment);item.historico=true;item.estado='Histórico v1 — rechazado artísticamente';}
  const current=await(await get(`./recursos/${family}/v2/catalogo.json`)).json();
  for(const item of current){const blob=await(await get(item.archivo)).blob();item.image=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob);});item.images={original:item.image};if(item.variantes)for(const v of item.variantes)if(v.tono!==null)item.images[v.id]=await recolor(item.image,v.tono);}
  result[key]=[...current,...history];
 }
 return result;
}
function parts(doc,item,variant){if(item.tipo==='raster-ia')return rasterParts(doc,item,variant);const source=parse(item.fragment);return ['back','front'].map(plane=>{const g=doc.createElementNS(NS,'g');g.id=item.id+'-'+plane;g.setAttribute('data-costume',item.id);if(plane==='back'&&source.querySelector('defs'))g.append(doc.importNode(source.querySelector('defs'),true));for(const c of source.querySelector(`[data-plane="${plane}"]`).children)g.append(doc.importNode(c,true));return g;});}
export function equipCostumes(doc,env,selection){
 const hat=[...env.hats,...env.masks].find(x=>x.id===selection.cabeza),cape=env.capes.find(x=>x.id===selection.espalda),head=doc.getElementById('head');
 if(cape){const [back,front]=parts(doc,cape,selection.varianteCapa);const neck=doc.getElementById('lab-scarf-lab-neck-back');head.parentNode.insertBefore(back,neck||head);head.parentNode.insertBefore(front,neck||head);doc.querySelector('desc').textContent+=' '+cape.nombre+'.';}
 if(hat){const [back,front]=parts(doc,hat);head.parentNode.insertBefore(back,head);doc.getElementById('jockey').append(front);
  if(hat.antenna===false)doc.getElementById('antennae')?.remove();
  if(hat.ocultaRostro){doc.getElementById('eyes').replaceChildren();doc.getElementById('eyes').setAttribute('data-hidden','costume');doc.getElementById('mouth').replaceChildren();doc.getElementById('mouth').setAttribute('data-hidden','costume');doc.getElementById('b03-brows')?.remove();}
  doc.querySelector('desc').textContent+=' '+hat.nombre+(hat.ocultaRostro?': disfraz completo, expresión oculta.':': conserva expresión original.');
 }
}

// Color controlado sobre el maestro rojo: conserva alfa, luminosidad y geometría.
// Los píxeles azules del contorno y dorados del broche permanecen intactos.
async function recolor(url,hue){
 const im=new Image();await new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=reject;im.src=url;});const canvas=document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0);const frame=ctx.getImageData(0,0,im.width,im.height),a=frame.data;
 for(let i=0;i<a.length;i+=4){if(!a[i+3])continue;const r=a[i]/255,g=a[i+1]/255,b=a[i+2]/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;if(!d||max!==r)continue;const h=((g-b)/d*60+360)%360;if(h>16&&h<340)continue;const saturation=d/(1-Math.abs(2*l-1));if(saturation<.35)continue;const c=(1-Math.abs(2*l-1))*saturation,x=c*(1-Math.abs(hue/60%2-1)),m=l-c/2;const rgb=hue<60?[c,x,0]:hue<120?[x,c,0]:hue<180?[0,c,x]:hue<240?[0,x,c]:hue<300?[x,0,c]:[c,0,x];const weight=Math.min(1,(saturation-.35)/.2);for(let j=0;j<3;j++)a[i+j]=Math.round(a[i+j]*(1-weight)+(rgb[j]+m)*255*weight);}
 ctx.putImageData(frame,0,0);return canvas.toDataURL('image/png');
}
function rasterParts(doc,item,variant){
 const node=(tag,attrs={})=>{const n=doc.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
 const [x,y,width,height]=item.encuadre,back=node('g',{id:item.id+'-back','data-costume':item.id}),front=node('g',{id:item.id+'-front','data-costume':item.id});
 const picture=()=>node('image',{x,y,width,height,href:item.images[variant]||item.image,preserveAspectRatio:'xMinYMin meet',...(item.rotation?{transform:`rotate(${item.rotation} ${(item.centroRotacion||[736,340]).join(" ")})`}:{})});
 if(item.splitY){const defs=node('defs');for(const [plane,top,h]of [['back',item.splitY,650-item.splitY],['front',0,item.splitY]]){const clip=node('clipPath',{id:item.id+'-clip-'+plane,clipPathUnits:'userSpaceOnUse'});clip.append(node('rect',{x:0,y:top,width:1000,height:h}));defs.append(clip);const g=node('g',{'clip-path':`url(#${item.id}-clip-${plane})`});g.append(picture());(plane==='back'?back:front).append(g);}back.prepend(defs);}else (item.soloPosterior?back:front).append(picture());
 return [back,front];
}
