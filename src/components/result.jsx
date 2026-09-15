import React, { useEffect, useRef, useState } from "react";
import { Row, Col, Button } from "react-bootstrap";
import "./resultComparison.css";
import SpaceProductResult from "./spaceProductResult";
import LoadingResult from "./LoadingResult";
import { FaLine } from "react-icons/fa";
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
  { key: "design", title: "การออกแบบและการติดตั้ง", symbol: "◇", pattern: /ดีไซน์|บาง|modular|5-in-one|ติดตั้ง/i },
  { key: "noise", title: "เสียงขณะทำงาน", symbol: "◌", pattern: /เสียง|เงียบ|พัดลม|\bdB\b/i },
  { key: "solar", title: "การรองรับแผงโซลาร์", symbol: "☀", pattern: /แผง|โซลาร์|MPPT/i },
  { key: "protection", title: "การป้องกันน้ำและฝุ่น", symbol: "⬡", pattern: /กันน้ำ|กันฝุ่น|IP\d+/i },
  { key: "ev", title: "การชาร์จรถยนต์ไฟฟ้า", symbol: "↯", pattern: /รถไฟฟ้า|รถยนต์ไฟฟ้า|EV|Charging/i },
  { key: "backup", title: "ระบบไฟสำรอง", symbol: "ϟ", pattern: /ไฟสำรอง|Backup/i },
  { key: "energy", title: "การจัดการพลังงาน", symbol: "◎", pattern: /AI|วิเคราะห์|จัดการพลังงาน/i },
  { key: "other", title: "รายละเอียดอื่น", symbol: "＋" },
];

function groupProductDetails(value) {
  const groups = {};
  String(value || "").split(/[,\n]+/).map(text => text.trim()).filter(Boolean).forEach(text => {
    const section = comparisonSections.find(item => item.pattern?.test(text));
    const key = section?.key || "other";
    (groups[key] ||= []).push(text);
  });
  return groups;
}

