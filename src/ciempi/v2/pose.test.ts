import{describe,it,expect}from'vitest';
import{roles,posiciones}from'./pose';
describe('crecimiento con piezas aprobadas',()=>{
 it('conserva exactamente las cinco posiciones aprobadas',()=>expect(posiciones(5).map(p=>p.x)).toEqual([187,289,390,477,558]));
 it('mantiene frente único y repite únicamente los centrales',()=>{for(const n of [0,1,2,5,12,40,100]){const r=roles(n);expect(r).toHaveLength(n);expect(r.filter(x=>x===4)).toHaveLength(n?1:0);expect(r.filter(x=>x===0)).toHaveLength(n>1?1:0);for(let i=1;i<n-1;i++)expect(r[i]).toBe(1+(i-1)%3)}})
});
