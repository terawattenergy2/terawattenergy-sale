import React, { useRef, useState } from "react";
import { Button } from "react-bootstrap";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import SelectedProductDetails from "./SelectedProductDetails";
import SpaceSuggestPdfPage from "./SpaceSuggestPdfPage";
import BatterySummary from "./BatterySummary";
import { getBatterySummary } from "./battery-summary";
import { useNavigate } from "react-router-dom";

export default function SpaceSuggest({
  spaceSug,
  getDriveImageUrl,
  onCompare,
  onCustomize,
  priceList = [],
  batteryCatalog = [],
}) {
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
  const navigate = useNavigate();
  const battery = getBatterySummary(
    spaceSug,
    Array.isArray(priceList) ? priceList : [],
    Array.isArray(batteryCatalog) ? batteryCatalog : [],
  );
  const fullName = [personalData.firstName, personalData.lastName]
    .filter(Boolean)
    .join(" ");
  const handleExportPDF = async () => {
    if (!pdfRef.current || isExporting) return;
    setIsExporting(true);
    setExportError("");
    try {
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
      pdf.save(
        `${(spaceSug?.ans_product || "recommended-solution").replace(/[\\/:*?"<>|]/g, "-")}.pdf`,
      );
    } catch (error) {
      console.error(error);
      setExportError("สร้าง PDF ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsExporting(false);
    }
  };
  return (
    <div className="space-suggest-wrapper">
      <style>{`
      .solar-selected-unified { background: var(--te-surface, #fff); border: 1px solid var(--te-border, #e3eaf2); border-radius: 28px; overflow: hidden; }
      .solar-selected-unified > .solar-selected-main > :first-child { background: transparent; border: 0; box-shadow: none; margin: 0; border-radius: 0; }
      .solar-selected-battery { padding: 0 clamp(24px, 5vw, 80px) 40px; }
    `}</style>
      <div className="solar-selected-unified">
        <div className="solar-selected-main">
          <SelectedProductDetails
            product={spaceSug}
            getDriveImageUrl={getDriveImageUrl}
            onCompare={onCompare}
            onCustomize={onCustomize}
          />
        </div>
        {battery && (
          <div className="solar-selected-battery">
            <BatterySummary
              battery={battery}
              getDriveImageUrl={getDriveImageUrl}
              showPrice={false}
            />
          </div>
        )}
      </div>
      <div className="space-suggest-export">
        <Button variant="outline-secondary" onClick={() => navigate("/")}>
          Restart
        </Button>
        <Button onClick={handleExportPDF} disabled={isExporting}>
          {isExporting ? "กำลังสร้างไฟล์..." : "Export PDF"}
        </Button>
      </div>
      {exportError && <p role="alert">{exportError}</p>}
      <SpaceSuggestPdfPage
        fullName={fullName}
        personalData={personalData}
        pdfRef={pdfRef}
        spaceSug={spaceSug}
        battery={battery}
        getDriveImageUrl={getDriveImageUrl}
      />
    </div>
  );
}
