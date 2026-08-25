import { Button } from "react-bootstrap";
import { AiFillMoon, AiFillSun } from "react-icons/ai";
function Header({ mode, setMode, theme, setTheme }) {
  return (
    <div className="header">
      <div className="header-left">
        <h1>Terawatt</h1>
        <p>ระบบแนะนำชุดโซลาร์และแบตเตอรี่สำหรับบ้าน</p>
      </div>
      <div className="header-right ">
         <div className="mode-switch">
          <Button
            className={mode === "wizard" ? "active" : ""}
            onClick={() => setMode("wizard")}
          >
            <span className="text"> โหมดเซลล์ (Wizard)</span>
          </Button>

          {/* <Button
            className={mode === "advanced" ? "active" : ""}
            onClick={() => setMode("advanced")}
          >
            <span className="text">โหมดเทคนิค (Advanced)</span>
          </Button> */}
        </div>
        <div className={`theme-switch ${theme === "light" ? "active" : ""}`}>
          <span
            onClick={() => setTheme("light")}
            className={`${theme === "light" ? "active" : ""}`}
          >
            <AiFillSun />
          </span>
          <span
            onClick={() => setTheme("dark")}
            className={`${theme === "dark" ? "active" : ""}`}
          >
            <AiFillMoon />
          </span>

        </div>
       
      </div>
    </div>
  );
}

export default Header;
