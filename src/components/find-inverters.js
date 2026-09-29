export function calculateBatteryCount(selectedKWh, capacityPerBattery) {
  if (!Number.isFinite(selectedKWh) || selectedKWh < 0) return null;
  if (selectedKWh === 0) return 0;
  if (capacityPerBattery === null || capacityPerBattery === undefined || capacityPerBattery === "") return null;
  const capacity = Number(capacityPerBattery);
  if (!Number.isFinite(capacity) || capacity <= 0) return null;
  return Math.ceil(selectedKWh / capacity);
}

// Public catalog lookup via Supabase Data API (Create React App environment).
export function matchProducts(rows, result) {
  return rows.flatMap((row) => {
    if (row.phase !== result.phase || Number(row.point) !== result.point) return [];
    if (!Array.isArray(row.product)) return [];
    return row.product.flatMap((product, index) => {
      if (!product || typeof product.product !== "string") return [];
      // Spelling matches the database screenshot: bat_caculated.
      const capacity = product.bat_caculated;
      if (capacity === null || capacity === undefined || capacity === "" || !Number.isFinite(Number(capacity))) return [];
      // Capacity is per module, not the requested system capacity.
      if (result.bat > 0 ? Number(capacity) <= 0 : Number(capacity) !== 0) return [];
      return [{ ...product, matchKey: `${row.id}-${index}` }];
    });
  });
}

export async function findInverters(result, { signal } = {}) {
  const projectUrl = process.env.REACT_APP_SUPABASE_URL;
  const apiKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!projectUrl || !apiKey) throw new Error("กรุณาตั้งค่า Supabase URL และ publishable key ใน .env แล้วเริ่มแอปใหม่");
  if (!Number.isFinite(result.point) || !Number.isFinite(result.bat) || !["1 phase", "3 phase"].includes(result.phase)) throw new Error("ค่าที่ใช้ค้นหาไม่ถูกต้อง");
  const rows = [];
  // Pagination avoids silently omitting matching rows beyond the API row limit.
  for (let offset = 0; ; ) {
    const url = new URL(`${projectUrl.replace(/\/$/, "")}/rest/v1/suggest_product`);
    url.search = new URLSearchParams({ select: "id,phase,point,product", phase: `eq.${result.phase}`, point: `eq.${result.point}`, order: "id.asc", offset: String(offset), limit: "100" }).toString();
    const response = await fetch(url, { headers: { apikey: apiKey }, signal });
    if (!response.ok) throw new Error(`ค้นหาไม่สำเร็จ (${response.status}) กรุณาตรวจการเชื่อมต่อและสิทธิ์ SELECT ของ suggest_product`);
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error("รูปแบบข้อมูลจาก Supabase ไม่ถูกต้อง");
    if (!page.length) break;
    rows.push(...page);
    offset += page.length;
  }
  return matchProducts(rows, result);
}