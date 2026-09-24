import { supabase } from "../supabase";
import teLogo from "./assets/images/LOGO-TE.png";

export function reportParams(filters, scope, page = 1, size = 25) {
  return {
    p_search: filters.search.trim(),
    p_sale: scope === "all" ? filters.sale : "",
    p_date_from: filters.from || null,
    p_date_to: filters.to || null,
    p_page: page,
    p_page_size: size,
    p_product: filters.product,
    p_company: filters.company,
    p_customer_name: filters.customerName.trim(),
    p_customer_email: filters.customerEmail.trim(),
    p_price_min: filters.priceMin === "" ? null : Number(filters.priceMin),
    p_price_max: filters.priceMax === "" ? null : Number(filters.priceMax),
    p_price_missing: filters.priceBand === "missing",
    p_weekday: filters.weekday === "" ? null : Number(filters.weekday),
  };
}
function check(signal) {
  if (signal?.aborted) throw new Error("ยกเลิกการส่งออกแล้ว");
}
export async function verifyExportAccess(userId, scope, signal) {
  check(signal);
  const { data, error } = await supabase.rpc("teramatch_report_access");
  check(signal);
  if (
    error ||
    !userId ||
    data?.user_id !== userId ||
    data?.scope !== scope ||
    !["all", "own"].includes(scope)
  ) {
    throw new Error("บัญชีหรือสิทธิ์เปลี่ยนไป กรุณาเปิด Report ใหม่");
  }
}
export async function loadExportRows(filters, access, signal, progress) {
  await verifyExportAccess(access.userId, access.scope, signal);
  const rows = [],
    seen = new Set();
  let total = null;
  for (let page = 1; ; page += 1) {
    check(signal);
    const { data, error } = await supabase.rpc(
      "teramatch_quote_report_v2",
      reportParams(filters, access.scope, page, 100),
    );
    check(signal);
    if (error) throw new Error(error.message);
    if (!data || !Array.isArray(data.rows) || data.scope !== access.scope)
      throw new Error("ข้อมูลหรือสิทธิ์รายงานเปลี่ยนไป กรุณาลองใหม่");
    if (total === null) total = Number(data.total);
    if (
      !Number.isSafeInteger(total) ||
      total < 0 ||
      Number(data.total) !== total
    )
      throw new Error("รายการเปลี่ยนระหว่างส่งออก กรุณาลองใหม่");
    for (const row of data.rows) {
      if (!row.id || seen.has(row.id))
        throw new Error("ลำดับรายการเปลี่ยนระหว่างส่งออก กรุณาลองใหม่");
      seen.add(row.id);
      rows.push(row);
    }
    progress(
      `กำลังโหลด ${rows.length.toLocaleString()} / ${total.toLocaleString()} รายการ`,
    );
    if (rows.length === total) break;
    if (!data.rows.length || rows.length > total)
      throw new Error("โหลดข้อมูลไม่ครบ กรุณาลองใหม่");
  }
  await verifyExportAccess(access.userId, access.scope, signal);
  if (!rows.length) throw new Error("ไม่มีรายการตรงกับตัวกรองที่เลือก");
  return rows;
}
const text = (value) =>
  value == null
    ? ""
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
const date = (value) =>
  value && !Number.isNaN(new Date(value).getTime())
    ? new Intl.DateTimeFormat("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Bangkok",
      }).format(new Date(value))
    : "";
