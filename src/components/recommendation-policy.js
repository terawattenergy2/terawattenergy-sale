import { inverterUnitCount } from "./neo-battery-options";
const key = (v) =>
  String(v ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
const cost = (p) => {
  const value = p.batteryPlan?.totalPrice ?? p.price;
  if (value == null || String(value).trim() === "") return Infinity;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : Infinity;
};
const invalid = (p) =>
  Boolean(
    p.batterySelectionError || p.neoBatteryError || p.missingCatalogDetails,
  );
export function finalizeRecommendations(products) {
  const unique = new Map();
  for (const original of products) {
    let product = original;
    if (product.solarRecommendation || product.batteryPlan) {
      const units = inverterUnitCount(product);
      const counts = product.batteryPlan?.items?.map((item) =>
        Number(item.count),
      );
      const total = counts
        ? counts.reduce((a, b) => a + b, 0)
        : Number(product.batteryCount);
      const noBattery = Number(product.selectedBatteryKWh) === 0;
      const allocations = product.batteryPlan?.allocations;
      const invalidAllocations =
        allocations &&
        (allocations.length !== units ||
          allocations.some((a) => {
            const count = Number(a.count);
            const sum = a.items?.reduce((n, item) => n + Number(item.count), 0);
            return (
              !Number.isInteger(count) ||
              count < 0 ||
              count > 6 ||
              sum !== count
            );
          }) ||
          allocations.reduce((n, a) => n + Number(a.count), 0) !== total);
      if (
        !noBattery &&
        (!Number.isInteger(total) ||
          total < 1 ||
          total > 6 * units ||
          counts?.some((n) => !Number.isInteger(n) || n < 1) ||
          invalidAllocations)
      ) {
        product = {
          ...product,
          batterySelectionError:
            "ชุดแบตไม่ถูกต้องหรือเกิน 6 ก้อนต่ออินเวอร์เตอร์ กรุณาเปลี่ยนความจุแบต",
        };
      }
    }
    // Preserve "2 Unit": a two-inverter system is a different configuration.
    const name = key(product.ans_product ?? product.product);
    const id =
      name ||
      "unnamed:" + String(product.matchKey ?? product.row_id ?? unique.size);
    const previous = unique.get(id);
    if (
      !previous ||
      (invalid(previous) && !invalid(product)) ||
      (invalid(previous) === invalid(product) && cost(product) < cost(previous))
    )
      unique.set(id, product);
  }
  return [...unique.values()];
}
