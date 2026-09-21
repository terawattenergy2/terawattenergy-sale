import React from "react";
import imgLogo from "../components/assets/images/LOGO-TE.png";

function PdfPage({
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
  optionCus,

  // ข้อมูลสำหรับ SigenMicro
  isMicro = false,
  microSizeKey = "microSize",
  selectedMicroSize,
}) {
  const formatEnergyValue = (value) =>
    typeof value === "number" && Number.isFinite(value)
      ? new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(value)
      : "—";

  const hasTotalPrice = typeof totalPrice === "number" && Number.isFinite(totalPrice);
  const formattedTotalPrice = hasTotalPrice
    ? new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalPrice)
    : "—";

  const microProducts = selectedMicroSize?.detail || [];

  return (
    <div className="pdf-export-wrapper">
      <div
        ref={pdfRef}
        className="pdf-specification"
        style={{
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* โลโก้ลายน้ำ */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "52%",
            left: "50%",
            zIndex: 0,
            width: "470px",
            opacity: 0.055,
            transform: "translate(-50%, -50%) rotate(-25deg)",
            transformOrigin: "center",
            pointerEvents: "none",
          }}
        >
          <img
            src={imgLogo}
            alt=""
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              objectFit: "contain",
            }}
          />
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
                    <strong>เฟสไฟฟ้า</strong>
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
            {!isMicro && data?.label === "SigenStor" && (
              <div className="pdf-spec-row">
                <div className="pdf-spec-title">
                  <strong>{optionCus.title}</strong>

                  {optionCus.sub_title && (
                    <small>{optionCus.sub_title}</small>
                  )}
                </div>

                <div className="pdf-spec-value">
                  {selectedOptions?.[optionCus.id] || "-"}
                </div>
              </div>
            )}
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

          {energySummary && (selectedOptions?.["1"] || selectedOptions?.[microSizeKey]) && (
            <section style={{ marginTop: "20px", color: "#1d2939", breakInside: "avoid" }}>
              <h3 className="pdf-section-title">สรุปประโยชน์ของระบบ</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", lineHeight: 1.5 }}>
                <tbody>
                  {[
                    { label: "ลดค่าไฟโดยประมาณจากแบตเตอรี่", unit: "บาท/รอบ", value: energySummary.savings },
                    { label: "ผลิตไฟได้โดยประมาณ", unit: "หน่วย/วัน", value: energySummary.production },
                    { label: "เทียบเท่ากับการเปิดแอร์ 12,000 BTU จากแบตเตอรี่", unit: "ชม./รอบ", value: energySummary.airconHours },
                  ].map(({ label, unit, value }) => (
                    <tr key={label}>
                      <th scope="row" style={{ padding: "10px", textAlign: "left", fontWeight: 500, borderBottom: "1px solid #dce3eb", width: "68%" }}>{label}</th>
                      <td style={{ padding: "10px", textAlign: "right", borderBottom: "1px solid #dce3eb", whiteSpace: "nowrap" }}>
                        <strong style={{ fontSize: "18px" }}>{formatEnergyValue(value)}</strong>{" "}{unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: "11px", lineHeight: 1.6, color: "#596579", margin: "10px 0 4px" }}>
                ประมาณการตามสูตรที่กำหนด: กำลังอินเวอร์เตอร์ × 4 ชั่วโมง/วัน โดยสมมติขนาดแผงเพียงพอ;
                ค่าไฟ 4.50 บาท/หน่วย และแอร์ใช้กำลังไฟเฉลี่ย 1 kW ผลจริงขึ้นกับการติดตั้งและการใช้งาน
              </p>
              <p style={{ fontSize: "11px", lineHeight: 1.6, color: "#596579", margin: 0 }}>
                ค่าไฟและชั่วโมงแอร์ใช้พลังงานแบต 50% ต่อรอบ
                {isMicro
                  ? " ระบบ Micro ไม่มีแบตเตอรี่ จึงไม่แสดงสองค่าที่อิงแบตเตอรี่"
                  : energySummary.savings == null || energySummary.airconHours == null
                    ? " ยังไม่มีข้อมูลแบตเตอรี่ที่ใช้คำนวณได้ กรุณาตรวจสอบรุ่นและจำนวนแบตเตอรี่"
                    : ""}
              </p>
            </section>
          )}

          <section
            aria-label="ราคาโดยประมาณ"
            style={{
              marginTop: "20px",
              padding: "18px 22px",
              backgroundColor: "#edf7f2",
              border: "1px solid #cde5d8",
              borderRadius: "12px",
              breakInside: "avoid",
              pageBreakInside: "avoid",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", color: "#163e2d" }}>ราคาโดยประมาณ</h3>
              <div style={{ color: "#176342", whiteSpace: "nowrap" }}>
                <strong style={{ fontSize: "28px" }}>{formattedTotalPrice}</strong>
                {hasTotalPrice && <span style={{ marginLeft: "8px", fontSize: "14px" }}>บาท</span>}
              </div>
            </div>
            {!hasTotalPrice && (
              <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#596579" }}>ข้อมูลราคายังไม่ครบ กรุณายืนยันราคากับเจ้าหน้าที่</p>
            )}
            <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#52695e" }}>
              ราคายังไม่รวมภาษีมูลค่าเพิ่ม 7%
            </p>
          </section>

          <div className="pdf-footer">
            วันที่สร้างเอกสาร:{" "}
            {new Date().toLocaleDateString("th-TH", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PdfPage;