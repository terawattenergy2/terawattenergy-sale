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
  const MICRO_SIZE_KEY = "microSize";
  const sugMicro = [
    {
      id: 0,
      type: 3,

      phase: [
        {
          id: 0,
          title: "1 phase",
          options: [
            {
              id: 0,
              title: "3 kw (Single Phase)",
              detail: [
                {
                  id: 0,
                  title: "SigenMicro 1000",
                  des: "SigenMicro Inverter 1000W 2-in-1",
                  count: "3",
                },
                {
                  id: 1,
                  title: "SigenMicro AC Trunk-20P-2.3M-2.5",
                  des: "SigenMicro AC Cable Kit-20-230-2.5",
                  count: "3",
                },
                {
                  id: 2,
                  title: "Sigen Sensor SP-CT100-WI for SigenMicro [New]",
                  des: "Sigen Power Sensor Single Phase CT 100A Wireless",
                  count: "1",
                },
                {
                  id: 3,
                  title: "SigenMicro AC Trunk Terminator",
                  des: "SigenMicro AC Trunk Terminator",
                  count: "1",
                },
                {
                  id: 4,
                  title: "SigenMicro AC Trunk Coupler",
                  des: "SigenMicro AC Trunk Coupler",
                  count: "1",
                },
                {
                  id: 5,
                  title: "SigenMicro AC Branch Unlock Tool",
                  des: "SigenMicro AC Branch Unlock Tool",
                  count: "1",
                },
                {
                  id: 6,
                  title: "SigenMicro AC Trunk Unlock Tool",
                  des: "SigenMicro AC Trunk Unlock Tool",
                  count: "1",
                },
              ],
            },
            {
              id: 1,
              title: "5 kw (Single Phase)",
              detail: [
                {
                  id: 0,
                  title: "SigenMicro 1000",
                  des: "SigenMicro Inverter 1000W 2-in-1",
                  count: "5",
                },
                {
                  id: 1,
                  title: "SigenMicro AC Trunk-20P-2.3M-4.0",
                  des: "SigenMicro AC Cable Kit-20-230-2.5",
                  count: "5",
                },
                {
                  id: 2,
                  title: "Sigen Sensor SP-CT100-WI for SigenMicro [New]",
                  des: "Sigen Power Sensor Single Phase CT 100A Wireless",
                  count: "1",
                },
                {
                  id: 3,
                  title: "SigenMicro AC Trunk Terminator",
                  des: "SigenMicro AC Trunk Terminator",
                  count: "1",
                },
                {
                  id: 4,
                  title: "SigenMicro AC Trunk Coupler",
                  des: "SigenMicro AC Trunk Coupler",
                  count: "1",
                },
                {
                  id: 5,
                  title: "SigenMicro AC Branch Unlock Tool",
                  des: "SigenMicro AC Branch Unlock Tool",
                  count: "1",
                },
                {
                  id: 6,
                  title: "SigenMicro AC Trunk Unlock Tool",
                  des: "SigenMicro AC Trunk Unlock Tool",
                  count: "1",
                },
              ],
            },
          ],
        },
        {
          id: 0,
          title: "3 phase",
          options: [
            {
              id: 0,
              title: "9 kw (Three Phase)",
              detail: [
                {
                  id: 0,
                  title: "SigenMicro 1000",
                  des: "SigenMicro Inverter 1000W 2-in-1",
                  count: "9",
                },
                {
                  id: 1,
                  title: "SigenMicro AC Trunk-20P-2.3M-2.5",
                  des: "SigenMicro AC Cable Kit-20-230-2.5",
                  count: "9",
                },
                {
                  id: 2,
                  title: "Sigen Sensor SP-CT100-WI for SigenMicro [New]",
                  des: "Sigen Power Sensor Single Phase CT 100A Wireless",
                  count: "1",
                },
                {
                  id: 3,
                  title: "SigenMicro AC Trunk Terminator",
                  des: "SigenMicro AC Trunk Terminator",
                  count: "3",
                },
                {
                  id: 4,
                  title: "SigenMicro AC Trunk Coupler",
                  des: "SigenMicro AC Trunk Coupler",
                  count: "3",
                },
                {
                  id: 5,
                  title: "SigenMicro AC Branch Unlock Tool",
                  des: "SigenMicro AC Branch Unlock Tool",
                  count: "1",
                },
                {
                  id: 6,
                  title: "SigenMicro AC Trunk Unlock Tool",
                  des: "SigenMicro AC Trunk Unlock Tool",
                  count: "1",
                },
              ],
            },
            {
              id: 1,
              title: "15 kw (Three Phase)",
              detail: [
                {
                  id: 0,
                  title: "SigenMicro 1000",
                  des: "SigenMicro Inverter 1000W 2-in-1",
                  count: "15",
                },
                {
                  id: 1,
                  title: "SigenMicro AC Trunk-20P-2.3M-4.0",
                  des: "SigenMicro AC Cable Kit-20-230-2.5",
                  count: "15",
                },
                {
                  id: 2,
                  title: "Sigen Sensor SP-CT100-WI for SigenMicro [New]",
                  des: "Sigen Power Sensor Single Phase CT 100A Wireless",
                  count: "1",
                },
                {
                  id: 3,
                  title: "SigenMicro AC Trunk Terminator",
                  des: "SigenMicro AC Trunk Terminator",
                  count: "3",
                },
                {
                  id: 4,
                  title: "SigenMicro AC Trunk Coupler",
                  des: "SigenMicro AC Trunk Coupler",
                  count: "3",
                },
                {
                  id: 5,
                  title: "SigenMicro AC Branch Unlock Tool",
                  des: "SigenMicro AC Branch Unlock Tool",
                  count: "1",
                },
                {
                  id: 6,
                  title: "SigenMicro AC Trunk Unlock Tool",
                  des: "SigenMicro AC Trunk Unlock Tool",
                  count: "1",
                },
              ],
            },
          ],
        },
      ],
    },
  ];

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
        item?.option_10,
      ].filter(Boolean);
    },
    [data?.id],
  );
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    setSelectedOptions({});
    setCurrentStep(0);
  }, [data?.id, data?.short]);

  const optionCus = {
    id: "5",
    title: "ชุดชาร์จ EV แบบ DC",
    sub_title: "รุ่น 12 kW ( สามารถอัพเกรด เป็นรุ่น 25Kw ได้)",
    type: "stor",
    option_1: "ไม่ติดตั้ง",
    option_2: "ติดตั้ง",
    option_3: "ติดตั้ง พร้อม License 25 KW",
  };

  const handleSelectOption = (itemId, value) => {
    const currentIndex = space?.findIndex(
      (item) => String(item.id) === String(itemId),
    );

    setSelectedOptions((previous) => {
      const updatedOptions = {
        ...previous,
        [itemId]: value,
      };

      if (currentIndex >= 0) {
        space.slice(currentIndex + 1).forEach((nextItem) => {
          delete updatedOptions[nextItem.id];
        });

        if (optionCus?.id !== undefined) {
          delete updatedOptions[optionCus.id];
        }
      }

      // ถ้า Micro เปลี่ยน Phase ให้ล้างขนาดที่เคยเลือก
      if (String(data?.id) === "3" && String(itemId) === "0") {
        delete updatedOptions[MICRO_SIZE_KEY];
      }

      return updatedOptions;
    });

    if (currentIndex >= 0) {
      setCurrentStep(currentIndex + 1);
    }

    scrollToNextQuestion(itemId);
  };


  // const isFormCompleted = isMainCompleted && isExtraCompleted;
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
  const handleReset = () => {
  setSelectedOptions({});
  setCurrentStep(0);

  document.querySelector(".micro-configurator")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
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

    inverter_size: isMicro
      ? selectedOptions[MICRO_SIZE_KEY] || ""
      : selectedOptions["1"] || "",

    bat: selectedOptions["2"] || "",
    bat_module: selectedOptions["3"] || "",
    home_energy: selectedOptions["4"] || "",
    ev_dc: selectedOptions["5"] || "",

    micro_products: isMicro
      ? (selectedMicroSize?.detail || [])
          .map((product) => `${product.title} x ${product.count}`)
          .join(", ")
      : "",
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

  const scrollToNextQuestion = (currentQuestionId) => {
    setTimeout(() => {
      const questions = Array.from(
        document.querySelectorAll(".progressive-question"),
      );

      const currentIndex = questions.findIndex(
        (question) =>
          String(question.dataset.questionId) === String(currentQuestionId),
      );

      const nextQuestion = questions[currentIndex + 1];

      if (nextQuestion) {
        nextQuestion.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 150);
  };
// 
const selectedMicroPhase = sugMicro[0]?.phase.find(
  (phase) => phase.title === selectedOptions["0"],
);

const selectedMicroSize = selectedMicroPhase?.options.find(
  (option) => option.title === selectedOptions[MICRO_SIZE_KEY],
);

const visibleSpace = space?.slice(0, currentStep + 1) || [];

const hasAnswer = (value) => {
  return value !== undefined && value !== null && value !== "";
};

const isMainCompleted =
  space?.length > 0 &&
  currentStep >= space.length &&
  space.every((item) => hasAnswer(selectedOptions[item.id]));

const hasExtraQuestion = data?.label === "SigenStor";

const isExtraCompleted =
  !hasExtraQuestion || hasAnswer(selectedOptions[optionCus?.id]);

// ตรวจสอบว่าเป็น SigenMicro
const isMicro = String(data?.id) === "3";

// Micro ต้องเลือกทั้งเฟสและขนาด
const isMicroCompleted =
  hasAnswer(selectedOptions["0"]) &&
  hasAnswer(selectedOptions[MICRO_SIZE_KEY]) &&
  Boolean(selectedMicroSize);

// เลือกวิธีตรวจตามประเภท Inverter
const isFormCompleted = isMicro
  ? isMicroCompleted
  : isMainCompleted && isExtraCompleted;
  return (
    <div className="space-product-result">
      <div className="advanced-card card-text">
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
              role="button"
              tabIndex={0}
              aria-pressed={
                String(selectedInverter?.id) === String(inverter.id)
              }
              onClick={() => handleSelect(inverter)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleSelect(inverter);
                }
              }}
            >
              <div className="inverter-header">
                {inverter.image && (
                  <Image
                    className="inverter-image"
                    src={inverter.image}
                    alt={inverter.label}
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
      <div className="advanced-card card-text">
        <h2>ปรับแต่งสเปกระบบ</h2>
        <p className="small text-secondary">
          {" "}
          เพิ่ม/ลดจำนวนโมดูล เปลี่ยนขนาดอินเวอร์เตอร์
          หรือเปิด-ปิดอุปกรณ์เสริมได้ตามหน้างานจริง{" "}
        </p>

        <div>
          <h4 className="mt-4 mb-4">{data?.label}</h4>
        </div>
        {String(data?.id) === "3" ? (
          <div className="col-12 text-space p-2 micro-configurator">
            <div className="text-space row">
              {/* คำถาม Phase */}
              <div
                className="space-data row w-100 progressive-question"
                data-question-id="0"
              >
                <div className="space-left col-6">
                  <h5>เฟสไฟฟ้า</h5>
                  {/* <p>เปลี่ยนรุ่นอินเวอร์เตอร์และ Gateway ให้ตรงเฟส</p> */}
                </div>

                <div className="space-right col-6">
                  {sugMicro[0].phase.map((phase) => (
                    <Button
                      key={phase.title}
                      className="me-2 mb-2 btn-space"
                      variant={
                        selectedOptions["0"] === phase.title
                          ? "primary"
                          : "outline-primary"
                      }
                      onClick={() => handleSelectOption("0", phase.title)}
                    >
                      {phase.title}
                    </Button>
                  ))}
                </div>
              </div>

              {/* แสดงขนาด หลังเลือก Phase */}
              {selectedMicroPhase && (
                <div
                  className="space-data-default option-2-neo row w-100 progressive-question"
                  data-question-id={MICRO_SIZE_KEY}
                >
                  {/* ไม่มีคำถาม */}

                  <div className="d-flex col-12 justify-content-center">
                    {selectedMicroPhase.options.map((option) => (
                      <Button
                        key={option.title}
                        className="me-2 btn-space "
                        variant={
                          selectedOptions[MICRO_SIZE_KEY] === option.title
                            ? "primary"
                            : "outline-primary"
                        }
                        onClick={() =>
                          handleSelectOption(MICRO_SIZE_KEY, option.title)
                        }
                      >
                        {option.title}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* แสดงรายการอุปกรณ์ หลังเลือกขนาด */}
              {selectedMicroSize && (
                <div
                  className="w-100 progressive-question"
                  data-question-id="micro-detail"
                >
                  <div className="micro-product-list">
                    {selectedMicroSize.detail.map((product) => (
                      <div className="micro-product-row" key={product.id}>
                        <div className="micro-product-info">
                          <h5>{product.title}</h5>
                          <p>{product.des}</p>
                        </div>

                        <div className="micro-product-count">
                          <span>จำนวน</span>
                          <strong>{product.count}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="col-12 text-space p-2 micro-configurator">
            <div className="text-space row">
              {visibleSpace.map((item, index) => {
                // ข้อแรกแสดงทันที
                // ข้อถัดไปจะแสดงเมื่อข้อก่อนหน้าทั้งหมดมีคำตอบแล้ว
                const canShow =
                  index === 0 ||
                  space
                    .slice(0, index)
                    .every((previousItem) =>
                      hasAnswer(selectedOptions[previousItem.id]),
                    );

                if (!canShow) return null;

                const options = getMatchedOptions(item);
                const selectedValue = selectedOptions[item.id] || "";

                const isSelectQuestion =
                  String(item?.id) === "3" ||
                  String(item?.id) === "4" ||
                  String(item?.id) === "5";

                return (
                  <div
                    className="space-data row w-100 progressive-question"
                    key={item.id}
                    data-question-id={item.id}
                  >
                    <div className="space-left col-6">
                      <h5>{item.title}</h5>
                      <p>{item.sub_title}</p>
                    </div>

                    {isSelectQuestion ? (
                      <div className="space-right col-6">
                        <select
                          name={`space-${item.id}`}
                          value={selectedValue}
                          onChange={(event) =>
                            handleSelectOption(item.id, event.target.value)
                          }
                        >
                          <option value="" disabled>
                            กรุณาเลือก
                          </option>

                          {options.map((option, optionIndex) => (
                            <option
                              key={`${item.id}-${option}-${optionIndex}`}
                              value={option}
                            >
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className=" row w-100 progressive-question space-right col-6">
                        {options.map((option, optionIndex) => (
                          <Button
                            key={`${item.id}-${option}-${optionIndex}`}
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
              {data?.label === "SigenStor" && isMainCompleted && (
                <div
                  className="space-data row w-100 progressive-question"
                  data-question-id={optionCus.id}
                >
                  <div className="space-left col-6">
                    <h5>{optionCus.title}</h5>
                    <p>{optionCus.sub_title}</p>
                  </div>

                  <div className="space-right col-6">
                    <select
                      name={`space-${optionCus.id}`}
                      value={selectedOptions[optionCus.id] || ""}
                      onChange={(event) =>
                        handleSelectOption(optionCus.id, event.target.value)
                      }
                    >
                      <option value="" disabled>
                        กรุณาเลือก
                      </option>

                      <option value="ไม่ติดตั้ง">{optionCus.option_1}</option>

                      <option value="ติดตั้ง">{optionCus.option_2}</option>

                      <option value="ติดตั้ง พร้อม License 25 KW">
                        {optionCus.option_3}
                      </option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      {isFormCompleted && (
  <div className="result-actions mt-3">
    <Button variant="outline-secondary" onClick={handleRestart}>
      Reset
    </Button>

    <Button
      variant="outline-success"
      onClick={handleExportPDF}
      disabled={isExporting}
    >
      {isExporting ? "กำลังสร้าง PDF..." : "Export PDF"}
    </Button>
  </div>
)}
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
  isMicro={isMicro}
  microSizeKey={MICRO_SIZE_KEY}
  selectedMicroSize={selectedMicroSize}
/>
      </div>
    </div>
  );
}

export default SpaceProductResult;