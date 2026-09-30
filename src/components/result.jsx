import React, { useEffect, useRef, useState } from "react";
import { Row, Col, Button } from "react-bootstrap";
import "./resultComparison.css";
// import "./ResultRestart.css";
import SpaceProductResult from "./spaceProductResult";
import LoadingResult from "./LoadingResult";
import {
  FaLine,
  FaCubes,
  FaExchangeAlt,
  FaBatteryFull,
  FaLightbulb,
  FaRulerCombined,
  FaChargingStation,
  FaBolt,
  FaCheckCircle,
} from "react-icons/fa";
import SpaceSuggest from "./spaceSuggest";
import { mergeSolarProducts } from "./merge-solar-products";
import { useLocation, useNavigate } from "react-router-dom";
import { IoRefresh } from "react-icons/io5";

// Strip the quantity suffix only for catalog lookups; keep display names intact.
const normalizeProductName = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+2\s+Unit$/i, "")
    .trim();

const restoreCatalogDetails = (product, catalog) => {
  if (!product.missingCatalogDetails) return product;

  const name = normalizeProductName(product.ans_product);
  if (!name) return product;

  const match =
    catalog.find((item) => String(item.ans_product ?? "").trim() === name) ||
    catalog.find((item) => normalizeProductName(item.ans_product) === name);
  if (!match) return product;

  // Copy only catalog presentation fields, preserving solar quantities and prices.
  return {
    ...product,
    img_product: match.img_product,
    detail_product: match.detail_product,
    sub_detail_product: match.sub_detail_product,
    short: match.short,
    missingCatalogDetails: false,
  };
};

const getDriveImageUrl = (url) => {
  if (!url) return "";
  if (!url.includes("drive.google.com")) return url;

  const match =
    url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);

  if (match && match[1]) {
    const fileId = match[1];
    const driveDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    return `https://wsrv.nl/?url=${encodeURIComponent(driveDownloadUrl)}`;
  }

  return url;
};

// จัดหมวดจากข้อความเดิม โดยเก็บข้อความที่ไม่ตรงหมวดไว้ในรายละเอียดอื่น
const comparisonSections = [
  {
    key: "design",
    title: "การออกแบบและการติดตั้ง",
    symbol: "◇",
    pattern: /ดีไซน์|บาง|modular|5-in-one|ติดตั้ง/i,
  },
  {
    key: "noise",
    title: "เสียงขณะทำงาน",
    symbol: "◌",
    pattern: /เสียง|เงียบ|พัดลม|\bdB\b/i,
  },
  {
    key: "solar",
    title: "การรองรับแผงโซลาร์",
    symbol: "☀",
    pattern: /แผง|โซลาร์|MPPT/i,
  },
  {
    key: "protection",
    title: "การป้องกันน้ำและฝุ่น",
    symbol: "⬡",
    pattern: /กันน้ำ|กันฝุ่น|IP\d+/i,
  },
  {
    key: "ev",
    title: "การชาร์จรถยนต์ไฟฟ้า",
    symbol: "↯",
    pattern: /รถไฟฟ้า|รถยนต์ไฟฟ้า|EV|Charging/i,
  },
  {
    key: "backup",
    title: "ระบบไฟสำรอง",
    symbol: "ϟ",
    pattern: /ไฟสำรอง|Backup/i,
  },
  {
    key: "energy",
    title: "การจัดการพลังงาน",
    symbol: "◎",
    pattern: /AI|วิเคราะห์|จัดการพลังงาน/i,
  },
  { key: "other", title: "รายละเอียดอื่น", symbol: "＋" },
];

const cleanDetail = (value) => {
  const text = String(value ?? "").trim();
  return /^[-–—]+$/.test(text) ? "" : text;
};
const splitDetails = (value) =>
  String(value ?? "")
    .split(/,|\r\n|\n|\r/)
    .map(cleanDetail);

const detailIconRules = [
  { pattern: /all[\s-]*in[\s-]*one/i, Icon: FaCubes },
  { pattern: /V2X/i, Icon: FaExchangeAlt },
  { pattern: /EV|Charging|รถยนต์ไฟฟ้า|รถไฟฟ้า/i, Icon: FaChargingStation },
  { pattern: /Backup|ไฟสำรอง/i, Icon: FaBolt },
  { pattern: /Battery|แบตเตอรี่/i, Icon: FaBatteryFull },
  { pattern: /LED|แถบไฟ/i, Icon: FaLightbulb },
  { pattern: /\d+\s*[x×]|ขนาด/i, Icon: FaRulerCombined },
];

