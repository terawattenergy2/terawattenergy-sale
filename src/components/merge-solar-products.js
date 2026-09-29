const normalizeName = (value) => String(value ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();

// Match only by product name; never borrow another model's picture or details.
export function mergeSolarProducts(recommendations, answer, priceList = []) {
  return recommendations.map((recommendation) => {
    const name = normalizeName(recommendation.product);
    const candidates = answer.filter((item) => name && normalizeName(item.ans_product) === name);
    const score = (item) => [item.img_product, item.detail_product, item.sub_detail_product].filter(Boolean).length;
    const detail = candidates.reduce((best, item) => !best || score(item) > score(best) ? item : best, null);
    const price = priceList.find((item) => normalizeName(item.product) === name);
    return {
      ...(detail || {}),
      ans_product: recommendation.product,
      price: price?.price ?? null,
      solarRecommendation: recommendation,
      batteryCount: recommendation.batteryCount,
      selectedBatteryKWh: recommendation.selectedBatteryKWh,
      missingCatalogDetails: !detail,
    };
  });
}
