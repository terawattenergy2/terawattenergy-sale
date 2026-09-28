/* Numeric substitutions use the same simulation result as the graph. */
export function renderFormulas(root, r, s, day, index) {
  const c = r.config,
    t = r.totals,
    f = (n) => n.toLocaleString("th-TH", { maximumFractionDigits: 4 });
  const daily = r.monthlyKWh / c.days,
    h = c.dayEnd - c.dayStart;
  root.querySelector("#liveFormulas").textContent =
    `ที่มาของข้อมูล: ตัวเลื่อนและช่องสมมติฐานที่เลือกขณะนี้
ตัวเลขแสดงไม่เกิน 4 ตำแหน่ง แต่คำนวณด้วยค่าความละเอียดเต็ม

1. หน่วยไฟและโหลด
${c.monthlyKWh === null ? `หน่วยไฟเดือน = (บิล ${f(c.bill)} − ค่าคงที่ ${f(c.fixed)}) ÷ ค่าไฟ ${f(c.rate)} = ${f(r.monthlyKWh)} kWh` : `หน่วยไฟเดือน = ${f(r.monthlyKWh)} kWh จากช่องหน่วยไฟจริง (ไม่ใช้ยอดบิลตัวเลื่อน)`}
หน่วยไฟวัน = ${f(r.monthlyKWh)} ÷ ${c.days} = ${f(daily)} kWh
ชั่วโมงกลางวัน = ${f(c.dayEnd)} − ${f(c.dayStart)} = ${f(h)} ชั่วโมง (เวลาเขียนเป็นชั่วโมงทศนิยม)
โหลดในช่วง = ${f(daily)} × ${f(c.daytimeShare)} ÷ ${f(h)} = ${f((daily * c.daytimeShare) / h)} kW
โหลดนอกช่วง = ${f(daily)} × (1 − ${f(c.daytimeShare)}) ÷ (24 − ${f(h)}) = ${f((daily * (1 - c.daytimeShare)) / (24 - h))} kW

2. Solar และเพดานแบต
Solar ต่อวัน = ขนาด ${f(c.solarKWp)} kWp × ผลผลิตสมมติ ${f(c.yieldPerKWp)} = ${f(c.solarKWp * c.yieldPerKWp)} kWh
ส่วนเกินทั้งวัน = รวม max(Solar − โหลด, 0) × 0.25 ทั้ง 96 ช่วง = ${f(s.surplusKWh)} kWh
ช่วงความจุใช้ได้ = SOCสูงสุด ${f(c.maxSOC)} − SOCขั้นต่ำ ${f(c.minSOC)} = ${f(s.usableFraction)}
เพดานก่อนปัด = ${f(s.surplusKWh)} × ประสิทธิภาพชาร์จ ${f(c.chargeEfficiency)} ÷ ${f(s.usableFraction)} = ${f((s.surplusKWh * c.chargeEfficiency) / s.usableFraction)} kWh
ปัดขึ้นทีละ 0.1 → สูงสุด ${f(s.batteryKWh)} kWh
ความจุที่คุณเลือกจริง = ${f(c.batteryKWh)} kWh (ใช้ค่านี้จำลองแบต)
Emin = ${f(c.batteryKWh)} × ${f(c.minSOC)} = ${f(c.batteryKWh * c.minSOC)} kWh
Emax = ${f(c.batteryKWh)} × ${f(c.maxSOC)} = ${f(c.batteryKWh * c.maxSOC)} kWh
ระบบ ${c.phases} เฟสเป็นข้อมูลระบบ ไม่ใช่ตัวคูณพลังงาน

3. รวมตลอด ${c.days} วัน จากผลจำลองทุก 15 นาที
ซื้อไฟ = Σ กำลังซื้อไฟ × 0.25 = ${f(t.grid)} kWh
ชาร์จเข้า = ${f(t.charge)} / แบตจ่ายออก = ${f(t.discharge)} kWh
ส่งออก = ${f(t.export)} / จำกัดการผลิต = ${f(t.curtailed)} kWh
สูญเสียแบต = ${f(t.loss)} / พลังงานสะสมเพิ่มปลายรอบ = ${f(r.storedChange)} kWh
บิลเดิม = ${f(r.monthlyKWh)} × ${f(c.rate)} + ${f(c.fixed)} = ${f(r.baselineBill)} บาท
บิลใหม่ = ${f(t.grid)} × ${f(c.rate)} + ${f(c.fixed)} = ${f(r.newBill)} บาท
ประหยัด = ${f(r.baselineBill)} − ${f(r.newBill)} = ${f(r.savings)} บาท
รายได้ขายไฟ = ${f(t.export)} × ${f(c.exportRate)} = ${f(r.exportRevenue)} บาท
รวมประโยชน์ = ${f(r.savings)} + ${f(r.exportRevenue)} = ${f(r.totalBenefit)} บาท
ยอดเงินปัดเป็นสตางค์`;
  const at = (day - 1) * 96 + index,
    v = r.series[at],
    e = at ? r.series[at - 1].energy : c.batteryKWh * c.minSOC;
  const surplus = Math.max(0, v.pv - v.load),
    deficit = Math.max(0, v.load - v.pv),
    mid = v.hour + 0.125;
  const weight =
    mid > 6 && mid < 18 ? Math.sin((Math.PI * (mid - 6)) / 12) ** 2 : 0;
  const area = Array.from({ length: 96 }, (_, i) => {
    const m = (i + 0.5) * 0.25;
    return m > 6 && m < 18 ? Math.sin((Math.PI * (m - 6)) / 12) ** 2 * 0.25 : 0;
  }).reduce((a, b) => a + b, 0);
  root.querySelector("#stepFormulas").textContent =
    `วันที่ ${day} ช่วงเริ่ม ${String(Math.floor(v.hour)).padStart(2, "0")}:${String((v.hour % 1) * 60).padStart(2, "0")} • Δt = 0.25 ชั่วโมง
น้ำหนัก Solar = sin²(π × (${f(mid)} − 6) ÷ 12) ภายในช่วงแดด 06–18; นอกช่วงเป็น 0 → ${f(weight)}
ผลรวมพื้นที่น้ำหนักทั้งวัน = ${f(area)} ชั่วโมง
Solar = ${f(c.solarKWp * c.yieldPerKWp)} × ${f(weight)} ÷ ${f(area)} = ${f(v.pv)} kW
โหลด = ${f(v.load)} kW จากสูตรโหลดใน/นอกช่วงด้านบน
ใช้ตรง = min(${f(v.load)}, ${f(v.pv)}) = ${f(v.direct)} kW
ส่วนเกิน = max(${f(v.pv)} − ${f(v.load)}, 0) = ${f(surplus)} kW
ส่วนขาด = max(${f(v.load)} − ${f(v.pv)}, 0) = ${f(deficit)} kW
E ก่อนช่วง = ${f(e)} kWh ${at ? "จากพลังงานท้ายช่วงก่อนหน้า" : "จากระดับสำรองขั้นต่ำเริ่มต้น"}
ชาร์จ = min(${f(surplus)}, ${f(c.chargeKW)}, (${f(c.batteryKWh * c.maxSOC)} − ${f(e)}) ÷ (0.25 × ${f(c.chargeEfficiency)})) = ${f(v.charge)} kW
จ่าย = min(${f(deficit)}, ${f(c.dischargeKW)}, (${f(e)} − ${f(c.batteryKWh * c.minSOC)}) × ${f(c.dischargeEfficiency)} ÷ 0.25) = ${f(v.discharge)} kW
Eใหม่ = ${f(e)} + ${f(v.charge)} × 0.25 × ${f(c.chargeEfficiency)} − ${f(v.discharge)} × 0.25 ÷ ${f(c.dischargeEfficiency)} = ${f(v.energy)} kWh
SOCท้ายช่วง = ${c.batteryKWh ? `${f(v.energy)} ÷ ${f(c.batteryKWh)} × 100 = ${f(v.soc)}%` : "0% (ไม่มีแบต)"}
ซื้อไฟ = ${f(deficit)} − ${f(v.discharge)} = ${f(v.grid)} kW
ส่วนเกินหลังชาร์จ = ${f(surplus)} − ${f(v.charge)} = ${f(surplus - v.charge)} kW → ${c.exportAllowed ? "ส่งออก" : "จำกัดการผลิต"}
พลังงานส่วนเกินของช่วงนี้ = ${f(surplus)} × 0.25 = ${f(surplus * 0.25)} kWh (นำไปรวมพื้นที่สีขาวทั้งวัน)`;
}
