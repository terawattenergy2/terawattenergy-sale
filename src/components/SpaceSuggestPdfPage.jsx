import React from "react";
import imgLogo from "../components/assets/images/LOGO-TE.png";
import { priceNumber } from "./battery-summary";

function money(value) {
  const amount = priceNumber(value);
  if (amount === null) return "ยังไม่มีราคา";
  const formatted = amount.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
  let digits = 0;
  return (
    formatted
      .split("")
      .reverse()
      .map((char) => {
        if (/\d/.test(char)) {
          digits += 1;
          return digits <= 4 ? "x" : char;
        }
        return char;
      })
      .reverse()
      .join("") + " บาท"
  );
}

// Use actual aspect-ratio dimensions: html2canvas need not emulate object-fit.
function PdfImage({ src, alt, maxWidth, maxHeight }) {
  const fit = (image) => {
    if (!image || !image.naturalWidth || !image.naturalHeight) return;
    const scale = Math.min(
      maxWidth / image.naturalWidth,
      maxHeight / image.naturalHeight,
    );
    image.style.width = `${image.naturalWidth * scale}px`;
    image.style.height = `${image.naturalHeight * scale}px`;
  };
  return (
    <div
      style={{
        width: maxWidth,
        height: maxHeight,
        flex: "0 0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <img
        ref={fit}
        onLoad={(event) => fit(event.currentTarget)}
        src={src}
        alt={alt}
        crossOrigin="anonymous"
        style={{
          display: "block",
          width: "auto",
          height: "auto",
          maxWidth,
          maxHeight,
          flex: "0 0 auto",
        }}
      />
    </div>
  );
}

export default function SpaceSuggestPdfPage({
  fullName,
  personalData,
  pdfRef,
  spaceSug,
  battery,
  getDriveImageUrl,
}) {
  const imageUrl = (value) => (value ? getDriveImageUrl?.(value) || value : "");
  const details = String(spaceSug?.detail_product || "")
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const inverterPrice = priceNumber(spaceSug?.price);
  const total =
    inverterPrice === null || (battery && battery.totalPrice === null)
      ? null
      : inverterPrice + (battery?.totalPrice || 0);
  const date = new Date().toLocaleDateString("th-TH");
  // Opaque surfaces hide the watermark beneath images and information.
  const foreground = {
    position: "relative",
    zIndex: 1,
    background: "#fff",
  };
  const panel = {
    ...foreground,
    border: "1px solid #e0e8f2",
    borderRadius: 14,
    padding: 20,
    marginTop: 0,
    flexShrink: 0,
  };
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: -10000,
        top: 0,
        width: 794,
        pointerEvents: "none",
      }}
    >
      <div ref={pdfRef}>
        <div
          data-pdf-page
          style={{
            position: "relative",
            zIndex: 0,
            overflow: "hidden",
            width: 794,
            minHeight: 1122,
            height: "auto",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            padding: 36,
            background: "#fff",
            color: "#20354b",
            fontFamily: "Tahoma, sans-serif",
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          {/* ลายน้ำอยู่ด้านหลัง และแสดงเฉพาะพื้นที่ว่างระหว่างข้อมูล */}
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
          <header
            style={{
              ...foreground,
              display: "flex",
              gap: 22,
              alignItems: "center",
              borderBottom: "2px solid #1680e6",
              paddingBottom: 18,
            }}
          >
            <PdfImage
              src={imgLogo}
              alt="Terawatt Energy"
              maxWidth={110}
              maxHeight={65}
            />
            <div>
              <div style={{ color: "#1674d1", letterSpacing: 2, fontSize: 11 }}>
                TERAMATCH / SOLAR & STORAGE
              </div>
              <h1 style={{ fontSize: 26, margin: "4px 0" }}>
                สรุประบบที่แนะนำ
              </h1>
              <span>วันที่จัดทำ {date}</span>
            </div>
          </header>
          <main
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              flex: "1 0 auto",
              justifyContent: "space-evenly",
              gap: 18,
              padding: "22px 0",
              margin: 0,
            }}
          >
            <div
              style={{
                ...panel,
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                background: "#f5f8fc",
              }}
            >
              <div>
                จัดทำสำหรับ
                <br />
                <strong>{fullName || "ไม่ระบุชื่อ"}</strong>
              </div>
              <div>
                อีเมล
                <br />
                <strong style={{ overflowWrap: "anywhere" }}>
                  {personalData?.email || "—"}
                </strong>
              </div>
              <div>
                โทรศัพท์
                <br />
                <strong>{personalData?.phone || "—"}</strong>
              </div>
            </div>
            <div
              style={{
                ...foreground,
                display: "flex",
                alignItems: "center",
                gap: 24,
                padding: "24px 20px",
                marginTop: 0,
                flexShrink: 0,
                background: "#f5f8fc",
                borderRadius: 16,
              }}
            >
              {spaceSug?.img_product && (
                <PdfImage
                  src={imageUrl(spaceSug.img_product)}
                  alt={spaceSug.ans_product}
                  maxWidth={245}
                  maxHeight={150}
                />
              )}
              <div>
                <span style={{ color: "#1674d1" }}>อินเวอร์เตอร์ที่เลือก</span>
                <h2 style={{ fontSize: 23, margin: "6px 0" }}>
                  {spaceSug?.ans_product || "ยังไม่ได้เลือกผลิตภัณฑ์"}
                </h2>
              </div>
            </div>
            <section style={panel}>
              <h3 style={{ margin: "0 0 10px", fontSize: 17 }}>
                01 · คุณสมบัติอินเวอร์เตอร์
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px 18px",
                }}
              >
                {details.map((text, i) => (
                  <div key={i}>✓ {text}</div>
                ))}
              </div>
              {!details.length && <p>ยังไม่มีรายละเอียดคุณสมบัติ</p>}
            </section>
            {battery && (
              <section style={{ ...panel, background: "#f2f7ff" }}>
                <h3 style={{ margin: "0 0 10px", fontSize: 17 }}>
                  02 · แบตเตอรี่ที่เลือก
                </h3>
                {battery.count === 0 ? (
                  <p>ไม่ติดแบต</p>
                ) : (
                  <>
                    <div
                      style={{ display: "flex", gap: 16, alignItems: "center" }}
                    >
                      {battery.image && (
                        <PdfImage
                          src={imageUrl(battery.image)}
                          alt={battery.name}
                          maxWidth={70}
                          maxHeight={80}
                        />
                      )}
                      <div>
                        <strong>{battery.name}</strong> · จำนวน{" "}
                        <strong>{battery.count} ก้อน</strong>
                        {battery.capacity !== null && (
                          <div>
                            ก้อนละ {battery.capacity} kWh · รวม{" "}
                            {Number(battery.totalCapacity.toFixed(2))} kWh
                          </div>
                        )}
                      </div>
                    </div>
                    {battery.detail && (
                      <div style={{ marginTop: 8, whiteSpace: "pre-line" }}>
                        {battery.detail}
                      </div>
                    )}
                    {battery.subDetail && (
                      <div style={{ whiteSpace: "pre-line" }}>
                        {battery.subDetail}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}
            <section style={panel}>
              <h3 style={{ margin: "0 0 10px", fontSize: 17 }}>
                ราคาโดยประมาณ
              </h3>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "1px solid #dce5ef",
                  marginTop: 10,
                  paddingTop: 10,
                  color: "#0767c4",
                  fontSize: 20,
                }}
              >
                <strong>ราคารวมชุดระบบ</strong>
                <strong>
                  {total === null ? "รอข้อมูลราคาให้ครบ" : money(total)}
                </strong>
              </div>
            </section>
          </main>
          <p
            style={{
              ...foreground,
              fontSize: 11,
              color: "#657080",
              margin: "0 0 14px",
              flexShrink: 0,
            }}
          >
            กรุณายืนยันจำนวนอุปกรณ์ ราคา ภาษี และค่าติดตั้งกับผู้ให้บริการ
            ยอดรวมคำนวณจากราคาอินเวอร์เตอร์และราคาแบตต่อก้อนในรายการราคา
          </p>
          <footer
            style={{
              ...foreground,
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid #dce5ef",
              paddingTop: 14,
              marginTop: 0,
              flexShrink: 0,
            }}
          >
            <strong>TERAWATT ENERGY</strong>
            <span>{date}</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
