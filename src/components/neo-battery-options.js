const key = v => String(v ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
const number = v => {
  if (v == null || String(v).trim() === '') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : null;
};
export function isNeoProduct(product) {
  return /neo/i.test(String(product.ans_product ?? product.product ?? "")) ||
    key(product.solarRecommendation?.type ?? product.type) === "neo";
}
export function inverterUnitCount(product) {
  const match = String(product.ans_product ?? '').match(/\b(\d+)\s+Units?\s*$/i);
  return match ? Math.max(1, Number(match[1])) : 1;
}
const modelKey = value => key(value).replace(/\([^)]*\)/g, '').replace(/[\s._-]+/g, '');
const batteryCapacity = row => {
  const explicit = number(row.bat_caculated ?? row.bat_calculated ?? row.capacity ?? row.capacityKWh);
  if ([6.02, 7.53].includes(explicit)) return explicit;
  const name = String(row.bat ?? row.product ?? row.ans_product ?? '');
  const match = name.match(/(\d+(?:\.\d+)?)\s*kWh/i);
  const parsed = match ? Number(match[1]) : null;
  return [6.02, 7.53].includes(parsed) ? parsed : null;
};
export function optimizeNeoProducts(products, prices = [], selectedBatteryKWh, catalog = []) {
  const options = [];
  const batteryRows = [
    ...catalog,
    ...products.map(p => p.solarRecommendation).filter(Boolean),
  ];
  for (const row of prices) {
    const priceName = String(row.product ?? '').trim();
    const details = batteryRows.find(item => {
      const name = item.bat ?? item.ans_product ?? item.product;
      return modelKey(name) === modelKey(priceName) && batteryCapacity(item) !== null;
    });
    const capacity = batteryCapacity(row) ?? (details ? batteryCapacity(details) : null);
    const price = number(row.price);
    if (!/bat|battery|แบต/i.test(priceName) || capacity === null || price === null) continue;
    const name = priceName;
    // One priced catalog option per capacity; do not count duplicate price rows as extra models.
    const previous = options.find(o => o.capacity === capacity);
    if (!previous) options.push({ name, capacity, unitPrice: price });
    else if (price < previous.unitPrice) Object.assign(previous, { name, unitPrice: price });
  }
  return products.map(product => {
    if (!isNeoProduct(product)) return product;
    const target = number(selectedBatteryKWh ?? product.selectedBatteryKWh);
    if (target === 0) return { ...product, selectedBatteryKWh: 0, batteryCount: 0,
      batteryPlan: { items: [], count: 0, totalCapacity: 0, totalPrice: 0 },
      neoBatteryError: null, batterySelectionError: null };
    const fail = message => ({ ...product, batteryPlan: null, neoBatteryError: message });
    if (target === null) return fail('ไม่พบความจุแบตที่เลือกจริง จึงยังเลือกชุดแบตไม่ได้');
    if (!options.length) return fail('ไม่พบราคาแบต NEO 6.02 หรือ 7.53 kWh ในตารางราคา');
    const units = inverterUnitCount(product);
    let best = null;
    // Generate each inverter's stack separately: no stack can exceed six packs.
    const stacks = [];
    function stack(index, counts, count, capacity, price) {
      if (index === options.length) {
        stacks.push({ counts: [...counts], count, capacity, price });
        return;
      }
      const option = options[index];
      for (let n = 0; n <= 6 - count; n++) {
        counts[index] = n;
        stack(index + 1, counts, count + n, capacity + n * option.capacity, price + n * option.unitPrice);
      }
    }
    stack(0, [], 0, 0, 0);
    // Identical inverters need only unique aggregate capacity/count combinations.
    let states = new Map([['0', { counts: options.map(() => 0), count: 0, capacity: 0, price: 0, allocations: [] }]]);
    for (let unit = 0; unit < units; unit++) {
      const next = new Map();
      for (const state of states.values()) for (const s of stacks) {
        const counts = state.counts.map((n, i) => n + s.counts[i]);
        const id = counts.join(',');
        if (!next.has(id)) next.set(id, { counts, count: state.count + s.count,
          capacity: state.capacity + s.capacity, price: state.price + s.price,
          allocations: [...state.allocations, { inverter: unit + 1, count: s.count,
            items: options.flatMap((o, i) => s.counts[i] ? [{ ...o, count: s.counts[i] }] : []) }] });
      }
      states = next;
    }
    for (const state of states.values()) {
      if (state.count < 1) continue;
      const distance = Math.abs(state.capacity - target);
      const bestDistance = best ? Math.abs(best.capacity - target) : Infinity;
      if (!best || distance < bestDistance - 1e-8 ||
        (Math.abs(distance - bestDistance) < 1e-8 && (state.price < best.price - 1e-8 ||
          (Math.abs(state.price - best.price) < 1e-8 && state.count < best.count)))) best = state;
    }
    if (!best) return fail('ยังจัดชุดแบต NEO ภายใต้ข้อจำกัด 6 ก้อนต่ออินเวอร์เตอร์ไม่ได้');
    const items = options.flatMap((o, i) => best.counts[i] ? [{ ...o, count: best.counts[i], totalPrice: o.unitPrice * best.counts[i] }] : []);
    return { ...product, selectedBatteryKWh: target, batteryCount: best.count,
      batteryPlan: { items, count: best.count, totalCapacity: Number(best.capacity.toFixed(2)),
        totalPrice: Number(best.price.toFixed(2)), allocations: best.allocations },
      batteryNotice: best.capacity + 1e-8 < target ? "ความจุชุดที่ใกล้ที่สุดต่ำกว่าที่เลือก " + (target - best.capacity).toFixed(2) + " kWh" : "",
      neoBatteryError: null, batterySelectionError: null };
  });
}
