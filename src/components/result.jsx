import React, { useEffect, useRef, useState } from "react";
import { Row, Col, Button } from "react-bootstrap";
import "./resultComparison.css";
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
import { useNavigate } from "react-router-dom";
import { IoRefresh } from "react-icons/io5";

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

  const handleRestart = () => {
    navigate("/");
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

    const products = answer
      .filter((item) => String(item.sum || "").trim() === targetSum)
      .map((item) => {
        const productName = String(item.ans_product ?? "").trim();

        const matchedPrice = productName
          ? prices.find(
              (entry) => String(entry.product ?? "").trim() === productName,
            )
          : undefined;

        return {
          ...item,
          price: matchedPrice?.price ?? null,
        };
      });

    const productsWithPrice = answer
      .filter((item) => String(item.sum || "").trim() === targetSum)
      .map((item) => {
        const name = String(item.ans_product ?? "").trim();

        const priceItem = (priceList ?? []).find(
          (p) => name !== "" && String(p.product ?? "").trim() === name,
        );

        return {
          ...item,
          price: priceItem?.price ?? null,
        };
      });

    setMatchedProducts(productsWithPrice);
  }, [answer, priceList]);

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
      : "3 เฟส · อินเวอร์เตอร์ 10 kW · แบตเตอรี่รวม 30.1 kWh · Self-consumption โดยประมาณ 75%";

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
        <div id="product-comparison" className="advanced-card mt-4 card-text">
          <h2>อินเวอร์เตอร์ที่แนะนำ: {inverterSug}</h2>

          <p className="text-secondary small">{desSug}</p>

          {matchedProducts.length > 0 ? (
            <section
              className="tera-compare"
              aria-label="เปรียบเทียบอินเวอร์เตอร์ที่แนะนำ"
            >
              <p className="tera-compare__intro">
                เปรียบเทียบ {matchedProducts.length} รุ่นที่เหมาะกับคุณ
                แล้วเลือกระบบที่ต้องการ
              </p>
              <div
                className="tera-compare__scroll"
                tabIndex={0}
                role="region"
                aria-label="ตารางเปรียบเทียบสินค้า เลื่อนแนวนอนเพื่อดูทุกรุ่น"
              >
                <div
                  className="tera-compare__grid"
                  style={{ "--product-count": matchedProducts.length }}
                >
                  {matchedProducts.map((item, index) => (
                    <div className="tera-compare__hero" key={`hero-${index}`}>
                      <p className="tera-compare__eyebrow">
                        ตัวเลือก {index + 1}
                      </p>
                      <h3>{item.ans_product}</h3>
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
                      >
                        เลือกรุ่นนี้ <span aria-hidden="true">↗</span>
                      </button>
                    </div>
                  ))}
                  {comparisonSections.map((section) => {
                    const rows = buildComparisonRows(matchedProducts).filter(
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
                          style={{
                            gridColumn: "1 / -1",
                            display: "grid",
                            gridTemplateColumns: `repeat(${matchedProducts.length}, minmax(0, 1fr))`,
                            textAlign: "center",
                            padding: "24px 0",
                          }}
                        >
                          {matchedProducts.map((item, index) => (
                            <p
                              className="tera-compare__model"
                              key={`model-${index}`}
                              style={{ margin: "0 0 24px", padding: "0 12px" }}
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
                                  className="text-secondary smallest"
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
            </section>
          ) : (
            <div className="p-4 my-3 rounded border text-center">
              {" "}
              <div className="d-flex justify-content-center mb-3">
                <Button variant="outline-secondary" onClick={handleRestart}>
                  <IoRefresh /> Restart{" "}
                </Button>{" "}
              </div>
              ไม่พบสินค้าที่ตรงกับคำตอบของคุณ
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
