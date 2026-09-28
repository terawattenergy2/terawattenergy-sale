import * as SolarEngine from "./solar-engine";
import { renderFormulas } from "./solar-formulas";

export function mountSolarPage(root) {
  const cleanups = [];
  const listen = (target, type, handler) => {
    target.addEventListener(type, handler);
    cleanups.push(() => target.removeEventListener(type, handler));
  };
  for (const id of ["dayStart", "dayEnd", "formulaTime", "viewDay"])
    root.querySelector("#" + id).replaceChildren();

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
    sizing,
    initialized = false;
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
    $("solarOut").textContent = fmt(+$("solarKWp").value, 1) + " kWp";
    $("billOut").textContent = money(+$("bill").value);
    $("batteryOut").textContent = fmt(+$("batteryKWh").value) + " kWh";
    $("dayOut").textContent = $("daytimeShare").value + "%";
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
      c.batteryKWh = initialized
        ? Math.min(c.batteryKWh, sizing.batteryKWh)
        : sizing.batteryKWh;
      $("batteryKWh").max = sizing.batteryKWh;
      $("batteryKWh").value = c.batteryKWh;
      $("batteryKWh").disabled = sizing.batteryKWh === 0;
      initialized = true;
      $("batterySizing").textContent =
        "เลือก " +
        fmt(c.batteryKWh, 1) +
        " / สูงสุด " +
        fmt(sizing.batteryKWh, 1) +
        " kWh • ส่วนเกิน " +
        fmt(sizing.surplusKWh, 2) +
        " kWh/วัน × ประสิทธิภาพชาร์จ " +
        fmt(c.chargeEfficiency * 100) +
        "% ÷ ช่วงความจุใช้ได้ " +
        fmt(sizing.usableFraction * 100) +
        "% (ปัดขึ้น 0.1 kWh)" +
        (sizing.powerLimitedKWh > 1e-8
          ? " • กำลังชาร์จไม่พอ: ต้องรองรับ " +
            fmt(sizing.requiredChargeKW, 2) +
            " kW เพื่อรับส่วนเกินทุกช่วง"
          : "") +
        " • เพดานนี้อิงส่วนเกินหนึ่งวัน หากมีแบตเหลือจากวันก่อนอาจยังรับส่วนเกินได้ไม่หมด";
      $("batteryOut").textContent = fmt(c.batteryKWh, 1) + " kWh";
      result = SolarEngine.simulate(c);
      withoutBattery = SolarEngine.simulate({ ...c, batteryKWh: 0 });
      $("periodInfo").textContent =
        timeLabel(c.dayStart) +
        "–" +
        timeLabel(c.dayEnd) +
        " · " +
        fmt(c.dayEnd - c.dayStart, 2) +
        " ชั่วโมง";
      $("error").textContent = "";
      $("download").disabled = false;
      const old = +$("viewDay").value || 1;
      $("viewDay").replaceChildren(
        ...Array.from(
          { length: c.days },
          (_, i) => new Option(String(i + 1), String(i + 1)),
        ),
      );
      $("viewDay").value = Math.min(old, c.days);
      const t = result.totals,
        spill = c.exportAllowed ? t.export : t.curtailed;
      $("pvValue").textContent = fmt(t.pv / c.days, 1) + " kWh";
      $("spillLabel").textContent = c.exportAllowed
        ? "สัดส่วนส่งออก"
        : "สัดส่วนจำกัดการผลิต";
      $("spillValue").textContent =
        fmt(t.pv ? (spill / t.pv) * 100 : 0, 1) + "%";
      $("spillSub").textContent = fmt(spill, 1) + " kWh / รอบบิล";
      $("savingValue").textContent = money(result.savings);
      $("newBillValue").textContent = money(result.newBill);
      $("baseline").textContent =
        "เทียบกับบิลเดิม " + money(result.baselineBill);
      $("summary").textContent =
        `ระบบ ${c.phases} เฟส • ช่วงกลางวัน ${timeLabel(c.dayStart)}–${timeLabel(c.dayEnd)} • ใช้ไฟ ${fmt(result.monthlyKWh, 1)} kWh • ซื้อไฟคงเหลือ ${fmt(t.grid, 1)} kWh • สูญเสียในแบต ${fmt(t.loss, 1)} kWh • พลังงานสะสมเพิ่มปลายรอบ ${fmt(result.storedChange, 1)} kWh • รายได้ขายไฟ ${money(result.exportRevenue)} • ประหยัดรวมรายได้ขายไฟ ${money(result.totalBenefit)}`;
      const b = withoutBattery,
        bt = b.totals,
        bs = c.exportAllowed ? bt.export : bt.curtailed;
      $("base_pvValue").textContent = fmt(bt.pv / c.days, 1) + " kWh";
      $("base_spillLabel").textContent = c.exportAllowed
        ? "สัดส่วนส่งออก"
        : "สัดส่วนจำกัดการผลิต";
      $("base_spillValue").textContent =
        fmt(bt.pv ? (bs / bt.pv) * 100 : 0, 1) + "%";
      $("base_spillSub").textContent = fmt(bs, 1) + " kWh / รอบบิล";
      $("base_savingValue").textContent = money(b.savings);
      $("base_newBillValue").textContent = money(b.newBill);
      $("base_baseline").textContent =
        "เทียบกับบิลเดิม " + money(b.baselineBill);
      $("baseSummary").textContent =
        "ยังไม่ติดแบต • ใช้ไฟ " +
        fmt(b.monthlyKWh, 1) +
        " kWh • Solar ใช้ตรง " +
        fmt(bt.direct, 1) +
        " kWh • ซื้อไฟ " +
        fmt(bt.grid, 1) +
        " kWh • รายได้ขายไฟ " +
        money(b.exportRevenue) +
        " • ประหยัดรวมรายได้ขายไฟ " +
        money(b.totalBenefit);
      $("batteryDelta").textContent =
        "แบตที่เลือก " +
        fmt(c.batteryKWh, 1) +
        " kWh • ซื้อไฟลดเพิ่ม " +
        fmt(bt.grid - t.grid, 1) +
        " kWh • ลดบิลเพิ่ม " +
        money(b.newBill - result.newBill) +
        " / รอบบิล • ผลประโยชน์สุทธิเพิ่มรวมรายได้ขายไฟ " +
        money(result.totalBenefit - b.totalBenefit) +
        " / รอบบิล";
      draw();
    } catch (e) {
      withoutBattery = null;
      for (const id of [
        "base_pvValue",
        "base_spillValue",
        "base_spillSub",
        "base_savingValue",
        "base_newBillValue",
        "base_baseline",
        "baseSummary",
        "batteryDelta",
        "baseReadout",
      ])
        $(id).textContent = "—";
      result = null;
      rows = [];
      $("liveFormulas").textContent = "แก้ไขข้อมูลเพื่อแสดงสูตร";
      $("stepFormulas").textContent = "";
      $("periodInfo").textContent = "ตรวจสอบช่วงเวลา";
      $("error").textContent = e.message;
      $("download").disabled = true;
      for (const id of ["chart", "socChart", "baseChart"]) {
        const cv = $(id);
        const context = cv?.getContext("2d");
        if (context) context.clearRect(0, 0, cv.width, cv.height);
      }
      for (const id of ["pvValue", "spillValue", "savingValue", "newBillValue"])
        $(id).textContent = "—";
      $("summary").textContent = "แก้ไขข้อมูลเพื่อคำนวณใหม่";
      $("batterySizing").textContent = "แก้ไขข้อมูลเพื่อคำนวณความจุแบต";
    }
  }
  function plot(id, soc = false, data = rows) {
    const rows = data;
    const cv = $(id);
    if (!cv) return; // Optional chart may be hidden or removed from JSX.
    const w = cv.clientWidth,
      h = cv.clientHeight,
      dpr = window.devicePixelRatio || 1;
    cv.width = w * dpr;
    cv.height = h * dpr;
    const palette = (name) => {
      const dark = Boolean(cv.closest('.dark, [data-theme="dark"]'));
      const fallback = dark
        ? {
            "--te-direct": "#2685cc",
            "--te-battery": "#8ac7f0",
            "--te-grid": "#596878",
            "--te-pv": "#69baff",
            "--te-load": "#f1f5f9",
            "--te-border": "#2c3a4a",
            "--te-muted": "#a6b3c4",
          }
        : {
            "--te-direct": "#278bd5",
            "--te-battery": "#9bcdf0",
            "--te-grid": "#b7bec8",
            "--te-pv": "#145b9d",
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
    cv.onpointermove = (e) => {
      const bounds = cv.getBoundingClientRect(),
        i = Math.max(
          0,
          Math.min(95, Math.floor(((e.clientX - bounds.left - l) / pw) * 96)),
        ),
        v = rows[i];
      $(id === "baseChart" ? "baseReadout" : "readout").textContent =
        `${String(Math.floor(v.hour)).padStart(2, "0")}:${String(Math.round((v.hour % 1) * 60)).padStart(2, "0")} · โหลด ${fmt(v.load, 2)} / Solar ${fmt(v.pv, 2)} / ใช้ตรง ${fmt(v.direct, 2)} / ชาร์จ ${fmt(v.charge, 2)} / แบตจ่าย ${fmt(v.discharge, 2)} / ซื้อไฟ ${fmt(v.grid, 2)} / ส่งออก ${fmt(v.export, 2)} / จำกัดผลิต ${fmt(v.curtailed, 2)} kW · SOC ${fmt(v.soc, 1)}%`;
    };
  }
  function showFormulas() {
    if (result)
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
    if (!result) return;
    showFormulas();
    rows = result.series.filter((v) => v.day === +$("viewDay").value);
    plot(
      "baseChart",
      false,
      withoutBattery.series.filter((v) => v.day === +$("viewDay").value),
    );
    $("baseReadout").textContent =
      "Solar อย่างเดียว • วันที่ " +
      $("viewDay").value +
      " • เลื่อนเมาส์หรือแตะกราฟเพื่อดูค่า";
    plot("chart");
    plot("socChart", true);
    $("readout").textContent = "เลื่อนเมาส์หรือแตะกราฟเพื่อดูค่ารายช่วงเวลา";
  }
  root
    .querySelectorAll("input, #exportAllowed, #dayStart, #dayEnd, #phases")
    .forEach((el) => listen(el, "input", update));
  listen($("viewDay"), "change", draw);
  listen(window, "resize", draw);
  $("download").onclick = () => {
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
  };
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
    });
    root.querySelector("#download").onclick = null;
  };
}
