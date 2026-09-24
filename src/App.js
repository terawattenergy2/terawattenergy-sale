import React, { useEffect, useState } from "react";
import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import WizardPage from "./components/WizardPage";
import AdvancedPage from "./components/AdvancedPage";
import ResultPage from "./components/result";
import MainPage from "./components/mainPage";
import Header from "./components/header";
import LoginPage from "./components/LoginPage";
// import ReportMenu from "./components/ReportMenu";
import ReportPage from "./components/ReportPage";
import { supabase } from "./supabase";

function DataGate({ loading, error, onRetry, children }) {
  if (loading) {
    return (
      <div className="p-5 text-center" role="status">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 text-center" role="alert">
        <p className="text-danger">{error}</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onRetry}
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  return children;
}

function App() {
  const [mode, setMode] = useState("wizard");
  const [theme, setTheme] = useState("light");
  const [data, setData] = useState({
    answer: [],
    inverter: [],
    question: [],
    space: [],
    price_list: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

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

        for (const result of results) {
          if (result.error) throw result.error;
        }

        const [answer, inverter, question, space, price_list] =
          results.map((result) => result.data ?? []);

        if (active) {
          setData({
            answer,
            inverter,
            question,
            space,
            price_list,
          });
        }
      } catch (err) {
        if (active) {
          setError(err.message || "โหลดข้อมูลไม่สำเร็จ");
        }
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
      onRetry={() => setRetry((value) => value + 1)}
    >
      {page}
    </DataGate>
  );

  return (
    <BrowserRouter>
      <div className={`main-page ${theme === "dark" ? "dark" : ""}`}>
        <Header
          mode={mode}
          setMode={setMode}
          theme={theme}
          setTheme={setTheme}
        />

        <Routes>
          <Route path="/" element={<LoginPage />} />

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
            element={withData(
              <WizardPage question={data.question} />
            )}
          />

          <Route
            path="/result"
            element={withData(
              <ResultPage
                inverter={data.inverter}
                answer={data.answer}
                space={data.space}
                priceList={data.price_list}
              />
            )}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;