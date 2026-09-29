import React, { useEffect, useId, useRef, useState } from "react";
// import { Button, Image } from "react-bootstrap";
import { AiFillMoon, AiFillSun, AiOutlineUser, AiOutlineLogout } from "react-icons/ai";
import { useLocation } from "react-router-dom";
import imgLogo from "../components/assets/images/LOGO-TE.png";
import ReportMenu from "./ReportMenu";
import "./HeaderUserMenu.css";

function Header({ mode, setMode, theme, setTheme, onSignOut, signingOut = false }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const toggleRef = useRef(null);
  const panelId = useId();
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    if (!open) return undefined;
    const outside = event => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const escape = event => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return <header className="header">
    <div className="header-brand">
      <Image src={imgLogo} alt="Terawatt Energy" className="header-brand-logo" />
      <span className="header-brand-divider" aria-hidden="true" />
      <div className="header-brand-content">
        <span className="header-brand-eyebrow">TERAWATT SMART DESIGN</span>
        <h1>TeraMatch</h1><p>Solar &amp; Storage Configurator</p>
      </div>
    </div>
    <div className="header-actions">
      {/* <Button type="button" className={`header-mode-button ${mode === "wizard" ? "active" : ""}`} onClick={() => setMode("wizard")}>
        <span className="mode-indicator" aria-hidden="true" />Smart Match
      </Button> */}
      <div className="theme-switch">
        <span role="button" tabIndex={0} aria-label="โหมดสว่าง" aria-pressed={theme === "light"}
          onClick={() => setTheme("light")}
          onKeyDown={event => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); setTheme("light"); } }}
          className={theme === "light" ? "active" : ""}><AiFillSun /></span>
        <span role="button" tabIndex={0} aria-label="โหมดมืด" aria-pressed={theme === "dark"}
          onClick={() => setTheme("dark")}
          onKeyDown={event => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); setTheme("dark"); } }}
          className={theme === "dark" ? "active" : ""}><AiFillMoon /></span>
      </div>
      <div className="te-user-menu" ref={containerRef} onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}>
        <button ref={toggleRef} type="button" className={`te-user-toggle ${open ? "is-open" : ""}`}
          aria-label="เมนูผู้ใช้" aria-expanded={open} aria-controls={panelId}
          onClick={() => setOpen(value => !value)}>
          <AiOutlineUser aria-hidden="true" />
        </button>
        {open && <div id={panelId} className="te-user-panel">
          <div className="te-user-panel-title">บัญชีผู้ใช้</div>
          <nav aria-label="เมนูรายงาน" className="te-user-report">
            {/* Preserve existing report visibility and access logic. */}
            <ReportMenu />
          </nav>
          <div className="te-user-separator" />
          <button type="button" className="te-user-signout" disabled={signingOut || !onSignOut}
            onClick={() => { setOpen(false); onSignOut?.(); }}>
            <AiOutlineLogout aria-hidden="true" />
            {signingOut ? "กำลังออกจากระบบ..." : "Sign out · ออกจากระบบ"}
          </button>
        </div>}
      </div>
    </div>
  </header>;
}
export default Header;
