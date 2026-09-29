import * as SolarEngine from "./solar-engine";
import { renderFormulas } from "./solar-formulas";

export function mountSolarPage(root, { onBatteryAvailability = () => {}, onCalculation = () => {} } = {}) {
  if (!root) return () => {};
  const cleanups = [];
  const setText = (id, value) => {
    const element = root.querySelector("#" + id);
    if (element) element.textContent = value;
  };
  const requiredIds = [
    "dayStart", "dayEnd", "formulaTime", "viewDay", "solarKWp", "bill",
    "batteryKWh", "batteryChoice", "rate", "fixed", "days", "yieldPerKWp", "chargeKW",
    "dischargeKW", "exportRate", "phases", "daytimeShare",
    "chargeEfficiency", "dischargeEfficiency", "minSOC", "maxSOC",
    "monthlyKWh", "exportAllowed",
  ];
  const missing = requiredIds.filter((id) => !root.querySelector("#" + id));
  if (missing.length) {
    const message = "ไม่พบช่องที่ใช้คำนวณ: " + missing.join(", ");
    console.error(message);
    setText("error", message);
    return () => {};
  }
  const listen = (target, type, handler) => {
    if (!target) return;
    target.addEventListener(type, handler);
    cleanups.push(() => target.removeEventListener(type, handler));
  };
  for (const id of ["dayStart", "dayEnd", "formulaTime", "viewDay"])
    root.querySelector("#" + id).replaceChildren();

  // Apply initial assumptions before the first calculation, including after hot reload.
  // Subsequent input events use the user's edits, without resetting these values.
  const initialAssumptions = {
    monthlyKWh: "", rate: "4.5", fixed: "0", days: "30",
    yieldPerKWp: "4", chargeKW: "5", dischargeKW: "5",
    chargeEfficiency: "99", dischargeEfficiency: "99",
    minSOC: "0", maxSOC: "99", exportAllowed: "true", exportRate: "2.2",
  };
  for (const [id, value] of Object.entries(initialAssumptions)) {
    root.querySelector("#" + id).value = value;
  }

  const tooltip = document.createElement("div");
  tooltip.className = "solar-chart-tooltip";
  tooltip.hidden = true;
  tooltip.setAttribute("role", "tooltip");
  root.appendChild(tooltip);
  const hideTooltip = () => { tooltip.hidden = true; };
  listen(window, "scroll", hideTooltip);
  listen(window, "blur", hideTooltip);
  const visibilityObserver = new MutationObserver(hideTooltip);
  const batteryPanel = root.querySelector("#battery-calculation");
  if (batteryPanel) visibilityObserver.observe(batteryPanel, { attributes: true, attributeFilter: ["style", "hidden"] });
  cleanups.push(() => { visibilityObserver.disconnect(); tooltip.remove(); });

  const $ = (id) => root.querySelector("#" + id),
    fmt = (n, d = 0) =>
      n.toLocaleString("th-TH", {
        maximumFractionDigits: d,
        minimumFractionDigits: d,
      }),
    money = (n) => "฿" + fmt(n);
  let withoutBattery,
    result,
    rows = [],
    sizing;
  const timeLabel = (h) =>
    String(Math.floor(h)).padStart(2, "0") +
    ":" +
    String(Math.round((h % 1) * 60)).padStart(2, "0");
  for (let i = 0; i <= 96; i++) {
    const h = i / 4;
    if (i < 96) $("dayStart").add(new Option(timeLabel(h), h));
    if (i > 0) $("dayEnd").add(new Option(timeLabel(h), h));
  }
  for (let i = 0; i < 96; i++)
    $("formulaTime").add(new Option(timeLabel(i / 4), i));
  $("formulaTime").value = 48;
  $("dayStart").value = 6;
  $("dayEnd").value = 18;
  function update() {
    hideTooltip();
    setText("solarOut", fmt(+$("solarKWp").value, 1) + " kWp");
    setText("billOut", money(+$("bill").value));
    setText("batteryOut", fmt(+$("batteryKWh").value) + " kWh");
    setText("dayOut", $("daytimeShare").value + "%");
    try {
      const c = {};
      for (const id of [
        "solarKWp",
        "bill",
        "batteryKWh",
        "rate",
        "fixed",
        "days",
        "yieldPerKWp",
        "chargeKW",
        "dischargeKW",
        "exportRate",
        "dayStart",
        "dayEnd",
        "phases",
      ])
        c[id] = +$(id).value;
      for (const id of [
        "daytimeShare",
        "chargeEfficiency",
        "dischargeEfficiency",
        "minSOC",
        "maxSOC",
      ])
        c[id] = +$(id).value / 100;
      c.monthlyKWh =
        $("monthlyKWh").value.trim() === "" ? null : +$("monthlyKWh").value;
      c.exportAllowed = $("exportAllowed").value === "true";
      for (const input of root.querySelectorAll("input[type=number]"))
        if (
          !input.validity.valid ||
          (input.id !== "monthlyKWh" && input.value === "")
        )
          throw Error("กรุณาตรวจสอบช่องตัวเลขและช่วงค่าที่กำหนด");
      sizing = SolarEngine.sizeBatteryFromSurplus(c);
      // Use the unrounded surplus-based capacity; rounding up must not unlock a size.
      const capacityLimit = sizing.usableFraction > 0
        ? sizing.surplusKWh * c.chargeEfficiency / sizing.usableFraction
        : 0;
      const maxTenths = Math.min(304, Math.floor((capacityLimit + 1e-9) * 10));
      const batteryOptions = [0];
      for (let tenths = 60; tenths <= maxTenths; tenths++) batteryOptions.push(tenths / 10);
      // Slider positions map to 0, 6.0, 6.1, ...; forbidden sizes have no position.
      const slider = $("batteryChoice");
      const index = Math.max(0, Math.min(batteryOptions.length - 1, Math.round(+slider.value || 0)));
      c.batteryKWh = batteryOptions[index];
      $("batteryKWh").value = c.batteryKWh;
      slider.min = 0;
      slider.max = batteryOptions.length - 1;
      slider.step = 1;
      slider.value = index;
      slider.disabled = batteryOptions.length === 1;
      slider.setAttribute("aria-valuetext", c.batteryKWh === 0 ? "ไม่ติดแบต" : fmt(c.batteryKWh, 1) + " kWh");
      const maxBattery = batteryOptions[batteryOptions.length - 1];
      onBatteryAvailability(maxBattery >= 6);
      setText("batteryOptions", maxBattery >= 6 ? "0 (ไม่ติดแบต) → 6.0 → 6.1 → … → " + fmt(maxBattery, 1) + " kWh" : "0 (ไม่ติดแบต)");
      setText("batterySizing", maxBattery >= 6
        ? "เลือกได้ 0 หรือ 6.0–" + fmt(maxBattery, 1) + " kWh ทีละ 0.1 • ส่วนเกิน " + fmt(sizing.surplusKWh, 2) + " kWh/วัน"
        : "Solar ส่วนเกินยังไม่พอสำหรับแบต 6 kWh • เลือกได้เฉพาะ 0 (ไม่ติดแบต) • ส่วนเกิน " + fmt(sizing.surplusKWh, 2) + " kWh/วัน");
      setText("batteryOut", c.batteryKWh === 0 ? "0 kWh · ไม่ติดแบต" : fmt(c.batteryKWh, 1) + " kWh");
      result = SolarEngine.simulate(c);
      withoutBattery = SolarEngine.simulate({ ...c, batteryKWh: 0 });
      setText("periodInfo", timeLabel(c.dayStart) +
        "–" +
        timeLabel(c.dayEnd) +
        " · " +
        fmt(c.dayEnd - c.dayStart, 2) +
        " ชั่วโมง");
      setText("error", "");
      if ($("download")) $("download").disabled = false;
      const old = +$("viewDay").value || 1;
      $("viewDay").replaceChildren(
        ...Array.from(
          { length: c.days },
          (_, i) => new Option(String(i + 1), String(i + 1)),
        ),
      );
      $("viewDay").value = Math.min(old, c.days);
      const t = result.totals;
      setText("pvValue", fmt(t.pv / c.days, 1) + " kWh");

      setText("savingValue", money(result.savings));
      setText("newBillValue", money(result.newBill));
      setText("baseline", "เทียบกับบิลเดิม " + money(result.baselineBill));
      setText("summary", `ระบบ ${c.phases} เฟส • ช่วงกลางวัน ${timeLabel(c.dayStart)}–${timeLabel(c.dayEnd)} • ใช้ไฟ ${fmt(result.monthlyKWh, 1)} kWh • ซื้อไฟคงเหลือ ${fmt(t.grid, 1)} kWh • สูญเสียในแบต ${fmt(t.loss, 1)} kWh • พลังงานสะสมเพิ่มปลายรอบ ${fmt(result.storedChange, 1)} kWh • รายได้ขายไฟ ${money(result.exportRevenue)} • ประหยัดรวมรายได้ขายไฟ ${money(result.totalBenefit)}`);
      const b = withoutBattery,
        bt = b.totals;
      setText("base_pvValue", fmt(bt.pv / c.days, 1) + " kWh");

      setText("base_savingValue", money(b.savings));
      setText("base_newBillValue", money(b.newBill));
      setText("base_baseline", "เทียบกับบิลเดิม " + money(b.baselineBill));
      setText("baseSummary", "ยังไม่ติดแบต • ใช้ไฟ " +
        fmt(b.monthlyKWh, 1) +
        " kWh • Solar ใช้ตรง " +
        fmt(bt.direct, 1) +
        " kWh • ซื้อไฟ " +
        fmt(bt.grid, 1) +
        " kWh • รายได้ขายไฟ " +
        money(b.exportRevenue) +
        " • ประหยัดรวมรายได้ขายไฟ " +
        money(b.totalBenefit));
      setText("batteryDelta", "แบตที่เลือก " +
        fmt(c.batteryKWh, 1) +
        " kWh • ซื้อไฟลดเพิ่ม " +
        fmt(bt.grid - t.grid, 1) +
        " kWh • ลดบิลเพิ่ม " +
        money(b.newBill - result.newBill) +
        " / รอบบิล • ผลประโยชน์สุทธิเพิ่มรวมรายได้ขายไฟ " +
        money(result.totalBenefit - b.totalBenefit) +
        " / รอบบิล");
      draw();
      onCalculation({
        peakLoadKW: result.series.reduce((peak, row) => Math.max(peak, row.load), 0),
        batteryKWh: c.batteryKWh,
        phases: c.phases,
      });
    } catch (e) {
      onCalculation(null);
      onBatteryAvailability(false);
      console.error("Solar calculation failed:", e);
      withoutBattery = null;
      for (const id of [
        "base_pvValue",
        "base_savingValue",
        "base_newBillValue",
        "base_baseline",
        "baseSummary",
        "batteryDelta",
        "baseReadout",
      ])
        setText(id, "—");
      result = null;
      rows = [];
      setText("liveFormulas", "แก้ไขข้อมูลเพื่อแสดงสูตร");
      setText("stepFormulas", "");
      setText("periodInfo", "ตรวจสอบช่วงเวลา");
      setText("error", e instanceof Error ? e.message : String(e));
      if ($("download")) $("download").disabled = true;
      for (const id of ["chart", "socChart", "baseChart"]) {
        const cv = $(id);
        const context = cv?.getContext("2d");
        if (context) context.clearRect(0, 0, cv.width, cv.height);
      }
      for (const id of ["pvValue", "savingValue", "newBillValue"])
        setText(id, "—");
      setText("summary", "แก้ไขข้อมูลเพื่อคำนวณใหม่");
      setText("batterySizing", "แก้ไขข้อมูลเพื่อคำนวณความจุแบต");
    }
  }
  function plot(id, soc = false, data = rows) {
    const rows = data;
    const cv = $(id);
    if (!cv) return; // Optional chart may be hidden or removed from JSX.
    const w = cv.clientWidth,
      h = cv.clientHeight,
      dpr = window.devicePixelRatio || 1;
    if (w <= 0 || h <= 0) return;
    cv.width = w * dpr;
    cv.height = h * dpr;
    const palette = (name) => {
      const dark = Boolean(cv.closest('.dark, [data-theme="dark"]'));
      const fallback = dark
        ? {
            "--te-direct": "#f59e0b",
            "--te-battery": "#22c55e",
            "--te-grid": "#9bd5f5",
            "--te-pv": "#ea580c",
            "--te-load": "#f1f5f9",
            "--te-border": "#2c3a4a",
            "--te-muted": "#a6b3c4",
          }
        : {
            "--te-direct": "#f59e0b",
            "--te-battery": "#22c55e",
            "--te-grid": "#9bd5f5",
            "--te-pv": "#ea580c",
            "--te-load": "#17212e",
            "--te-border": "#dce2e8",
            "--te-muted": "#657080",
          };
      return (
        getComputedStyle(cv).getPropertyValue(name).trim() || fallback[name]
      );
    };
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const l = 46,
      r = 15,
      top = 15,
      bottom = 30,
      pw = w - l - r,
      ph = h - top - bottom,
      max = soc
        ? 100
        : Math.max(
            1,
            Math.ceil(
              Math.max(...rows.map((v) => Math.max(v.pv, v.load))) * 1.1,
            ),
          );
    const x = (i) => l + (pw * i) / 96,
      y = (v) => top + ph * (1 - v / max);
    ctx.font = "11px Tahoma";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const v = (max * i) / 4;
      ctx.strokeStyle = palette("--te-border");
      ctx.beginPath();
      ctx.moveTo(l, y(v));
      ctx.lineTo(w - r, y(v));
      ctx.stroke();
      ctx.fillStyle = palette("--te-muted");
      ctx.fillText(fmt(v, soc ? 0 : 1), 3, y(v) + 4);
    }
    for (let hour = 0; hour <= 24; hour += 3) {
      ctx.fillStyle = palette("--te-muted");
      ctx.fillText(
        String(hour).padStart(2, "0") + ":00",
        x(hour * 4) - 14,
        h - 8,
      );
    }
    function path(values) {
      ctx.moveTo(x(0), y(values[0]));
      values.forEach((v, i) => {
        ctx.lineTo(x(i), y(v));
        ctx.lineTo(x(i + 1), y(v));
      });
    }
    function area(lower, upper, color) {
      ctx.beginPath();
      path(upper);
      for (let i = 95; i >= 0; i--) {
        ctx.lineTo(x(i + 1), y(lower[i]));
        ctx.lineTo(x(i), y(lower[i]));
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    }
    function line(values, color, dash = []) {
      // Shape-preserving cubic interpolation for the Solar outline only.
      // Values at interval midpoints remain unchanged; no energy is recalculated.
      if (color === palette("--te-pv") && !soc) {
        const points = [
          { x: x(0), y: y(0) },
          ...values.map((v, i) => ({ x: x(i + 0.5), y: y(v) })),
          { x: x(96), y: y(0) },
        ];
        const slopes = points
          .slice(1)
          .map((p, i) => (p.y - points[i].y) / (p.x - points[i].x));
        const tangents = points.map((p, i) =>
          i === 0
            ? slopes[0]
            : i === points.length - 1
              ? slopes[slopes.length - 1]
              : slopes[i - 1] * slopes[i] <= 0
                ? 0
                : 2 / (1 / slopes[i - 1] + 1 / slopes[i]),
        );
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 0; i < points.length - 1; i++) {
          const a = points[i],
            b = points[i + 1],
            dx = (b.x - a.x) / 3;
          ctx.bezierCurveTo(
            a.x + dx,
            a.y + tangents[i] * dx,
            b.x - dx,
            b.y - tangents[i + 1] * dx,
            b.x,
            b.y,
          );
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.stroke();
        return;
      }
      ctx.beginPath();
      path(values);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash(dash);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (soc) {
      area(
        rows.map(() => 0),
        rows.map((v) => v.soc),
        palette("--te-battery"),
      );
      line(
        rows.map((v) => v.soc),
        palette("--te-pv"),
      );
    } else {
      const direct = rows.map((v) => v.direct),
        combined = rows.map((v) => v.direct + v.discharge);
      area(
        rows.map(() => 0),
        direct,
        palette("--te-direct"),
      );
      area(direct, combined, palette("--te-battery"));
      area(
        combined,
        rows.map((v) => v.load),
        palette("--te-grid"),
      );
      line(
        rows.map((v) => v.pv),
        palette("--te-pv"),
      );
      line(
        rows.map((v) => v.load),
        palette("--te-load"),
        [5, 4],
      );
    }
    // Draw a sun directly inside each power chart, above the Solar peak.
    if (!soc && rows.some((row) => row.pv > 0)) {
      const peakIndex = rows.reduce((best, row, index) =>
        row.pv > rows[best].pv ? index : best, 0);
      const sunX = x(peakIndex + 0.5);
      const sunY = Math.max(top + 19, y(rows[peakIndex].pv) - 24);
      ctx.save();
      ctx.strokeStyle = palette("--te-pv");
      ctx.fillStyle = palette("--te-direct");
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(sunX, sunY, 7, 0, Math.PI * 2);
      ctx.fill();
      for (let ray = 0; ray < 8; ray++) {
        const angle = ray * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(sunX + Math.cos(angle) * 11, sunY + Math.sin(angle) * 11);
        ctx.lineTo(sunX + Math.cos(angle) * 16, sunY + Math.sin(angle) * 16);
        ctx.stroke();
      }
      ctx.restore();
    }

    cv.onpointerleave = hideTooltip;
    cv.onpointercancel = hideTooltip;
    cv.onpointermove = (e) => {
      const bounds = cv.getBoundingClientRect(),
        i = Math.max(
          0,
          Math.min(95, Math.floor(((e.clientX - bounds.left - l) / pw) * 96)),
        ),
        v = rows[i];
      if (!v) return;
      tooltip.textContent = [
        "วันที่ " + v.day + " · " + timeLabel(v.hour),
        "โหลดรวม: " + fmt(v.load, 2) + " kW",
        "☀ Solar ผลิต: " + fmt(v.pv, 2) + " kW",
        "☀ Solar ใช้ตรง: " + fmt(v.direct, 2) + " kW",
        ...(id === "baseChart" ? [] : [
          "ชาร์จแบต: " + fmt(v.charge, 2) + " kW",
          "แบตจ่าย: " + fmt(v.discharge, 2) + " kW",
          "ระดับแบต: " + fmt(v.soc, 1) + "%",
        ]),
        "ซื้อไฟ: " + fmt(v.grid, 2) + " kW",
        "ส่งออก: " + fmt(v.export, 2) + " kW",
        "จำกัดผลิต: " + fmt(v.curtailed, 2) + " kW",
      ].join("\n");
      tooltip.hidden = false;
      const box = tooltip.getBoundingClientRect();
      const left = e.clientX + 16 + box.width > window.innerWidth - 8
        ? e.clientX - box.width - 16 : e.clientX + 16;
      const top = e.clientY + 16 + box.height > window.innerHeight - 8
        ? e.clientY - box.height - 16 : e.clientY + 16;
      tooltip.style.left = Math.max(8, left) + "px";
      tooltip.style.top = Math.max(8, top) + "px";
      setText(id === "baseChart" ? "baseReadout" : "readout", `${String(Math.floor(v.hour)).padStart(2, "0")}:${String(Math.round((v.hour % 1) * 60)).padStart(2, "0")} · โหลด ${fmt(v.load, 2)} / Solar ${fmt(v.pv, 2)} / ใช้ตรง ${fmt(v.direct, 2)} / ชาร์จ ${fmt(v.charge, 2)} / แบตจ่าย ${fmt(v.discharge, 2)} / ซื้อไฟ ${fmt(v.grid, 2)} / ส่งออก ${fmt(v.export, 2)} / จำกัดผลิต ${fmt(v.curtailed, 2)} kW · SOC ${fmt(v.soc, 1)}%`);
    };
  }
  function showFormulas() {
    if (result && $("liveFormulas") && $("stepFormulas"))
      renderFormulas(
        root,
        result,
        sizing,
        +$("viewDay").value,
        +$("formulaTime").value,
      );
  }
  listen($("formulaTime"), "change", showFormulas);
  function draw() {
    hideTooltip();
    if (!result) return;
    showFormulas();
    rows = result.series.filter((v) => v.day === +$("viewDay").value);
    plot(
      "baseChart",
      false,
      withoutBattery.series.filter((v) => v.day === +$("viewDay").value),
    );
    setText("baseReadout", "Solar อย่างเดียว • วันที่ " +
      $("viewDay").value +
      " • เลื่อนเมาส์หรือแตะกราฟเพื่อดูค่า");
    plot("chart");
    plot("socChart", true);
    setText("readout", "เลื่อนเมาส์หรือแตะกราฟเพื่อดูค่ารายช่วงเวลา");
  }
  root
    .querySelectorAll("input, #exportAllowed, #dayStart, #dayEnd, #phases")
    .forEach((el) => listen(el, "input", update));
  listen($("solarKWp"), "change", update);
  listen($("viewDay"), "change", draw);
  listen(window, "resize", draw);
  listen(root, "solar:battery-visible", draw);
  listen($("download"), "click", () => {
    if (!result) return;
    const keys = [
      "phases",
      "dayStart",
      "dayEnd",
      "day",
      "hour",
      "load",
      "pv",
      "direct",
      "charge",
      "discharge",
      "grid",
      "export",
      "curtailed",
      "loss",
      "energy",
      "soc",
    ];
    const header = [
      "phases",
      "daytime_start_hour",
      "daytime_end_hour",
      "day",
      "hour_start",
      "load_kW",
      "pv_potential_kW",
      "direct_kW",
      "charge_AC_kW",
      "discharge_AC_kW",
      "grid_kW",
      "export_kW",
      "curtailed_kW",
      "battery_loss_kW",
      "battery_energy_end_kWh",
      "soc_end_percent",
    ];
    const csv =
      "\uFEFF" +
      header.join(",") +
      "\n" +
      result.series
        .map((v) => keys.map((k) => v[k] ?? result.config[k]).join(","))
        .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "solar-bess-15min.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const themeObserver = new MutationObserver(() => draw());
  for (let node = root; node; node = node.parentElement)
    themeObserver.observe(node, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
  update();

  return () => {
    themeObserver.disconnect();
    cleanups.forEach((cleanup) => cleanup());
    root.querySelectorAll("canvas").forEach((canvas) => {
      canvas.onpointermove = null;
      canvas.onpointerleave = null;
      canvas.onpointercancel = null;
    });
  };
}