export function calculateBatteryCount(selectedKWh, capacityPerBattery) {
  if (!Number.isFinite(selectedKWh) || selectedKWh < 0) return null;
  if (selectedKWh === 0) return 0;
  if (
    capacityPerBattery === null ||
    capacityPerBattery === undefined ||
    capacityPerBattery === ""
  )
    return null;
  const capacity = Number(capacityPerBattery);
  if (!Number.isFinite(capacity) || capacity <= 0) return null;
  return Math.ceil(selectedKWh / capacity);
}

export function inverterModel(name) {
  const match = String(name || '').trim().match(/^(SigenStor\s+(?:EC|NEO)|Sigen\s+Hybrid)\s+(\d+(?:\.\d+)?)\s+(SP2?|TP2?)$/i);
  return match ? { size: +match[2], phase: match[3].toUpperCase().startsWith('SP') ? '1 phase' : '3 phase' } : null;
}
export function solarSizes(rows = [], phase) {
  const points = rows.filter(row => (!phase || row.phase === phase) && Array.isArray(row.product) && row.product.some(p => typeof p?.product === "string" && p.product.trim()))
    .map(row => Number(row.point)).filter(point => point > 0 && Number.isFinite(point));
  const available = rows.length ? points : [5,10,15,20,25];
  return [...new Set([...available, ...(phase !== '1 phase' && available.includes(25) ? [30] : [])])].sort((a,b) => a-b);
}
export function matchProducts(rows, result, { filterProducts = products => products } = {}) {
  const target = result.point === 30 ? 25 : result.point;
  const points = [...new Set(rows.filter(row => row.phase === result.phase).map(row => Number(row.point)).filter(point => point > 0 && Number.isFinite(point)))]
    .sort((a,b) => Math.abs(a-target)-Math.abs(b-target) || b-a);
  for (const point of points) {
    const candidates = [];
    for (const row of rows) {
      if (row.phase !== result.phase || Number(row.point) !== point || !Array.isArray(row.product)) continue;
      for (const product of row.product) {
        if (typeof product?.product !== "string" || !product.product.trim()) continue;
        const capacity = Number(product.bat_caculated);
        if (product.bat_caculated == null || !Number.isFinite(capacity) || capacity < 0 || (result.bat > 0 ? capacity <= 0 : capacity !== 0)) continue;
        if (result.point === 30 && !/^SigenStor\s+EC\s+25(?:\.0)?\s+TP$/i.test(product.product.trim())) continue;
        candidates.push({...product, matchKey: `${row.id}-${product.product.trim()}-${capacity}`});
      }
    }
    const matches = filterProducts(candidates);
    if (matches.length) return matches;
  }
  return [];
}

export async function findInverters(result, { signal, filterProducts } = {}) {
  const projectUrl = process.env.REACT_APP_SUPABASE_URL;
  const apiKey =
    process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY ||
    process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!projectUrl || !apiKey)
    throw new Error(
      "กรุณาตั้งค่า Supabase URL และ publishable key ใน .env แล้วเริ่มแอปใหม่",
    );
  if (
    !Number.isFinite(result.point) ||
    !Number.isFinite(result.bat) ||
    !["1 phase", "3 phase"].includes(result.phase)
  )
    throw new Error("ค่าที่ใช้ค้นหาไม่ถูกต้อง");
  const rows = [];
  // Pagination avoids silently omitting matching rows beyond the API row limit.
  for (let offset = 0; ; ) {
    const url = new URL(
      `${projectUrl.replace(/\/$/, "")}/rest/v1/suggest_product`,
    );
    url.search = new URLSearchParams({
      select: "id,phase,point,product",
      phase: `eq.${result.phase}`,
      order: "id.asc",
      offset: String(offset),
      limit: "100",
    }).toString();
    const response = await fetch(url, { headers: { apikey: apiKey }, signal });
    if (!response.ok)
      throw new Error(
        `ค้นหาไม่สำเร็จ (${response.status}) กรุณาตรวจการเชื่อมต่อและสิทธิ์ SELECT ของ suggest_product`,
      );
    const page = await response.json();
    if (!Array.isArray(page))
      throw new Error("รูปแบบข้อมูลจาก Supabase ไม่ถูกต้อง");
    if (!page.length) break;
    rows.push(...page);
    offset += page.length;
  }
  return matchProducts(rows, result, { filterProducts });
}
