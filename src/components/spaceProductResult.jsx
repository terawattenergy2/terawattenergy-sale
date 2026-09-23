import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Button, Image, Modal, Spinner } from "react-bootstrap";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useNavigate } from "react-router-dom";
import PdfPage from "./pdfPage";
import { supabase } from "../supabase";

// ค่าคงที่ถอดจากแท็บ "สูตรคิด" ไม่ได้ดึงสดจาก Google Sheets
const ENERGY_ASSUMPTIONS = {
  equivalentSunHours: 4,
  electricityRate: 4.5,
  batteryEnergyFraction: 0.5, // จำลองสูตรหาร 2 ในชีต ไม่ใช่การแปลง C-rate
  airconPowerKw: 1,
};

function calculateEnergySummary(options, isMicro) {
  const model = String(isMicro ? options.microSize || "" : options["1"] || "");
  // อ่านเลขกำลังเฉพาะรูปแบบชื่อรุ่นที่ใช้ในตัวเลือก ไม่อ่าน SP2 เป็นกำลังไฟ
  const powerMatch = isMicro
    ? model.match(/^(\d+(?:\.\d+)?)\s*kW\b/i)
    : model.match(/(?:Hybrid|EC|NEO)\s+(\d+(?:\.\d+)?)\s+(?:SP|TP)/i);

  const inverterKw = powerMatch ? Number(powerMatch[1]) : null;
  const production =
    inverterKw === null
      ? null
      : inverterKw * ENERGY_ASSUMPTIONS.equivalentSunHours;
  const capacityMatch = String(options["2"] || "").match(
    /\(\s*(\d+(?:\.\d+)?)\s*kWh\s*\)/i,
  );
  const rawCount = String(options["3"] ?? "").trim();
  const count = /^\d+$/.test(rawCount) ? Number(rawCount) : null;
  const batteryKwh =
    !isMicro && capacityMatch && count !== null
      ? Number(capacityMatch[1]) * count
      : null;
  const usableForEstimate =
    batteryKwh === null
      ? null
      : batteryKwh * ENERGY_ASSUMPTIONS.batteryEnergyFraction;
  return {
    production,
    savings:
      usableForEstimate === null
        ? null
        : usableForEstimate * ENERGY_ASSUMPTIONS.electricityRate,
    airconHours:
      usableForEstimate === null
        ? null
        : usableForEstimate / ENERGY_ASSUMPTIONS.airconPowerKw,
  };
}

const formatEnergyValue = (value) =>
  value === null || !Number.isFinite(value)
    ? "—"
    : new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(
        value,
      );
function buildPriceSummary(items, priceList) {
  const prices = Array.isArray(priceList) ? priceList : [];

  const toNumber = (value) => {
    if (
      (typeof value !== "number" && typeof value !== "string") ||
      String(value).trim() === ""
    ) {
      return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };

  const lines = items.map((item) => {
    // product ใช้ค้นหาใน Supabase; title ใช้แสดงผลให้ลูกค้า
    const product = String(item.product ?? item.title ?? "").trim();
    const match = product
      ? prices.find((entry) => String(entry.product ?? "").trim() === product)
      : undefined;

    const parsedPrice = toNumber(item.price ?? match?.price);
    const unitPrice =
      parsedPrice !== null && parsedPrice >= 0 ? parsedPrice : null;

    const parsedQuantity = toNumber(item.quantity);
    const quantity =
      Number.isInteger(parsedQuantity) && parsedQuantity > 0
        ? parsedQuantity
        : null;

    const status = item.status ?? match?.status ?? null;
    const rawEndCalculate = item.end_calculate ?? match?.end_calculate;

    // ใช้ค่าตัวเลขสำหรับคำนวณ โดย false จะได้ null
    const endCalculate = toNumber(rawEndCalculate);

    return {
      ...item,
      product,
      price: unitPrice,
      text: match?.text ?? item.text ?? null,
      end_text: match?.end_text ?? item.end_text ?? null,
      status,
      end_calculate: rawEndCalculate === false ? false : endCalculate,
      // คำนวณเฉพาะ status ที่เป็น boolean
      endCalculateTotal:
        status === true && endCalculate !== null && quantity !== null
          ? endCalculate * quantity
          : null,

      unitPrice,
      quantity,
      subtotal:
        unitPrice !== null && quantity !== null ? unitPrice * quantity : null,
    };
  });

  const knownTotal = lines.reduce((sum, item) => sum + (item.subtotal ?? 0), 0);

  const markupAmount =
    Math.round((knownTotal * 0.1 + Number.EPSILON) * 100) / 100;

  const totalWithMarkup =
    Math.round((knownTotal + markupAmount + Number.EPSILON) * 100) / 100;

  return {
    lines,
    knownTotal,
    markupAmount,
    totalWithMarkup,
    complete: lines.length > 0 && lines.every((item) => item.subtotal !== null),
  };
}

const formatPrice = (value) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);

