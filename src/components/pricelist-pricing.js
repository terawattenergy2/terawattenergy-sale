const productKey = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

export function parsePrice(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

// Match only a complete product name; missing rows must not become zero prices.
export function priceListTotal(priceList, items) {
  if (!Array.isArray(priceList) || !Array.isArray(items) || !items.length)
    return null;
  let total = 0;
  for (const item of items) {
    const quantity = parsePrice(item.quantity ?? 1);
    if (quantity === null || quantity < 0) return null;
    if (quantity === 0) continue;
    const key = productKey(item.product);
    if (!key) return null;
    const matches = priceList.filter((row) => productKey(row.product) === key);
    if (matches.length !== 1) return null;
    const price = parsePrice(matches[0].price);
    if (price === null || price < 0) return null;
    total += price * quantity;
  }
  return total;
}
