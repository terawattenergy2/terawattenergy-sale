import React from "react";
import imgLogo from "../components/assets/images/LOGO-TE.png";

function SpaceSuggestPdfPage({ fullName, personalData, pdfRef, spaceSug, getDriveImageUrl }) {
  const productImage = getDriveImageUrl?.(spaceSug?.img_product);

  const addOns = [
    {
      id: 1,
      name: spaceSug?.ans_add_on_1,
      image: getDriveImageUrl?.(spaceSug?.img_add_1),
    },
    {
      id: 2,
      name: spaceSug?.ans_add_on_2,
      image: getDriveImageUrl?.(spaceSug?.img_add_2),
    },
  ].filter((item) => item.name);

  return (
    <div className="space-suggest-pdf-stage">
      <div ref={pdfRef} className="space-suggest-pdf">
        {/* ลายน้ำ */}
        <div className="space-pdf-watermark">
          <img src={imgLogo} alt="" />
        </div>

        <div className="space-pdf-content">
          {/* Header */}
          <div className="space-pdf-header">
            <div>
              <span>RECOMMENDED SOLUTION</span>
              <h2>สรุปผลิตภัณฑ์ที่แนะนำ</h2>
              <p>ระบบพลังงานที่เหมาะสมตามข้อมูลที่คุณเลือก</p>
            </div>

            <img src={imgLogo} alt="Terawatt" className="space-pdf-logo" />
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

          {/* สินค้าหลัก */}
          <div className="space-pdf-section">
            <div className="space-pdf-section-heading">
              <span>MAIN PRODUCT</span>
              <h3>ผลิตภัณฑ์หลัก</h3>
            </div>

            <div className="space-pdf-product-card">
              <div className="space-pdf-product-image">
                {productImage ? (
                  <img
                    src={productImage}
                    alt={spaceSug?.ans_product || "Product"}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <span>ไม่มีรูปสินค้า</span>
                )}
              </div>

              <div className="space-pdf-product-info">
                <span className="space-pdf-selected">ผลิตภัณฑ์ที่แนะนำ</span>

                <h3>{spaceSug?.ans_product || "ยังไม่ได้เลือกผลิตภัณฑ์"}</h3>

                <p>{spaceSug?.detail_product || "ไม่มีรายละเอียดผลิตภัณฑ์"}</p>
              </div>
            </div>
          </div>

          {/* อุปกรณ์เสริม */}
          {addOns.length > 0 && (
            <div className="space-pdf-section">
              <div className="space-pdf-section-heading">
                <span>RECOMMENDED ADD-ONS</span>
                <h3>อุปกรณ์เสริมที่แนะนำ</h3>
              </div>

              <div className="space-pdf-addon-grid">
                {addOns.map((item, index) => (
                  <div className="space-pdf-addon-card" key={item.id}>
                    <div className="space-pdf-addon-number">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="space-pdf-addon-image">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          crossOrigin="anonymous"
                          style={{
                            width: "auto",
                            height: "auto",
                            maxWidth: "100%",
                            maxHeight: "150px",
                            objectFit: "contain",
                          }}
                        />
                      ) : (
                        <span>ไม่มีรูป</span>
                      )}
                    </div>

                    <div className="space-pdf-addon-info">
                      <span>อุปกรณ์เสริม</span>
                      <strong>{item.name}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* หมายเหตุ */}
          <div className="space-pdf-note">
            <strong>หมายเหตุ</strong>

            <p>
              รายการผลิตภัณฑ์เป็นคำแนะนำเบื้องต้น
              กรุณาปรึกษาผู้เชี่ยวชาญเพื่อสำรวจพื้นที่และยืนยันสเปกระบบ
              ก่อนติดตั้งจริง
            </p>
          </div>

          {/* Footer */}
          <div className="space-pdf-footer">
            <span>TERAWATT ENERGY</span>

            <span>
              วันที่สร้างเอกสาร:{" "}
              {new Date().toLocaleDateString("th-TH", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SpaceSuggestPdfPage;
