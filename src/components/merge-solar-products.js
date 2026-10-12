const normalizeName = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s+2\s+Unit$/i, "")
    .trim()
    .toLowerCase();
// The recommended models come exclusively from suggest_product.
// answer and priceList enrich these models; they never add or remove models.
export function mergeSolarProducts(recommendations, answer, priceList = []) {
  return recommendations.map((recommendation) => {
    const name = normalizeName(recommendation.product);
    const candidates = answer.filter(
      (item) => name && normalizeName(item.ans_product) === name,
    );
    const score = (item) =>
      [item.img_product, item.detail_product, item.sub_detail_product].filter(
        Boolean,
      ).length;
    const detail = candidates.reduce(
      (best, item) => (!best || score(item) > score(best) ? item : best),
      null,
    );
    const price = priceList.find(
      (item) => name && normalizeName(item.product) === name,
    );
    const capacity =
      recommendation.bat_caculated ?? recommendation.bat_calculated;
    const inverterCount = Number(
      String(recommendation.product ?? "").match(
        /\b(\d+)\s+Units?\s*$/i,
      )?.[1] ?? 1,
    );
    const rawPrice = price?.price;
    const parsedPrice =
      rawPrice == null || String(rawPrice).trim() === ""
        ? null
        : Number(String(rawPrice).replace(/,/g, ""));
    const unitPrice =
      Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : null;
    return {
      ...(detail || {}),
      ans_product: recommendation.product,
      price: unitPrice === null ? null : unitPrice * inverterCount,
      inverterUnitPrice: unitPrice,
      inverterCount,
      solarRecommendation: {
        ...recommendation,
        bat_caculated: capacity,
        type: /neo/i.test(recommendation.product) ? "neo" : recommendation.type,
      },
      batteryCount: recommendation.batteryCount,
      selectedBatteryKWh: recommendation.selectedBatteryKWh,
      missingCatalogDetails: !detail,
    };
  });
}