export const exportColumns = [
  ["เลขรายการ", (r) => text(r.id), 38],
  ["วันเวลา Export (ไทย)", (r) => date(r.created_at), 26],
  [
    "ชื่อลูกค้า",
    (r) => [r.first_name, r.last_name].filter(Boolean).join(" "),
    28,
  ],
  ["อีเมลลูกค้า", (r) => text(r.email), 32],
  ["เบอร์โทรลูกค้า", (r) => text(r.phone), 20],
  [
    "ชื่อเซลส์",
    (r) => r.exporter_full_name || r.exporter_email || "ไม่ทราบเซลส์",
    28,
  ],
  ["บริษัทของเซลส์", (r) => text(r.exporter_business), 26],
  ["อีเมลเซลส์", (r) => text(r.exporter_email), 32],
  ["เบอร์โทรเซลส์", (r) => text(r.exporter_phone), 20],
  ["สินค้าที่แนะนำ", (r) => text(r.suggest_product), 30],
  ["ระบบไฟ", (r) => text(r.phase), 18],
  ["อินเวอร์เตอร์", (r) => text(r.inverter_size), 32],
  ["แบตเตอรี่", (r) => text(r.bat), 30],
  ["จำนวนแบตเตอรี่", (r) => text(r.bat_module), 18],
  ["Home Energy", (r) => text(r.home_energy), 25],
  ["EV DC", (r) => text(r.ev_dc), 25],
  ["รายการ Micro", (r) => text(r.micro_products), 40],
  [
    "ราคาโดยประมาณ (บาท)",
    (r) =>
      r.total_price == null ||
      r.total_price === "" ||
      !Number.isFinite(Number(r.total_price))
        ? null
        : Number(r.total_price),
    24,
  ],
  ["ตัวเลือกทั้งหมด", (r) => text(r.selected_options), 60],
];
export function filterDescription(filters, scope, choices) {
  const weekdays = [
    "อาทิตย์",
    "จันทร์",
    "อังคาร",
    "พุธ",
    "พฤหัสบดี",
    "ศุกร์",
    "เสาร์",
  ];
  return [
    ["ขอบเขต", scope === "all" ? "ทุกเซลส์" : "เฉพาะรายการของฉัน"],
    ["สินค้า", filters.product || "ทั้งหมด"],
    [
      "เซลส์",
      scope === "own"
        ? "ตัวเอง"
        : choices.sellers.find((s) => s.id === filters.sale)?.name ||
          filters.sale ||
          "ทั้งหมด",
    ],
    ["บริษัท", filters.company || "ทั้งหมด"],
    ["ชื่อลูกค้า", filters.customerName || "ทั้งหมด"],
    ["อีเมลลูกค้า", filters.customerEmail || "ทั้งหมด"],
    ["ราคาต่ำสุด", filters.priceMin || "ไม่จำกัด"],
    ["ราคาสูงสุด", filters.priceMax || "ไม่จำกัด"],
    [
      "ราคา",
      filters.priceBand === "missing"
        ? "เฉพาะรายการยังไม่มีราคา"
        : "ตามช่วงที่ระบุ",
    ],
    [
      "วันในสัปดาห์",
      filters.weekday === "" ? "ทุกวัน" : weekdays[Number(filters.weekday)],
    ],
    ["ตั้งแต่วันที่", filters.from || "ไม่จำกัด"],
    ["ถึงวันที่", filters.to || "ไม่จำกัด"],
    ["ค้นหาเพิ่มเติม", filters.search || "ไม่มี"],
  ];
}
function filename(extension) {
  return `TeraMatch-Report-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`;
}
function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export async function exportExcel(rows, description, guard, signal, progress) {
  const module = await import("exceljs");
  check(signal);
  const ExcelJS = module.default || module;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TeraMatch";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("รายการลูกค้า", {
    views: [{ state: "frozen", ySplit: 1, xSplit: 3 }],
  });
  sheet.columns = exportColumns.map(([header, , width], index) => ({
    header,
    key: `c${index}`,
    width,
  }));
  for (let index = 0; index < rows.length; index += 1) {
    check(signal);
    // Strings are explicit cell values, never interpreted as formulas.
    const values = exportColumns.map(([, read]) => read(rows[index]));
    if (
      values.some((value) => typeof value === "string" && value.length > 32767)
    ) {
      throw new Error(
        "มีรายละเอียดเกินขนาดเซลล์ Excel กรุณาเลือกส่งออก PDF หรือกรองรายการให้แคบลง",
      );
    }
    const row = sheet.addRow(values);
    row.alignment = { vertical: "top", wrapText: true };
    if (index % 2 === 1)
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF2F6FC" },
      };
    if (index % 200 === 0) {
      progress(`กำลังสร้าง Excel ${index + 1} / ${rows.length}`);
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  sheet.getColumn(18).numFmt = "#,##0.00";
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: rows.length + 1, column: exportColumns.length },
  };
  [sheet].forEach((ws) => {
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    ws.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF205DAD" },
    };
    ws.getRow(1).height = 32;
  });
  sheet.pageSetup = {
    orientation: "landscape",
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    printTitlesRow: "1:1",
    margins: {
      left: 0.2,
      right: 0.2,
      top: 0.3,
      bottom: 0.3,
      header: 0.1,
      footer: 0.1,
    },
  };
  sheet.headerFooter.oddFooter = "&LTeraMatch Sales Report&RPage &P / &N";
  // A faint floating logo keeps the underlying cell values available for filtering.
  const watermark = await logoData(0.09);
  check(signal);
  const imageId = workbook.addImage({ base64: watermark, extension: "png" });
  for (let row = 2; row < rows.length + 1; row += 30) {
    sheet.addImage(imageId, {
      tl: { col: 5, row },
      ext: { width: 260, height: 140 },
      editAs: "absolute",
    });
  }
  progress("กำลังเตรียมไฟล์ Excel…");
  const buffer = await workbook.xlsx.writeBuffer();
  check(signal);
  await guard();
  check(signal);
  download(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename("xlsx"),
  );
}

async function logoData(opacity = 1) {
  const image = new Image();
  image.src = teLogo;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  context.globalAlpha = opacity;
  context.drawImage(image, 0, 0);
  return canvas.toDataURL("image/png");
}

