// Preserve catalog order within a family without mutating the source list.
export function sortSuggestionProducts(products) {
  const priority = (item) => {
    const name = String(item?.ans_product || item?.product || "");
    const type = String(item?.solarRecommendation?.type || item?.short || "").toLowerCase();
    if (/\bneo\b/i.test(name) || type === "neo") return 3;
    if (/hybrid/i.test(name) || type === "hybrid") return 1;
    if (/sigenstor/i.test(name) || ["stor", "sigenstor", "ec"].includes(type)) return 0;
    return 2;
  };
  return [...products].sort((a, b) => priority(a) - priority(b));
}
