import React from "react";
import { money } from "./battery-summary";
export default function BatterySummary({ battery, getDriveImageUrl, showPrice = false }) {
  if (!battery) return null;
  return <section style={{ border: "1px solid #dbeafe", borderRadius: 20, padding: 24, margin: "20px 0 0", background: "#f3f8ff", color: "#20354b", breakInside: "avoid" }}>
    <div style={{ color: "#1674d1", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>BATTERY STORAGE</div>
    <h3 style={{ fontSize: 22, margin: "8px 0 16px" }}>แบตเตอรี่ที่เลือก</h3>
    {battery.count === 0 ? <p>ไม่ติดแบต</p> : battery.items ? <>
      {battery.items.map(item => <div key={item.name} style={{marginBottom: 12}}>
        {item.image && <img src={getDriveImageUrl?.(item.image) || item.image} alt={item.name} style={{width: 80, height: 80, objectFit: "contain"}} />}
        <p><strong>{item.name}</strong> · {item.count} ก้อน · ก้อนละ {item.capacity} kWh</p>
        {item.detail && <p style={{whiteSpace: "pre-line"}}>{item.detail}</p>}
        {item.subDetail && <p style={{whiteSpace: "pre-line"}}>{item.subDetail}</p>}
      </div>)}
      <p>รวม {battery.count} ก้อน · {battery.totalCapacity.toFixed(2)} kWh</p>
      {showPrice && <p>ราคาแบตรวม: {money(battery.totalPrice)}</p>}
    </> : <>
      {battery.image && <img src={getDriveImageUrl?.(battery.image) || battery.image} crossOrigin="anonymous" alt={battery.name} style={{ width: 100, height: 100, objectFit: "contain" }} />}
      <p><strong>{battery.name}</strong> · จำนวน {battery.count} ก้อน</p>
      {battery.capacity !== null && <p>ก้อนละ {battery.capacity} kWh · รวม {Number(battery.totalCapacity.toFixed(2))} kWh</p>}
      {showPrice && <p>ราคาต่อก้อน: {money(battery.unitPrice)} · ราคาแบตรวม: {money(battery.totalPrice)}</p>}
      {battery.detail && <p style={{whiteSpace: "pre-line"}}>{battery.detail}</p>}
      {battery.subDetail && <p style={{whiteSpace: "pre-line"}}>{battery.subDetail}</p>}
    </>}
  </section>;
}
