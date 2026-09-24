import React from "react";
import imgLogo from "../components/assets/images/LOGO-TE.png";
import imgLine from "../components/assets/images/LineOA.png";

function PdfPage({
  formatPrice,
  priceSummary,
  pdfRef,
  totalPrice,
  energySummary,
  data,
  getDriveImageUrl,
  space,
  fullName,
  personalData,
  detail,
  selectedOptions,

  // ข้อมูลสำหรับ SigenMicro
  isMicro = false,
  microSizeKey = "microSize",
  selectedMicroSize,
}) {
  const formatEnergyValue = (value) =>
    typeof value === "number" && Number.isFinite(value)
      ? new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(
          value,
        )
      : "—";

  const hasTotalPrice =
    typeof totalPrice === "number" && Number.isFinite(totalPrice);
  // const formattedTotalPrice = hasTotalPrice
  //   ? new Intl.NumberFormat("en-US", {
  //       minimumFractionDigits: 2,
  //       maximumFractionDigits: 2,
  //     }).format(totalPrice)
  //   : "—";

  const microProducts = selectedMicroSize?.detail || [];

  return (
    <div className="pdf-export-wrapper">
      <style>{`
        .pdf-compact-page {
          isolation: isolate;
          transform: none !important;
          zoom: 1 !important;
        }
        .pdf-compact-page .pdf-header { margin: 0 0 10px !important; padding: 0 0 8px !important; }
        .pdf-compact-page .pdf-header h2 { font-size: 24px !important; margin: 0 0 4px !important; }
        .pdf-compact-page .pdf-header p { margin: 0 !important; }
        .pdf-compact-page .pdf-customer-section {
          transform: none !important;
          zoom: 1 !important;
          width: 100% !important;
          box-sizing: border-box;
          padding: 10px 14px !important;
          margin: 0 0 10px !important;
        }
        .pdf-compact-page .pdf-customer-heading { margin: 0 0 6px !important; padding: 0 0 6px !important; }
        .pdf-compact-page .pdf-customer-heading h3 { font-size: 17px !important; margin: 2px 0 !important; }
        .pdf-compact-page .pdf-customer-grid { display: grid; grid-template-columns: 1fr 1.35fr 0.8fr; gap: 10px !important; padding: 0 !important; }
        .pdf-compact-page .pdf-customer-item { min-width: 0; padding: 0 8px !important; }
        .pdf-compact-page .pdf-customer-item strong { font-size: 12px !important; overflow-wrap: anywhere; }
        .pdf-compact-page .pdf-inverter-card { padding: 10px 14px !important; margin: 0 0 10px !important; gap: 14px !important; }
        .pdf-compact-page .pdf-inverter-image { flex: 0 0 110px !important; width: 110px !important; min-height: 0 !important; height: auto !important; padding: 6px !important; }
        .pdf-compact-page .pdf-inverter-image img { width: auto !important; height: auto !important; max-width: 100% !important; max-height: 95px !important; object-fit: contain !important; }
        .pdf-compact-page .pdf-inverter-info h3 { margin: 5px 0 !important; font-size: 20px !important; }
        .pdf-compact-page .pdf-inverter-info p { margin: 0 !important; font-size: 12px !important; line-height: 1.5 !important; }
        .pdf-compact-page .pdf-section-title { margin: 10px 0 5px !important; padding-bottom: 5px !important; font-size: 16px !important; }
        .pdf-compact-page .pdf-spec-row { padding: 7px 0 !important; min-height: 0 !important; font-size: 12px !important; }
        .pdf-compact-page section { margin-top: 10px !important; }
        .pdf-compact-page .pdf-footer { margin-top: 10px !important; padding-top: 5px !important; }
      `}</style>

      <div
        ref={pdfRef}
        className="pdf-specification pdf-compact-page"
        style={{
          position: "relative",
          overflow: "hidden",
          width: "794px",
          maxWidth: "none",
          height: "auto",
          minHeight: 0,
          margin: 0,
          padding: "12px",
          boxSizing: "border-box",
          backgroundColor: "#ffffff",
        }}
      >
        {/* ลายน้ำแบรนด์และข้อมูลผู้ใช้ซ้ำเต็มหน้ากระดาษ */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          {Array.from({ length: 8 }, (_, row) =>
            Array.from({ length: 3 }, (_, column) => (
              <div
                key={`watermark-${row}-${column}`}
                style={{
                  position: "absolute",
                  top: `${6 + row * 12.5}%`,
                  left: `${16 + column * 34}%`,
                  width: "29%",
                  transform: "translate(-50%, -50%) rotate(-25deg)",
                  transformOrigin: "center",
                  opacity: 0.055,
                  textAlign: "center",
                  color: "#163e2d",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  lineHeight: 1.4,
                }}
              >
                <img
                  src={imgLogo}
                  alt=""
                  style={{
                    display: "block",
                    width: "72%",
                    height: "auto",
                    maxHeight: "65px",
                    objectFit: "contain",
                    margin: "0 auto 5px",
                  }}
                />
                {fullName && (
                  <div style={{ fontSize: "17px", overflowWrap: "anywhere" }}>
                    {fullName}
                  </div>
                )}
                {personalData?.phone && (
                  <div style={{ marginTop: "2px", fontSize: "15px" }}>
                    {personalData.phone}
                  </div>
                )}
              </div>
            )),
          )}
        </div>

        {/* เนื้อหา PDF */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
          }}
        >
          <div className="pdf-header">
            <h2>สรุปสเปกระบบ</h2>

            <p>{data?.label || "ยังไม่ได้เลือกอินเวอร์เตอร์"}</p>
          </div>

          {/* ข้อมูลผู้ใช้งาน */}
          <div className="pdf-customer-section">
            <div className="pdf-customer-heading">
              <div>
                <span className="pdf-customer-eyebrow">
                  CUSTOMER INFORMATION
                </span>

                <h3>ข้อมูลผู้ใช้งาน</h3>
              </div>
            </div>

            <div className="pdf-customer-grid">
              <div className="pdf-customer-item pdf-name-item">
                <span className="pdf-customer-label">ชื่อ–นามสกุล</span>

                <strong>{fullName || "-"}</strong>
              </div>

              <div className="pdf-customer-item">
                <span className="pdf-customer-label">อีเมล</span>

                <strong>{personalData?.email || "-"}</strong>
              </div>

              <div className="pdf-customer-item">
                <span className="pdf-customer-label">เบอร์โทรศัพท์</span>

                <strong>{personalData?.phone || "-"}</strong>
              </div>
            </div>
          </div>

          {/* Inverter ที่เลือก */}
          {data && (
            <div className="pdf-inverter-card">
              <div className="pdf-inverter-image">
                {data.image ? (
                  <img
                    src={getDriveImageUrl(data.image)}
                    alt={data.label || "Inverter"}
                    crossOrigin="anonymous"
                    style={{
                      width: "auto",
                      height: "auto",
                      maxWidth: "100%",
                      maxHeight: "125px",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <div className="pdf-no-image">ไม่มีรูปสินค้า</div>
                )}
              </div>

              <div className="pdf-inverter-info">
                <span className="pdf-selected-label">
                  อินเวอร์เตอร์ที่เลือก
                </span>

                <h3>{data.label}</h3>

                {data.desc && <p>{data.desc}</p>}
              </div>
            </div>
          )}

          {detail?.title && (
            <div className="pdf-product-detail">
              <h3>{detail.title}</h3>

              <p>{detail.subTitle}</p>
            </div>
          )}

          <h3 className="pdf-section-title">รายละเอียดสเปกระบบ</h3>

          <div className="pdf-spec-list">
            {isMicro ? (
              <>
                {/* Phase ของ Micro */}
                <div className="pdf-spec-row">
                  <div className="pdf-spec-title">
                    <strong>ระบบไฟฟ้า</strong>
                  </div>

                  <div className="pdf-spec-value">
                    {selectedOptions?.["0"] || "-"}
                  </div>
                </div>

                {/* ขนาด Micro */}
                <div className="pdf-spec-row">
                  <div className="pdf-spec-title">
                    <strong>ขนาดระบบ SigenMicro</strong>
                  </div>

                  <div className="pdf-spec-value">
                    {selectedOptions?.[microSizeKey] || "-"}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* ข้อมูลของ Hybrid, SigenStor และ NEO */}
                {space?.map((item) => (
                  <div className="pdf-spec-row" key={item.id}>
                    <div className="pdf-spec-title">
                      <strong>{item.title}</strong>

                      {item.sub_title && <small>{item.sub_title}</small>}
                    </div>

                    <div className="pdf-spec-value">
                      {selectedOptions?.[item.id] || "-"}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* คำถาม EV DC ของ SigenStor */}
            {/* {!isMicro && data?.label === "SigenStor" && (
              <div className="pdf-spec-row">
                <div className="pdf-spec-title">
                  <strong>{optionCus.title}</strong>

                  {optionCus.sub_title && <small>{optionCus.sub_title}</small>}
                </div>

                <div className="pdf-spec-value">
                  {selectedOptions?.[optionCus.id] || "-"}
                </div>
              </div>
            )} */}
          </div>

          {/* รายการสินค้า SigenMicro */}
          {isMicro && microProducts.length > 0 && (
            <>
              <h3 className="pdf-section-title">รายการอุปกรณ์ในชุด</h3>

              <div className="pdf-spec-list">
                {microProducts.map((product) => (
                  <div className="pdf-spec-row" key={product.id}>
                    <div className="pdf-spec-title">
                      <strong>{product.title}</strong>

                      {product.des && <small>{product.des}</small>}
                    </div>

                    <div className="pdf-spec-value">
                      จำนวน {product.count || "-"}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {energySummary &&
            (selectedOptions?.["1"] || selectedOptions?.[microSizeKey]) && (
              <section
                style={{
                  marginTop: "20px",
                  color: "#1d2939",
                  breakInside: "avoid",
                }}
              >
                <h3 className="pdf-section-title">สรุปประโยชน์ของระบบ</h3>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                    lineHeight: 1.5,
                  }}
                >
                  <tbody>
                    {[
                      {
                        id: 0,
                        label: "ลดค่าไฟโดยประมาณจากแบตเตอรี่",
                        unit: "บาท/วัน",
                        value: energySummary.savings,
                      },
                      {
                        id: 1,
                        label: "ผลิตไฟได้โดยประมาณ",
                        unit: "บาท/วัน",
                        value: energySummary.productionValue,
                      },
                      {
                        id: 2,
                        label:
                          "เทียบเท่ากับการเปิดแอร์ 12,000 BTU จากแบตเตอรี่",
                        unit: "ชม./ วัน",
                        value: energySummary.airconHours,
                      },
                    ].map(({ label, unit, value, id }) => (
                      <tr key={label}>
                        <th
                          scope="row"
                          style={{
                            padding: "10px",
                            textAlign: "left",
                            fontWeight: 500,
                            borderBottom: "1px solid #dce3eb",
                            width: "68%",
                          }}
                        >
                          {label}
                          {id === 0 && (
                            <div className="small text-secondary">
                              ถ้าติดแผงโซลาร์เซลล์เพิ่ม
                              มีโอกาสที่ระบบแบตเตอรี่จะจ่ายไฟได้สูง 2 รอบ / วัน
                            </div>
                          )}
                        </th>
                        <td
                          style={{
                            padding: "10px",
                            textAlign: "right",
                            borderBottom: "1px solid #dce3eb",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <strong style={{ fontSize: "18px" }}>
                            {formatEnergyValue(value)}
                          </strong>{" "}
                          {unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p
                  style={{
                    fontSize: "11px",
                    lineHeight: 1.6,
                    color: "#596579",
                    margin: "10px 0 4px",
                  }}
                >
                  ประมาณการตามสูตรที่กำหนด: กำลังอินเวอร์เตอร์ × 4 ชั่วโมง/วัน
                  โดยสมมุติขนาดแผงเพียงพอ; ค่าไฟ 4.50 บาท/หน่วย และแอร์ (12,000
                  BTU) ใช้กำลังไฟเฉลี่ย 1 kW อ้างอิงจากการใช้แบตเตอรี่ 1 รอบ/
                  วัน ผลจริงขึ้นกับการติดตั้งและการใช้งาน
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    lineHeight: 1.6,
                    color: "#596579",
                    margin: 0,
                  }}
                >
                  {/* ค่าไฟและชั่วโมงแอร์ใช้พลังงานแบต 50% ต่อรอบ */}
                  {isMicro
                    ? " ระบบ Micro ไม่มีแบตเตอรี่ จึงไม่แสดงสองค่าที่อิงแบตเตอรี่"
                    : energySummary.savings == null ||
                        energySummary.airconHours == null
                      ? " ยังไม่มีข้อมูลแบตเตอรี่ที่ใช้คำนวณได้ กรุณาตรวจสอบรุ่นและจำนวนแบตเตอรี่"
                      : ""}
                </p>
              </section>
            )}
          {priceSummary?.lines?.some((item) => item.text || item.end_text) && (
            <section
              style={{
                marginTop: "20px",
                padding: "12px 16px",
                backgroundColor: "#f4f8f6",
                border: "1px solid #d9e7df",
                borderLeft: "3px solid #287653",
                borderRadius: "8px",
                breakInside: "avoid",
                pageBreakInside: "avoid",
              }}
            >
              <div
                style={{
                  marginBottom: "8px",
                  paddingBottom: "6px",
                  borderBottom: "1px solid #d9e7df",
                }}
              >
                <p
                  style={{
                    margin: "0 0 3px",
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                    color: "#56806b",
                  }}
                >
                  YOUR ENERGY SOLUTION
                </p>

                <h3
                  style={{
                    margin: 0,
                    fontSize: "15px",
                    fontWeight: 700,
                    lineHeight: 1.5,
                    color: "#163e2d",
                  }}
                >
                  สรุประบบที่แนะนำสำหรับคุณ
                </h3>
              </div>

              {priceSummary.lines
                .filter((item) => item.text || item.end_text)
                .map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "7px",
                      marginTop: index === 0 ? 0 : "6px",
                      breakInside: "avoid",
                      pageBreakInside: "avoid",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        flexShrink: 0,
                        color: "#287653",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      •
                    </span>

                    <p
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        lineHeight: 1.6,
                        color: "#34483d",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {item.text}{" "}
                      {item.status === true && item.quantity != null && (
                        <strong style={{ color: "#176342", fontSize: "13px" }}>
                          {item.quantity}{" "}
                        </strong>
                      )}
                      {item.status === false &&
                        item.title === "SigenMicro 1000" && (
                          <strong
                            style={{ color: "#176342", fontSize: "13px" }}
                          >
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
                              fontSize: "13px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatEnergyValue(item.endCalculateTotal)} kWh
                          </strong>
                        )}
                    </p>
                  </div>
                ))}
            </section>
          )}
          <section
            aria-label="ราคาโดยประมาณ"
            style={{
              marginTop: "20px",
              padding: "12px 16px",
              backgroundColor: "#edf7f2",
              border: "1px solid #cde5d8",
              borderRadius: "8px",
              breakInside: "avoid",
              pageBreakInside: "avoid",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "16px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "15px", color: "#163e2d" }}>
                ราคาโดยประมาณ
              </h3>
              <div style={{ color: "#176342", whiteSpace: "nowrap" }}>
                <strong style={{ fontSize: "22px" }}>
                  {/* {hasTotalPrice ? ( */}
                  <span>
                    {formatPrice(priceSummary.totalWithMarkup).replace(
                      /\d(?=(?:\D*\d){0,3}\D*$)/g,
                      "X",
                    )}{" "}
                    บาท{" "}
                  </span>
                  {/* ) : null}{" "} */}
                </strong>
              </div>
            </div>
            {!hasTotalPrice && (
              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "11px",
                  color: "#596579",
                }}
              >
                ข้อมูลราคาเป็นเพียงการประมาณการเท่านั้น
                กรุณายืนยันราคากับเจ้าหน้าที่
              </p>
            )}
            <p
              style={{ margin: "5px 0 0", fontSize: "11px", color: "#52695e" }}
            >
              ราคายังไม่รวมภาษีมูลค่าเพิ่ม 7%
            </p>
          </section>

          {/* Footer ติดต่อและวันที่ในแถบเดียว */}
          <footer
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "10px",
              paddingTop: "7px",
              borderTop: "1px solid #dce7e0",
              color: "#52695e",
              breakInside: "avoid",
              pageBreakInside: "avoid",
            }}
          >
            <img
              src={imgLine}
              alt="LINE สำหรับติดต่อสั่งซื้อ"
              style={{
                display: "block",
                width: "44px",
                height: "auto",
                flexShrink: 0,
                objectFit: "contain",
              }}
            />
            <div style={{ flex: 1, fontSize: "11px", lineHeight: 1.5 }}>
              <strong style={{ color: "#176342" }}>
                ติดต่อเพื่อขอส่วนลดเพิ่มเติม สแกนเลย
              </strong>
            </div>
            <span
              style={{
                fontSize: "9px",
                color: "#7b8794",
                whiteSpace: "nowrap",
              }}
            >
              วันที่สร้างเอกสาร:{" "}
              {new Date().toLocaleDateString("th-TH", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default PdfPage;
