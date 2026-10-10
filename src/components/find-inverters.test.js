import { matchProducts, solarSizes, calculateBatteryCount } from './find-inverters';
const product = (name, capacity = 0) => ({product:name, bat_caculated:capacity});
const rows = [
 {id:1,phase:'1 phase',point:5,product:[product('SigenStor EC 5.0 SP'),product('Sigen Hybrid 5.0 SP2')]},
 {id:2,phase:'1 phase',point:15,product:[product('SigenStor NEO 12.0 SP'),product('SigenStor EC 10.0 SP'),product('SigenStor EC 5.0 SP 3 Unit')]},
 {id:3,phase:'1 phase',point:25,product:null},
 {id:4,phase:'3 phase',point:25,product:[product('SigenStor EC 25.0 TP')]},
 {id:5,phase:'1 phase',point:15,product:[product('SigenStor NEO 12.0 SP',6.02)]},
];
test('uses the table point instead of parsing inverter power',()=> {
 expect(matchProducts(rows,{point:15,phase:'1 phase',bat:0}).map(p=>p.product)).toEqual(['SigenStor NEO 12.0 SP','SigenStor EC 10.0 SP','SigenStor EC 5.0 SP 3 Unit']);
});
test('includes Hybrid and retains exact product metadata',()=> {
 expect(matchProducts(rows,{point:5,phase:'1 phase',bat:0})[1]).toMatchObject(product('Sigen Hybrid 5.0 SP2'));
});
test('null row falls back to nearest populated point of same phase',()=> {
 expect(matchProducts(rows,{point:25,phase:'1 phase',bat:0})).toHaveLength(3);
});
test('30 selects SigenStor 25 and battery count is unchanged',()=> {
 expect(matchProducts(rows,{point:30,phase:'3 phase',bat:0})[0].product).toBe('SigenStor EC 25.0 TP');
 expect(calculateBatteryCount(15,6.02)).toBe(3);
 expect(matchProducts(rows,{point:15,phase:'1 phase',bat:15})[0].bat_caculated).toBe(6.02);
});
test('slider derives populated points from suggest_product',()=> {
 expect(solarSizes(rows,'1 phase')).toEqual([5,15]);
 expect(solarSizes(rows,'3 phase')).toEqual([25,30]);
});

test('15 three-phase without battery returns the exact two products, including Hybrid 2 Unit', () => {
 const products = [
  {id:0,product:'SigenStor NEO 15.0 TP',type:'neo',bat_caculated:0},
  {id:2,product:'Sigen Hybrid 10.0 TP2 2 Unit',type:'hybrid',bat:'BAT 10.0 (9.04kWh)',bat_caculated:0},
 ];
 const catalog = [{id:18,phase:'3 phase',point:15,product:products}];
 expect(matchProducts(catalog,{point:15,phase:'3 phase',bat:0}).map(({matchKey,...p}) => p)).toEqual(products);
 expect(solarSizes(catalog,'3 phase')).toEqual([15]);
});
test('multi-unit battery metadata remains unchanged', () => {
 const hybrid = {product:'Sigen Hybrid 10.0 TP2 2 Unit',type:'hybrid',bat:'BAT 10.0 (9.04kWh)',bat_caculated:9.04};
 expect(matchProducts([{id:6,phase:'3 phase',point:15,product:[hybrid]}],{point:15,phase:'3 phase',bat:20})[0]).toMatchObject(hybrid);
});
