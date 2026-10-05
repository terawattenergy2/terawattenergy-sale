import React, { useEffect, useRef, useState } from "react";
import { mountSolarPage } from "./solar-page-controller";
import "./SolarPage.css";
import { useNavigate } from "react-router-dom";
import { findInverters, calculateBatteryCount } from "./find-inverters";
import { Button } from "react-bootstrap";
import PersonalPage from "./personalPage";

// Use the exact selected capacity, not the rounded search bucket.
// With no battery selected, preserve the existing inverter recommendations.
function filterBatteryOptionsByType(matches, selectedBatteryKWh) {
  if (selectedBatteryKWh <= 0) return matches;

  return matches.filter((item) => {
    const type = String(item.type ?? "")
      .trim()
      .toLowerCase();
    const capacity = Number(item.bat_caculated);
    if (type === "neo") return capacity === 6.02 || capacity === 7.53;
    if (type === "stor" || type === "hybrid") return capacity === 9.04;
    return true;
  });
}

// The controller owns the form inputs and calculated outputs.
// Its effect is scoped to this page and cleans up on route changes/StrictMode.
function ChartLegend({ battery = false }) {
  const itemStyle = { display: "inline-flex", alignItems: "center", gap: 8 };
  const sun = (color) => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" fill={color} />
      <path d="M12 1v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </svg>
  );
  const dot = (color) => (
    <span
      aria-hidden="true"
      style={{ width: 14, height: 14, borderRadius: 3, background: color }}
    />
  );
  return (
    <div
      className="solar-chart-legend"
      aria-label="คำอธิบายกราฟ"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px 24px",
        margin: "16px 0",
      }}
    >
      <span style={itemStyle}>{sun("var(--te-direct)")}การใช้ไฟจากโซลาเซลล์โดยตรง</span>
      {battery && (
        <span style={itemStyle}>{dot("var(--te-battery)")}พลังงานจากแบตเตอรี่</span>
      )}
      <span style={itemStyle}>{dot("var(--te-grid, #9bd5f5)")}Grid มิเตอร์การไฟฟ้า</span>
      <span style={itemStyle}>
        {sun("var(--te-pv)")}กำลังการผลิตของโซลาเซลล์
      </span>
      <span style={itemStyle}>
        <span
          aria-hidden="true"
          style={{ width: 24, borderTop: "2px dashed var(--te-load, #17212e)" }}
        />
        โหลดการใช้ไฟฟ้า
      </span>
    </div>
  );
}

