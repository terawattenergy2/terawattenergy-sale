import React, { useEffect, useState } from "react";
import { Form, Row, Col, Image } from "react-bootstrap";
import SpaceProductResult from "./spaceProductResult";
import LoadingResult from "./LoadingResult";

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

function ResultPage({ sheet }) {
  // 🌟 States
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [selectedInverter, setSelectedInverter] = useState(null);
  const [inverterTypes, setInverterTypes] = useState([]); // 👈 เก็บรายการ InverterType เป็น Array
  const [productSelected, setProductSelected] = useState(null);

  const [space, setSpace] = useState([]);
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

            // เลือกตัวแรกเป็นค่าเริ่มต้น
            setSelectedInverter((previous) => {
              return previous || formattedInverterTypes[0];
            });
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

  const desSug =
    matchedProducts.length > 0
      ? `สินค้าแนะนำ: ${matchedProducts.map((p) => p.ans_product).join(", ")}`
      : "3 เฟส · อินเวอร์เตอร์ 10 kW · แบตเตอรี่รวม 30.1 kWh · Self-consumption โดยประมาณ 75%";

  const handleSelect = (value) => {
    setSelectedInverter(value);
  };

  if (!productSelected || productSelected.length === 0) {
    return <LoadingResult className="p-5 text-center"></LoadingResult>;
  }

  const productDetails =
    productSelected.detail_product
      ?.split(/[,\n]+/)
      .map((detail) => detail.trim())
      .filter(Boolean) || [];

  return (
    <Row>
      <Col xs={12}>
        <div className="advanced-card mt-4 card-text">
          <h2>อินเวอร์เตอร์ที่แนะนำ: {inverterSug}</h2>

          <p className="text-secondary small">{desSug}</p>

          {matchedProducts.length > 0 ? (
            <div className="p-3 my-2 rounded border">
              <strong>
                พบสินค้าที่ตรงกับการเลือกของคุณ ({matchedProducts.length}{" "}
                รายการ):
              </strong>

              <div className="row g-3 mt-1">
                {matchedProducts.map((item, idx) => {
                  const productDetails = item.detail_product
                    ? item.detail_product
                        .split(/[,\n]+/)
                        .map((detail) => detail.trim())
                        .filter(Boolean)
                    : [];

                  return (
                    <div key={item.id || idx} className="col-12 col-lg-6">
                      <div className="sug-inverter-card h-100 p-3 rounded">
                        <h4 className="text-center border-bottom mb-4 pb-3">
                          Option {idx + 1}
                        </h4>

                        <div className="d-flex flex-column flex-md-row">
                          {item.img_product && (
                            <Image
                              src={getDriveImageUrl(item.img_product)}
                              alt={item.ans_product}
                              className="product-image me-md-3"
                            />
                          )}

                          <div className="flex-grow-1">
                            <h3 className="mb-3">{item.ans_product}</h3>

                            {productDetails.length > 0 && (
                              <div className="product-details">
                                {productDetails.map((detail, detailIndex) => (
                                  <div
                                    key={detailIndex}
                                    className="product-detail-item"
                                  >
                                    {detail}
                                  </div>
                                ))}
                              </div>
                            )}

                            {item.ans_add_on_1 && (
                              <div className="product-detail-item add-on-detail">
                                <strong>Add On 1:</strong> {item.ans_add_on_1}
                              </div>
                            )}

                            {item.ans_add_on_2 && (
                              <div className="product-detail-item add-on-detail">
                                <strong>Add On 2:</strong> {item.ans_add_on_2}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 my-3 rounded border text-center">
              ไม่พบสินค้าที่ตรงกับคำตอบของคุณ
            </div>
          )}
        </div>

        {/*--- 2. เลือกประเภทอินเวอร์เตอร์ (ดึงจาก Tab: InverterType) --- */}
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
                  selectedInverter?.id === inverter.id ? "active" : ""
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

        {/* ----------------- 3. สเปกระบบ ----------------- */}
        <div className="advanced-card mt-4 card-text">
          <h2>ปรับแต่งสเปกระบบ</h2>
          <p className="small text-secondary">
            {" "}
            เพิ่ม/ลดจำนวนโมดูล เปลี่ยนขนาดอินเวอร์เตอร์
            หรือเปิด-ปิดอุปกรณ์เสริมได้ตามหน้างานจริง{" "}
          </p>
          <SpaceProductResult
            data={selectedInverter}
            space={space}
            getDriveImageUrl={getDriveImageUrl}
          />{" "}
        </div>
      </Col>
    </Row>
  );
}

export default ResultPage;
