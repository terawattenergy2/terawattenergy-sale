import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase";
import useReportAccess from "./useReportAccess";
import "./report.css";
import {
  reportParams,
  loadExportRows,
  verifyExportAccess,
  filterDescription,
  exportExcel,
  exportPdf,
} from "./reportExport";

const EMPTY_FILTERS = {
  search: "",
  sale: "",
  from: "",
  to: "",
  product: "",
  company: "",
  customerName: "",
  customerEmail: "",
  priceMin: "",
  priceMax: "",
  priceBand: "",
  weekday: "",
};
const PAGE_SIZE = 25;
const display = (value) =>
  value == null || value === "" ? "—" : String(value);
const dateLabel = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime())
    ? new Intl.DateTimeFormat("th-TH", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Bangkok",
      }).format(date)
    : "—";
};
const priceLabel = (value) =>
  value == null || value === "" || !Number.isFinite(Number(value))
    ? "ยังไม่มีราคา"
    : `${new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(Number(value))} บาท`;
const optionLabels = {
  0: "ระบบไฟ",
  1: "อินเวอร์เตอร์",
  2: "แบตเตอรี่",
  3: "จำนวนแบตเตอรี่",
  4: "Home Energy",
  5: "EV DC",
  microSize: "ขนาด Micro",
};
function readable(value) {
  if (value == null || value === "") return "—";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}
