// Recommendation only. The existing chart, battery and billing engine is unchanged.
export function recommendSolarSize(c) {
  const monthly = c.monthlyKWh === null ? (c.bill - c.fixed) / c.rate : c.monthlyKWh;
  const daily = monthly / c.days;
  const hours = c.dayEnd - c.dayStart;
  if (!Number.isFinite(daily) || daily < 0 || !(hours > 0 && hours < 24)) {
    throw new Error("กรุณาตรวจสอบข้อมูลสำหรับแนะนำ Solar");
  }
  const dayLoad = daily * c.daytimeShare / hours;
  const nightLoad = daily * (1 - c.daytimeShare) / (24 - hours);
  let recommended = 0.5;
  let meetsTarget = false;
  let recommendedRatio = null;
  // One-minute midpoint integration, 06:00–18:00; 0.5 kWp increments.
  for (let half = 1; half <= 60; half++) {
    const k = half / 2;
    let production = 0, surplus = 0;
    for (let minute = 360; minute < 1080; minute++) {
      const t = (minute + 0.5) / 60;
      const pv = 0.8 * k * Math.sin(Math.PI * (t - 6) / 12) ** 2;
      const load = t >= c.dayStart && t < c.dayEnd ? dayLoad : nightLoad;
      production += pv / 60;
      surplus += Math.max(pv - load, 0) / 60;
    }
    const ratio = production > 0 ? surplus / production : 0;
    if (ratio > 0.2 + 1e-12) break;
    recommended = k;
    recommendedRatio = ratio;
    meetsTarget = true;
  }
  return { solarKWp: recommended, meetsTarget, surplusRatio: recommendedRatio };
}
