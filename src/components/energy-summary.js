// สมมติฐานคำนวณตามสูตรที่กำหนด ใช้พลังงานแบตเตอรี่ 100%
const ENERGY_ASSUMPTIONS = {
  equivalentSunHours: 4,
  electricityRate: 4.5,
  batteryEnergyFraction: 1, // ใช้ความจุแบตเตอรี่รวม 100%
  airconPowerKw: 1,
};

export function calculateEnergySummary(options, isMicro) {
  const model = String(isMicro ? options.microSize || "" : options["1"] || "");
  // อ่านเลขกำลังเฉพาะรูปแบบชื่อรุ่นที่ใช้ในตัวเลือก ไม่อ่าน SP2 เป็นกำลังไฟ
  const powerMatch = isMicro
    ? model.match(/^(\d+(?:\.\d+)?)\s*kWh?\b/i)
    : model.match(/(?:Hybrid|EC|NEO)\s+(\d+(?:\.\d+)?)\s+(?:SP|TP)/i);

  const inverterKw = powerMatch ? Number(powerMatch[1]) : null;
  const production =
    inverterKw === null
      ? null
      : inverterKw * ENERGY_ASSUMPTIONS.equivalentSunHours;
  const capacityMatch = String(options["2"] || "").match(
    /\(\s*(\d+(?:\.\d+)?)\s*kWh\s*\)/i,
  );
  const rawCount = String(options["3"] ?? "").trim();
  const count = /^\d+$/.test(rawCount) ? Number(rawCount) : null;
  const batteryKwh =
    capacityMatch && count !== null
      ? Number(capacityMatch[1]) * count
      : isMicro || options["2"] === "ไม่รับแบตเตอรี่" ? 0 : null;
  const usableForEstimate =
    batteryKwh === null
      ? null
      : batteryKwh * ENERGY_ASSUMPTIONS.batteryEnergyFraction;
  return {
    production, // kWh/day; retained for existing PDF consumers
    productionValue:
      production === null
        ? null
        : production * ENERGY_ASSUMPTIONS.electricityRate, // baht/day
    savings:
      usableForEstimate === null
        ? null
        : usableForEstimate * ENERGY_ASSUMPTIONS.electricityRate,
    airconHours:
      usableForEstimate === null
        ? null
        : usableForEstimate / ENERGY_ASSUMPTIONS.airconPowerKw,
  };
}

