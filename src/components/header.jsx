import { Button, Image } from "react-bootstrap";
import { AiFillMoon, AiFillSun } from "react-icons/ai";
import imgLogo from "../components/assets/images/LOGO-TE.png";
import ReportMenu from "./ReportMenu";

function Header({ mode, setMode, theme, setTheme }) {
  return (
    <header className="header">
      <div className="header-brand">
        <Image
          src={imgLogo}
          alt="Terawatt Energy"
          className="header-brand-logo"
        />

        <span className="header-brand-divider" aria-hidden="true" />

        <div className="header-brand-content">
          <span className="header-brand-eyebrow">
            TERAWATT SMART DESIGN
          </span>
          <h1>TeraMatch</h1>
          <p>Solar & Storage Configurator</p>
        </div>
      </div>

      <div className="header-actions">
        <nav aria-label="เมนูรายงาน" className="header-report-menu">
          <ReportMenu />
        </nav>

        <Button
          type="button"
          className={`header-mode-button ${
            mode === "wizard" ? "active" : ""
          }`}
          onClick={() => setMode("wizard")}
        >
          <span className="mode-indicator" aria-hidden="true" />
          Smart Match
        </Button>

        <div className="theme-switch">
          <span
            role="button"
            tabIndex={0}
            aria-label="โหมดสว่าง"
            aria-pressed={theme === "light"}
            onClick={() => setTheme("light")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setTheme("light");
              }
            }}
            className={theme === "light" ? "active" : ""}
          >
            <AiFillSun />
          </span>

          <span
            role="button"
            tabIndex={0}
            aria-label="โหมดมืด"
            aria-pressed={theme === "dark"}
            onClick={() => setTheme("dark")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setTheme("dark");
              }
            }}
            className={theme === "dark" ? "active" : ""}
          >
            <AiFillMoon />
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;