export default function SolarPage({ resultPath = "/result" }) {
  const navigate = useNavigate();
  const root = useRef(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 600px)");
    const sync = () => {
      const details = root.current?.querySelector(".battery-mobile-help");
      if (details) details.open = !media.matches;
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  const [pendingSearch, setPendingSearch] = useState(null);
  const [latestCalculation, setLatestCalculation] = useState(null);
  const [result, setResult] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchStatus, setSearchStatus] = useState("idle");
  const [searchError, setSearchError] = useState("");
  const searchRequest = useRef(null);
  const clearSearch = () => {
    searchRequest.current?.abort();
    searchRequest.current = null;
    setProducts([]);
    setSearchStatus("idle");
    setSearchError("");
  };
  useEffect(() => () => searchRequest.current?.abort(), []);
  useEffect(
    () =>
      mountSolarPage(root.current, {
        onCalculation: (calculation) => {
          clearSearch();
          setLatestCalculation(calculation);
          setResult(null);
        },
        onBatteryAvailability: (available) => {
          setCanAddBattery(available);
          if (!available) setIsBat(false);
        },
      }),
    [],
  );

  const [isBat, setIsBat] = useState(false);
  const [canAddBattery, setCanAddBattery] = useState(false);

  useEffect(() => {
    if (isBat) {
      root.current?.dispatchEvent(new Event("solar:battery-visible"));
    }
  }, [isBat]);

  const handleIsBat = () => {
    clearSearch();
    setResult(null);
    setIsBat((prev) => !prev);
  };

  const handleFindInverter = async () => {
    if (!latestCalculation) return;
    const roundUpToFive = (value) => Math.ceil(value / 5) * 5;
    const selectedBatteryKWh = isBat ? latestCalculation.batteryKWh : 0;
    const result = {
      point: roundUpToFive(latestCalculation.peakLoadKW),
      bat: roundUpToFive(isBat ? latestCalculation.batteryKWh : 0),
      phase: `${latestCalculation.phases} phase`,
    };
    clearSearch();
    setResult(result);
    const request = new AbortController();
    searchRequest.current = request;
    setSearchStatus("loading");
    try {
      const matches = await findInverters(result, { signal: request.signal });
      if (searchRequest.current !== request || request.signal.aborted) return;
      const batteryMatches = filterBatteryOptionsByType(
        matches,
        selectedBatteryKWh,
      );
      const recommendations = batteryMatches.map((item) => ({
        ...item,
        selectedBatteryKWh,
        batteryCount: calculateBatteryCount(
          selectedBatteryKWh,
          item.bat_caculated,
        ),
      }));
      setProducts(recommendations);
      if (recommendations.length) {
        // Keep the exact search snapshot until personal details are saved.
        setPendingSearch({
          source: "solar",
          result,
          selectedBatteryKWh,
          products: recommendations,
        });
      }
      setSearchStatus("success");
    } catch (error) {
      if (searchRequest.current !== request || request.signal.aborted) return;
      setSearchError(error.message);
      setSearchStatus("error");
    }
  };

  useEffect(() => {
    if (pendingSearch) {
      window.scrollTo({ top: 0, behavior: "auto" });
    } else {
      // Redraw canvases after returning from the personal information step.
      root.current?.dispatchEvent(new Event("solar:battery-visible"));
    }
  }, [pendingSearch]);

  const handlePersonalComplete = (personalData) => {
    if (!pendingSearch) return;
    // PersonalPage has already saved the lead and personal_data before calling us.
    navigate(resultPath, {
      state: { solarSearch: pendingSearch, personalData },
    });
  };

  return (
    <>
      {pendingSearch && (
        <PersonalPage
          onComplete={handlePersonalComplete}
          onBack={() => setPendingSearch(null)}
        />
      )}
      {/* Keep controller-owned inputs mounted so Back preserves all graph values. */}
      <div
        className="solar-page"
        ref={root}
        style={pendingSearch ? { display: "none" } : undefined}
      >
        <main>
          <div className={"eyebrow"}>{"ENERGY PLANNING / SOLAR + STORAGE"}</div>
          <h1>{"จำลองพลังงาน Solar + BESS"}</h1>
          <p className={"sub"}>
            {
              "\n      ดูว่าไฟมาจากไหนในแต่ละช่วงเวลา และขนาดระบบเปลี่ยนการซื้อไฟอย่างไร\n    "
            }
          </p>
          <div className={"controls"}>
            <label>
              {"ขนาด Solar"}
              <input
                id={"solarKWp"}
                type={"range"}
                min={"0"}
                max={"30"}
                step={"0.5"}
                defaultValue={"9"}
              />
              <output id={"solarOut"}></output>
            </label>
            <label>
              {"บิลเดิมต่อเดือน"}
              <input
                id={"bill"}
                type={"range"}
                min={"0"}
                max={"30000"}
                step={"100"}
                defaultValue={"7000"}
              />
              <output id={"billOut"}></output>
            </label>
            <label>
              {"◐ สัดส่วนใช้ไฟกลางวัน"}
              <input
                id={"daytimeShare"}
                type={"range"}
                min={"0"}
                max={"100"}
                step={"1"}
                defaultValue={"20"}
              />
              <output id={"dayOut"}></output>
            </label>
          </div>
          <section className={"chart-box"} style={{ marginTop: "18px" }}>
            <div className={"settings"} style={{ marginTop: "0" }}>
              <label>
                {"เริ่มช่วงกลางวัน"}
                <select id={"dayStart"}></select>
              </label>
              <label>
                {"สิ้นสุดช่วงกลางวัน"}
                <select id={"dayEnd"}></select>
              </label>
              <label>
                {"ระบบไฟฟ้า"}
                <select id={"phases"}>
                  <option value={"1"}>{"1 เฟส"}</option>
                  <option value={"3"}>{"3 เฟส"}</option>
                </select>
              </label>
              <div>
                <b id={"periodInfo"}></b>
                <p className={"hint"}>
                  {
                    "\n            สัดส่วนกลางวันใช้กับช่วงที่เลือก ส่วนที่เหลือกระจายนอกช่วงนี้\n          "
                  }
                </p>
              </div>
            </div>
            <p className={"hint"}>
              {
                "\n        เลือกช่วงภายในวันเดียวกัน ทุก 15 นาที • ช่วงการใช้ไฟไม่เปลี่ยนเวลาแดดของ\n        Solar • จำนวนเฟสเป็นข้อมูลระบบ\n        ยังไม่จำลองโหลดแยกเฟสหรือข้อจำกัดของอินเวอร์เตอร์\n      "
              }
            </p>
          </section>
          <details>
            <summary>{"ข้อมูลและสมมติฐานการคำนวณ"}</summary>
            <div className={"settings"}>
              <label>
                {"หน่วยไฟจริงต่อเดือน (kWh)"}
                <input
                  id={"monthlyKWh"}
                  type={"number"}
                  min={"0"}
                  placeholder={"เว้นว่างเพื่อประมาณจากบิล"}
                />
                <span className={"hint"}>{"ถ้ากรอก จะใช้แทนยอดบิลด้านบน"}</span>
              </label>
              <label>
                {"ค่าไฟแปรผันรวม (บาท/kWh)"}
                <input
                  id={"rate"}
                  type={"number"}
                  min={"0.01"}
                  step={"0.01"}
                  defaultValue={"4.5"}
                />
              </label>
              <label>
                {"ค่าคงที่รวมต่อเดือน (บาท)"}
                <input
                  id={"fixed"}
                  type={"number"}
                  min={"0"}
                  defaultValue={"0"}
                />
              </label>
              <label>
                {"จำนวนวันในรอบบิล"}
                <input
                  id={"days"}
                  type={"number"}
                  min={"1"}
                  max={"31"}
                  defaultValue={"30"}
                />
              </label>
              <label>
                {"ผลผลิต Solar (kWh/kWp/วัน)"}
                <input
                  id={"yieldPerKWp"}
                  type={"number"}
                  min={"0"}
                  step={"0.1"}
                  defaultValue={"4"}
                />
              </label>
              <label>
                {"กำลังชาร์จสูงสุด (kW)"}
                <input
                  id={"chargeKW"}
                  type={"number"}
                  min={"0"}
                  step={"0.5"}
                  defaultValue={"9"}
                  readOnly
                />
              </label>
              <label>
                {"กำลังจ่ายสูงสุด (kW)"}
                <input
                  id={"dischargeKW"}
                  type={"number"}
                  min={"0"}
                  step={"0.5"}
                  defaultValue={"5"}
                />
              </label>
              <label>
                {"ประสิทธิภาพชาร์จ (%)"}
                <input
                  id={"chargeEfficiency"}
                  type={"number"}
                  min={"1"}
                  max={"100"}
                  defaultValue={"99"}
                />
              </label>
              <label>
                {"ประสิทธิภาพจ่าย (%)"}
                <input
                  id={"dischargeEfficiency"}
                  type={"number"}
                  min={"1"}
                  max={"100"}
                  defaultValue={"99"}
                />
              </label>
              <label>
                {"ระดับแบตขั้นต่ำ (%)"}
                <input
                  id={"minSOC"}
                  type={"number"}
                  min={"0"}
                  max={"100"}
                  defaultValue={"0"}
                />
              </label>
              <label>
                {"ระดับแบตสูงสุด (%)"}
                <input
                  id={"maxSOC"}
                  type={"number"}
                  min={"0"}
                  max={"100"}
                  defaultValue={"99"}
                />
              </label>
              <label>
                {"เงื่อนไขไฟส่วนเกิน"}
                <select id={"exportAllowed"} defaultValue="true">
                  <option value={"false"}>{"ไม่ส่งออก / จำกัดการผลิต"}</option>
                  <option value={"true"}>{"อนุญาตให้ส่งออก"}</option>
                </select>
              </label>
              <label>
                {"ราคาขายไฟ (บาท/kWh)"}
                <input
                  id={"exportRate"}
                  type={"number"}
                  min={"0"}
                  step={"0.01"}
                  defaultValue={"2.2"}
                />
              </label>
            </div>
            <p className={"hint"}>
              {
                "\n        ค่าไฟ 4.50 เป็นค่าตัวอย่าง ไม่ใช่อัตราประกาศ •\n        กรอกอัตราและค่าคงที่บนฐานภาษีเดียวกัน • ค่าเริ่มต้นประสิทธิภาพชาร์จและจ่าย 99%\n        ให้ประสิทธิภาพรอบ 98.01% • ราคาขายไฟ 2.20 เป็นค่าที่ตั้งในแบบจำลอง\n      "
              }
            </p>
          </details>
          <p id={"error"} role={"alert"}></p>
          <h2>{"1. Solar อย่างเดียว — ยังไม่ติดแบต"}</h2>
          <section className={"chart-box"}>
            <b>{"☀ กำลังไฟตลอดวัน · kW"}</b>
            <ChartLegend />
            <canvas
              id={"baseChart"}
              role={"img"}
              aria-label={"กราฟ Solar ที่ยังไม่ติดแบต"}
            ></canvas>
            <div id={"baseReadout"} className={"readout"}>
              {"เลื่อนเมาส์หรือแตะกราฟเพื่อดูค่า"}
            </div>
          </section>
          <div className={"cards"}>
            <div className={"card"}>
              <span>{"Solar ที่ผลิตได้ / วัน"}</span>
              <strong style={{ color: "orange" }} id={"base_pvValue"}></strong>
              <small>{"ก่อนหักส่วนที่จำกัดการผลิต"}</small>
            </div>

            <div className={"card"}>
              <span>{"ประหยัดค่าไฟ / รอบบิล"}</span>
              <strong
                id={"base_savingValue"}
                style={{ color: "var(--te-accent)" }}
              ></strong>
              <small>{"ยังไม่รวมรายได้ขายไฟ"}</small>
            </div>
            <div className={"card"}>
              <span>{"บิลใหม่โดยประมาณ"}</span>
              <strong
                id={"base_newBillValue"}
                style={{ color: "var(--te-text)" }}
              ></strong>
              <small id={"base_baseline"}></small>
            </div>
          </div>
          <div className={"note"} id={"baseSummary"}></div>
          <Button
            onClick={handleIsBat}
            disabled={!canAddBattery}
            aria-describedby={!canAddBattery ? "battery-advice" : undefined}
            aria-expanded={isBat}
            aria-controls="battery-calculation"
            className="mt-4"
          >
            {!canAddBattery
              ? "Solar ส่วนเกินไม่พอติดแบต"
              : isBat
                ? "ไม่สนใจติดตั้งแบต"
                : "สนใจติดตั้งแบต"}
          </Button>
          {!canAddBattery && (
            <p id="battery-advice" className="hint" role="status">
              ลองเพิ่มขนาด Solar หรือลดการใช้ไฟช่วงกลางวัน
            </p>
          )}
          <div
            id="battery-calculation"
            style={{ display: isBat ? "block" : "none" }}
          >
            <h2>{"2. เลือกความจุแบตเตอรี่"}</h2>
            <section className={"battery-panel"}>
              <label>
                {"▣ ความจุแบตเตอรี่"}
                <input
                  id="batteryChoice"
                  type="range"
                  min="0"
                  max="0"
                  step="1"
                  defaultValue="0"
                  aria-label="ความจุแบตเตอรี่"
                  aria-describedby="batterySizing"
                />
                <input id="batteryKWh" type="hidden" defaultValue="0" />
                <div
                  id="batteryOptions"
                  aria-hidden="true"
                  style={{ display: "flex", justifyContent: "space-between" }}
                />
                <output id={"batteryOut"}></output>
              </label>
              <details className="battery-mobile-help">
                <summary>เงื่อนไขการเลือกแบต</summary>
              <div className={"note"}>
                <b>{"เลือกแบตตามพลังงาน Solar ส่วนเกิน"}</b>
                <div id={"batterySizing"} aria-live={"polite"}></div>
              </div>
              <p className={"hint"}>
                {
                  "เลือก 0 (ไม่ติดแบต) หรือ 6.0–30.4 kWh ทีละ 0.1 โดยไม่เกิน Solar ส่วนเกิน หากไม่ถึง 6 จะเลือกได้เฉพาะ 0"
                }
              </p>
              </details>
            </section>
            <h2>{"3. Solar + แบตเตอรี่ที่เลือก"}</h2>
            <div className={"note"} id={"batteryDelta"}></div>
            <section className={"chart-box"}>
              <div className={"chart-head"}>
                <b>
                  {"กำลังไฟตลอดวัน "}
                  <span className={"hint"}>{"· kW"}</span>
                </b>
                <label hidden style={{ display: "none" }}>
                  วันที่แสดง
                  <select id="viewDay" defaultValue="1">
                    <option value="1">1</option>
                  </select>
                </label>
              </div>
              <ChartLegend battery />
              <canvas
                id={"chart"}
                role={"img"}
                aria-label={
                  "กราฟกำลังไฟราย 15 นาที แสดง Solar แบตเตอรี่ และการซื้อไฟ"
                }
              ></canvas>
              <div id={"readout"} className={"readout"} aria-live={"polite"}>
                {
                  "\n        เลื่อนเมาส์หรือแตะกราฟเพื่อดูค่ารายช่วงเวลา\n      "
                }
              </div>
              {/* <div className={"hint"}>{"ระดับพลังงานในแบตเตอรี่ · SOC (%)"}</div>
        <canvas
          id={"socChart"}
          className={"soc"}
          role={"img"}
          aria-label={"กราฟระดับแบตเตอรี่"}
        ></canvas> */}
            </section>
            <div className={"cards"}>
              <div className={"card"}>
                <span>{"Solar ที่ผลิตได้ / วัน"}</span>
                <strong id={"pvValue"}></strong>
                <small>{"ก่อนหักส่วนที่จำกัดการผลิต"}</small>
              </div>

              <div className={"card"}>
                <span>{"ประหยัดค่าไฟ / รอบบิล"}</span>
                <strong
                  id={"savingValue"}
                  style={{ color: "var(--te-accent)" }}
                ></strong>
                <small>{"ยังไม่รวมรายได้ขายไฟ"}</small>
              </div>
              <div className={"card"}>
                <span>{"บิลใหม่โดยประมาณ"}</span>
                <strong
                  id={"newBillValue"}
                  style={{ color: "var(--te-text)" }}
                ></strong>
                <small id={"baseline"}></small>
              </div>
            </div>
          </div>
          <div className={"note"} id={"summary"}></div>
          <Button
            onClick={handleFindInverter}
            disabled={!latestCalculation || searchStatus === "loading"}
            className="mt-4"
          >
            {searchStatus === "loading"
              ? "กำลังค้นหา…"
              : "ค้นหาอินเวอร์ที่เหมาะสม"}
          </Button>
          {result && (
            <div className="note" role="status">
              ค่าที่ใช้ค้นหา: {result.point} kW · แบต {result.bat} kWh ·{" "}
              {result.phase}
            </div>
          )}
          {searchStatus === "error" && <p role="alert">{searchError}</p>}
          {searchStatus === "success" && products.length === 0 && (
            <p role="status">ไม่พบสินค้าที่ตรงกับโหลด แบต และเฟสที่เลือก</p>
          )}
          {searchStatus === "success" && products.length > 0 && (
            <section aria-label="สินค้าที่ตรงเงื่อนไข">
              <h2>สินค้าที่ตรงเงื่อนไข ({products.length})</h2>
              <div className="cards">
                {products.map((item) => (
                  <div className="card" key={item.matchKey}>
                    <h3>{item.product}</h3>
                    {item.type && <p>ประเภท: {item.type}</p>}
                    {result.bat > 0 && (
                      <p>
                        แบต: {item.bat} · จำนวน{" "}
                        {item.batteryCount === null
                          ? "คำนวณไม่ได้"
                          : `${item.batteryCount} ก้อน`}
                      </p>
                    )}
                    <p>
                      {result.point} kW · {result.phase}
                    </p>
                    {result.bat > 0 && (
                      <p>
                        ก้อนละ {Number(item.bat_caculated)} kWh · รวม{" "}
                        {Number(
                          (
                            item.batteryCount * Number(item.bat_caculated)
                          ).toFixed(2),
                        )}{" "}
                        kWh
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
          <div className={"footer"}>
            <span className={"hint"}>
              {
                "แบบจำลองราย 15 นาที • ช่วงกลางวันตามที่เลือก •\n        ต่อเนื่องตลอดรอบบิล"
              }
            </span>
          </div>
          <details hidden style={{ display: "none" }}>
            <summary>{"สูตรและขอบเขตของแบบจำลอง"}</summary>
            <p>
              {
                "\n        ใช้รูปแบบโหลดกลางวัน/กลางคืนคงที่ และผลผลิต Solar รูปคลื่น sin² ช่วง\n        06:00–18:00 โดยปรับพื้นที่ใต้กราฟให้ตรงกับพลังงานต่อวัน\n        ไม่ได้ใช้ข้อมูลอากาศหรือมิเตอร์จริง\n      "
              }
            </p>
            <pre id={"liveFormulas"}></pre>
            <label>
              {"ดูสูตรรายช่วงเวลา"}
              <select id={"formulaTime"}></select>
            </label>
            <pre id={"stepFormulas"}></pre>
            <details>
              <summary>{"สูตรทั่วไป"}</summary>
              <pre>
                {
                  "\nหน่วยไฟเดือน = (บิล − ค่าคงที่) ÷ อัตราค่าไฟ หรือใช้หน่วยจริงที่กรอก\nหน่วยไฟวัน = หน่วยไฟเดือน ÷ จำนวนวัน\nชั่วโมงกลางวัน = เวลาสิ้นสุด − เวลาเริ่มต้น\nโหลดกลางวัน = หน่วยไฟวัน × สัดส่วนกลางวัน ÷ ชั่วโมงกลางวัน\nโหลดนอกช่วง = หน่วยไฟวัน × (1 − สัดส่วนกลางวัน) ÷ (24 − ชั่วโมงกลางวัน)\nSolar ต่อวัน = ขนาด kWp × ผลผลิต kWh/kWp/วัน\n\nเพดานแบตจากพื้นที่ส่วนเกิน:\nพลังงานส่วนเกินต่อวัน = Σ max(Solar − โหลดการใช้ไฟฟ้า, 0) × 0.25\nความจุแบตพิกัด = พลังงานส่วนเกิน × ประสิทธิภาพชาร์จ ÷ (SOCสูงสุด − SOCขั้นต่ำ)\nใช้ SOC เป็นสัดส่วน 0–1 และปัดความจุขึ้นทีละ 0.1 kWh\nเป็นขนาดเพื่อรับส่วนเกินหนึ่งวัน ไม่ใช่ขนาดที่เหมาะสมที่สุดด้านความคุ้มค่า\n\nแต่ละช่วงเวลา Δt = 0.25 ชั่วโมง:\nใช้ตรง = min(โหลดการใช้ไฟฟ้า, Solar)\nส่วนเกิน = max(Solar − โหลดการใช้ไฟฟ้า, 0)\nส่วนขาด = max(โหลดการใช้ไฟฟ้า − Solar, 0)\nชาร์จ = min(ส่วนเกิน, กำลังชาร์จสูงสุด, (Emax − E) ÷ (Δt × ηชาร์จ))\nจ่าย = min(ส่วนขาด, กำลังจ่ายสูงสุด, (E − Emin) × ηจ่าย ÷ Δt)\nEใหม่ = E + ชาร์จ × Δt × ηชาร์จ − จ่าย × Δt ÷ ηจ่าย\nซื้อไฟ = ส่วนขาด − จ่าย\nส่งออกหรือจำกัดการผลิต = ส่วนเกิน − ชาร์จ\n\nพลังงานแต่ละรายการ (kWh) = Σ กำลัง (kW) × Δt\nบิลใหม่ = พลังงานซื้อไฟ × อัตราค่าไฟ + ค่าคงที่\nประหยัด = บิลเดิมที่คำนวณได้ − บิลใหม่\nรายได้ขายไฟ = พลังงานส่งออก × ราคาขายไฟ"
                }
              </pre>
            </details>
            <p className={"hint"}>
              {
                "\n        เริ่มแบตที่ระดับสำรองขั้นต่ำและส่งต่อสถานะทุกวัน ไม่มีการชาร์จจากกริด\n        ไม่มี TOU/ขั้นบันได/demand charge การเสื่อมแบต ขีดจำกัดอินเวอร์เตอร์ร่วม\n        หรือการประเมินไฟสำรองขณะไฟดับ ตัวเลขเป็นการประมาณด้วยอัตราค่าไฟคงที่\n        ไม่ใช่ใบเสนอราคาหรือบิลจริง แกนเวลาแสดงต้นช่วง ส่วน SOC เป็นค่าท้ายช่วง\n      "
              }
            </p>
          </details>
        </main>
      </div>
    </>
  );
}
