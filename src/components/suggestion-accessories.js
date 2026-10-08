export function suggestionAccessories(product, battery, prices = []) {
  const name = String(product?.ans_product || "");
  const hybrid = /hybrid/i.test(`${name} ${product?.short || ""}`);
  const phase = String(product?.solarRecommendation?.phase || product?.phase || name);
  const three = /(?:3|three)\s*phase|\bTP\d*\b/i.test(phase);
  const sensor = prices.find(p => String(p.id) === (three ? "38" : "37"));
  const kit = prices.find(p => String(p.id) === (/neo/i.test(name) ? "54" : "52"));
  const bc = prices.find(p => String(p.id) === "60");
  return [
    { label: "Meter Sigen Power Sensor", product: sensor?.product || `Sigen Sensor ${three ? "TP" : "SP"}-CT100`, price: sensor?.price },
    ...(!hybrid ? [{ label: "SigenStor Installation Kits", product: kit?.product || (/neo/i.test(name) ? "NEO Ground-Mounted" : "SigenStor Ground-Mounted"), price: kit?.price }] : []),
    ...(hybrid && battery?.count > 0 ? [{ label: "SigenStor BC", description: "Battery Controller", product: bc?.product || "SigenStor BC", price: bc?.price }] : []),
  ];
}
