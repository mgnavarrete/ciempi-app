async () => {
 const {load,renderCiempi,escena,BASE}=window.tools,env=await load(),fail=[],results=[],t0=performance.now();
 const cases=[['base',BASE],...env.sets.map(x=>[x.id,{...BASE,...x.seleccion}]),...env.groups.flatMap(([key,,items])=>items.map(x=>[key+':'+x.id,{...BASE,[key]:x.id}]))];
 for(const [name,s]of cases)for(const n of [0,1,2,5,12,40]){
  try{const svg=renderCiempi(env,s),out=escena(svg,n,'test'),d=new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${out.html}</svg>`,'image/svg+xml'),ids=[...d.querySelectorAll('[id]')].map(x=>x.id);if(d.querySelector('parsererror'))throw Error('XML inválido');if(new Set(ids).size!==ids.length)throw Error('IDs duplicados');for(const el of d.querySelectorAll('*'))for(const a of el.attributes){for(const match of a.value.matchAll(/url\(#([^)]*)\)/g))if(!ids.includes(match[1]))throw Error('Referencia rota '+match[1]);if(a.localName==='href'&&a.value.startsWith('#')&&!ids.includes(a.value.slice(1)))throw Error('href roto '+a.value);}
  const body=d.getElementById('test-body');if(body.children.length!==n)throw Error('Segmentos '+body.children.length);if(d.getElementById('test-legs-and-sneakers').children.length!==(n?n+1:0))throw Error('Patas');results.push([name,n]);
  }catch(e){fail.push([name,n,e.message])}
 }
 const resources=[...new Set(JSON.stringify(env).match(/\/ciempi-v2\/[a-f0-9]+\.webp/g)||[])];const images=[];for(const url of resources){const img=new Image();img.src=url;try{await img.decode();images.push([url,img.naturalWidth,img.naturalHeight])}catch{fail.push(['image',url])}}
 return {count:results.length,fail,images,ms:performance.now()-t0,cases:cases.length};
}
