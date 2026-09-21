import React from "react";
import imgLogo from "../components/assets/images/LOGO-TE.png";
import "./spaceSuggestPdf.css";

function SpaceSuggestPdfPage({
  fullName,
  personalData,
  pdfRef,
  spaceSug,
  getDriveImageUrl,
}) {
  const imageUrl = (value) => (value ? getDriveImageUrl?.(value) || value : "");
  const details = String(spaceSug?.detail_product || "")
    .split(/[,\n]+/)
    .map((text) => text.trim())
    .filter(Boolean);
  // const addOns = [1, 2].map(number => ({
  //   number, name: spaceSug?.[`ans_add_on_${number}`], image: imageUrl(spaceSug?.[`img_add_${number}`]),
  // })).filter(item => item.name);
  const productImage = imageUrl(spaceSug?.img_product);
  const date = new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
const formattedPrice =
  spaceSug?.price != null && Number.isFinite(Number(spaceSug.price))
    ? Number(spaceSug.price)
        .toLocaleString("en-US", { maximumFractionDigits: 0 })
        .replace(/\d(?=(?:\D*\d){0,3}\D*$)/g, "x")
    : "—";
  return (
    <div className="tera-pdf-stage" aria-hidden="true">
      <div ref={pdfRef} className="tera-pdf-page">
        <header className="tera-pdf-header">
          <img src={imgLogo} alt="Terawatt Energy" />
          <div>
            <span>TERAMATCH / SOLAR & STORAGE</span>
            <h1>สรุประบบที่แนะนำ</h1>
            <p>รายละเอียดผลิตภัณฑ์และอุปกรณ์สำหรับคุณ</p>
          </div>
        </header>
        <section className="tera-pdf-customer">
          <div>
            <span>จัดทำสำหรับ</span>
            <strong>{fullName || "ไม่ระบุชื่อ"}</strong>
          </div>
          <div>
            <span>อีเมล</span>
            <strong>{personalData?.email || "—"}</strong>
          </div>
          <div>
            <span>โทรศัพท์</span>
            <strong>{personalData?.phone || "—"}</strong>
          </div>
        </section>
        <section className="tera-pdf-hero">
          <div className="tera-pdf-product-image">
            {productImage ? (
              <img
                src={productImage}
                alt={spaceSug?.ans_product || "ผลิตภัณฑ์"}
                crossOrigin="anonymous"
              />
            ) : (
              <span>ไม่มีรูปสินค้า</span>
            )}
          </div>
          <div>
            <span className="tera-pdf-tag">ผลิตภัณฑ์ที่คุณเลือก</span>
            <h2>{spaceSug?.ans_product || "ยังไม่ได้เลือกผลิตภัณฑ์"}</h2>
            <p>ชุดแนะนำตามข้อมูลที่คุณเลือกใน TeraMatch</p>
          </div>
        </section>
        <section>
          <h3 className="tera-pdf-heading">
            <span>01</span> คุณสมบัติผลิตภัณฑ์
          </h3>
          {details.length ? (
            <div className="tera-pdf-features">
              {details.map((text, index) => (
                <div className="tera-pdf-feature" key={index}>
                  <span aria-hidden="true">✓</span>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="tera-pdf-empty">
              ยังไม่มีรายละเอียดคุณสมบัติระบุในข้อมูล
            </p>
          )}
        </section>
        <section className="tera-pdf-price">
          <div className="tera-pdf-price__heading">
            <span className="tera-pdf-price__label">
              งบประมาณสำหรับชุดที่เลือก
            </span>
            <h3>ราคาโดยประมาณ</h3>
            <p>{spaceSug?.ans_product || "ชุดระบบที่แนะนำ"}</p>
          </div>

          <div className="tera-pdf-price__summary">
            <div className="tera-pdf-price__amount">
              <strong>{formattedPrice}</strong>
              <span>บาท</span>
            </div>
            <p>ราคาสุดท้ายขึ้นอยู่กับอุปกรณ์และหน้างานติดตั้ง</p>
          </div>
        </section>
        <aside className="tera-pdf-note">
          <strong>ก่อนตัดสินใจติดตั้ง</strong>
          <p>
            รายการนี้เป็นคำแนะนำเบื้องต้น กรุณายืนยันจำนวนอุปกรณ์ ราคา
            และความเหมาะสมกับหน้างานกับผู้เชี่ยวชาญก่อนติดตั้งจริง
          </p>
        </aside>
        <footer className="tera-pdf-footer">
          <strong>TERAWATT ENERGY</strong>
          <span>วันที่จัดทำ {date}</span>
        </footer>
      </div>
    </div>
  );
}
export default SpaceSuggestPdfPage;
