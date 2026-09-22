import React, { useEffect, useState } from "react";
import "./App.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import WizardPage from "./components/WizardPage";
import AdvancedPage from "./components/AdvancedPage";
import ResultPage from "./components/result";
import MainPage from "./components/mainPage";
import Header from "./components/header";
import { supabase } from "./supabase";

function App() {
  const [mode, setMode] = useState("wizard");
  const [theme, setTheme] = useState("light");
  const [data, setData] = useState({
    answer: [],
    inverter: [],
    question: [],
    space: [],
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
        const [answer, inverter, question, space, price_list] = results.map(
          (result) => result.data ?? [],
        );
        if (active) setData({ answer, inverter, question, space, price_list });
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

  return (
    <BrowserRouter>
      <div className={`main-page ${theme === "dark" ? "dark" : ""}`}>
        <Header
          mode={mode}
          setMode={setMode}
          theme={theme}
          setTheme={setTheme}
        />
        {loading ? (
          <div className="p-5 text-center" role="status">
            กำลังโหลดข้อมูล...
          </div>
        ) : error ? (
          <div className="p-5 text-center" role="alert">
            <p className="text-danger">{error}</p>
            <button
              className="btn btn-primary"
              onClick={() => setRetry((value) => value + 1)}
            >
              ลองใหม่
            </button>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<MainPage mode={mode} {...data} />} />
            <Route path="/advanced" element={<AdvancedPage {...data} />} />
            <Route
              path="/wizard"
              element={<WizardPage question={data.question} />}
            />
            <Route
              path="/result"
              element={
                <ResultPage
                  inverter={data.inverter}
                  answer={data.answer}
                  space={data.space}
                  priceList={data.price_list}
                />
              }
            />
            {console.log("dataMain", data)}
          </Routes>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
