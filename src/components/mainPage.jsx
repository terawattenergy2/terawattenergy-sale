import React, { useEffect, useState } from "react";
import WizardPage from "./WizardPage";
import AdvancedPage from "./AdvancedPage";
import LoadingPage from "./LoadingPage";

function waitBeforeRetry(ms, signal) {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("ยกเลิกการโหลด"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
  });
}

async function loadSheet(sheet, signal, onRetry) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (signal.aborted) throw new Error("ยกเลิกการโหลด");
    const request = new AbortController();
    let timedOut = false;
    const abortRequest = () => request.abort();
    signal.addEventListener("abort", abortRequest, { once: true });
    const timeout = setTimeout(() => {
      timedOut = true;
      request.abort();
    }, 30000);
    let retryError;

    try {
      // เรียก /exec ต้นฉบับใหม่ทุกครั้ง ไม่ใช้ response.url ของ Google ซ้ำ
      const response = await fetch(sheet, {
        signal: request.signal,
        cache: "no-store",
        redirect: "follow",
      });
      if (!response.ok) {
        const error = new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${response.status})`);
        error.retryable = [404, 408, 429, 500, 502, 503, 504].includes(response.status);
        throw error;
      }
      const result = await response.json();
      if (result.success !== true) {
        throw new Error(result.message || "ระบบส่งข้อมูลกลับมาไม่สำเร็จ");
      }
      if (!Array.isArray(result.data?.question) || !result.data.question.length) {
        throw new Error("ไม่พบข้อมูลคำถาม กรุณาตรวจสอบชีต question");
      }
      return result.data;
    } catch (error) {
      if (signal.aborted) throw error;
      const retryable = timedOut || error.retryable === true || error instanceof TypeError;
      retryError = timedOut ? new Error("โหลดข้อมูลนานเกิน 30 วินาที กรุณาลองใหม่") : error;
      if (!retryable || attempt === 2) throw retryError;
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener("abort", abortRequest);
    }
    onRetry(attempt + 1);
    await waitBeforeRetry((attempt + 1) * 1000, signal);
  }
}

function MainPage({ sheet, mode }) {
  const [links, setLinks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [automaticRetry, setAutomaticRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError("");
    setLinks(null);
    setAutomaticRetry(0);

    async function fetchData() {
      try {
        const data = await loadSheet(sheet, controller.signal, (attempt) => {
          if (active) setAutomaticRetry(attempt);
        });
        const question = data.question.map((item, index) => ({
          id: index,
          ques: item.ques || "",
          sub_ques: String(item.sub_ques || "").trim(),
          options: [1, 2, 3]
            .filter((number) => item[`ans_${number}`])
            .map((number) => ({
              id: number - 1,
              ans: item[`ans_${number}`],
              sub_ans: item[`sub_ans_${number}`],
              value: item[`value_${number}`],
            })),
        }));
        if (active) setLinks({ ...data, question });
      } catch (err) {
        if (active) setError(err.message || "ไม่สามารถโหลดข้อมูลได้");
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchData();
    return () => {
      active = false;
      controller.abort();
    };
  }, [sheet, retryCount]);

  if (loading) return (
    <>
      <LoadingPage />
      {automaticRetry > 0 && (
        <p className="text-center text-secondary" role="status">
          กำลังเชื่อมต่อใหม่ ครั้งที่ {automaticRetry}/2 กรุณารอสักครู่
        </p>
      )}
    </>
  );

  if (error) return (
    <div className="container py-5 text-center" role="alert">
      <h4>ไม่สามารถโหลดข้อมูลได้</h4>
      <p>{error}</p>
      <button type="button" className="btn btn-primary" onClick={() => setRetryCount((count) => count + 1)}>
        ลองใหม่
      </button>
    </div>
  );
  if (!links) return null;
  return mode === "wizard" ? <WizardPage data={links} /> : <AdvancedPage data={links} />;
}

export default MainPage;
