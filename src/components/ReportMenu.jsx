import React from "react";
import { Link } from "react-router-dom";
import useReportAccess from "./useReportAccess";
import "./report.css";
import { Button } from "react-bootstrap";

export default function ReportMenu() {
  const access = useReportAccess();
  if (access.loading || !["all", "own"].includes(access.scope)) return null;
  return (
    <Button className="btn-nav-link">
      <Link className="nav-link" to="/report">
        {access.scope === "all"
          ? "Report · ลูกค้าทั้งหมด"
          : "Report · ลูกค้าของฉัน"}
      </Link>
    </Button>
  );
}
