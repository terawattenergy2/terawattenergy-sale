import { sortSuggestionProducts } from "./suggestion-order";
test("SigenStor comes first and NEO last regardless of input order", () => {
  const neo = {ans_product:"SigenStor NEO 12.0 SP"};
  const hybrid = {ans_product:"Sigen Hybrid 5.0 SP2 2 Unit"};
  const stor = {ans_product:"SigenStor EC 10.0 SP"};
  for (const input of [[neo,stor,hybrid],[hybrid,neo,stor],[stor,hybrid,neo]]) {
    const original = [...input];
    expect(sortSuggestionProducts(input)).toEqual([stor,hybrid,neo]);
    expect(input).toEqual(original);
  }
});
test("ordering preserves every result and the order within each family", () => {
  const first = {short:"stor",ans_product:"EC A"};
  const second = {solarRecommendation:{type:"stor"},ans_product:"EC B"};
  const neo = {short:"neo"};
  expect(sortSuggestionProducts([neo,first,second])).toEqual([first,second,neo]);
  expect(sortSuggestionProducts([neo])).toEqual([neo]);
});

test("NEO remains last even when other inverter families are present", () => {
  const neo = {short:"neo"};
  const micro = {short:"micro"};
  const hybrid = {short:"hybrid"};
  expect(sortSuggestionProducts([neo,micro,hybrid])).toEqual([hybrid,micro,neo]);
});
