export function simulate(options = {}) {
  const c = Object.assign(
    {
      solarKWp: 9,
      bill: 7000,
      rate: 4.5,
      fixed: 0,
      monthlyKWh: null,
      days: 30,
      daytimeShare: 0.2,
      dayStart: 6,
      dayEnd: 18,
      phases: 1,
      yieldPerKWp: 4,
      batteryKWh: 0,
      chargeKW: 5,
      dischargeKW: 5,
      minSOC: 0,
      maxSOC: 0.99,
      chargeEfficiency: 0.99,
      dischargeEfficiency: 0.99,
      exportAllowed: true,
      exportRate: 2.2,
    },
    options,
  );
  for (const k of [
    "solarKWp",
    "bill",
    "fixed",
    "yieldPerKWp",
    "batteryKWh",
    "chargeKW",
    "dischargeKW",
    "exportRate",
  ]) {
    if (!Number.isFinite(c[k]) || c[k] < 0) throw new Error("Invalid " + k);
  }
  if (
    !(c.rate > 0) ||
    !Number.isInteger(c.days) ||
    c.days < 1 ||
    c.days > 366 ||
    !(c.daytimeShare >= 0 && c.daytimeShare <= 1) ||
    !(c.minSOC >= 0 && c.minSOC <= c.maxSOC && c.maxSOC <= 1) ||
    !(c.chargeEfficiency > 0 && c.chargeEfficiency <= 1) ||
    !(c.dischargeEfficiency > 0 && c.dischargeEfficiency <= 1)
  )
    throw new Error("Invalid model settings");
  if (![1, 3].includes(c.phases)) throw new Error("จำนวนเฟสต้องเป็น 1 หรือ 3");
  if (
    !Number.isFinite(c.dayStart) ||
    !Number.isFinite(c.dayEnd) ||
    c.dayStart < 0 ||
    c.dayEnd > 24 ||
    c.dayEnd <= c.dayStart ||
    c.dayEnd - c.dayStart >= 24 ||
    !Number.isInteger(c.dayStart * 4) ||
    !Number.isInteger(c.dayEnd * 4)
  )
    throw new Error(
      "ช่วงกลางวันต้องอยู่ในวันเดียวกัน สิ้นสุดหลังเริ่มต้น ยาวน้อยกว่า 24 ชั่วโมง และเลือกทุก 15 นาที",
    );
  if (
    c.monthlyKWh !== null &&
    (!Number.isFinite(c.monthlyKWh) || c.monthlyKWh < 0)
  )
    throw new Error("Invalid monthlyKWh");
  if (c.monthlyKWh === null && c.bill < c.fixed)
    throw new Error("ยอดบิลต้องไม่น้อยกว่าค่าคงที่");
  const dt = 0.25,
    steps = 96;
  const monthlyKWh =
    c.monthlyKWh === null ? (c.bill - c.fixed) / c.rate : c.monthlyKWh;
  const dailyKWh = monthlyKWh / c.days;
  const dayHours = c.dayEnd - c.dayStart,
    nightHours = 24 - dayHours;
  const shape = Array.from({ length: steps }, (_, i) => {
    const h = (i + 0.5) * dt;
    return h > 6 && h < 18 ? Math.sin((Math.PI * (h - 6)) / 12) ** 2 : 0;
  });
  const shapeArea = shape.reduce((a, b) => a + b, 0) * dt;
  const minEnergy = c.batteryKWh * c.minSOC,
    maxEnergy = c.batteryKWh * c.maxSOC;
  // Start at reserve: no free initial stored energy. Carry state across days.
  let energy = minEnergy;
  const totals = {
    load: 0,
    pv: 0,
    direct: 0,
    charge: 0,
    discharge: 0,
    grid: 0,
    export: 0,
    curtailed: 0,
    loss: 0,
  };
  const series = [];
  for (let day = 0; day < c.days; day++) {
    for (let i = 0; i < steps; i++) {
      const hour = i * dt,
        isDay = hour >= c.dayStart && hour < c.dayEnd;
      const load =
        dailyKWh *
        (isDay ? c.daytimeShare / dayHours : (1 - c.daytimeShare) / nightHours);
      const pv = (c.solarKWp * c.yieldPerKWp * shape[i]) / shapeArea;
      const direct = Math.min(load, pv),
        surplus = Math.max(pv - load, 0),
        deficit = Math.max(load - pv, 0);
      const charge = Math.min(
        surplus,
        c.chargeKW,
        Math.max(0, maxEnergy - energy) / (dt * c.chargeEfficiency),
      );
      const discharge = Math.min(
        deficit,
        c.dischargeKW,
        (Math.max(0, energy - minEnergy) * c.dischargeEfficiency) / dt,
      );
      energy +=
        charge * dt * c.chargeEfficiency -
        (discharge * dt) / c.dischargeEfficiency;
      const remaining = Math.max(0, surplus - charge);
      const row = {
        day: day + 1,
        hour,
        load,
        pv,
        direct,
        charge,
        discharge,
        grid: Math.max(0, deficit - discharge),
        export: c.exportAllowed ? remaining : 0,
        curtailed: c.exportAllowed ? 0 : remaining,
        loss:
          charge * (1 - c.chargeEfficiency) +
          discharge * (1 / c.dischargeEfficiency - 1),
        energy,
        soc: c.batteryKWh ? (energy / c.batteryKWh) * 100 : 0,
      };
      for (const key of Object.keys(totals)) totals[key] += row[key] * dt;
      series.push(row);
    }
  }
  const cents = (n) => Math.round(n * 100) / 100;
  const baselineBill = cents(monthlyKWh * c.rate + c.fixed);
  const newBill = cents(totals.grid * c.rate + c.fixed);
  const savings = cents(baselineBill - newBill),
    exportRevenue = cents(totals.export * c.exportRate);
  return {
    config: c,
    dt,
    monthlyKWh,
    series,
    totals,
    baselineBill,
    newBill,
    savings,
    exportRevenue,
    totalBenefit: savings + exportRevenue,
    storedChange: energy - minEnergy,
  };
}
// Size nominal capacity for one day's entire surplus, starting at minimum SOC.
// Power limits and energy carried from previous days still apply in simulate().
export function sizeBatteryFromSurplus(options = {}) {
  const base = simulate(Object.assign({}, options, { batteryKWh: 0 }));
  const c = base.config,
    usableFraction = c.maxSOC - c.minSOC;
  if (usableFraction <= 0)
    throw new Error("โหมดแบตอัตโนมัติต้องตั้งระดับสูงสุดมากกว่าระดับขั้นต่ำ");
  const daily = base.series.filter((row) => row.day === 1);
  const surplusKWh = daily.reduce(
    (sum, row) => sum + Math.max(0, row.pv - row.load) * base.dt,
    0,
  );
  const requiredChargeKW = Math.max(
    ...daily.map((row) => Math.max(0, row.pv - row.load)),
  );
  const powerLimitedKWh = daily.reduce(
    (sum, row) => sum + Math.max(0, row.pv - row.load - c.chargeKW) * base.dt,
    0,
  );
  const nominal = (surplusKWh * c.chargeEfficiency) / usableFraction;
  return {
    batteryKWh: Math.ceil(Math.max(0, nominal - 1e-10) * 10) / 10,
    surplusKWh,
    requiredChargeKW,
    powerLimitedKWh,
    usableFraction,
  };
}