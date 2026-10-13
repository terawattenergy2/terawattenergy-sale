import { mergeSolarProducts } from './merge-solar-products';

test('multi-unit inverter uses base catalog details and multiplies the unit price', () => {
  const result = mergeSolarProducts(
    [{ product: 'SigenStor EC 5.0 SP 3 Unit', bat_caculated: 0 }],
    [{ ans_product: 'SigenStor EC 5.0 SP', img_product: 'inverter.png', detail_product: 'details' }],
    [{ product: 'SigenStor EC 5.0 SP', price: 100 }],
  );
  expect(result[0]).toMatchObject({
    ans_product: 'SigenStor EC 5.0 SP 3 Unit',
    img_product: 'inverter.png', detail_product: 'details',
    missingCatalogDetails: false, inverterCount: 3, price: 300,
  });
});
