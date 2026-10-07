import { priceNumber } from "./battery-summary";
export const MAX_BATTERY_MODULES = 6;
const key = v => String(v ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();

// Prefer the cheapest set within ±0.5 kWh; otherwise use the nearest capacity.
export function cheapestBatteryMix(target, modules) {
  if (!Number.isFinite(target) || target <= 0 || !modules.length) return null;
  const low = Math.ceil((target - 0.5) * 100 - 1e-7);
  const high = Math.floor((target + 0.5) * 100 + 1e-7);
  if (modules.some(m => !(m.capacity > 0) || !Number.isFinite(m.unitPrice) || m.unitPrice < 0)) return null;
  const minCapacity = Math.min(...modules.map(m => Math.round(m.capacity * 100)));
  if (target * 100 < minCapacity - 1e-7) {
    const smallest = modules.filter(m => Math.round(m.capacity * 100) === minCapacity)
      .sort((a, b) => a.unitPrice - b.unitPrice)[0];
    return { count: 1, totalCapacity: minCapacity / 100,
      totalPrice: smallest.unitPrice, minimumFallback: true,
      excess: Number((minCapacity / 100 - target).toFixed(2)),
      items: [{ ...smallest, count: 1, totalPrice: smallest.unitPrice }] };
  }
  const maxCapacity = Math.max(...modules.map(m => Math.round(m.capacity * 100))) * MAX_BATTERY_MODULES;
  if (target * 100 > maxCapacity + 1e-7) {
    const largest = modules.filter(m => Math.round(m.capacity * 100) * MAX_BATTERY_MODULES === maxCapacity)
      .sort((a, b) => a.unitPrice - b.unitPrice)[0];
    return { count: MAX_BATTERY_MODULES, totalCapacity: maxCapacity / 100,
      totalPrice: Math.round(largest.unitPrice * 100) * MAX_BATTERY_MODULES / 100,
      capped: true, shortfall: Number((target - maxCapacity / 100).toFixed(2)),
      items: [{ ...largest, count: MAX_BATTERY_MODULES, totalPrice: largest.unitPrice * MAX_BATTERY_MODULES }] };
  }
  let best = null;
  let nearest = null;
  function visit(i, capacity, cents, counts, count) {
    if (i === modules.length) {
      if (!count) return;
      const distance = Math.abs(capacity - target * 100);
      const candidate = {
        cents, distance, count, totalCapacity: capacity / 100, totalPrice: cents / 100,
        items: modules.flatMap((m, j) => counts[j] ? [{
          ...m, count: counts[j],
          totalPrice: counts[j] * Math.round(m.unitPrice * 100) / 100,
        }] : []),
      };
      if (!nearest || distance < nearest.distance - 1e-7 ||
          (Math.abs(distance - nearest.distance) < 1e-7 &&
           (cents < nearest.cents || (cents === nearest.cents && count < nearest.count)))) {
        nearest = candidate;
      }
      if (capacity < low || capacity > high) return;
      if (!best || cents < best.cents || (cents === best.cents && (distance < best.distance || (distance === best.distance && count < best.count)))) {
        best = { cents, distance, count, totalCapacity: capacity / 100,
          totalPrice: cents / 100,
          items: modules.flatMap((m, j) => counts[j] ? [{ ...m, count: counts[j], totalPrice: counts[j] * m.unitPrice }] : []) };
      }
      return;
    }
    const size = Math.round(modules[i].capacity * 100);
    for (let n = 0; n <= MAX_BATTERY_MODULES - count; n++) {
      visit(i + 1, capacity + n * size, cents + n * Math.round(modules[i].unitPrice * 100), [...counts, n], count + n);
    }
  }
  visit(0, 0, 0, [], 0);
  return best || (nearest ? {
    ...nearest, nearestFallback: true,
    capacityDifference: Number((nearest.totalCapacity - target).toFixed(2)),
  } : null);
}

export function optimizeNeoProducts(products, prices = []) {
  const seen = new Set();
  return products.flatMap(product => {
    if (Number(product.selectedBatteryKWh) === 0) return [{
      ...product, batteryCount: 0, batteryPlan: null, batteryNotice: "",
      batterySelectionError: null, neoBatteryError: null,
    }];
    if (!(product.selectedBatteryKWh > 0)) return [product];
    if (!/\bneo\b/i.test(product.ans_product)) {
      const capacity = priceNumber(product.solarRecommendation?.bat_caculated);
      const count = capacity > 0 ? Math.ceil(Number(product.selectedBatteryKWh) / capacity - 1e-9) : null;
      if (!Number.isInteger(count) || count < 1) {
        return [{ ...product, batteryCount: null, batteryPlan: null,
          batterySelectionError: count > MAX_BATTERY_MODULES
            ? `รุ่นนี้ติดแบตได้สูงสุด 6 ก้อน (${Number((capacity * MAX_BATTERY_MODULES).toFixed(2))} kWh) กรุณาลดความจุแบตที่เลือก`
            : "ไม่มีข้อมูลความจุแบตสำหรับคำนวณจำนวนก้อน" }];
      }
      const capped = count > MAX_BATTERY_MODULES;
      return [{ ...product, batteryCount: Math.min(count, MAX_BATTERY_MODULES),
        batteryNotice: capped ? `ติดได้สูงสุด ${Number((capacity * MAX_BATTERY_MODULES).toFixed(2))} kWh (6 ก้อน) · ต่ำกว่าเป้าหมาย ${Number((Number(product.selectedBatteryKWh) - capacity * MAX_BATTERY_MODULES).toFixed(2))} kWh` : Number(product.selectedBatteryKWh) < capacity ? `เลือกแบตก้อนเล็กสุด ${capacity} kWh · มากกว่าเป้าหมาย ${Number((capacity - Number(product.selectedBatteryKWh)).toFixed(2))} kWh` : "" }];
    }
    const model = key(product.ans_product);
    if (seen.has(model)) return [];
    seen.add(model);
    const variants = products.filter(p => key(p.ans_product) === model);
    const modules = [];
    for (const variant of variants) {
      const r = variant.solarRecommendation;
      const capacity = priceNumber(r?.bat_caculated);
      // Only BAT 6.0 and BAT 8.0 already associated with this NEO model.
      if (!/^bat\s+(6|8)\.0\b/i.test(String(r?.bat || "")) || !(capacity > 0)) continue;
      if (modules.some(m => key(m.name) === key(r.bat))) continue;
      const row = prices.find(p => key(p.product) === key(r.bat));
      modules.push({ name: r.bat, capacity, unitPrice: priceNumber(row?.price) });
    }
    const plan = cheapestBatteryMix(Number(product.selectedBatteryKWh), modules);
    if (!plan) return [{ ...product, batteryCount: null, batteryPlan: null,
      batterySelectionError: modules.some(m => m.unitPrice === null)
        ? "ข้อมูลราคาแบต NEO ยังไม่ครบ จึงยังเลือกชุดที่คุ้มที่สุดไม่ได้"
        : "ยังไม่มีข้อมูลรุ่นแบต NEO ที่รองรับสำหรับคำนวณ" }];
    return [{ ...product, batterySelectionError: null, neoBatteryError: null, batteryCount: plan.count, batteryPlan: plan, batteryNotice: plan.capped ? `ติดได้สูงสุด ${plan.totalCapacity} kWh (6 ก้อน) · ต่ำกว่าเป้าหมาย ${plan.shortfall} kWh` : plan.minimumFallback ? `เลือกแบตก้อนเล็กสุด ${plan.totalCapacity} kWh · มากกว่าเป้าหมาย ${plan.excess} kWh` : plan.nearestFallback ? `เลือกความจุใกล้ที่สุด ${plan.totalCapacity.toFixed(2)} kWh · ${plan.capacityDifference < 0 ? "ต่ำกว่า" : "มากกว่า"}เป้าหมาย ${Math.abs(plan.capacityDifference).toFixed(2)} kWh` : "" }];
  });
}
