/** Índices del maestro: cola=0, centrales=1/2/3, frente/emblema=4. */
export function roles(cantidad:number):number[]{
 const n=Math.max(0,Math.floor(cantidad));return Array.from({length:n},(_,i)=>i===n-1?4:i===0?0:1+(i-1)%3)
}
export function posiciones(cantidad:number){
 const r=roles(cantidad),xs=Array<number>(r.length);if(xs.length)xs[xs.length-1]=558
 for(let i=xs.length-2;i>=0;i--)xs[i]=xs[i+1]-([102,101,87,81][r[i]]??100)
 return r.map((role,i)=>({role,x:xs[i],y:[386,410,414,402,402][role]}))
}
export interface Escena {html:string;viewBox:string;headX:number;left:number;right:number}
/** Esta función se llama al cambiar vestuario/longitud, nunca al mover el dedo. */
export function escena(svg:string,n:number,prefix:string):Escena{
 const doc=new DOMParser().parseFromString(svg,'image/svg+xml');if(doc.querySelector('parsererror'))throw Error('Ciempi SVG inválido')
 const body=doc.getElementById('body')!,feet=doc.getElementById('legs-and-sneakers')!;
 const sourceBody=[...body.children],sourceFeet=[...feet.children];const xs=[187,289,390,477,558];
 function isolate(node:Element,key:string){const ids=new Map<string,string>();for(const e of [node,...node.querySelectorAll('[id]')])if(e.id)ids.set(e.id,key+e.id);for(const e of [node,...node.querySelectorAll('*')])for(const a of [...e.attributes]){let v=a.value;if(a.name==='id')v=ids.get(v)||v;else if((a.localName==='href')&&v.startsWith('#'))v='#'+(ids.get(v.slice(1))||v.slice(1));else v=v.replace(/url\(#([^)]*)\)/g,(_,id)=>`url(#${ids.get(id)||id})`);e.setAttributeNS(a.namespaceURI,a.name,v);}}
 if(n!==5){body.replaceChildren();feet.replaceChildren();
  for(const [i,p]of posiciones(n).entries()){const part=sourceBody[p.role].cloneNode(true) as Element;part.setAttribute('transform',`translate(${p.x} ${p.y})`);part.setAttribute('data-role',String(p.role));isolate(part,`seg${i}-`);body.append(part);
   const foot=sourceFeet[p.role].cloneNode(true) as Element;const wrapper=doc.createElementNS('http://www.w3.org/2000/svg','g');wrapper.setAttribute('transform',`translate(${p.x-xs[p.role]} 0)`);isolate(foot,`foot${i}-`);wrapper.append(foot);feet.append(wrapper);
  }
  if(n>0)feet.append(sourceFeet[5].cloneNode(true));
  // Sombras originales: repetir apoyos, sin conservar una sombra de cinco segmentos en N=0.
  for(const e of [...doc.documentElement.children])if(e.localName==='ellipse')e.remove();
  if(n===0){for(const e of doc.querySelectorAll('[data-bag], [data-surface]'))e.remove();}
 }
 const positions=posiciones(n);
 const backEdges=[...doc.querySelectorAll('[data-costume^="b08-"] image,[data-bag] image')].map(e=>Number(e.getAttribute('x'))-8);
 const left=n===5?0:Math.min(550,(positions[0]?.x??650)-110,...backEdges),right=1000;
 doc.documentElement.setAttribute('data-segments',String(n));isolate(doc.documentElement,prefix+'-');
 return {html:[...doc.documentElement.childNodes].filter(e=>e.nodeType===1&&!['title','desc'].includes((e as Element).localName)).map(e=>new XMLSerializer().serializeToString(e)).join(''),viewBox:`${left} 0 ${right-left} 650`,headX:736,left,right}
}

/**
 * Forma del cuerpo de una especie (laboratorio T01/T02): subconjunto
 * estructural de `FormaCuerpo` de `especie.ts` (rama de transformaciones), que
 * se le puede pasar tal cual. Sin forma, Ciempi exactamente como siempre.
 */
export interface FormaEscena {ciclo:number[];cola:number;frente:number;xFrente:number;y:Record<number,number>;separacion:Record<number,number>;xMaestro:Record<number,number>;pieDeRol:Record<number,number>;siempreClonar:boolean;margenCola?:number}
/** `posiciones(n)` o, con `forma`, la misma regla que `posiciones(n, forma)` de la rama de especies. */
export function posicionesForma(cantidad:number,forma?:FormaEscena){
 if(!forma)return posiciones(cantidad)
 const n=Math.max(0,Math.floor(cantidad)),c=forma.ciclo,r=Array.from({length:n},(_,i)=>i===n-1?forma.frente:i===0?forma.cola:c[(i-1)%c.length]),xs=Array<number>(n);if(n)xs[n-1]=forma.xFrente
 for(let i=n-2;i>=0;i--)xs[i]=xs[i+1]-(forma.separacion[r[i]]??100)
 return r.map((role,i)=>({role,x:xs[i],y:forma.y[role]}))
}

/** Escena compuesta una vez para hasta `nMax` segmentos: el rig muestra los primeros `n` sin recomponer (`rig.crecer`). */
export interface EscenaCreciente {html:string;nMax:number;headX:number;right:number;
 /** El mismo encuadre que daría `escena(svg, n)` (o `escena(svg, n, prefix, forma)`). */
 encuadre(n:number):{viewBox:string;left:number}
 /** Las posiciones de n segmentos con la forma de esta escena (para `rig.crecer`). */
 posiciones(n:number):{role:number;x:number;y:number}[]}
/**
 * Como `escena(svg, n)` para todo n ≤ nMax, pero sin volver a parsear ni
 * serializar al crecer: se arma la cadena modular completa (nMax segmentos,
 * sus patas y la pata de la cabeza) y se conserva lo que `escena` quita según
 * n (sombras del maestro, que solo se ven con n = 5; mochila y superficies,
 * que se ocultan con n = 0), marcado para que el rig lo muestre u oculte.
 *
 * `forma` (opcional, especies): el mismo comportamiento que `escena(…, forma)`:
 * roles y posiciones de la forma, pata del maestro según `pieDeRol` trasladada
 * desde `xMaestro` (anotado en `data-x-pie` para `rig.crecer`), sin sombras del
 * maestro con `siempreClonar` y `margenCola` en el encuadre. Sin `forma` el
 * resultado es idéntico al anterior (mismo html, carácter por carácter).
 */
export function escenaCreciente(svg:string,nMax:number,prefix:string,forma?:FormaEscena):EscenaCreciente{
 nMax=Math.max(0,Math.floor(nMax))
 const doc=new DOMParser().parseFromString(svg,'image/svg+xml');if(doc.querySelector('parsererror'))throw Error('Ciempi SVG inválido')
 const body=doc.getElementById('body')!,feet=doc.getElementById('legs-and-sneakers')!;
 const sourceBody=[...body.children],sourceFeet=[...feet.children];const xs=[187,289,390,477,558];
 const pieDe=(role:number)=>forma?forma.pieDeRol[role]??role:role,xPie=(role:number)=>forma?forma.xMaestro[pieDe(role)]:xs[role];
 function isolate(node:Element,key:string){const ids=new Map<string,string>();for(const e of [node,...node.querySelectorAll('[id]')])if(e.id)ids.set(e.id,key+e.id);for(const e of [node,...node.querySelectorAll('*')])for(const a of [...e.attributes]){let v=a.value;if(a.name==='id')v=ids.get(v)||v;else if((a.localName==='href')&&v.startsWith('#'))v='#'+(ids.get(v.slice(1))||v.slice(1));else v=v.replace(/url\(#([^)]*)\)/g,(_,id)=>`url(#${ids.get(id)||id})`);e.setAttributeNS(a.namespaceURI,a.name,v);}}
 body.replaceChildren();feet.replaceChildren();
 for(const [i,p]of posicionesForma(nMax,forma).entries()){const part=sourceBody[p.role].cloneNode(true) as Element;part.setAttribute('transform',`translate(${p.x} ${p.y})`);part.setAttribute('data-role',String(p.role));isolate(part,`seg${i}-`);body.append(part);
  const foot=sourceFeet[pieDe(p.role)].cloneNode(true) as Element;const wrapper=doc.createElementNS('http://www.w3.org/2000/svg','g');wrapper.setAttribute('transform',`translate(${p.x-xPie(p.role)} 0)`);wrapper.setAttribute('data-role',String(p.role));if(forma)wrapper.setAttribute('data-x-pie',String(xPie(p.role)));isolate(foot,`foot${i}-`);wrapper.append(foot);feet.append(wrapper);
 }
 const headFoot=sourceFeet[5].cloneNode(true) as Element;headFoot.setAttribute('data-pata-cabeza','');feet.append(headFoot);
 // Con `siempreClonar`, `escena` nunca muestra las sombras del maestro (ni con 5): se quitan.
 for(const e of [...doc.documentElement.children])if(e.localName==='ellipse'){if(forma?.siempreClonar)e.remove();else e.setAttribute('data-sombra-base','')}
 const edges=(sel:string)=>[...doc.querySelectorAll(sel)].map(e=>Number(e.getAttribute('x'))-8);
 const capeEdges=edges('[data-costume^="b08-"] image'),bagEdges=edges('[data-bag] image');
 doc.documentElement.setAttribute('data-segments',String(nMax));isolate(doc.documentElement,prefix+'-');
 const right=1000,clona=(n:number)=>n!==5||!!forma?.siempreClonar;
 return {nMax,headX:736,right,
  posiciones:(n)=>posicionesForma(n,forma),
  encuadre(n){const left=!clona(n)?0:Math.min(550,(posicionesForma(n,forma)[0]?.x??650)-(forma?.margenCola??110),...capeEdges,...(n===0?[]:bagEdges));return {left,viewBox:`${left} 0 ${right-left} 650`}},
  html:[...doc.documentElement.childNodes].filter(e=>e.nodeType===1&&!['title','desc'].includes((e as Element).localName)).map(e=>new XMLSerializer().serializeToString(e)).join('')}
}
