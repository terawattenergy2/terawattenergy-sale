import React, { useRef, useState } from "react";
import { Button } from "react-bootstrap";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import SelectedProductDetails from "./SelectedProductDetails";
import SpaceSuggestPdfPage from "./SpaceSuggestPdfPage";
import { useNavigate } from "react-router-dom";

function SpaceSuggest({ spaceSug, getDriveImageUrl, onCompare, onCustomize }) {
  const pdfRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
const [personalData] = useState(() => {
  try {
    return JSON.parse(
      localStorage.getItem("personal_data") || "{}"
    );
  } catch (error) {
    console.error("อ่านข้อมูลส่วนตัวไม่ได้:", error);

    localStorage.removeItem("personal_data");

    return {};
  }
});
  const fullName = [personalData.firstName, personalData.lastName]
    .filter(Boolean)
    .join(" ");

  const handleExportPDF = async () => {
    if (!pdfRef.current || isExporting) return;

    try {
      setIsExporting(true);

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const element = pdfRef.current;
      const images = Array.from(element.querySelectorAll("img"));

      // รอรูปทั้งหมดโหลดเสร็จ
      await Promise.all(
        images.map((image) => {
          if (image.complete) {
            return Promise.resolve();
          }

          return new Promise((resolve) => {
            image.onload = resolve;
            image.onerror = resolve;
          });
        }),
      );

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight,
        windowWidth: 794,
        windowHeight: 1122,
      });

      const imageData = canvas.toDataURL("image/png", 1);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();

      const pageHeight = pdf.internal.pageSize.getHeight();

      // ป้องกันค่าทศนิยมเกินขอบ A4
      const safetyMargin = 0.5;
      const availableWidth = pageWidth - safetyMargin * 2;
      const availableHeight = pageHeight - safetyMargin * 2;

      // รักษาสัดส่วน Canvas และย่อให้พอดีหน้าเดียว
      const scaleX = availableWidth / canvas.width;

      const scaleY = availableHeight / canvas.height;

      const pdfScale = Math.min(scaleX, scaleY);

      const renderWidth = canvas.width * pdfScale;

      const renderHeight = canvas.height * pdfScale;

      // จัดให้อยู่กลางหน้า
      const positionX = (pageWidth - renderWidth) / 2;

      const positionY = (pageHeight - renderHeight) / 2;

      // เพิ่มเพียงครั้งเดียว จึงมี PDF หน้าเดียว
      pdf.addImage(
        imageData,
        "PNG",
        positionX,
        positionY,
        renderWidth,
        renderHeight,
      );

      const fileName = (spaceSug?.ans_product || "recommended-solution")
        .replace(/[\\/:*?"<>|]/g, "-")
        .trim();

      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error("Export PDF Error:", error);

      alert("ไม่สามารถ Export PDF ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsExporting(false);
    }
  };
  const navigate = useNavigate();

  const handleRestart = () => {
    navigate("/");
  };
  return (
    <div className="space-suggest-wrapper">
      <SelectedProductDetails
        product={spaceSug}
        getDriveImageUrl={getDriveImageUrl}
        onCompare={onCompare}
        onCustomize={onCustomize}
      />

      {/* ปุ่ม Export อยู่นอกหน้าสำหรับ PDF */}
      <div className="space-suggest-export">
        <Button variant="outline-secondary" onClick={handleRestart}>
          Restart
        </Button>

        <Button
          type="button"
          className="btn-export-pdf"
          onClick={handleExportPDF}
          disabled={isExporting}
        >
          {isExporting ? "กำลังสร้างไฟล์..." : "Export PDF"}
        </Button>
      </div>

      {/* Template ที่ใช้สร้าง PDF */}
      <SpaceSuggestPdfPage
        fullName={fullName}
        personalData={personalData}
        pdfRef={pdfRef}
        spaceSug={spaceSug}
        getDriveImageUrl={getDriveImageUrl}
      />
    </div>
  );
}

export default SpaceSuggest;
