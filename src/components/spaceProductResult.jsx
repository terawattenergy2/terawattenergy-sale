import React, { useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useNavigate } from "react-router-dom";
import PdfPage from "./pdfPage";
import { FaLine } from "react-icons/fa";
function SpaceProductResult({ data, space, getDriveImageUrl }) {
  const GOOGLE_SHEET_API_URL =
    "https://script.google.com/macros/s/AKfycbwmtR-OOjtXiT3dwEZ6rtGnHC6Zb58bpx_VLhAI3RQB1E_Z6Pfv-2A0HTBdybpjDRSZWA/exec";
  const detail = data?.detail;

  const [selectedOptions, setSelectedOptions] = useState({});
  const [isExporting, setIsExporting] = useState(false);

  const pdfRef = useRef(null);

  // กำหนดค่าเริ่มต้นเป็น option_1
useEffect(() => {
  if (!space?.length) return;

  setSelectedOptions((previous) => {
    const newSelectedOptions = { ...previous };

    space.forEach((item) => {
      const availableOptions = getOptions(item);
      const currentValue = newSelectedOptions[item.id];

      // ถ้าค่าเดิมไม่ได้อยู่ในตัวเลือกที่อนุญาต
      // ให้เลือกตัวเลือกแรกอัตโนมัติ
      if (!availableOptions.includes(currentValue)) {
        newSelectedOptions[item.id] = availableOptions[0] || "";
      }
    });

    return newSelectedOptions;
  });
}, [space, data?.id]);

  const getOptions = (item) => {
    // เงื่อนไขเฉพาะแถว Sigen Battery
    if (String(item.id) === "2") {
      // ถ้าสินค้าที่เลือกมี data.id === 2
      // แสดงเฉพาะ option_2 และ option_3
      if (String(data?.id) === "2") {
        return [item.option_2, item.option_3].filter(Boolean);
      }

      // ถ้า data.id ไม่ใช่ 2 แสดงเฉพาะ option_1
      return [item.option_1].filter(Boolean);
    }

    // แถวอื่นแสดงตัวเลือกทั้งหมดตามปกติ
    return [
      item.option_1,
      item.option_2,
      item.option_3,
      item.option_4,
      item.option_5,
      item.option_6,
      item.option_7,
      item.option_8,
      item.option_9,
    ].filter(Boolean);
  };

  const handleSelectOption = (itemId, value) => {
    setSelectedOptions((previous) => ({
      ...previous,
      [itemId]: value,
    }));
  };

  const waitForImages = async (element) => {
    const images = Array.from(element.querySelectorAll("img"));

    await Promise.all(
      images.map((image) => {
        if (image.complete) {
          return Promise.resolve();
        }

        return new Promise((resolve) => {
          const done = () => resolve();

          image.addEventListener("load", done, {
            once: true,
          });

          image.addEventListener("error", done, {
            once: true,
          });

          // ไม่รอรูปเกิน 5 วินาที
          setTimeout(done, 5000);
        });
      }),
    );
  };
  const handleExportPDF = async () => {
    if (!pdfRef.current) return;

    try {
      setIsExporting(true);

      // Google Sheet มีปัญหา ก็ยัง Export PDF ต่อ
      try {
        await saveToGoogleSheet();
      } catch (sheetError) {
        console.error("Google Sheet error:", sheetError);
      }

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await waitForImages(pdfRef.current);

      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 5000,
      });

      const imageData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();

      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 7;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      const scaleRatio = Math.min(
        maxWidth / canvas.width,
        maxHeight / canvas.height,
      );

      const renderWidth = canvas.width * scaleRatio;

      const renderHeight = canvas.height * scaleRatio;

      const positionX = (pageWidth - renderWidth) / 2;

      pdf.addImage(
        imageData,
        "PNG",
        positionX,
        margin,
        renderWidth,
        renderHeight,
        undefined,
        "FAST",
      );

      const safeName = (fullName || "customer").replace(/[\\/:*?"<>|]/g, "-");

      pdf.save(`system-spec-${safeName}.pdf`);
    } catch (error) {
      console.error("Export PDF error:", error);

      alert(`ไม่สามารถ Export PDF ได้: ${error.message || "เกิดข้อผิดพลาด"}`);
    } finally {
      setIsExporting(false);
    }
  };

  const navigate = useNavigate();

  const handleRestart = () => {
    navigate("/");
  };

  const [personalData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("personal_data") || "{}");
    } catch (error) {
      console.error("อ่านข้อมูลส่วนตัวไม่ได้:", error);
      return {};
    }
  });

  const fullName = [personalData.firstName, personalData.lastName]
    .filter(Boolean)
    .join(" ");

  const saveToGoogleSheet = async () => {
    const payload = {
      name: personalData.firstName || "",
      username: personalData.lastName || "",
      email: personalData.email || "",
      phone: personalData.phone || "",

      suggest_product: data?.label || "",

      phase: selectedOptions["0"] || "",
      inverter_size: selectedOptions["1"] || "",
      bat: selectedOptions["2"] || "",
      bat_module: selectedOptions["3"] || "",
      home_energy: selectedOptions["4"] || "",
      ev_dc: selectedOptions["5"] || "",
    };

    await fetch(GOOGLE_SHEET_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });
  };

  return (
    <div>
      <div>
        <h4 className="mt-4 mb-4">{data?.label}</h4>
      </div>

      <div className="col-12 text-space p-2">
        {/*   <div>
          <h5>{detail?.title}</h5> <p className="small text-secondary">{detail?.desc}</p> 
        </div>*/}

        <div className="text-space row">
          {space?.map((item) => {


            const options = getOptions(item);
            const selectedValue = selectedOptions[item.id];

            return (
              <div className="space-data row w-100" key={item.id}>

                <div className="space-left col-6">
                  <h5>{item.title}</h5>
                  <p>{item.sub_title}</p>
                </div>

                {String(item?.id) === "3" ||
                String(item?.id) === "4" ||
                String(item?.id) === "5" ? (
                  <div className="space-right col-6">

                    <select
                      name={`space-${item.id}`}
                      value={selectedValue || ""}
                      onChange={(event) =>
                        handleSelectOption(item.id, event.target.value)
                      }
                    >
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-right col-6">
                    {options.map((option) => (
                      <Button
                        key={option}
                        className="me-2 mb-2 btn-space"
                        variant={
                          selectedValue === option
                            ? "primary"
                            : "outline-primary"
                        }
                        onClick={() => handleSelectOption(item.id, option)}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className=" d-flex gap-3 mt-3">
        <Button
          variant="outline-secondary"
          onClick={handleRestart}
          // disabled={isExporting}
        >
          Restart
        </Button>

        <Button
          variant="outline-success"
          onClick={handleExportPDF}
          disabled={isExporting}
        >
          {isExporting ? "กำลังสร้าง PDF..." : "Export PDF"}
        </Button>
      </div>

      <a
        href="https://lin.ee/60uFI44s"
        target="_blank"
        rel="noopener noreferrer"
        className="line-floating-button"
      >
        <FaLine />
        <span>ปรึกษาสเปกผ่าน LINE</span>
      </a>

      {/* ส่วนนี้ใช้สร้างหน้า PDF โดยเฉพาะ */}
      <PdfPage
        pdfRef={pdfRef}
        data={data}
        getDriveImageUrl={getDriveImageUrl}
        space={space}
        fullName={fullName}
        personalData={personalData}
        detail={detail}
        selectedOptions={selectedOptions}
      />
    </div>
  );
}

export default SpaceProductResult;
