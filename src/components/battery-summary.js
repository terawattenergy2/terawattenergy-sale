const nameKey = (v) => String(v ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
export const priceNumber = (v) => {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : null;
};
export function getBatterySummary(product, prices = [], catalog = []) {
  if (product?.batteryPlan) {
    const plan = product.batteryPlan;
    const items = plan.items.map(item => {
      const detail = catalog.find(row => nameKey(row.ans_product) === nameKey(item.name));
      return { ...item, image: detail?.img_product || null,
        detail: detail?.detail_product || "", subDetail: detail?.sub_detail_product || "" };
    });
    return { ...plan, items, notice: product.batteryNotice || "", name: items.map(i => `${i.name} × ${i.count} ก้อน`).join(" + "),
      capacity: null, unitPrice: null, image: null, detail: "", subDetail: "" };
  }
  const selected = product?.solarRecommendation;
  if (!selected) return null;
  const count = Number(product.batteryCount);
  const name = String(selected.bat || "").trim();
  if (product.selectedBatteryKWh === 0 || count === 0) return { count: 0, name: "ไม่ติดแบต", totalPrice: 0 };
  if (!Number.isInteger(count) || count < 1) return null;
  const priceRow = prices.find((row) => name && nameKey(row.product) === nameKey(name));
  const detail = catalog.find((row) => name && nameKey(row.ans_product) === nameKey(name));
  const unitPrice = priceNumber(priceRow?.price);
  const capacity = priceNumber(selected.bat_caculated);
  return { notice: product.batteryNotice || "", name: name || "ยังไม่ระบุรุ่นแบต", count, unitPrice,
    totalPrice: unitPrice === null ? null : unitPrice * count,
    capacity, totalCapacity: capacity === null ? null : capacity * count,
    image: detail?.img_product || null,
    detail: detail?.detail_product || "", subDetail: detail?.sub_detail_product || "",
  };
}
export const money = (value) => value === null || value === undefined ? "ยังไม่มีราคา" : Number(value).toLocaleString("th-TH", {maximumFractionDigits: 2}) + " บาท";
