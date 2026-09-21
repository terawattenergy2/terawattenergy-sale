import React from "react";
import "./selectedProductDetails.css";

const categories = [
  {
    title: "การออกแบบและติดตั้ง",
    pattern: /ดีไซน์|บาง|modular|5-in-one|ติดตั้ง/i,
  },
  { title: "เสียงขณะทำงาน", pattern: /เสียง|เงียบ|พัดลม|\bdB\b/i },
  { title: "แผงโซลาร์และการผลิตไฟ", pattern: /แผง|โซลาร์|MPPT/i },
  { title: "การป้องกันน้ำและฝุ่น", pattern: /กันน้ำ|กันฝุ่น|IP\d+/i },
  {
    title: "การชาร์จรถยนต์ไฟฟ้า",
    pattern: /รถไฟฟ้า|รถยนต์ไฟฟ้า|\bEV\b|Charging/i,
  },
  { title: "ระบบไฟสำรอง", pattern: /ไฟสำรอง|Backup/i },
  { title: "การจัดการพลังงาน", pattern: /\bAI\b|วิเคราะห์|จัดการพลังงาน/i },
];

export default function SelectedProductDetails({
  product,
  getDriveImageUrl,
  onCompare,
  onCustomize,
}) {
  if (!product) return null;
  const details = String(product.detail_product || "")
    .split(/[,\n]+/)
    .map((text) => text.trim())
    .filter(Boolean);
  const groups = details.reduce((result, text) => {
    const title =
      categories.find((category) => category.pattern.test(text))?.title ||
      "คุณสมบัติอื่น";
    (result[title] ||= []).push(text);
    return result;
  }, {});
  // const addOns = [1, 2]
  //   .map((number) => ({
  //     number,
  //     name: product[`ans_add_on_${number}`],
  //     image: product[`img_add_${number}`],
  //   }))
  //   .filter((item) => item.name);

  return (
    <section className="tera-selected" aria-label="รายละเอียดรุ่นที่เลือก">
      <header className="tera-selected__hero">
        <div className="tera-selected__visual">
          {product.img_product ? (
            <img
              src={getDriveImageUrl(product.img_product)}
              alt={product.ans_product || "สินค้าที่เลือก"}
            />
          ) : (
            <span>ยังไม่มีรูปสินค้า</span>
          )}
        </div>
        <div className="tera-selected__intro">
          <span className="tera-selected__badge">รุ่นที่คุณเลือก</span>
          <h2>{product.ans_product || "รายละเอียดผลิตภัณฑ์"}</h2>
          <p>
            ดูจุดเด่นของผลิตภัณฑ์และอุปกรณ์เสริมที่แนะนำ
            เพื่อประกอบการเลือกระบบสำหรับบ้านของคุณ
          </p>
          <div className="tera-selected__actions">
            {onCustomize && (
              <button type="button" onClick={onCustomize}>
                ปรับแต่งรุ่นนี้ <span aria-hidden="true">↗</span>
              </button>
            )}
            {onCompare && (
              <button
                type="button"
                className="tera-selected__secondary"
                onClick={onCompare}
              >
                กลับไปเปรียบเทียบ
              </button>
            )}
          </div>
        </div>
      </header>
      <div className="tera-selected__body">
        <div className="tera-selected__heading">
          <span>01</span>
          <div>
            <h3>ทำความรู้จักรุ่นนี้</h3>
            <p>คุณสมบัติที่ระบุสำหรับผลิตภัณฑ์ที่เลือก</p>
          </div>
        </div>
        {details.length ? (
          <div className="tera-selected__features">
            {Object.entries(groups).map(([title, items]) => (
              <article key={title}>
                <h4>{title}</h4>
                <ul>
                  {items.map((text, index) => (
                    <li key={index}>{text}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <p>ยังไม่มีรายละเอียดคุณสมบัติสำหรับรุ่นนี้</p>
        )}
        {/* <div className="tera-selected__heading"><span>02</span><div><h3>อุปกรณ์เสริมที่แนะนำ</h3><p>รายการจากชุดแนะนำนี้ สามารถตรวจสอบเพิ่มเติมก่อนเลือกติดตั้ง</p></div></div>
        {addOns.length ? <div className="tera-selected__addons">
          {addOns.map(item => <article key={item.number}>
            {item.image && <img src={getDriveImageUrl(item.image)} alt={item.name} />}
            <div><span>อุปกรณ์เสริม {item.number}</span><h4>{item.name}</h4></div>
          </article>)}
        </div> : <p>ไม่มีรายการอุปกรณ์เสริมระบุในชุดแนะนำนี้</p>} */}
        <p className="tera-selected__note">
          รายการนี้เป็นคำแนะนำเบื้องต้น รายละเอียดจำนวนอุปกรณ์ ราคา
          และความเหมาะสมกับหน้างานควรยืนยันก่อนติดตั้ง
        </p>
        <p className="small text-danger mt-3 mb-1">
          กด Export เพื่อแสดงราคาโดยประมาณ
        </p>{" "}
        {product.price != null
          ? Number(product.price)
              .toLocaleString("en-US", { maximumFractionDigits: 0 })
              .replace(/\d{3}$/, "xxx")
          : "-"}{" "}บาท
      </div>
    </section>
  );
}