function QuoteDetail({ row }) {
  const fields = [
    ["รุ่นที่แนะนำ", row.suggest_product],
    ["ระบบไฟ / Phase", row.phase],
    ["ขนาดอินเวอร์เตอร์", row.inverter_size],
    ["แบตเตอรี่", row.bat],
    ["จำนวนแบตเตอรี่", row.bat_module],
    ["Home Energy", row.home_energy],
    ["EV DC", row.ev_dc],
    ["รายการ Micro", row.micro_products],
  ];
  const options =
    row.selected_options &&
    typeof row.selected_options === "object" &&
    !Array.isArray(row.selected_options)
      ? Object.entries(row.selected_options)
      : [];
  return (
    <div className="tr-detail">
      <h3>สิ่งที่ลูกค้าเลือก</h3>
      <dl className="tr-detail-grid">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{display(value)}</dd>
          </div>
        ))}
      </dl>
      {options.length > 0 && (
        <details>
          <summary>ดูตัวเลือกที่บันทึกทั้งหมด</summary>
          <dl className="tr-detail-grid">
            {options.map(([key, value]) => (
              <div key={key}>
                <dt>{optionLabels[key] || `ตัวเลือก ${key}`}</dt>
                <dd>{readable(value)}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
      <p>
        ราคาโดยประมาณ: <strong>{priceLabel(row.total_price)}</strong>
      </p>
      <p>
        ติดต่อเซลส์: {display(row.exporter_email)} ·{" "}
        {display(row.exporter_phone)}
      </p>
      <small>เลขรายการ: {row.id}</small>
    </div>
  );
}

export default function ReportPage() {
  const access = useReportAccess();
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const [choices, setChoices] = useState({
    products: [],
    companies: [],
    sellers: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const requestRef = useRef(0);
  const exportControllerRef = useRef(null);
  const [exporting, setExporting] = useState("");
  const [exportProgress, setExportProgress] = useState("");
  const [exportError, setExportError] = useState("");
  useEffect(
    () => () => {
      exportControllerRef.current?.abort();
    },
    [access.userId, access.scope, access.loading],
  );

  const handleReportExport = async (format) => {
    if (
      exportControllerRef.current ||
      loading ||
      access.loading ||
      !result?.total
    )
      return;
    if (JSON.stringify(draft) !== JSON.stringify(filters)) {
      setExportError("กรุณากดค้นหารายการเพื่อใช้ตัวกรองที่แก้ไขก่อน Export");
      return;
    }
    const controller = new AbortController();
    exportControllerRef.current = controller;
    setExporting(format);
    setExportError("");
    setExportProgress("กำลังเตรียมข้อมูล…");
    try {
      const allRows = await loadExportRows(
        filters,
        access,
        controller.signal,
        setExportProgress,
      );
      const description = filterDescription(filters, access.scope, choices);
      const guard = () =>
        verifyExportAccess(access.userId, access.scope, controller.signal);
      const writer = format === "excel" ? exportExcel : exportPdf;
      await writer(
        allRows,
        description,
        guard,
        controller.signal,
        setExportProgress,
      );
      setExportProgress("เตรียมไฟล์และเริ่มดาวน์โหลดแล้ว");
    } catch (err) {
      setExportProgress("");
      setExportError(
        controller.signal.aborted
          ? "ยกเลิกการส่งออกแล้ว"
          : err.message || "ส่งออกไม่สำเร็จ กรุณาลองใหม่",
      );
    } finally {
      if (exportControllerRef.current === controller)
        exportControllerRef.current = null;
      setExporting("");
    }
  };

  useEffect(() => {
    setResult(null);
    setChoices({ products: [], companies: [], sellers: [] });
    setExpanded(null);
    setPage(1);
    setFilters(EMPTY_FILTERS);
    setDraft(EMPTY_FILTERS);
  }, [access.userId, access.scope]);

  useEffect(() => {
    const request = ++requestRef.current;
    setResult(null);
    setExpanded(null);
    setError("");
    if (access.loading || !["all", "own"].includes(access.scope)) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    supabase
      .rpc(
        "teramatch_quote_report_v2",
        reportParams(filters, access.scope, page, PAGE_SIZE),
      )
      .then(({ data, error: queryError }) => {
        if (!active || request !== requestRef.current) return;
        if (queryError) throw queryError;
        if (!data || !Array.isArray(data.rows))
          throw new Error("รูปแบบข้อมูล Report ไม่ถูกต้อง");
        setResult(data);
        setChoices({
          products: data.products || [],
          companies: data.companies || [],
          sellers: data.sellers || [],
        });
      })
      .catch((queryError) => {
        if (active && request === requestRef.current) {
          setResult(null);
          setError(queryError.message || "โหลด Report ไม่สำเร็จ กรุณาลองใหม่");
        }
      })
      .finally(() => {
        if (active && request === requestRef.current) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [access.loading, access.userId, access.scope, filters, page, refresh]);

  if (access.loading)
    return (
      <main className="tr-report">
        <p role="status">กำลังตรวจสอบสิทธิ์…</p>
      </main>
    );
  if (!["all", "own"].includes(access.scope))
    return (
      <main className="tr-report">
        <h1>ไม่สามารถเปิด Report ได้</h1>
        <p role="alert">{access.error || "บัญชีนี้ไม่มีสิทธิ์ดูรายงาน"}</p>
        <Link to="/mainpage">กลับหน้าหลัก</Link>
      </main>
    );

  const rows = result?.rows || [];
  const total = Number(result?.total || 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const change = (key) => (event) =>
    setDraft((old) => ({ ...old, [key]: event.target.value }));
  const applyFilters = (event) => {
    event.preventDefault();
    if (exporting) return;
    setFormError("");
    if (draft.from && draft.to && draft.from > draft.to) {
      setFormError("วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด");
      return;
    }
    if (
      [draft.priceMin, draft.priceMax].some(
        (v) => v !== "" && (!Number.isFinite(Number(v)) || Number(v) < 0),
      ) ||
      (draft.priceMin !== "" &&
        draft.priceMax !== "" &&
        Number(draft.priceMin) > Number(draft.priceMax))
    ) {
      setFormError(
        "กรุณาระบุช่วงราคาให้ถูกต้อง ราคาต่ำสุดต้องไม่เกินราคาสูงสุด",
      );
      return;
    }
    setPage(1);
    setFilters({ ...draft });
  };
  return (
    <main className="tr-report">
      <header className="tr-header">
        <div>
          <span className="tr-eyebrow">TERAMATCH / SALES REPORT</span>
          <h1>
            {access.scope === "all" ? "ภาพรวมลูกค้าและเซลส์" : "ลูกค้าของฉัน"}
          </h1>
          <p>ติดตามลูกค้า ผู้ดูแล และระบบที่สนใจ จากรายการที่กด Export</p>
        </div>
        <div className="tr-header-actions">
          <Link to="/mainpage">กลับหน้าหลัก</Link>
          <button
            type="button"
            disabled={loading || Boolean(exporting)}
            onClick={() => setRefresh((n) => n + 1)}
          >
            รีเฟรช
          </button>
        </div>
      </header>
      <div className="tr-scope">
        {access.scope === "all"
          ? "ผู้ดูแล · เห็นข้อมูลทุกเซลส์"
          : "เซลส์ · เห็นเฉพาะรายการของคุณ"}
      </div>
      <section className="tr-stats" aria-label="สรุปตามตัวกรอง">
        {[
          ["รายการ Export", result ? total : "—"],
          ["ลูกค้าโดยประมาณ", result ? result.customer_count : "—"],
          ["รายการไม่ทราบเซลส์", result ? result.unassigned_count : "—"],
        ].map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
      <p className="tr-hint">
        นับลูกค้าจากอีเมล ถ้าไม่มีใช้เบอร์โทร
        หากไม่มีทั้งสองอย่างนับแยกตามรายการ
      </p>
      <section className="tr-filter-panel" aria-label="ค้นหารายงาน">
        <div className="tr-panel-heading">
          <div>
            <span className="tr-eyebrow">FILTERS</span>
            <h2>ค้นหารายการลูกค้า</h2>
          </div>
          <span>เลือกเงื่อนไข แล้วกดค้นหา</span>
        </div>
        <form className="tr-filters" onSubmit={applyFilters}>
          <label>
            สินค้า / รุ่น
            <select value={draft.product} onChange={change("product")}>
              <option value="">สินค้าทั้งหมด</option>
              {choices.products.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            เรทราคา
            <select
              value={draft.priceBand}
              onChange={(e) => {
                const band = e.target.value;
                const ranges = {
                  low: ["0", "100000"],
                  mid: ["100000.01", "300000"],
                  high: ["300000.01", "500000"],
                  premium: ["500000.01", ""],
                };
                const [priceMin, priceMax] = ranges[band] || ["", ""];
                setDraft((old) => ({
                  ...old,
                  priceBand: band,
                  priceMin,
                  priceMax,
                }));
              }}
            >
              <option value="">ทุกราคา</option>
              <option value="low">ไม่เกิน 100,000 บาท</option>
              <option value="mid">มากกว่า 100,000–300,000 บาท</option>
              <option value="high">มากกว่า 300,000–500,000 บาท</option>
              <option value="premium">มากกว่า 500,000 บาท</option>
              <option value="missing">ยังไม่มีราคา</option>
              <option value="custom">กำหนดราคาเอง</option>
            </select>
          </label>
          <label>
            ราคาต่ำสุด (บาท)
            <input
              type="number"
              min="0"
              step="0.01"
              disabled={draft.priceBand === "missing"}
              value={draft.priceMin}
              placeholder="ไม่จำกัด"
              onChange={(e) =>
                setDraft((old) => ({
                  ...old,
                  priceBand: "custom",
                  priceMin: e.target.value,
                }))
              }
            />
          </label>
          <label>
            ราคาสูงสุด (บาท)
            <input
              type="number"
              min="0"
              step="0.01"
              disabled={draft.priceBand === "missing"}
              value={draft.priceMax}
              placeholder="ไม่จำกัด"
              onChange={(e) =>
                setDraft((old) => ({
                  ...old,
                  priceBand: "custom",
                  priceMax: e.target.value,
                }))
              }
            />
          </label>
          <label>
            ชื่อเซลส์
            <select
              value={draft.sale}
              onChange={change("sale")}
              disabled={access.scope !== "all"}
            >
              <option value="">
                {access.scope === "all" ? "เซลส์ทั้งหมด" : "เฉพาะรายการของฉัน"}
              </option>
              {choices.sellers.map((sale) => (
                <option key={sale.id} value={sale.id}>
                  {sale.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            บริษัทของเซลส์
            <select value={draft.company} onChange={change("company")}>
              <option value="">บริษัททั้งหมด</option>
              {choices.companies.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            ชื่อลูกค้า
            <input
              value={draft.customerName}
              onChange={change("customerName")}
              placeholder="ค้นหาชื่อหรือนามสกุล"
              maxLength={200}
            />
          </label>
          <label>
            อีเมลลูกค้า
            <input
              type="text"
              inputMode="email"
              value={draft.customerEmail}
              onChange={change("customerEmail")}
              placeholder="ค้นหาอีเมลบางส่วนได้"
              maxLength={200}
            />
          </label>
          <label>
            วันในสัปดาห์
            <select value={draft.weekday} onChange={change("weekday")}>
              <option value="">ทุกวัน</option>
              {[
                [1, "วันจันทร์"],
                [2, "วันอังคาร"],
                [3, "วันพุธ"],
                [4, "วันพฤหัสบดี"],
                [5, "วันศุกร์"],
                [6, "วันเสาร์"],
                [0, "วันอาทิตย์"],
              ].map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            ตั้งแต่วันที่
            <input type="date" value={draft.from} onChange={change("from")} />
          </label>
          <label>
            ถึงวันที่
            <input type="date" value={draft.to} onChange={change("to")} />
          </label>
          <label>
            ค้นหาเพิ่มเติม
            <input
              value={draft.search}
              onChange={change("search")}
              placeholder="เช่น เบอร์โทรศัพท์"
              maxLength={200}
            />
          </label>
          <div className="tr-filter-actions">
            <span>วันและวันที่อิงเวลา Export ในประเทศไทย</span>
            <div>
              <button
                type="button"
                disabled={loading || Boolean(exporting)}
                onClick={() => {
                  setDraft(EMPTY_FILTERS);
                  setFilters(EMPTY_FILTERS);
                  setFormError("");
                  setPage(1);
                }}
              >
                ล้างตัวกรอง
              </button>
              <button
                className="tr-primary"
                type="submit"
                disabled={loading || Boolean(exporting)}
              >
                {loading ? "กำลังค้นหา…" : "ค้นหารายการ"}
              </button>
            </div>
          </div>
        </form>
      </section>
      <section className="tr-export-bar" aria-label="ส่งออกรายงาน">
        <div>
          <strong>ส่งออกรายงาน</strong>
          <p>ส่งออกทุกรายการตามตัวกรองที่กดค้นหาล่าสุด รวมทุกหน้า</p>
        </div>
        <div className="tr-export-buttons">
          <button
            type="button"
            className="tr-export-excel"
            disabled={loading || Boolean(exporting) || !result?.total}
            onClick={() => handleReportExport("excel")}
          >
            Export Excel
          </button>
          <button
            type="button"
            className="tr-export-pdf"
            disabled={loading || Boolean(exporting) || !result?.total}
            onClick={() => handleReportExport("pdf")}
          >
            Export PDF
          </button>
          {exporting && (
            <button
              type="button"
              onClick={() => exportControllerRef.current?.abort()}
            >
              ยกเลิก
            </button>
          )}
        </div>
      </section>
      {exportProgress && (
        <p className="tr-export-status" role="status">
          {exportProgress}
        </p>
      )}
      {exportError && (
        <p className="tr-error" role="alert">
          {exportError}
        </p>
      )}
      {formError && (
        <p className="tr-error" role="alert">
          {formError}
        </p>
      )}
      {error && (
        <p className="tr-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="tr-empty" role="status">
          กำลังโหลดรายการ…
        </p>
      ) : !error && rows.length === 0 ? (
        <p className="tr-empty">ไม่พบรายการตามเงื่อนไขนี้</p>
      ) : (
        !error && (
          <div className="tr-table-wrap">
            <table className="tr-table">
              <caption className="tr-sr-only">
                รายการลูกค้าและสินค้าที่เลือก
              </caption>
              <thead>
                <tr>
                  <th>วัน / วันที่ Export</th>
                  <th>ลูกค้า</th>
                  <th>เซลส์ / บริษัท</th>
                  <th>สินค้าที่สนใจ</th>
                  <th>ราคาโดยประมาณ</th>
                  <th>รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr>
                      <td>{dateLabel(row.created_at)}</td>
                      <td>
                        <strong>
                          {[row.first_name, row.last_name]
                            .filter(Boolean)
                            .join(" ") || "ไม่ระบุชื่อ"}
                        </strong>
                        <span>{display(row.email)}</span>
                        <span>{display(row.phone)}</span>
                      </td>
                      <td>
                        <strong>
                          {row.exporter_full_name ||
                            row.exporter_email ||
                            "ไม่ทราบเซลส์"}
                        </strong>
                        <span>{display(row.exporter_business)}</span>
                      </td>
                      <td>
                        <strong>{display(row.suggest_product)}</strong>
                        <span>{display(row.inverter_size)}</span>
                      </td>
                      <td>{priceLabel(row.total_price)}</td>
                      <td>
                        <button
                          type="button"
                          aria-expanded={expanded === row.id}
                          aria-controls={`quote-${row.id}`}
                          onClick={() =>
                            setExpanded(expanded === row.id ? null : row.id)
                          }
                        >
                          {expanded === row.id ? "ปิด" : "ดูรายการ"}
                        </button>
                      </td>
                    </tr>
                    {expanded === row.id && (
                      <tr id={`quote-${row.id}`}>
                        <td colSpan={6}>
                          <QuoteDetail row={row} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
      <footer className="tr-pagination">
        <span>
          หน้า {page} / {pages} · {total} รายการ · เวลาไทย
        </span>
        <div>
          <button
            type="button"
            disabled={loading || Boolean(exporting) || page <= 1}
            onClick={() => setPage((n) => n - 1)}
          >
            ก่อนหน้า
          </button>
          <button
            type="button"
            disabled={loading || Boolean(exporting) || !result || page >= pages}
            onClick={() => setPage((n) => n + 1)}
          >
            ถัดไป
          </button>
        </div>
      </footer>
      <p className="tr-hint">
        รายงานนี้แสดงเฉพาะข้อมูลที่บันทึกใน customer_quotes ตอน Export
        ผู้กรอกที่ยังไม่ Export จะยังไม่ปรากฏ รายการเก่าที่ไม่มีข้อมูลผู้ Export
        จะแสดงเฉพาะผู้ดูแล โดยไม่คาดเดาเจ้าของรายการ
      </p>
    </main>
  );
}
