import { suggestionAccessories } from "./suggestion-accessories";
const prices = [{id:37,product:"SP-100",price:2500},{id:38,product:"TP-100",price:4900},{id:52,product:"Ground",price:4900},{id:54,product:"NEO Ground",price:2800},{id:60,product:"SigenStor BC",price:11200}];
test("Hybrid battery requires BC and never an installation kit", () => {
  const items = suggestionAccessories({ans_product:"Sigen Hybrid 5.0 SP2"}, {count:3}, prices);
  expect(items.map(i => i.product)).toEqual(["SP-100", "SigenStor BC"]);
  expect(suggestionAccessories({ans_product:"Sigen Hybrid 10.0 TP2"}, {count:0}, prices).map(i=>i.product)).toEqual(["TP-100"]);
});
test("every non-Hybrid family receives a phase sensor and ground kit", () => {
  expect(suggestionAccessories({ans_product:"SigenStor EC 10.0 TP"}, {count:2}, prices).map(i=>i.product)).toEqual(["TP-100","Ground"]);
  expect(suggestionAccessories({ans_product:"SigenStor NEO 12.0 SP"}, {count:2}, prices).map(i=>i.product)).toEqual(["SP-100","NEO Ground"]);
  expect(suggestionAccessories({ans_product:"SigenMicro",phase:"3 Phase"}, {count:0}, prices).map(i=>i.product)).toEqual(["TP-100","Ground"]);
});

