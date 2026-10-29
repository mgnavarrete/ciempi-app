import{describe,it,expect}from'vitest';
import{roles,posiciones}from'./pose';import{desdeGuardada}from'./seleccion';import{APARIENCIA_INICIAL,CATALOGO}from'../catalogo';
describe('crecimiento con piezas aprobadas',()=>{
 it('conserva exactamente las cinco posiciones aprobadas',()=>expect(posiciones(5).map(p=>p.x)).toEqual([187,289,390,477,558]));
 it('mantiene frente único y repite únicamente los centrales',()=>{for(const n of [0,1,2,5,12,40,100]){const r=roles(n);expect(r).toHaveLength(n);expect(r.filter(x=>x===4)).toHaveLength(n?1:0);expect(r.filter(x=>x===0)).toHaveLength(n>1?1:0);for(let i=1;i<n-1;i++)expect(r[i]).toBe(1+(i-1)%3)}});
 it('no modifica la apariencia guardada; mantiene alternativas históricas',()=>{const a={...APARIENCIA_INICIAL};expect(desdeGuardada(a)).not.toBeNull();expect(a).toEqual(APARIENCIA_INICIAL);expect(desdeGuardada({...a,forma:'forma-estrella'})).toBeNull();expect(desdeGuardada({...a,pies:'pies-zapatillas'})).toBeNull()});
 it('conserva los 78 derechos históricos sin IDs duplicados',()=>{expect(CATALOGO).toHaveLength(78);expect(new Set(CATALOGO.map(x=>x.id)).size).toBe(78)})
});