function SpaceProductResult({
  data,
  space,
  getDriveImageUrl,
  inverterTypes,
  selectedInverter,
  handleSelect,
  priceList,
}) {
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
              title: "3 kWh (Single Phase)",
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
              title: "5 kWh (Single Phase)",
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
              title: "9 kWh (Three Phase)",
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
              title: "15 kWh (Three Phase)",
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
  // const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    setSelectedOptions({});
    // setCurrentStep(0);
  }, [data?.id, data?.short]);

  const navigate = useNavigate();
  const handleRestart = () => {
    navigate("/");
  };
  const selectBat = selectedOptions["2"];
  const noBattery = selectBat === "ไม่รับแบตเตอรี่";

  // 4 = Home Energy Gateway
  // const skippedIds = noBattery ? ["4"] : [];
  const skippedIds = noBattery ? ["3", "4"] : [];

  const isSigenStor = String(data?.id) === "1";
  const batteryCount = String(selectedOptions["3"] ?? "");
  const canSelectEv =
    isSigenStor && (noBattery || (batteryCount !== "" && batteryCount !== "6"));
  const activeSpace = (space || []).filter(
    (item) =>
      !skippedIds.includes(String(item.id)) &&
      (String(item.id) !== "5" || canSelectEv),
  );

  const hasAnswer = (value) =>
    value !== undefined && value !== null && value !== "";

  const firstUnansweredIndex = activeSpace.findIndex(
    (item) => !hasAnswer(selectedOptions[item.id]),
  );

  // แสดงถึงคำถามแรกที่ยังไม่ได้ตอบ
  const visibleSpace =
    firstUnansweredIndex === -1
      ? activeSpace
      : activeSpace.slice(0, firstUnansweredIndex + 1);

  const isMainCompleted =
    activeSpace.length > 0 &&
    activeSpace.every((item) => hasAnswer(selectedOptions[item.id]));

  const handleSelectOption = (itemId, value) => {
    const currentIndex = space?.findIndex(
      (item) => String(item.id) === String(itemId),
    );
    // setSelectBat(value)
    setSelectedOptions((previous) => {
      const updatedOptions = {
        ...previous,
        [itemId]: value,
      };

      if (currentIndex >= 0) {
        space.slice(currentIndex + 1).forEach((nextItem) => {
          delete updatedOptions[nextItem.id];
        });
      }

      // ถ้า Micro เปลี่ยน Phase ให้ล้างขนาดที่เคยเลือก
      if (String(data?.id) === "3" && String(itemId) === "0") {
        delete updatedOptions[MICRO_SIZE_KEY];
      }

      return updatedOptions;
    });

    scrollToNextQuestion(itemId);
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
  if (!pdfRef.current || isExporting) return;

  try {
    setIsExporting(true);

    await new Promise((resolve) =>
      window.requestAnimationFrame(() => window.setTimeout(resolve, 0)),
    );

    await saveToSupabase();

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

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 5;

    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    // รักษาสัดส่วนภาพ และให้เนื้อหาทั้งหมดอยู่ในหน้าเดียว
    const scale = Math.min(
      availableWidth / canvas.width,
      availableHeight / canvas.height,
    );

    const renderWidth = canvas.width * scale;
    const renderHeight = canvas.height * scale;

    // เพิ่มภาพเพียงครั้งเดียว
    pdf.addImage({
      imageData: canvas.toDataURL("image/jpeg", 0.95),
      format: "JPEG",
      x: (pageWidth - renderWidth) / 2,
      y: margin,
      width: renderWidth,
      height: renderHeight,
      compression: "FAST",
    });

    const safeName = (fullName || "customer").replace(
      /[/\\?%*:|"<>]/g,
      "-",
    );

    pdf.save(`system-spec-${safeName}.pdf`);
  } catch (error) {
    console.error("Export PDF error:", error);
    alert(
      `ไม่สามารถ Export PDF ได้: ${error.message || "เกิดข้อผิดพลาด"}`,
    );
  } finally {
    setIsExporting(false);
  }
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

  const saveToSupabase = async () => {
    const payload = {
      first_name: personalData.firstName || "",
      last_name: personalData.lastName || "",
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

    const { error: saveError } = await supabase.from("customer_quotes").insert({
      ...payload,
      selected_options: selectedOptions,
      price_summary: priceSummary,
      total_price: totalPrice, // <-- ตัวแปร totalPrice อาจมีค่าเป็น null / NaN
      markup_percent: 10,
      vat_included: false,
    });

    if (saveError) {
      throw new Error(
        `บันทึกข้อมูลลง Supabase ไม่สำเร็จ: ${saveError.message}`,
      );
    }
  };

  const [rawDataCus, setRawDataCus] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadDataCus() {
      const { data: rows, error } = await supabase
        .from("data_cus")
        .select("*")
        .order("id", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("โหลด data_cus ไม่สำเร็จ:", error.message);
        return;
      }

      setRawDataCus(rows ?? []);
    }

    loadDataCus();

    return () => {
      cancelled = true;
    };
  }, []);

  const dataCus = useMemo(() => {
    const prices = Array.isArray(priceList) ? priceList : [];

    const addPrices = (items) => {
      if (!Array.isArray(items)) return [];

      return items.map((item) => {
        const title = String(item.title ?? "").trim();
        const matchedPrice = title
          ? prices.find((entry) => String(entry.product ?? "").trim() === title)
          : undefined;

        return {
          ...item,
          price: matchedPrice?.price ?? null,
        };
      });
    };

    return rawDataCus.map((item) => ({
      ...item,
      sizeInverter_1: addPrices(item.sizeInverter_1),
      sizeInverter_2: addPrices(item.sizeInverter_2),
      bat: addPrices(item.bat),
    }));
  }, [rawDataCus, priceList]);

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
      const inverterOptions =
        selectedPhase === "3 Phase"
          ? matchedData?.sizeInverter_2
          : matchedData?.sizeInverter_1;

      return (inverterOptions ?? []).map((option) => option.title);
    }

    // หัวข้อ Battery
    if (itemId === "2") {
      return (matchedData?.bat || []).map((option) => option.title);
    }

    // Home Energy Gateway: แสดงเฉพาะรุ่นที่ตรงกับเฟสที่เลือก
    if (itemId === "4") {
      const phase = String(selectedOptions["0"] ?? "").match(
        /\b([13])\s*phase\b/i,
      )?.[1];

      return getOptions(item).filter((option) => {
        const text = String(option).trim();

        // ตัวเลือกไม่เพิ่ม Gateway ใช้ได้ทั้งสองเฟส
        if (text === "ไม่เพิ่มเติม") return true;

        const optionPhase = text.match(/\b([13])\s*phase\b/i)?.[1];
        return Boolean(phase && optionPhase === phase);
      });
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

  // ตรวจสอบว่าเป็น SigenMicro
  const isMicro = String(data?.id) === "3";

  // คำนวณจาก state ทุก render จึงอัปเดตทันทีเมื่อเปลี่ยนตัวเลือก
  const energySummary = calculateEnergySummary(selectedOptions, isMicro);
  const selectedPriceItems = [];
  // Micro ต้องเลือกทั้งเฟสและขนาด
  const isMicroCompleted =
    hasAnswer(selectedOptions["0"]) &&
    hasAnswer(selectedOptions[MICRO_SIZE_KEY]) &&
    Boolean(selectedMicroSize);
  // เลือกวิธีตรวจตามประเภท Inverter
  const isFormCompleted = isMicro ? isMicroCompleted : isMainCompleted;

  if (isMicro) {
    (selectedMicroSize?.detail ?? []).forEach((item) => {
      selectedPriceItems.push({ title: item.title, quantity: item.count });
    });
  } else {
    const inverterOptions =
      selectedPhase === "3 Phase"
        ? matchedData?.sizeInverter_2
        : matchedData?.sizeInverter_1;
    const inverterOption = (inverterOptions ?? []).find(
      (item) => item.title === selectedOptions["1"],
    );
    if (selectedOptions["1"]) {
      selectedPriceItems.push({
        title: selectedOptions["1"],
        quantity: 1,
        price: inverterOption?.price,
      });
    }
    const batteryOption = (matchedData?.bat ?? []).find(
      (item) => item.title === selectedOptions["2"],
    );
    if (selectedOptions["2"]) {
      selectedPriceItems.push({
        title: selectedOptions["2"],
        quantity: selectedOptions["3"],
        price: batteryOption?.price,
      });
    }
    const gateway = selectedOptions["4"];
    if (gateway && gateway !== "ไม่เพิ่มเติม" && gateway !== "ไม่ติดตั้ง") {
      selectedPriceItems.push({ title: gateway, quantity: 1 });
    }

    const evQuestion = activeSpace.find((item) => String(item.id) === "5");
    const evOption = selectedOptions["5"];
    if (evQuestion && evOption && evOption !== "ไม่ติดตั้ง") {
      selectedPriceItems.push({
        title: `${evQuestion.title}: ${evOption}`,
        // price_list.product ในภาพคือ "ติดตั้ง" ไม่ใช่ชื่อหัวข้อรวมตัวเลือก
        product: evOption,
        quantity: 1,
      });
    }
  }

  const priceSummary = buildPriceSummary(selectedPriceItems, priceList);
  const totalPrice =
    isFormCompleted && priceSummary.complete
      ? priceSummary.totalWithMarkup
      : null;

  return (
    <div className="space-product-result">
      <Modal
        show={isExporting}
        centered
        backdrop="static"
        keyboard={false}
        aria-labelledby="pdf-loading-title"
      >
        <Modal.Body className="text-center py-5 px-4">
          <Spinner animation="border" variant="primary" aria-hidden="true" />
          <div role="status" aria-live="polite">
            <h3 id="pdf-loading-title" className="h5 mt-4 mb-2">
              กำลังสร้างไฟล์ PDF
            </h3>
            <p className="text-secondary mb-0">
              กำลังเตรียมข้อมูลและรูปภาพ กรุณารอสักครู่
            </p>
          </div>
        </Modal.Body>
      </Modal>

      <div className="advanced-card card-text">
        <h3>เลือกประเภทอินเวอร์เตอร์</h3>
        <p className="text-secondary small">
          Hybrid / SigenStor / Micro — แต่ละแบบเหมาะกับสถานการณ์ต่างกัน{" "}
        </p>
        <div className="advanced-card-2 mt-4 card-text">
          {inverterTypes.map((inverter) => {
            const isSelected =
              String(selectedInverter?.id) === String(inverter.id);

            return (
              <div
                key={inverter.id}
                className={`inverter-card ${
                  isSelected ? "inverter-card-selected" : ""
                }`}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
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
            );
          })}
        </div>
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
                  <h5>ระบบไฟฟ้า</h5>
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
                  className="space-data row w-100 progressive-question"
                  data-question-id="0"
                >
                  <div className="space-left col-6">
                    <h5>กำลังการติดตั้ง</h5>
                    {/* <p>เปลี่ยนรุ่นอินเวอร์เตอร์และ Gateway ให้ตรงเฟส</p> */}
                  </div>

                  <div className="space-right col-6">
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
                const canShow = activeSpace
                  .slice(0, index)
                  .every((previousItem) =>
                    hasAnswer(selectedOptions[previousItem.id]),
                  );

                if (!canShow) return null;

                const options = getMatchedOptions(item);
                const currentValue = selectedOptions[item.id] ?? "";
                const selectedValue = options.includes(currentValue)
                  ? currentValue
                  : "";

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
                        <>
                          <div className="space-right col-6 d-flex flex-column align-items-start">
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

                            {String(data?.id) === 1 &&
                              String(item?.id) === 3 &&
                              String(selectedValue) === 6 && (
                                <p className="text-danger mt-2 mb-0">
                                  หากติดแบต 6 ก้อน ไม่สามารถติด EVDC ได้
                                </p>
                              )}
                          </div>
                        </>
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
            </div>
          </div>
        )}
        {(selectedOptions["1"] || selectedOptions[MICRO_SIZE_KEY]) && (
          <section className="mt-4 mb-4" aria-labelledby="energy-summary-title">
            <h3 id="energy-summary-title" className="h5 mb-3">
              สรุปประโยชน์ของระบบ
            </h3>
            <div className="row g-3">
              {[
                {
                  label: "ลดค่าไฟโดยประมาณจากแบตเตอรี่",
                  unit: "บาท/รอบ",
                  value: energySummary.savings,
                },
                {
                  label: "ผลิตไฟได้โดยประมาณ",
                  unit: "หน่วย/วัน",
                  value: energySummary.production,
                },
                {
                  label: "เทียบเท่ากับการเปิดแอร์ 12,000 BTU จากแบตเตอรี่",
                  unit: "ชม./ วัน",
                  value: energySummary.airconHours,
                },
              ].map(({ label, unit, value }) => (
                <div className="col-12 col-md-4" key={label}>
                  <div className="border rounded-3 p-4 h-100 d-flex flex-column">
                    <h4 className="h6 mb-4">{label}</h4>
                    <div className="d-flex align-items-end gap-3 mt-auto">
                      <strong className="fs-2" aria-live="polite">
                        {formatEnergyValue(value)}
                      </strong>
                      <span className="text-nowrap">{unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="small text-secondary mt-3 mb-1">
              ประมาณการตามสูตรที่กำหนด: กำลังอินเวอร์เตอร์ × 4 ชั่วโมง/วัน
              โดยสมมุติขนาดแผงเพียงพอ; ค่าไฟ 4.50 บาท/หน่วย
              และแอร์ใช้กำลังไฟเฉลี่ย 1 kW อ้างอิงจากการใช้แบตเตอรี่ 1 รอบ/ วัน ผลจริงขึ้นกับการติดตั้งและการใช้งาน
            </p>
            <p className="small text-secondary mb-0">
              {/* ค่าไฟและชั่วโมงแอร์ใช้พลังงานแบต 50% ต่อรอบ */}
              {isMicro
                ? " ระบบ Micro ไม่มีแบตเตอรี่ จึงไม่แสดงสองค่าที่อิงแบตเตอรี่"
                : energySummary.savings === null ||
                    energySummary.airconHours === null
                  ? " ยังไม่มีข้อมูลแบตเตอรี่ที่ใช้คำนวณได้ กรุณาตรวจสอบรุ่นและจำนวนแบตเตอรี่"
                  : ""}
            </p>
          </section>
        )}
        {/* {priceSummary.lines.length > 0 && (
          <section
            className="border rounded-3 p-4 mt-4"
            aria-labelledby="selected-price-title"
          >
            <h3 id="selected-price-title" className="h5 mb-3">
              สรุปราคาอุปกรณ์ที่เลือก
            </h3>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>รายการ</th>
                    <th>จำนวน</th>
                    <th className="text-end">ราคา/หน่วย</th>
                    <th className="text-end">รวม (บาท)</th>
                  </tr>
                </thead>
                <tbody>
                  {priceSummary.lines.map((item, index) => (
                    <tr key={`${item.title}-${index}`}>
                      <td>{item.title}</td>
                      <td>{item.quantity ?? "รอเลือกจำนวน"}</td>
                      <td className="text-end">
                        {item.unitPrice === null
                          ? "ไม่พบราคา"
                          : formatPrice(item.unitPrice)}
                      </td>
                      <td className="text-end">
                        {item.subtotal === null
                          ? "—"
                          : formatPrice(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="d-flex justify-content-between gap-3 mb-2">
              <span>ยอดก่อนบวกเพิ่ม</span>
              <span>{formatPrice(priceSummary.knownTotal)} บาท</span>
            </div>
            <div className="d-flex justify-content-between gap-3 mb-2">
              <span>บวกเพิ่ม 10%</span>
              <span>{formatPrice(priceSummary.markupAmount)} บาท</span>
            </div>
            <div
              className="d-flex justify-content-between gap-3"
              aria-live="polite"
            >
              <strong>
                {totalPrice !== null
                  ? "ยอดรวมหลังบวกเพิ่ม 10%"
                  : "ยอดรายการที่คำนวณได้ หลังบวกเพิ่ม 10%"}
              </strong>{formatPrice(priceSummary.totalWithMarkup).replace(
                        /\d(?=(?:\D*\d){0,3}\D*$)/g,
                        "X",
                      )}
              <strong>{formatPrice(priceSummary.totalWithMarkup)} บาท</strong>
            </div>
   
            {!isFormCompleted && (
              <p className="text-secondary small mt-2 mb-0">
                ยอดจะอัปเดตตามตัวเลือก กรุณาเลือกสเปกให้ครบ
              </p>
            )}
          </section>
        )} 

        {priceSummary.lines
          .filter((item) => item.text || item.end_text)
          .map((item, index) => (
            <div
              key={`${item.title}-${index}`}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "10px",
                marginTop: index === 0 ? 0 : "10px",
                breakInside: "avoid",
                pageBreakInside: "avoid",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  color: "#287653",
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                •
              </span>

              <p
                style={{
                  margin: 0,
                  fontSize: "15px",
                  lineHeight: 1.85,
                  color: "#34483d",
                  overflowWrap: "anywhere",
                }}
              >
                {item.text}{" "}
                { item.quantity != null && (
                  <strong style={{ color: "#176342", fontSize: "17px" }}>
                    {item.quantity}{" "}
                  </strong>
                )}
                {item.end_text}{" "}
                {item.status === true &&
                  typeof item.endCalculateTotal === "number" &&
                  Number.isFinite(item.endCalculateTotal) && (
                    <strong
                      style={{
                        color: "#176342",
                        fontSize: "17px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatEnergyValue(item.endCalculateTotal)} kWh
                    </strong>
                  )}
              </p>
            </div>
          ))} */}

        {isFormCompleted && (
          <>
            <p className="small text-danger mt-3 mb-1">
              กด Export เพื่อแสดงราคาโดยประมาณ
              และสรุปสเปกอินเวอร์ดตอร์ที่ท่านเลือก
            </p>{" "}
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
          </>
        )}
        <PdfPage
          formatPrice={formatPrice}
          priceSummary={priceSummary}
          totalPrice={totalPrice}
          energySummary={energySummary}
          pdfRef={pdfRef}
          data={data}
          getDriveImageUrl={getDriveImageUrl}
          space={activeSpace}
          fullName={fullName}
          personalData={personalData}
          detail={detail}
          selectedOptions={selectedOptions}
          isMicro={isMicro}
          microSizeKey={MICRO_SIZE_KEY}
          selectedMicroSize={selectedMicroSize}
        />
      </div>
    </div>
  );
}

export default SpaceProductResult;
