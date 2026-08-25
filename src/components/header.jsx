import { Button, Image } from "react-bootstrap";
import { AiFillMoon, AiFillSun } from "react-icons/ai";
import imgLogo from "../components/assets/images/LOGO-TE.png";

function Header({ mode, setMode, theme, setTheme }) {
  return (
    <header className="header">
      <div className="header-brand">
        <Image
          src={imgLogo}
          alt="Terawatt Energy"
          className="header-brand-logo"
        />

        <span
          className="header-brand-divider"
          aria-hidden="true"
        />

        <div className="header-brand-content">
          <span className="header-brand-eyebrow">
            TERAWATT SMART DESIGN
          </span>

          <h1>TeraMatch</h1>

          <p>Solar & Storage Configurator</p>
        </div>
      </div>

      <div className="header-actions">
        <Button
          className={`header-mode-button ${
            mode === "wizard" ? "active" : ""
          }`}
          onClick={() => setMode("wizard")}
        >
          <span className="mode-indicator" />

          Sales Wizard
        </Button>

        <div className="theme-switch">
          <span
            role="button"
            tabIndex={0}
            aria-label="โหมดสว่าง"
            onClick={() => setTheme("light")}
            className={theme === "light" ? "active" : ""}
          >
            <AiFillSun />
          </span>

          <span
            role="button"
            tabIndex={0}
            aria-label="โหมดมืด"
            onClick={() => setTheme("dark")}
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