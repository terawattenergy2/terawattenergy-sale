import React from "react";
import imgLogo from "../components/assets/images/LOGO-TE.png";

function PdfPage({
  pdfRef,
  data,
  getDriveImageUrl,
  space,
  fullName,
  personalData,
  detail,
  selectedOptions,
  optionCus
}) {
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
        {/* รูปโลโก้ลายน้ำ */}
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

        {/* เนื้อหา PDF อยู่เหนือลายน้ำ */}
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

                <strong>{personalData.email || "-"}</strong>
              </div>

              <div className="pdf-customer-item">
                <span className="pdf-customer-label">เบอร์โทรศัพท์</span>

                <strong>{personalData.phone || "-"}</strong>
              </div>
            </div>
          </div>

          {/* อินเวอร์เตอร์ที่เลือก */}
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
                      maxHeight: "200px",
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
            {space?.map((item) => (
              <div className="pdf-spec-row" key={item.id}>
                <div className="pdf-spec-title">
                  <strong>{item.title}</strong>

                  {item.sub_title && <small>{item.sub_title}</small>}
                </div>

                <div className="pdf-spec-value">
                  {selectedOptions[item.id] || "-"}
                </div>
              </div>
            ))}
            <div className="pdf-spec-row" key={optionCus.id}>
                <div className="pdf-spec-title">
                  <strong>{optionCus.title}</strong>

                  {optionCus.sub_title && <small>{optionCus.sub_title}</small>}
                </div>

                <div className="pdf-spec-value">
                  {selectedOptions[optionCus.id] || "-"}
                </div>
              </div>
          </div>

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
