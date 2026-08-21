import React, { useState } from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  BrowserRouter,
} from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import WizardPage from "./components/WizardPage";
import AdvancedPage from "./components/AdvancedPage";
import ResultPage from "./components/result";
import MainPage from "./components/mainPage";
import Header from "./components/header";
function App() {
  const [mode, setMode] = useState("wizard");
  const [theme, setTheme] = useState("light");
  const SHEET_URL =
    "https://script.google.com/macros/s/AKfycbwjlVYgeItIfnX2DtPusdvBhnldd0O8-zCNQkF1ywy5fC0GcuT8blZmnI5aYbXh9jkb-Q/exec";

  return (
    <div className={`main-page ${theme === "dark" ? "dark" : ""}`}>
      <Header mode={mode} setMode={setMode} theme={theme} setTheme={setTheme} />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={<MainPage sheet={SHEET_URL} mode={mode} />}
          />
          <Route path="/advanced" element={<AdvancedPage />} />
          <Route path="/wizard" element={<WizardPage />} />
          <Route path="/result" element={<ResultPage sheet={SHEET_URL} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
