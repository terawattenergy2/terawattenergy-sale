import React, { useEffect, useState } from "react";
import "./App.css";
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import WizardPage from "./components/WizardPage";
import AdvancedPage from "./components/AdvancedPage";
import ResultPage from "./components/result";
import MainPage from "./components/mainPage";
import Header from "./components/header";
import LoginPage from "./components/LoginPage";
import ReportPage from "./components/ReportPage";
import SolarPage from "./components/SolarPage";
import RequireAuth from "./components/RequireAuth";
import { supabase } from "./supabase";

function DataGate({ loading, error, onRetry, children }) {
  if (loading)
    return (
      <div className="p-5 text-center" role="status">
        กำลังโหลดข้อมูล...
      </div>
    );
  if (error)
    return (
      <div className="p-5 text-center" role="alert">
        <p className="text-danger">{error}</p>
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          ลองใหม่
        </button>
      </div>
    );
  return children;
}

// This component mounts ONLY after RequireAuth verifies the session and profile.
function PrivateApp() {
  const [mode, setMode] = useState("wizard");
  const [theme, setTheme] = useState("light");
  const [data, setData] = useState({
    answer: [],
    inverter: [],
    question: [],
    space: [],
    price_list: [],
    status: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [logoutError, setLogoutError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const results = await Promise.all([
          supabase.from("tm_answer").select("*"),
          supabase.from("tm_inverter_type").select("*"),
          supabase
            .from("tm_question")
            .select("*")
            .order("id", { ascending: true }),
          supabase
            .from("tm_space")
            .select("*")
            .order("id", { ascending: true }),
          supabase.from("price_list").select("*"),
        ]);
        for (const result of results) if (result.error) throw result.error;
        const [answer, inverter, question, space, price_list] = results.map(
          (result) => result.data ?? [],
        );
        if (active)
          setData({
            answer,
            inverter,
            question,
            space,
            price_list,
            status: [],
          });
      } catch (err) {
        if (active) setError(err.message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [retry]);

  const withData = (page) => (
    <DataGate
      loading={loading}
      error={error}
      onRetry={() => setRetry((v) => v + 1)}
    >
      {page}
    </DataGate>
  );
  async function logout() {
    setSigningOut(true);
    setLogoutError("");
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      // RequireAuth receives SIGNED_OUT and unmounts this entire subtree.
    } catch {
      setLogoutError("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่");
      setSigningOut(false);
    }
  }
  return (
    <div className={`main-page ${theme === "dark" ? "dark" : ""}`}>
      <Header
        mode={mode}
        setMode={setMode}
        theme={theme}
        setTheme={setTheme}
        onSignOut={logout}
        signingOut={signingOut}
      />
      {logoutError && (
        <p className="text-danger px-3" role="alert">
          {logoutError}
        </p>
      )}
      <Routes>
        <Route path="/report" element={<ReportPage />} />
        <Route
          path="/mainpage"
          element={withData(<MainPage mode={mode} {...data} />)}
        />
        <Route
          path="/advanced"
          element={withData(<AdvancedPage {...data} />)}
        />
        <Route
          path="/wizard"
          element={withData(<WizardPage question={data.question} />)}
        />
        <Route
          path="/result"
          element={withData(
            <ResultPage
              inverter={data.inverter}
              answer={data.answer}
              space={data.space}
              priceList={data.price_list}
            />,
          )}
        />
        <Route path="/solar" element={<SolarPage />} />
        <Route path="*" element={<Navigate to="/solar" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Keep public: LoginPage handles signup and password-recovery callbacks too. */}
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <PrivateApp />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
