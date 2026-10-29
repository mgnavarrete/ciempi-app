import{it,expect}from'vitest';
import{crearRepositoriosLocales}from'../../datos/localStorage/repositoriosLocales';
import{CATALOGO,APARIENCIA_INICIAL}from'../catalogo';import{desdeGuardada}from'./seleccion';
it('reabre los 78 derechos, monedas y apariencia histórica sin migración visual',async()=>{
 const data=new Map<string,string>(),store={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)}};
 const repos=crearRepositoriosLocales(store),p=await repos.perfiles.crear({apodo:'Prueba aislada',icono:'🐛'});
 const all=CATALOGO.map(x=>x.id),a={...APARIENCIA_INICIAL,forma:'forma-estrella',cabeza:'cabeza-unicornio',presentado:true};
 data.set('ciempi:v1:perfiles',JSON.stringify([{...p,monedas:987,inventario:all,ciempi:a}]));
 const before=JSON.stringify([...data]);const again=await crearRepositoriosLocales(store).perfiles.obtener(p.id);
 expect(again?.inventario).toEqual(all);expect(again?.monedas).toBe(987);expect(again?.ciempi).toEqual(a);expect(desdeGuardada(a)).toBeNull();expect(JSON.stringify([...data])).toBe(before);
});
