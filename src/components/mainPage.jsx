import React, { useEffect, useState } from "react";
import WizardPage from "./WizardPage";
import AdvancedPage from "./AdvancedPage";
import LoadingPage from "./LoadingPage";

function MainPage({ sheet, mode }) {
  const [links, setLinks] = useState({
    question: [],
    ans_small: [],
    ans_medium: [],
    ans_large: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(sheet);
        const result = await response.json();

        if (result.success) {
          // 🔄 แปลงข้อมูล question จาก Sheet มาเป็นโครงสร้าง quesData
          const formattedQuesData = result.data.question.map((item, index) => {
            // ดึงตัวเลือกตอบ ans_1, ans_2, ans_3 มาจัดรูป
            const options = [];

            if (item.ans_1) {
              options.push({
                id: 0,
                ans: item.ans_1,
                sub_ans: item.sub_ans_1,
                value: item.value_1,
              });
            }
            if (item.ans_2) {
              options.push({
                id: 1,
                ans: item.ans_2,
                sub_ans: item.sub_ans_2,
                value: item.value_2,
              });
            }
            if (item.ans_3) {
              options.push({
                id: 2,
                ans: item.ans_3,
                sub_ans: item.sub_ans_3,
                value: item.value_3,
              });
            }

            return {
              id: index, // หรือใช้ Number(item.num) - 1
              ques: item.ques || "",
              sub_ques: (item.sub_ques || "").trim(), // .trim() เพื่อตัด \n ท้ายข้อความ
              options: options,
            };
          });

          // นำข้อมูลที่แปลงแล้วไปเก็บบน State
          setLinks({
            ...result.data,
            question: formattedQuesData, // เก็บตัวที่ Map แล้วลงไป
          });
        }
      } catch (error) {
        console.error("Fetch Error:", error);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [sheet]);

  return (
    <>
      {!links ? (
        <LoadingPage />
      ) : (
        <>
          {mode === "wizard" ? (
            <WizardPage data={links} />
          ) : (
            <AdvancedPage data={links} />
          )}
        </>
      )}
    </>
  );
}

export default MainPage;