function ResultPage({ sheet }) {
  // 🌟 States
  const spaceSugRef = useRef(null);
  const customSpaceRef = useRef(null);
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [selectedInverter, setSelectedInverter] = useState(null);
  const [inverterTypes, setInverterTypes] = useState([]); // 👈 เก็บรายการ InverterType เป็น Array
  const [productSelected, setProductSelected] = useState(null);
  const [isCustom, setIsCustom] = useState(false);
  const [space, setSpace] = useState([]);
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
    const fetchData = async () => {
      try {
        const response = await fetch(sheet);
        const result = await response.json();

        if (result.success && result.data) {
          // 🎯 1. ดึงข้อมูล inverterType (เช็กทั้งตัวพิมพ์เล็กและพิมพ์ใหญ่)
          const rawInverterData =
            result.data.inverterType || result.data.InverterType || [];

          if (rawInverterData.length > 0) {
            const formattedInverterTypes = rawInverterData.map((item) => ({
              id: item.id,
              label: item.label || "",
              short: item.short || "",
              desc: item.desc || "",
              image: getDriveImageUrl(item.image),
              detail: item.detail,
            }));

            setInverterTypes(formattedInverterTypes);
          }

          // 🎯 2. ดึงและ Match ข้อมูลตาราง answer
          if (result.data.answer) {
            const rawAnswers = result.data.answer;

            const savedAnswers = JSON.parse(
              localStorage.getItem("wizard_answers") || "{}",
            );
            const size = savedAnswers["0"]?.value || "";
            const rawPhase = savedAnswers["1"]?.value || "";
            const phase = rawPhase
              ? rawPhase.includes("phase")
                ? rawPhase
                : `${rawPhase}phase`
              : "";
            setSpace(result.data.space);

            const type = savedAnswers["2"]?.value || "";
            const targetSum = `${size},${phase},${type}`;

            const matches = rawAnswers.filter((item) => item.sum === targetSum);
            setMatchedProducts(matches);

            const formattedQuesData = rawAnswers.map((item, index) => {
              const options = [];
              if (item.value >= 1 && item.value <= 15) {
                options.push({
                  id: item.value - 1,
                  product: item.ans_product,
                  add_on_1: item.ans_add_on_1,
                  add_on_2: item.ans_add_on_2,
                  img_product: getDriveImageUrl(item.img_product),
                  img_add_2: getDriveImageUrl(item.img_add_2),
                  sum: item.sum,
                  value: item.value,
                });
              }

              return {
                id: index,
                ques: item.ques || "",
                sub_ques: (item.sub_ques || "").trim(),
                options: options,
              };
            });

            setProductSelected({
              ...result.data,
              question: formattedQuesData,
            });
          }
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      }
    };

    fetchData();
  }, [sheet]);

  const inverterSug =
    matchedProducts.length > 0 ? matchedProducts[0].ans_product : "SigenStor";
  const inverterShortSug = matchedProducts[0]?.short || "";

  useEffect(() => {
    if (inverterTypes.length === 0) return;

    const normalizedShort = String(inverterShortSug).trim().toLowerCase();
    const suggestedInverter = normalizedShort
      ? inverterTypes.find(
          (inverter) =>
            String(inverter.short).trim().toLowerCase() === normalizedShort,
        )
      : null;

    setSelectedInverter((previous) => {
      if (suggestedInverter) return suggestedInverter;

      const previousStillExists = inverterTypes.find(
        (inverter) => String(inverter.id) === String(previous?.id),
      );

      return previousStillExists || inverterTypes[0];
    });
  }, [inverterTypes, inverterShortSug]);

  const desSug =
    matchedProducts.length > 0
      ? `สินค้าแนะนำ: ${matchedProducts.map((p) => p.ans_product).join(", ")}`
      : "3 เฟส · อินเวอร์เตอร์ 10 kW · แบตเตอรี่รวม 30.1 kWh · Self-consumption โดยประมาณ 75%";

  const handleSelect = (value) => {
    setSelectedInverter(value);

    scrollToSection(".space-product-result > .advanced-card:nth-of-type(2)");
  };

  if (!productSelected) {
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
            <section className="tera-compare" aria-label="เปรียบเทียบอินเวอร์เตอร์ที่แนะนำ">
              <p className="tera-compare__intro">
                เปรียบเทียบ {matchedProducts.length} รุ่นที่เหมาะกับคุณ แล้วเลือกระบบที่ต้องการ
              </p>
              <div className="tera-compare__scroll" tabIndex={0} role="region" aria-label="ตารางเปรียบเทียบสินค้า เลื่อนแนวนอนเพื่อดูทุกรุ่น">
                <div className="tera-compare__grid" style={{ "--product-count": matchedProducts.length }}>
                  {matchedProducts.map((item, index) => (
                    <div className="tera-compare__hero" key={`hero-${index}`}>
                      <p className="tera-compare__eyebrow">ตัวเลือก {index + 1}</p>
                      <h3>{item.ans_product}</h3>
                      <div className="tera-compare__image">
                        {item.img_product ? (
                          <img src={getDriveImageUrl(item.img_product)} alt={item.ans_product || "อินเวอร์เตอร์"} />
                        ) : <span>ไม่มีรูปสินค้า</span>}
                      </div>
                      <button type="button" className="tera-compare__choose" onClick={() => handleSelectSug(item)}>
                        เลือกรุ่นนี้ <span aria-hidden="true">↗</span>
                      </button>
                    </div>
                  ))}
                  {comparisonSections.map(section => {
                    const values = matchedProducts.map(item => groupProductDetails(item.detail_product)[section.key] || []);
                    if (!values.some(items => items.length)) return null;
                    return (
                      <React.Fragment key={section.key}>
                        <h3 className="tera-compare__section tera-compare__category">
                          <span className="tera-compare__icon" aria-hidden="true">{section.symbol}</span>
                          {section.title}
                        </h3>
                        {values.map((details, index) => (
                          <div className="tera-compare__features" key={`${section.key}-${index}`}>
                            <p className="tera-compare__model">{matchedProducts[index].ans_product}</p>
                            {details.length ? (
                              <ul>{details.map((text, i) => <li key={i}>{text}</li>)}</ul>
                            ) : <p className="tera-compare__missing">ไม่ระบุในข้อมูล</p>}
                          </div>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {["ans_add_on_1", "ans_add_on_2"].map((field, index) => (
                    matchedProducts.some(item => item[field]) && (
                      <React.Fragment key={field}>
                        <h3 className="tera-compare__section">อุปกรณ์เสริม {index + 1}</h3>
                        {matchedProducts.map((item, i) => (
                          <div className="tera-compare__spec" key={`${field}-${i}`}>{item[field] || "—"}</div>
                        ))}
                      </React.Fragment>
                    )
                  ))}
                </div>
              </div>
              <div className="tera-compare__footer">
                <p>ต้องการเลือกอุปกรณ์ให้เหมาะกับหน้างาน?</p>
                <button type="button" className="tera-compare__custom" onClick={handleOpenSpace}>
                  {isCustom ? "ย้อนกลับ" : "ปรับแต่งด้วยตนเอง"} <span aria-hidden="true">›</span>
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
                const matchingInverter = inverterTypes.find(inverter =>
                  String(inverter.short).trim().toLowerCase() === String(spaceSug?.short || "").trim().toLowerCase()
                );
                if (matchingInverter) setSelectedInverter(matchingInverter);
                setIsCustom(true);
              }}
              getDriveImageUrl={getDriveImageUrl}
            />
          </div>
        )}
        {/*--- 2. เลือกประเภทอินเวอร์เตอร์ (ดึงจาก Tab: InverterType) --- */}
        {isCustom && (
          <div ref={customSpaceRef} style={{ scrollMarginTop: "24px" }}>
            <SpaceProductResult
              data={selectedInverter}
              space={space}
              getDriveImageUrl={getDriveImageUrl}
              inverterTypes={inverterTypes}
              selectedInverter={selectedInverter}
              handleSelect={handleSelect}
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
