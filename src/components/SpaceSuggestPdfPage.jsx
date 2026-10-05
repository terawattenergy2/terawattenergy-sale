import React from "react";
import imgLogo from "../components/assets/images/LOGO-TE.png";
import imgLine from "../components/assets/images/LineOA.png";
import { priceNumber } from "./battery-summary";

const number = (value) =>
  Number.isFinite(value)
    ? value.toLocaleString("th-TH", { maximumFractionDigits: 2 })
    : "—";
const maskedPrice = (value) => {
  if (value === null) return "รอข้อมูลราคา";
  return (
    value
      .toLocaleString("en-US", { maximumFractionDigits: 0 })
      .replace(/\d(?=(?:\D*\d){0,3}\D*$)/g, "X") + " บาท"
  );
};

// Explicit fitted dimensions also preserve proportions in html2canvas.
function FittedImage({ src, alt, width, height }) {
  const fit = (image) => {
    if (!image?.naturalWidth || !image.naturalHeight) return;
    const scale = Math.min(
      width / image.naturalWidth,
      height / image.naturalHeight,
    );
    image.style.width = `${image.naturalWidth * scale}px`;
    image.style.height = `${image.naturalHeight * scale}px`;
  };
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <img
        ref={fit}
        onLoad={(e) => fit(e.currentTarget)}
        src={src}
        alt={alt}
        crossOrigin="anonymous"
        style={{
          width: "auto",
          height: "auto",
          maxWidth: width,
          maxHeight: height,
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
  const name = spaceSug?.ans_product || "ยังไม่ได้เลือกอินเวอร์เตอร์";
  const imageUrl = (value) => (value ? getDriveImageUrl?.(value) || value : "");
  const family = /\bneo\b/i.test(name)
    ? "SigenStor Neo"
    : /hybrid/i.test(name)
      ? "Sigen Hybrid"
      : /sigenstor/i.test(name)
        ? "SigenStor"
        : name;
  const recommendation = spaceSug?.solarRecommendation;
  const phaseRaw = recommendation?.phase || spaceSug?.phase;
  const phase = phaseRaw
    ? String(phaseRaw)
    : /\bSP\d*\b/i.test(name)
      ? "1 Phase"
      : /\bTP\d*\b/i.test(name)
        ? "3 Phase"
        : "ไม่ได้ระบุ";
  // Parse only an explicit model power, never the rounded load-search bucket.
  const modelPower = name.match(/(?:\bEC|\bNEO|\bHybrid)\s+(\d+(?:\.\d+)?)/i);
  const units = name.match(/\b(\d+)\s*Units?\b/i);
  const inverterKW = modelPower
    ? Number(modelPower[1]) * (units ? Number(units[1]) : 1)
    : null;
  const capacity =
    battery?.count === 0 ? 0 : priceNumber(battery?.totalCapacity);
  const packs = battery?.items || (battery?.count > 0 ? [battery] : []);
  const batteryNames = packs.length
    ? packs.map((p) => `${p.name} × ${p.count}`).join(" + ")
    : battery?.count === 0
      ? "ไม่ติดแบต"
      : "ไม่ได้ระบุ";
  const inverterPrice = priceNumber(spaceSug?.price);
  const batteryPrice = battery ? priceNumber(battery.totalPrice) : null;
  const total =
    inverterPrice !== null && batteryPrice !== null
      ? inverterPrice + batteryPrice
      : null;
  const features = String(spaceSug?.detail_product || "")
    .split(/[,\n]+/)
    .map((v) => v.trim())
    .filter((v) => v && !/^[-–—]+$/.test(v));
  const description = features
    .filter((v) => !/ขนาด/.test(v))
    .slice(0, 3)
    .join(" · ");
  const date = new Date().toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const blue = "#00a8df",
    green = "#087455",
    ink = "#202c3b",
    muted = "#768390";
  const heading = {
    fontSize: 15,
    margin: "0 0 4px",
    paddingBottom: 5,
    borderBottom: `2px solid ${blue}`,
    color: ink,
  };
  const specs = [
    ["ระบบไฟฟ้า", phase],
    ["ขนาดอินเวอร์เตอร์", name],
    ["Sigen Battery", batteryNames],
    [
      "จำนวนโมดูลแบตเตอรี่",
      battery
        ? `${battery.count} ก้อน · รวม ${number(capacity)} kWh`
        : "ไม่ได้ระบุ",
    ],
    [
      "Sigen Energy Gateway (ระบบไฟสำรอง)",
      spaceSug?.gateway || "ไม่ได้ระบุ",
      "อุปกรณ์ตัดและสลับไฟระหว่างการไฟฟ้า แบตเตอรี่ และเครื่องปั่นไฟ",
    ],
    ["Meter Sigen Power Sensor", spaceSug?.meter || "ไม่ได้ระบุ"],
    ["Installation Kits", spaceSug?.installationKit || "ไม่ได้ระบุ"],
  ];
  const benefits = [
    [
      "ลดค่าไฟโดยประมาณจากแบตเตอรี่",
      capacity === null ? null : capacity * 4.5,
      "บาท/วัน",
    ],
    [
      "มูลค่าไฟที่ผลิตได้โดยประมาณ",
      inverterKW === null ? null : inverterKW * 4 * 4.5,
      "บาท/วัน",
    ],
    ["เทียบเท่าการเปิดแอร์ 12,000 BTU จากแบตเตอรี่", capacity, "ชม./วัน"],
  ];
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
            isolation: "isolate",
            width: 794,
            minHeight: 1122,
            padding: "30px 42px",
            boxSizing: "border-box",
            background: "white",
            color: ink,
            fontFamily: "Tahoma, sans-serif",
            fontSize: 11,
            lineHeight: 1.5,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 28,
              overflow: "hidden",
              opacity: 0.045,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gridTemplateRows: "repeat(5, 1fr)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            {Array.from({ length: 15 }, (_, i) => (
              <div
                key={i}
                style={{
                  transform: "rotate(-25deg)",
                  alignSelf: "center",
                  textAlign: "center",
                }}
              >
                <img
                  src={imgLogo}
                  alt=""
                  style={{ width: 130, height: "auto" }}
                />
                <div style={{ fontWeight: 700 }}>
                  {fullName || "TERAWATT ENERGY"}
                </div>
                <div>{personalData?.phone || ""}</div>
              </div>
            ))}
          </div>
          <main
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              flex: 1,
              margin: 0,
            }}
          >
            <header
              style={{ borderBottom: `2px solid ${blue}`, paddingBottom: 7 }}
            >
              <h1 style={{ color: blue, fontSize: 24, margin: 0 }}>
                สรุปสเปกระบบ
              </h1>
              <strong style={{ color: muted, fontSize: 13 }}>{family}</strong>
            </header>
            <section
              style={{
                background: "#f2f9ff",
                border: "1px solid #dfedf5",
                borderLeft: `4px solid ${blue}`,
                borderRadius: 10,
                padding: "10px 14px",
              }}
            >
              <div
                style={{
                  color: blue,
                  fontSize: 9,
                  letterSpacing: 1,
                  fontWeight: 700,
                }}
              >
                CUSTOMER INFORMATION
              </div>
              <h2 style={{ fontSize: 16, margin: "0 0 6px" }}>
                ข้อมูลผู้ใช้งาน
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.4fr 0.85fr",
                  gap: 12,
                  borderTop: "1px solid #e0edf4",
                  paddingTop: 6,
                }}
              >
                {[
                  ["ชื่อ–นามสกุล", fullName],
                  ["อีเมล", personalData?.email],
                  ["เบอร์โทรศัพท์", personalData?.phone],
                ].map(([label, value]) => (
                  <div key={label} style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 9, color: muted }}>{label}</div>
                    <strong style={{ overflowWrap: "anywhere" }}>
                      {value || "—"}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
            <section
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                background: "#f2f9ff",
                border: "1px solid #dfedf5",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <div
                style={{ background: "white", borderRadius: 10, padding: 6 }}
              >
                {spaceSug?.img_product ? (
                  <FittedImage
                    src={imageUrl(spaceSug.img_product)}
                    alt={name}
                    width={92}
                    height={98}
                  />
                ) : (
                  <span>ไม่มีรูปสินค้า</span>
                )}
              </div>
              <div>
                <span
                  style={{
                    background: blue,
                    color: "white",
                    borderRadius: 20,
                    padding: "5px 10px",
                    fontSize: 10,
                    display: "inline-block",
                  }}
                >
                  อินเวอร์เตอร์ที่เลือก
                </span>
                <h2 style={{ fontSize: 20, margin: "6px 0 3px" }}>{family}</h2>
                <p style={{ color: muted, margin: 0 }}>{description || name}</p>
              </div>
            </section>
            <section>
              <h3 style={heading}>รายละเอียดสเปกระบบ</h3>
              {specs.map(([label, value, hint]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    gap: 16,
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    borderBottom: "1px solid #e5eaee",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <strong>{label}</strong>
                    {hint && (
                      <div style={{ fontSize: 9, color: muted }}>{hint}</div>
                    )}
                  </div>
                  <strong
                    style={{
                      color: blue,
                      textAlign: "right",
                      maxWidth: "53%",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {value}
                  </strong>
                </div>
              ))}
            </section>
            <section>
              <h3 style={heading}>สรุปประโยชน์ของระบบ</h3>
              {benefits.map(([label, value, unit]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 0",
                    borderBottom: "1px solid #e5eaee",
                  }}
                >
                  <strong>{label}</strong>
                  <span style={{ whiteSpace: "nowrap" }}>
                    <strong style={{ fontSize: 17 }}>{number(value)}</strong>{" "}
                    {unit}
                  </span>
                </div>
              ))}
              <p style={{ color: muted, fontSize: 9, margin: "7px 0 0" }}>
                ประมาณการตามสูตรในแม่แบบ: กำลังอินเวอร์เตอร์ × 4 ชั่วโมง/วัน
                โดยสมมุติแผงเพียงพอ; ค่าไฟ 4.50 บาท/หน่วย แบตเตอรี่ใช้ 1 รอบ/วัน
                และแอร์ใช้กำลังเฉลี่ย 1 kW ไม่หักการสูญเสีย
                ตัวเลขส่วนนี้เป็นสมมติฐานของแม่แบบ ไม่ใช่ผลจำลองกราฟ
              </p>
            </section>
            <section
              style={{
                background: "#f0f8f5",
                border: "1px solid #d7e9e0",
                borderLeft: `3px solid ${green}`,
                borderRadius: 8,
                padding: "12px 15px",
              }}
            >
              <div
                style={{
                  color: green,
                  fontSize: 9,
                  letterSpacing: 1,
                  fontWeight: 700,
                }}
              >
                YOUR ENERGY SOLUTION
              </div>
              <h3 style={{ margin: "4px 0 6px", fontSize: 14, color: green }}>
                สรุประบบที่แนะนำสำหรับคุณ
              </h3>
              <div style={{ borderTop: "1px solid #d7e9e0", paddingTop: 7 }}>
                • ระบบนี้ใช้ {name}
                {inverterKW !== null
                  ? ` · กำลังรวม ${number(inverterKW)} kW`
                  : ""}
              </div>
              {packs.map((pack, i) => (
                <div key={i} style={{ marginTop: 4 }}>
                  • {pack.name} จำนวน <strong>{pack.count} ก้อน</strong>
                </div>
              ))}
              <div style={{ marginTop: 4 }}>
                {battery?.count === 0
                  ? "• ไม่ติดแบตเตอรี่"
                  : `• ความจุแบตรวม ${number(capacity)} kWh`}
              </div>
              {battery?.notice && (
                <div style={{ color: "#946200", fontSize: 10, marginTop: 5 }}>
                  {battery.notice}
                </div>
              )}
            </section>
            <section
              style={{
                background: "#e8f6f0",
                border: "1px solid #cee8dc",
                borderRadius: 8,
                padding: "12px 15px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: green,
                }}
              >
                <h3 style={{ fontSize: 15, margin: 0 }}>ราคาโดยประมาณ</h3>
                <strong style={{ fontSize: 24 }}>{maskedPrice(total)}</strong>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 9, color: "#60796e" }}>
                ราคารวมอินเวอร์เตอร์และแบตเตอรี่ที่เลือก กรุณายืนยันราคา ภาษี
                และค่าติดตั้งกับเจ้าหน้าที่
              </p>
            </section>
            <footer
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                marginTop: "auto",
                paddingTop: 8,
                borderTop: "1px solid #e5eaee",
              }}
            >
              <FittedImage
                src={imgLine}
                alt="LINE ติดต่อเจ้าหน้าที่"
                width={42}
                height={42}
              />
              <strong style={{ color: green, flex: 1, fontSize: 10 }}>
                ติดต่อเพื่อขอส่วนลดเพิ่มเติม สแกนเลย
              </strong>
              <span style={{ color: muted, fontSize: 9 }}>
                วันที่สร้างเอกสาร: {date}
              </span>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