// Build shared comparison rows from product detail positions.
function buildComparisonRows(products) {
  const parsed = products.map((product) => ({
    main: splitDetails(product.detail_product),
    sub: splitDetails(product.sub_detail_product),
  }));

  const count = Math.max(0, ...parsed.map((item) => item.main.length));
  return Array.from({ length: count }, (_, index) => {
    const representative = parsed.find((item) => item.main[index])?.main[index];
    if (!representative) return null;
    const section = comparisonSections.find((item) =>
      item.pattern?.test(representative),
    );
    return {
      index,
      sectionKey: section?.key || "other",
      cells: parsed.map((item) => ({
        text: item.main[index] || "",
        valueDetail: item.main[index] ? item.sub[index] || "" : "",
      })),
    };
  }).filter(Boolean);
}

// Pass arrays loaded from Supabase. Leave props undefined while loading.
function ResultPage({ inverter, answer, space, priceList, error = null }) {
  const location = useLocation();
  const solarSearch = location.state?.solarSearch;
  const fromSolar =
    solarSearch?.source === "solar" && Array.isArray(solarSearch.products);
  const inverterTypes = Array.isArray(inverter) ? inverter : [];
  const isLoading =
    !Array.isArray(inverter) || !Array.isArray(answer) || !Array.isArray(space);
  // 🌟 States
  const spaceSugRef = useRef(null);
  const customSpaceRef = useRef(null);
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [selectedInverter, setSelectedInverter] = useState(null);
  const [isCustom, setIsCustom] = useState(false);
  const [spaceSug, setSpaceSug] = useState();
  const [spaceSugOpen, setSpaceSugOpen] = useState(false);
  const navigate = useNavigate();
  const [restartError, setRestartError] = useState("");
  const [istype, setIsType] = useState("");

  const handleRestart = () => {
    setRestartError("");
    setIsType("");
    if (fromSolar) {
      navigate(-1);
      return;
    }
    try {
      // Only the calculation key observed in this page. Keep Supabase auth intact.
      localStorage.removeItem("wizard_answers");
    } catch {
      setRestartError(
        "ล้างคำตอบไม่สำเร็จ กรุณาอนุญาตการใช้งานพื้นที่จัดเก็บของเบราว์เซอร์แล้วลองใหม่",
      );
      return;
    }
    setMatchedProducts([]);
    setSelectedInverter(null);
    setIsCustom(false);
    setSpaceSug(undefined);
    setSpaceSugOpen(false);
    navigate("/mainpage", { replace: true, state: null });
    window.scrollTo({ top: 0, behavior: "auto" });
  };
  const scrollToSection = (selector) => {
    let attempt = 0;

    const findAndScroll = () => {
      window.requestAnimationFrame(() => {
        const target = document.querySelector(selector);

        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          return;
        }

        // รอกรณี React ยัง render ข้อมูลไม่เสร็จ
        attempt += 1;

        if (attempt < 10) {
          window.setTimeout(findAndScroll, 50);
        }
      });
    };

    findAndScroll();
  };
  useEffect(() => {
    if (!isCustom) return;

    const scrollTimer = window.setTimeout(() => {
      customSpaceRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    return () => window.clearTimeout(scrollTimer);
  }, [isCustom]);
  useEffect(() => {
    if (!spaceSugOpen || isCustom || !spaceSug) return;

    const scrollTimer = window.setTimeout(() => {
      spaceSugRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);

    return () => window.clearTimeout(scrollTimer);
  }, [spaceSugOpen, spaceSug, isCustom]);

  useEffect(() => {
    if (!Array.isArray(answer)) {
      setMatchedProducts([]);
      return;
    }

    if (fromSolar) {
      const mergedProducts = mergeSolarProducts(
        solarSearch.products,
        answer,
        Array.isArray(priceList) ? priceList : [],
      );
      setMatchedProducts(
        mergedProducts.map((product) => restoreCatalogDetails(product, answer)),
      );
      return;
    }

    let savedAnswers = {};

    try {
      savedAnswers =
        JSON.parse(localStorage.getItem("wizard_answers") || "{}") || {};
    } catch (error) {
      console.error("Unable to read wizard answers:", error);
    }

    const size = String(savedAnswers["0"]?.value || "").trim();
    const rawPhase = String(savedAnswers["1"]?.value || "").trim();
    const phase = rawPhase
      ? rawPhase.includes("phase")
        ? rawPhase
        : `${rawPhase}phase`
      : "";
    const type = String(savedAnswers["2"]?.value || "").trim();

    if (!size || !phase || !type) {
      setMatchedProducts([]);
      return;
    }

    const targetSum = `${size},${phase},${type}`;
    const prices = Array.isArray(priceList) ? priceList : [];

    const productsWithPrice = answer
      .filter((item) => String(item.sum || "").trim() === targetSum)
      .map((item) => {
        const name = normalizeProductName(item.ans_product);
        const priceItem = prices.find(
          (p) => name !== "" && normalizeProductName(p.product) === name,
        );

        return {
          ...item,
          price: priceItem?.price ?? null,
        };
      });

    setMatchedProducts(productsWithPrice);
  }, [answer, priceList, fromSolar, solarSearch]);

  const filterType = (type) => {
    setIsType(type);
  };

  const filteredProducts = matchedProducts.filter((item) => {
    const type = String(item?.solarRecommendation?.type ?? "")
      .trim()
      .toLowerCase();

    return !fromSolar || !istype || type === istype;
  });

  const inverterSug =
    matchedProducts.length > 0 ? matchedProducts[0].ans_product : "SigenStor";
  const inverterShortSug = matchedProducts[0]?.short || "";

  useEffect(() => {
    if (!Array.isArray(inverter) || inverter.length === 0) {
      setSelectedInverter(null);
      return;
    }

    const normalizedShort = String(inverterShortSug).trim().toLowerCase();
    const suggestedInverter = normalizedShort
      ? inverter.find(
          (inverter) =>
            String(inverter.short).trim().toLowerCase() === normalizedShort,
        )
      : null;

    setSelectedInverter((previous) => {
      if (suggestedInverter) return suggestedInverter;

      const previousStillExists = inverter.find(
        (inverter) => String(inverter.id) === String(previous?.id),
      );

      return previousStillExists || inverter[0];
    });
  }, [inverter, inverterShortSug]);

  const desSug =
    matchedProducts.length > 0
      ? `สินค้าแนะนำ: ${matchedProducts.map((p) => p.ans_product).join(", ")}`
      : "3 เฟส · อินเวอร์เตอร์ 10 kWh · แบตเตอรี่รวม 30.1 kWh · Self-consumption โดยประมาณ 75%";

  const handleSelect = (value) => {
    setSelectedInverter(value);

    scrollToSection(".space-product-result > .advanced-card:nth-of-type(2)");
  };

  if (error) {
    return (
      <div role="alert" className="p-4 text-center">
        โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
      </div>
    );
  }

  if (isLoading) {
    return <LoadingResult className="p-5 text-center"></LoadingResult>;
  }

  const handleOpenSpace = () => {
    setIsCustom(!isCustom);
  };

  const handleSelectSug = (item) => {
    setSpaceSug(item);
    setSpaceSugOpen(true);
    setIsCustom(false);

    scrollToSection("#selected-product-details");
  };

  return (
    <Row>
      <Col xs={12}>
        <div className="te-result-back-row">
          <button
            type="button"
            className="te-result-back"
            onClick={handleRestart}
            aria-label="กลับหน้าหลักและล้างคำตอบเพื่อคำนวณใหม่"
            title="กลับหน้าหลักและคำนวณใหม่"
          >
            <svg
              aria-hidden="true"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5m6-6-6 6 6 6" />
            </svg>
          </button>
        </div>
        {restartError && (
          <p role="alert" className="te-restart-error">
            {restartError}
          </p>
        )}
        <div id="product-comparison" className="advanced-card mt-4 card-text">
          <h2>อินเวอร์เตอร์ที่แนะนำ: {inverterSug}</h2>

          <p className="text-secondary small">{desSug}</p>
          {fromSolar && (
            <p className="text-secondary small">
              โหลดที่ใช้ค้นหา {solarSearch.result.point} kW ·{" "}
              {solarSearch.result.phase} · แบตที่เลือก{" "}
              {solarSearch.selectedBatteryKWh} kWh
            </p>
          )}

          {fromSolar && (
            <div className="d-flex justify-content-center flex-wrap gap-2">
              {[
                { value: "", label: "ทั้งหมด" },
                { value: "stor", label: "SigenStor" },
                { value: "neo", label: "SigenStor NEO" },
                { value: "hybrid", label: "Sigen Hybrid" },
              ].map(({ value, label }) => (
                <Button
                  key={value}
                  onClick={() => filterType(value)}
                  variant={
                    istype === value ? "primary" : "outline-primary"
                  }
                  aria-pressed={istype === value}
                >
                  {label}
                </Button>
              ))}
            </div>
          )}

          {filteredProducts.length > 0 ? (
            <section
              className="tera-compare"
              aria-label="เปรียบเทียบอินเวอร์เตอร์ที่แนะนำ"
            >
              <p className="tera-compare__intro">
                เปรียบเทียบ {filteredProducts.length} รุ่นที่เหมาะกับคุณ
                แล้วเลือกระบบที่ต้องการ
              </p>

              <>
                <div
                  className="tera-compare__scroll"
                  tabIndex={0}
                  role="region"
                  aria-label="ตารางเปรียบเทียบสินค้า เลื่อนแนวนอนเพื่อดูทุกรุ่น"
                >
                  <div
                    className="tera-compare__grid"
                    style={{ "--product-count": filteredProducts.length }}
                  >
                    {filteredProducts.map((item, index) => (
                      <div className="tera-compare__hero" key={`hero-${index}`}>
                        <p className="tera-compare__eyebrow">
                          ตัวเลือก {index + 1}
                        </p>
                        <h3>{item.ans_product}</h3>
                        <div className="tera-compare__battery-info">
                          {fromSolar && item.solarRecommendation && (
                            <p>
                              {item.selectedBatteryKWh > 0 ? (
                                <>
                                  แบต {item.solarRecommendation.bat || ""} ·{" "}
                                  {item.batteryCount} ก้อน
                                  <span className="tera-compare__battery-total">
                                    รวม{" "}
                                    {Number(
                                      (
                                        item.batteryCount *
                                        Number(
                                          item.solarRecommendation
                                            .bat_caculated,
                                        )
                                      ).toFixed(2),
                                    )}{" "}
                                    kWh
                                  </span>
                                </>
                              ) : (
                                "ไม่ติดแบต"
                              )}
                            </p>
                          )}
                          {item.missingCatalogDetails && (
                            <p role="status">
                              ยังไม่มีรูปและข้อมูลเปรียบเทียบของชื่อนี้ในตารางเดิม
                            </p>
                          )}
                        </div>
                        <div className="tera-compare__image">
                          {item.img_product ? (
                            <img
                              src={getDriveImageUrl(item.img_product)}
                              alt={item.ans_product || "อินเวอร์เตอร์"}
                            />
                          ) : (
                            <span>ไม่มีรูปสินค้า</span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="tera-compare__choose"
                          onClick={() => handleSelectSug(item)}
                          disabled={item.missingCatalogDetails}
                        >
                          เลือกรุ่นนี้
                        </button>
                      </div>
                    ))}
                    {comparisonSections.map((section) => {
                      const rows = buildComparisonRows(filteredProducts).filter(
                        (row) => row.sectionKey === section.key,
                      );
                      if (!rows.length) return null;
                      return (
                        <React.Fragment key={section.key}>
                          <h3 className="tera-compare__section tera-compare__category">
                            <span
                              className="tera-compare__icon"
                              aria-hidden="true"
                            >
                              {section.symbol}
                            </span>
                            {section.title}
                          </h3>
                          <div
                            className="tera-compare__category-grid"
                            style={{
                              gridColumn: "1 / -1",
                              display: "grid",
                              gridTemplateColumns: `repeat(${filteredProducts.length}, minmax(0, 1fr))`,
                              textAlign: "center",
                              padding: "24px 0",
                            }}
                          >
                            {filteredProducts.map((item, index) => (
                              <p
                                className="tera-compare__model"
                                key={`model-${index}`}
                                style={{
                                  margin: "0 0 24px",
                                  padding: "0 12px",
                                }}
                              >
                                {item.ans_product}
                              </p>
                            ))}
                            {rows.map((row) => (
                              <React.Fragment key={row.index}>
                                {/* Icons, labels and descriptions each share a grid row.
                                  Wrapped text therefore moves every model down equally. */}
                                {row.cells.map((cell, index) => {
                                  const Icon =
                                    detailIconRules.find((rule) =>
                                      rule.pattern.test(cell.text),
                                    )?.Icon || FaCheckCircle;
                                  return (
                                    <div
                                      key={`icon-${index}`}
                                      className="tera-compare__detail-icon"
                                      aria-hidden="true"
                                      style={{
                                        minHeight: "24px",
                                        padding: "0 12px 8px",
                                      }}
                                    >
                                      {cell.text && (
                                        <Icon
                                          style={{
                                            width: "20px",
                                            height: "20px",
                                          }}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                                {row.cells.map((cell, index) => (
                                  <div
                                    key={`label-${index}`}
                                    className="tera-compare__detail-label"
                                    style={{
                                      fontSize: "18px",
                                      fontWeight: 600,
                                      lineHeight: 1.5,
                                      padding: "0 12px",
                                      overflowWrap: "anywhere",
                                    }}
                                  >
                                    {cell.text || "-"}
                                  </div>
                                ))}
                                {row.cells.map((cell, index) => (
                                  <div
                                    key={`sub-${index}`}
                                    className="text-secondary smallest tera-compare__detail-sub"
                                    style={{
                                      padding: "12px 12px 32px",
                                      lineHeight: 1.7,
                                      minHeight: "24px",
                                      overflowWrap: "anywhere",
                                    }}
                                  >
                                    {cell.valueDetail}
                                  </div>
                                ))}
                              </React.Fragment>
                            ))}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
                <div className="tera-compare__footer">
                  <p>ต้องการเลือกอุปกรณ์ให้เหมาะกับหน้างาน?</p>
                  <button
                    type="button"
                    className="tera-compare__custom"
                    onClick={handleOpenSpace}
                  >
                    {isCustom ? "ย้อนกลับ" : "ปรับแต่งด้วยตนเอง"}{" "}
                    <span aria-hidden="true">›</span>
                  </button>
                </div>
              </>
            </section>
          ) : (
            <div className="p-4 my-3 rounded border text-center">
              {" "}
              <div className="d-flex justify-content-center mb-3">
                {fromSolar && istype ? (
                  <Button variant="outline-secondary" onClick={() => filterType("")}>
                    แสดงทั้งหมด
                  </Button>
                ) : (
                  <Button variant="outline-secondary" onClick={handleRestart}>
                    <IoRefresh /> Restart
                  </Button>
                )}{" "}
              </div>
              {fromSolar && istype
                ? "ไม่พบสินค้าในประเภทที่เลือก"
                : "ไม่พบสินค้าที่ตรงกับคำตอบของคุณ"}
            </div>
          )}
        </div>

        {spaceSugOpen && !isCustom && (
          <div
            id="selected-product-details"
            ref={spaceSugRef}
            style={{ overflowWrap: "anywhere", scrollMarginTop: "24px" }}
          >
            <SpaceSuggest
              spaceSug={spaceSug}
              priceList={priceList}
              batteryCatalog={answer}
              onCompare={() => scrollToSection("#product-comparison")}
              onCustomize={() => {
                const matchingInverter = inverterTypes.find(
                  (inverter) =>
                    String(inverter.short).trim().toLowerCase() ===
                    String(spaceSug?.short || "")
                      .trim()
                      .toLowerCase(),
                );
                if (matchingInverter) setSelectedInverter(matchingInverter);
                setIsCustom(true);
              }}
              getDriveImageUrl={getDriveImageUrl}
            />
          </div>
        )}
        {/*--- 2. เลือกประเภทอินเวอร์เตอร์ (ข้อมูลจาก Supabase: tm_inverter_type) --- */}
        {isCustom && (
          <div ref={customSpaceRef} style={{ scrollMarginTop: "24px" }}>
            <SpaceProductResult
              data={selectedInverter}
              space={space}
              getDriveImageUrl={getDriveImageUrl}
              inverterTypes={inverterTypes}
              selectedInverter={selectedInverter}
              handleSelect={handleSelect}
              priceList={priceList}
            />
          </div>
        )}
        <a
          href="https://lin.ee/60uFI44s"
          target="_blank"
          rel="noopener noreferrer"
          className="line-floating-button"
        >
          <FaLine />
          <span>ปรึกษาสเปกผ่าน LINE</span>
        </a>
      </Col>
    </Row>
  );
}

export default ResultPage;
