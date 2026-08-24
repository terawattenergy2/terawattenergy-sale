import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button, Image } from "react-bootstrap";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useNavigate } from "react-router-dom";
import PdfPage from "./pdfPage";

function SpaceProductResult({
  data,
  space,
  getDriveImageUrl,
  inverterTypes,
  selectedInverter,
  handleSelect,
}) {
  const GOOGLE_SHEET_API_URL =
    "https://script.google.com/macros/s/AKfycbwmtR-OOjtXiT3dwEZ6rtGnHC6Zb58bpx_VLhAI3RQB1E_Z6Pfv-2A0HTBdybpjDRSZWA/exec";
  const detail = data?.detail;
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const pdfRef = useRef(null);

  const getOptions = useCallback(
    (item) => {
      if (String(item?.id) === "2") {
        if (String(data?.id) === "2") {
          return [item?.option_2, item?.option_3].filter(Boolean);
        }
        return [item?.option_1].filter(Boolean);
      }
      return [
        item?.option_1,
        item?.option_2,
        item?.option_3,
        item?.option_4,
        item?.option_5,
        item?.option_6,
        item?.option_7,
        item?.option_8,
        item?.option_9,
      ].filter(Boolean);
    },
    [data?.id],
  );

  useEffect(() => {
    if (!space?.length) return;
    setSelectedOptions((previous) => {
      const newSelectedOptions = { ...previous };
      space.forEach((item) => {
        const availableOptions = getOptions(item);
        const currentValue = newSelectedOptions[item.id];
        if (!availableOptions.includes(currentValue)) {
          newSelectedOptions[item.id] = availableOptions[0] || "";
        }
      });
      return newSelectedOptions;
    });
  }, [space, data?.id, getOptions]);

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
        if (image.complete) return Promise.resolve();
        return new Promise((resolve) => {
          const done = () => resolve();
          image.addEventListener("load", done, { once: true });
          image.addEventListener("error", done, { once: true });
          setTimeout(done, 5000);
        });
      }),
    );
  };

  const handleExportPDF = async () => {
    if (!pdfRef.current) return;
    try {
      setIsExporting(true);
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

      const safeName = (fullName || "customer").replace(/[/\\?%*:|"<>]/g, "-");
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

  const dataCus = [
    {
      title: "Hybrid",
      id: 0,
      phase_1: "1 Phase",
      sizeInverter_1: [
        {
          id: 0,
          title: "Sigen Hybrid 5.0 SP2",
        },
      ],

      phase_2: "3 Phase",
      sizeInverter_2: [
        {
          id: 0,
          title: "Sigen Hybrid 10.0 SP2",
        },
      ],
      bat: [
        {
          id: 0,
          title: "BAT 10.0 (9.04kWh)",
        },
      ],
    },
    {
      title: "SigenStor",
      id: 0,
      phase_1: [
        {
          id: 0,
          title: "SigenStor EC 5.0 SP",
        },
        {
          id: 1,
          title: "SigenStor EC 10.0 SP",
        },
      ],

      phase_2: [
        {
          id: 0,
          title: "SigenStor EC 5.0 TP",
        },
        {
          id: 1,
          title: "SigenStor EC 10.0 TP",
        },
        {
          id: 2,
          title: "SigenStor EC 20.0 TP",
        },
        {
          id: 3,
          title: "SigenStor EC 25.0 TP",
        },
      ],
      bat: [
        {
          id: 0,
          title: "BAT 10.0 (9.04kWh)",
        },
      ],
    },
    {
      title: "Neo",
      id: 0,
      phase_1: [
        {
          id: 0,
          title: "SigenStor NEO EC 6.0 SP",
        },
        {
          id: 1,
          title: "SigenStor NEO EC 12.0 SP",
        },
      ],

      phase_2: [
        {
          id: 0,
          title: "SigenStor NEO EC 5.0 TP",
        },
        {
          id: 1,
          title: "SigenStor NEO EC 10.0 TP",
        },
        {
          id: 2,
          title: "SigenStor NEO EC 15.0 TP",
        },
      ],
      bat: [
        {
          id: 0,
          title: "BAT 6.0 (6.02kWh)",
        },
        {
          id: 1,
          title: "BAT 8.0 (6.02kWh)",
        },
      ],
    },
  ];

  const matchedData = dataCus.find(
    (item) =>
      item.title?.trim().toLowerCase() === data?.short?.trim().toLowerCase(),
  );

  const selectedPhase = selectedOptions["0"] || "1 Phase";

  const getMatchedOptions = (item) => {
    const itemId = String(item?.id);

    // หัวข้อ Phase
    if (itemId === "0") {
      return ["1 Phase", "3 Phase"];
    }

    // หัวข้อขนาด Inverter
    if (itemId === "1") {
      let inverterOptions = [];

      if (matchedData?.title === "Hybrid") {
        inverterOptions =
          selectedPhase === "3 Phase"
            ? matchedData?.sizeInverter_2
            : matchedData?.sizeInverter_1;
      } else {
        inverterOptions =
          selectedPhase === "3 Phase"
            ? matchedData?.phase_2
            : matchedData?.phase_1;
      }

      return (inverterOptions || []).map((option) => option.title);
    }

    // หัวข้อ Battery
    if (itemId === "2") {
      return (matchedData?.bat || []).map((option) => option.title);
    }

    // ตัวเลือกอื่น ๆ ใช้ข้อมูลเดิมจาก Google Sheet
    return getOptions(item);
  };

  const optionCus = {
    id: "5",
    title: "ชุดชาร์จ EV แบบ DC",
    sub_title: "รุ่น 12 kW ( สามารถอัพเกรด เป็นรุ่น 25Kw ได้)",
    type: "stor",
    option_1: "ไม่ติดตั้ง",
    option_2: "ติดตั้ง",
    option_3: "ติดตั้ง พร้อม License 25 KW",
  };

  return (
    <div>
      <div className="advanced-card mt-4 card-text">
        <h3>เลือกประเภทอินเวอร์เตอร์</h3>
        <p className="text-secondary small">
          Hybrid / SigenStor / Micro — แต่ละแบบเหมาะกับสถานการณ์ต่างกัน{" "}
        </p>
        <div className="advanced-card-2 mt-4 card-text">
          {inverterTypes.map((inverter) => (
            <div
              key={inverter.id}
              className={`inverter-card ${
                String(selectedInverter?.id) === String(inverter.id)
                  ? "active"
                  : ""
              }`}
              onClick={() => handleSelect(inverter)}
            >
              <div className="inverter-header">
                {inverter.image && (
                  <Image
                    className="inverter-image"
                    src={inverter.image}
                    alt={inverter.label}
                    style={{
                      width: "100%",
                      height: "160px",
                      objectFit: "contain",
                    }}
                  />
                )}
              </div>

              <div className="inverter-body">
                <h3>{inverter.label}</h3>
                <p>{inverter.desc}</p>
              </div>
            </div>
          ))}
        </div>{" "}
      </div>
      <div className="advanced-card mt-4 card-text">
        <h2>ปรับแต่งสเปกระบบ</h2>
        <p className="small text-secondary">
          {" "}
          เพิ่ม/ลดจำนวนโมดูล เปลี่ยนขนาดอินเวอร์เตอร์
          หรือเปิด-ปิดอุปกรณ์เสริมได้ตามหน้างานจริง{" "}
        </p>

        <div>
          <h4 className="mt-4 mb-4">{data?.label}</h4>
        </div>
        <div className="col-12 text-space p-2">
          <div className="text-space row">
            {space?.map((item) => {
              const options = getMatchedOptions(item);
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
                      {options.map((option, index) => (
                        <Button
                          key={`${item.id}-${option}-${index}`}
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
            {data.label === "SigenStor" ? (
              <div className="space-data row w-100">
                <div className="space-left col-6">
                  <h5>{optionCus.title}</h5>
                  <p>{optionCus.sub_title}</p>
                </div>
                <div className="space-right col-6">
                  <select
                    name={`space-${optionCus.id}`}
                    onChange={(event) =>
                      handleSelectOption(optionCus.id, event.target.value)
                    }
                    value={selectedOptions[optionCus.id] || ""}
                  >
                    <option value="ไม่ติดตั้ง">{optionCus.option_1}</option>
                    <option value="ติดตั้ง">{optionCus.option_2}</option>
                    <option value="ติดตั้ง พร้อม License 25 KW">
                      {optionCus.option_3}
                    </option>
                  </select>
                </div>
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
        <div className="d-flex gap-3 mt-3">
          <Button variant="outline-secondary" onClick={handleRestart}>
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

        <PdfPage
          pdfRef={pdfRef}
          data={data}
          getDriveImageUrl={getDriveImageUrl}
          space={space}
          fullName={fullName}
          personalData={personalData}
          detail={detail}
          selectedOptions={selectedOptions}
          optionCus={optionCus}
        />
      </div>
    </div>
  );
}

export default SpaceProductResult;
