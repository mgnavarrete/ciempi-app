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
