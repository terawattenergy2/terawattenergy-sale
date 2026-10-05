import React from "react";
import { NavLink } from "react-router-dom";
import useReportAccess from "./useReportAccess";
import "./report.css";

export default function ReportMenu() {
  const access = useReportAccess();
  if (access.loading || !["all", "own"].includes(access.scope)) return null;
  return (
    <NavLink className="tr-menu-link" to="/report">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M4 3v18h17M8 16v-5m5 5V7m5 9V4" />
      </svg>
      {access.scope === "all" ? "รายงานลูกค้าทั้งหมด" : "รายงานลูกค้าของฉัน"}
    </NavLink>
  );
}
