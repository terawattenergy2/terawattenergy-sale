import React, { useEffect, useState } from "react";
import WizardPage from "./WizardPage";
import AdvancedPage from "./AdvancedPage";
import LoadingPage from "./LoadingPage";

function MainPage({ sheet, mode }) {
  const [links, setLinks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 30000);

    async function fetchData() {
      setLoading(true);
      setError("");
      setLinks(null);

      try {
        // เริ่มจาก /exec ต้นฉบับทุกครั้ง รวมถึงตอนลองใหม่
        const response = await fetch(sheet, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${response.status})`);
        }

        const result = await response.json();

        if (result.success !== true) {
          throw new Error(result.message || "ระบบส่งข้อมูลกลับมาไม่สำเร็จ");
        }

        if (
          !Array.isArray(result.data?.question) ||
          result.data.question.length === 0
        ) {
          throw new Error("ไม่พบข้อมูลคำถาม กรุณาตรวจสอบชีต question");
        }

        const formattedQuesData = result.data.question.map((item, index) => {
          const options = [1, 2, 3]
            .filter((number) => item[`ans_${number}`])
            .map((number) => ({
              id: number - 1,
              ans: item[`ans_${number}`],
              sub_ans: item[`sub_ans_${number}`],
              value: item[`value_${number}`],
            }));

          return {
            id: index,
            ques: item.ques || "",
            sub_ques: String(item.sub_ques || "").trim(),
            options,
          };
        });

        if (active) {
          setLinks({
            ...result.data,
            question: formattedQuesData,
          });
        }
      } catch (err) {
        if (!active) return;

        console.error("Fetch Error:", err);

        setError(
          timedOut
            ? "โหลดข้อมูลนานเกิน 30 วินาที กรุณาลองใหม่"
            : err.message || "ไม่สามารถโหลดข้อมูลได้"
        );
      } finally {
        clearTimeout(timeoutId);
        if (active) setLoading(false);
      }
    }

    fetchData();

    return () => {
      active = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [sheet, retryCount]);

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="container py-5 text-center" role="alert">
        <h4>ไม่สามารถโหลดข้อมูลได้</h4>
        <p>{error}</p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setRetryCount((count) => count + 1)}
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  if (!links) return null;

  return mode === "wizard" ? (
    <WizardPage data={links} />
  ) : (
    <AdvancedPage data={links} />
  );
}

export default MainPage;