export async function exportPdf(rows, description, guard, signal, progress) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  check(signal);
  if (document.fonts?.ready) await document.fonts.ready;
  const logo = await logoData();
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const host = document.createElement("div");
  host.style.cssText =
    "position:absolute;left:-10000px;top:0;width:794px;pointer-events:none;";
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);
  let page,
    content,
    footer,
    pageNumber = 0;
  const node = (tag, value, css = "") => {
    const el = document.createElement(tag);
    el.textContent = value;
    el.style.cssText = css;
    return el;
  };
  const startPage = () => {
    page = node(
      "div",
      "",
      `width:794px;height:1122px;box-sizing:border-box;padding:26px 30px;background:#fff;color:#20354f;font-family:${getComputedStyle(document.body).fontFamily};font-size:11px;line-height:1.45;position:relative;`,
    );
    const mark = document.createElement("img");
    mark.src = logo;
    mark.style.cssText =
      "position:absolute;left:222px;top:410px;width:350px;height:220px;object-fit:contain;opacity:0.055;pointer-events:none;";
    page.appendChild(mark);
    page.appendChild(
      node(
        "div",
        "TERAMATCH / SALES REPORT · รายงานลูกค้าและระบบที่เลือก",
        "position:relative;font-size:15px;color:#205dad;font-weight:bold;padding-bottom:9px;border-bottom:2px solid #205dad;margin-bottom:10px;",
      ),
    );
    content = node("div", "", "position:relative;height:989px;");
    page.appendChild(content);
    footer = node(
      "div",
      `เวลาไทย · ส่งออก ${date(new Date())} · ${rows.length} รายการ`,
      "position:absolute;bottom:15px;left:30px;right:30px;font-size:10px;color:#708299;",
    );
    page.appendChild(footer);
    host.replaceChildren(page);
  };
  const flush = async () => {
    check(signal);
    pageNumber += 1;
    footer.textContent += ` · หน้า ${pageNumber}`;
    progress(`กำลังสร้าง PDF หน้า ${pageNumber}…`);
    const canvas = await html2canvas(page, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      width: 794,
      height: 1122,
      windowWidth: 1100,
    });
    check(signal);
    if (pageNumber > 1) pdf.addPage();
    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.94),
      "JPEG",
      0,
      0,
      210,
      297,
      undefined,
      "FAST",
    );
    canvas.width = 0;
    canvas.height = 0;
  };
  const fits = () =>
    content.lastElementChild.getBoundingClientRect().bottom <=
    content.getBoundingClientRect().bottom;
  const heading = (index, continued = false) =>
    node(
      "div",
      `รายการ ${index + 1}${continued ? " (ต่อ)" : ""}`,
      "font-size:12px;font-weight:bold;color:#205dad;border-top:1px solid #c6d5e7;padding:7px 0 4px;margin-top:6px;",
    );
  const field = (label, value) => {
    const el = node(
      "div",
      "",
      "min-width:0;overflow-wrap:anywhere;white-space:pre-wrap;",
    );
    el.appendChild(node("span", label + ": ", "color:#65778c;"));
    el.appendChild(
      node(
        "span",
        text(value) || "—",
        /เซลส์|เบอร์โทร/.test(label) ? "font-weight:bold;" : "",
      ),
    );
    return el;
  };
  try {
    startPage();
    for (let index = 0; index < rows.length; index += 1) {
      check(signal);
      const block = node("div", "", "padding-bottom:7px;");
      block.appendChild(heading(index));
      const grid = node(
        "div",
        "",
        "display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;",
      );
      for (const [label, read] of exportColumns) {
        let value = read(rows[index]);
        if (label === "ราคาโดยประมาณ (บาท)" && value != null)
          value = value.toLocaleString("th-TH", { maximumFractionDigits: 2 });
        const chars = Array.from(text(value) || "—");
        for (let offset = 0; offset < chars.length; offset += 500) {
          const cell = field(
            label + (offset ? " (ต่อ)" : ""),
            chars.slice(offset, offset + 500).join(""),
          );
          if (chars.length > 100 || label === "ตัวเลือกทั้งหมด")
            cell.style.gridColumn = "1 / -1";
          grid.appendChild(cell);
        }
      }
      block.appendChild(grid);
      content.appendChild(block);
      if (fits()) continue;
      // Keep an ordinary record intact; only split records taller than an entire page.
      block.remove();
      if (content.children.length) {
        await flush();
        startPage();
      }
      content.appendChild(block);
      if (fits()) continue;
      block.remove();
      content.appendChild(heading(index));
      for (const cell of Array.from(grid.children)) {
        cell.style.paddingBottom = "4px";
        content.appendChild(cell);
        if (!fits()) {
          cell.remove();
          await flush();
          startPage();
          content.appendChild(heading(index, true));
          content.appendChild(cell);
          if (!fits())
            throw new Error("รายละเอียดเกินหน้ากระดาษ กรุณาส่งออก Excel");
        }
      }
    }
    if (content.children.length) await flush();
    check(signal);
    await guard();
    check(signal);
    await pdf.save(filename("pdf"), { returnPromise: true });
  } finally {
    host.remove();
  }
}
