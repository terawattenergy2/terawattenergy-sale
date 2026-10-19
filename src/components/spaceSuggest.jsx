import React, { useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import "./spaceSuggestCompact.css";
import SpaceSuggestPdfPage from "./SpaceSuggestPdfPage";
import { suggestionAccessories } from "./suggestion-accessories";
import { getBatterySummary } from "./battery-summary";
import { supabase } from "../supabase";
import { priceListTotal } from "./pricelist-pricing";

export default function SpaceSuggest({
  spaceSug,
  getDriveImageUrl,
  onCompare,
  onCustomize,
  priceList: providedPriceList = [],
  batteryCatalog = [],
}) {
  const [loadedPriceList, setLoadedPriceList] = useState(null);
  const priceList = loadedPriceList ?? (
    Array.isArray(providedPriceList) ? providedPriceList : []
  );

  useEffect(() => {
    let cancelled = false;
    async function loadPriceList() {
      try {
        const { data: rows, error } = await supabase
          .from("price_list")
          .select("*")
          .order("id", { ascending: true });
        if (cancelled) return;
        if (error) {
          console.error("[SpaceSuggest] โหลด price_list ไม่สำเร็จ:", error.message);
          return;
        }
        console.info("[SpaceSuggest price_list] loaded", {
          count: rows?.length ?? 0,
          columns: rows?.[0] ? Object.keys(rows[0]) : [],
          products: (rows ?? []).map((row) => row.product),
        });
        if (!rows?.length) {
          console.warn("[SpaceSuggest price_list] query succeeded but returned no rows");
        }
        setLoadedPriceList(rows ?? []);
      } catch (error) {
        if (!cancelled) console.error("[SpaceSuggest] โหลด price_list ไม่สำเร็จ:", error);
      }
    }
    loadPriceList();
    return () => { cancelled = true; };
  }, []);

  const pdfRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [personalData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("personal_data") || "{}") || {};
    } catch {
      return {};
    }
  });
  const battery = getBatterySummary(
    spaceSug,
    Array.isArray(priceList) ? priceList : [],
    Array.isArray(batteryCatalog) ? batteryCatalog : [],
  );
  const accessories = suggestionAccessories(spaceSug, battery, priceList);
  const imageUrl = (value) => (value ? getDriveImageUrl?.(value) || value : "");
  const detailLines = (value) =>
    String(value || "")
      .split(/[,\n]+/)
      .map((v) => v.trim())
      .filter((v) => v && !/^[-–—]+$/.test(v));
  const features = [...new Set(detailLines(spaceSug?.detail_product))];
  // const extraFeatures = detailLines(spaceSug?.sub_detail_product);
  const batteryItems = battery?.items || (battery?.count > 0 ? [battery] : []);
  // Use the same item quantities and price calculation for PDF and saved quote.
  const modelName = spaceSug?.ans_product || "";
  const units = modelName.match(/\b(\d+)\s*Units?\b/i);
  const priceItems = [
    { product: modelName.replace(/\s*\b\d+\s*Units?\b\s*/i, " ").trim(), quantity: units ? Number(units[1]) : 1 },
    ...(battery?.count === 0
      ? []
      : batteryItems.length
        ? batteryItems.map((item) => ({ product: item.name, quantity: item.count }))
        : [{ product: "", quantity: 1 }]),
    ...accessories.map((item) => ({ product: item.product, quantity: 1 })),
    ...(spaceSug?.gateway && !["ไม่เพิ่มเติม", "ไม่ติดตั้ง", "ไม่ติด", "-", "—"].includes(spaceSug.gateway)
      ? [{ product: spaceSug.gateway, quantity: 1 }]
      : []),
  ];
  const totalPrice = priceListTotal(priceList, priceItems);
  const priceSummary = {
    lines: priceItems.map((item) => ({
      ...item,
      title: item.product,
      unitPrice: priceListTotal(priceList, [{ product: item.product, quantity: 1 }]),
      subtotal: priceListTotal(priceList, [item]),
    })),
    complete: totalPrice !== null,
    knownTotal: totalPrice,
    totalWithMarkup: totalPrice,
    markupAmount: 0,
  };
  const fullName = [personalData.firstName, personalData.lastName]
    .filter(Boolean)
    .join(" ");
  const handleExportPDF = async () => {
    if (!pdfRef.current || isExporting) return;
    setIsExporting(true);
    setExportError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw new Error("กรุณาเข้าสู่ระบบใหม่ก่อน Export");
      }
      if (document.fonts?.ready) await document.fonts.ready;
      await Promise.all(
        Array.from(pdfRef.current.querySelectorAll("img")).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                const done = () => {
                  clearTimeout(timer);
                  img.removeEventListener("load", done);
                  img.removeEventListener("error", done);
                  resolve();
                };
                const timer = setTimeout(done, 10000);
                img.addEventListener("load", done);
                img.addEventListener("error", done);
              }),
        ),
      );
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pages = Array.from(
        pdfRef.current.querySelectorAll("[data-pdf-page]"),
      );
      for (let i = 0; i < pages.length; i++) {
        const element = pages[i];
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#fff",
          logging: false,
          windowWidth: 794,
          width: element.offsetWidth,
          height: element.offsetHeight,
        });
        if (i) pdf.addPage();
        const scale = Math.min(209 / canvas.width, 296 / canvas.height);
        const w = canvas.width * scale,
          h = canvas.height * scale;
        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          (210 - w) / 2,
          (297 - h) / 2,
          w,
          h,
        );
      }
      const model = spaceSug?.ans_product || "";
      const phase = spaceSug?.solarRecommendation?.phase || spaceSug?.phase ||
        (/\bSP\d*\b/i.test(model) ? "1 Phase" : /\bTP\d*\b/i.test(model) ? "3 Phase" : "");
      const batteryNames = battery?.count === 0
        ? "ไม่ติดแบต"
        : batteryItems.map((item) => `${item.name} × ${item.count} ก้อน`).join(" + ");
      const { error: saveError } = await supabase.from("customer_quotes").insert({
        first_name: personalData.firstName || "",
        last_name: personalData.lastName || "",
        email: personalData.email || "",
        phone: personalData.phone || "",
        suggest_product: model,
        phase,
        inverter_size: model,
        bat: batteryNames,
        bat_module: battery?.count == null ? "" : String(battery.count),
        home_energy: spaceSug?.gateway || "",
        capture_exporter: true,
        price_summary: priceSummary,
        total_price: totalPrice,
        markup_percent: 0,
        vat_included: false,
        selected_options: {
          0: phase,
          1: model,
          2: batteryNames,
          3: battery?.count == null ? "" : String(battery.count),
          4: spaceSug?.gateway || "",
          batteries: batteryItems.map(({ name, count, capacity }) => ({ name, count, capacity })),
          battery_total_kwh: battery?.totalCapacity ?? (battery?.count === 0 ? 0 : null),
          accessories: accessories.map(({ label, product }) => ({ label, product, quantity: 1 })),
        },
      });
      if (saveError) {
        throw new Error(`บันทึกข้อมูลลง Supabase ไม่สำเร็จ: ${saveError.message}`);
      }
      pdf.save(
        `${(spaceSug?.ans_product || "recommended-solution").replace(/[\\/:*?"<>|]/g, "-")}.pdf`,
      );
    } catch (error) {
      console.error(error);
      setExportError(error.message || "สร้าง PDF ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsExporting(false);
    }
  };
  return (
    <div className="space-suggest-wrapper">
      <section className="te-solution" aria-label="สรุประบบที่เลือก">
        <header className="te-solution__hero">
          <div className="te-solution__image">
            {spaceSug?.img_product ? (
              <img
                src={imageUrl(spaceSug.img_product)}
                alt={spaceSug.ans_product || "อินเวอร์เตอร์"}
              />
            ) : (
              <span>ไม่มีรูปสินค้า</span>
            )}
          </div>
          <div>
            <span className="te-solution__tag">ระบบที่คุณเลือก</span>
            <h2>{spaceSug?.ans_product || "ยังไม่ได้เลือกผลิตภัณฑ์"}</h2>
            <p className="te-solution__muted">
              อินเวอร์เตอร์และแบตเตอรี่สำหรับระบบของคุณ
            </p>
            <div className="te-solution__actions">
              <Button onClick={onCustomize}>ปรับแต่งรุ่นนี้ ↗</Button>
              <Button variant="outline-primary" onClick={onCompare}>
                กลับไปเปรียบเทียบ
              </Button>
            </div>
          </div>
        </header>
        <div className="te-solution__columns">
          <section className="te-solution__panel">
            <h3>
              <span>01</span> คุณสมบัติอินเวอร์เตอร์
            </h3>
            {features.length ? (
              <ul className="te-solution__features">
                {features.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            ) : (
              <p>ยังไม่มีข้อมูลคุณสมบัติ</p>
            )}
            {/* {extraFeatures.length > 0 && <details className="te-solution__more"><summary>รายละเอียดเพิ่มเติม</summary><ul>{extraFeatures.map((text, i) => <li key={i}>{text}</li>)}</ul></details>} */}
          </section>
          <section className="te-solution__panel te-solution__battery">
            <h3>
              <span>02</span> แบตเตอรี่ที่เลือก
            </h3>
            {!battery ? (
              <p>ยังไม่มีข้อมูลแบตเตอรี่</p>
            ) : battery.count === 0 ? (
              <p>ไม่ติดแบต</p>
            ) : (
              <>
                <div className="te-solution__packs">
                  {batteryItems.map((item, i) => (
                    <div
                      className="te-solution__pack"
                      key={`${item.name}-${i}`}
                    >
                      {item.image && (
                        <img src={imageUrl(item.image)} alt={item.name} />
                      )}
                      <div>
                        <strong>{item.name}</strong>
                        <p>
                          {item.capacity != null
                            ? `ก้อนละ ${item.capacity} kWh`
                            : ""}
                        </p>
                      </div>
                      <span className="te-solution__count">
                        {item.count} ก้อน
                      </span>
                    </div>
                  ))}
                </div>
                {battery.notice && (
                  <p role="status" style={{ fontSize: 13, color: "#946200" }}>
                    {battery.notice}
                  </p>
                )}
                <div className="te-solution__total">
                  <span>รวม {battery.count} ก้อน</span>
                  <strong>
                    {battery.totalCapacity != null
                      ? Number(battery.totalCapacity).toFixed(2) + " kWh"
                      : "ยังไม่มีข้อมูลความจุ"}
                  </strong>
                </div>
                {batteryItems.some((item) => item.detail || item.subDetail) && (
                  <details className="te-solution__more">
                    <summary>รายละเอียดแบตเตอรี่</summary>
                    {batteryItems.map((item, i) => (
                      <div key={i}>
                        <strong>{item.name}</strong>
                        <p style={{ whiteSpace: "pre-line" }}>
                          {[item.detail, item.subDetail]
                            .filter(Boolean)
                            .join("\n")}
                        </p>
                      </div>
                    ))}
                  </details>
                )}
              </>
            )}
          </section>
        </div>
        <section className="te-solution__panel mt-3">
          <h3>อุปกรณ์แนะนำ</h3>
          {accessories.map(item => (
            <div key={item.label} className="mb-3">
              <p className="mb-0">{item.label}: {item.product} × 1</p>
              {item.description && <small className="text-secondary">{item.description}</small>}
            </div>
          ))}
        </section>
        <footer className="te-solution__footer">
          <div>
            <p>กรุณายืนยันจำนวนอุปกรณ์และความเหมาะสมกับหน้างานก่อนติดตั้ง</p>
            <span>กด Export PDF เพื่อดูราคารวมโดยประมาณ</span>
          </div>
          <div className="te-solution__actions">
            <Button onClick={handleExportPDF} disabled={isExporting}>
              {isExporting ? "กำลังสร้างไฟล์..." : "Export PDF"}
            </Button>
          </div>
        </footer>
      </section>
      {exportError && <p role="alert">{exportError}</p>}
      <SpaceSuggestPdfPage
        fullName={fullName}
        personalData={personalData}
        pdfRef={pdfRef}
        spaceSug={spaceSug}
        priceList={priceList}
        priceItems={priceItems}
        battery={battery}
        accessories={accessories}
        getDriveImageUrl={getDriveImageUrl}
      />
    </div>
  );
}
