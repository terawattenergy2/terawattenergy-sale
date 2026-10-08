// import React, { useEffect, useState } from "react";
// import { Button, Col, Row } from "react-bootstrap";
// import { useNavigate } from "react-router-dom";
// import PersonalPage from "./personalPage";
// import { IoHome, IoWarningOutline } from "react-icons/io5";
// import CheckPhase from "../components/assets/images/checkPhae.png";
// const getOptionValue = (option) => option.value ?? option.title ?? option.ans;

// const hasValidAnswer = (question, answers) => {
//   const value = answers[question?.id]?.value;
//   return (
//     value !== undefined &&
//     value !== null &&
//     String(value).trim() !== "" &&
//     (question?.options ?? []).some((option) => getOptionValue(option) === value)
//   );
// };

function WizardPage(
  // { question = [] }
) {
  // useEffect(() => {
  //   localStorage.removeItem("personal_data");
  // }, []);

  // const [showPersonalPage, setShowPersonalPage] = useState(false);
  // const navigate = useNavigate();

  // const [step, setStep] = useState(0);

  // // 1. โหลดค่าเดิมจาก localStorage ถ้ามี (ป้องกันข้อมูลหายถ้ารีเฟรชหน้าเว็บ)
  // const [answers, setAnswers] = useState(() => {
  //   try {
  //     const saved = JSON.parse(localStorage.getItem("wizard_answers") || "{}");
  //     return saved && typeof saved === "object" && !Array.isArray(saved)
  //       ? saved
  //       : {};
  //   } catch {
  //     return {};
  //   }
  // });
  // // 2. บันทึกลง localStorage อัตโนมัติทุกครั้งที่ answers เปลี่ยนแปลง
  // useEffect(() => {
  //   localStorage.setItem("wizard_answers", JSON.stringify(answers));
  // }, [answers]);

  // const currentQuestion = question[step];
  // const canProceed = hasValidAnswer(currentQuestion, answers);
  // const handlePersonalComplete = (personalData) => {
  //   localStorage.setItem("wizard_answers", JSON.stringify(answers));

  //   navigate("/result", {
  //     state: {
  //       answers,
  //       personalData,
  //     },
  //   });
  // };

  // // ใช้ answers เป็นแหล่งข้อมูลเดียวสำหรับคำตอบและสถานะการ์ดที่เลือก
  // const handleSelect = (questionId, option) => {
  //   setAnswers((prev) => ({
  //     ...prev,
  //     [questionId]: { value: getOptionValue(option) },
  //   }));
  // };

  // if (!question || question.length === 0) {
  //   return (
  //     <div className="p-5 text-center" role="status">
  //       ไม่พบข้อมูลคำถาม
  //     </div>
  //   );
  // }

  // if (showPersonalPage) {
  //   return (
  //     <PersonalPage
  //       onComplete={handlePersonalComplete}
  //       onBack={() => setShowPersonalPage(false)}
  //     />
  //   );
  // }

  return (
    <div>
      {/* <div className="wizard-step-summary">
        <span>
          ขั้นตอนที่ {step + 1} จาก {question.length}
        </span>

        <div className="wizard-step-track">
          <div
            className="wizard-step-progress"
            style={{
              width: `${((step + 1) / question.length) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="question-card">
        <h2>{currentQuestion?.ques || currentQuestion?.title}</h2>
        <p className="sub-title">
          {currentQuestion?.sub_ques || currentQuestion?.subTitle}
        </p>

        <Row className="g-3">
          {currentQuestion?.options?.map((option) => (
            <Col
              key={option.id}
              xs={12}
              sm={6}
              lg={12 / currentQuestion.options.length}
            >
              <div
                className={`option-card h-100 ${
                  canProceed &&
                  answers[currentQuestion.id]?.value === getOptionValue(option)
                    ? "active"
                    : ""
                }`}
                onClick={() => handleSelect(currentQuestion.id, option)}
              >
                <div className="option-icon">
                  <IoHome />
                </div>
                <h4>{option.title || option.ans}</h4>
                <p>{option.subTitle || option.sub_ans}</p>
              </div>
            </Col>
          ))}
        </Row>

        {String(currentQuestion?.id) === "1" && (
          <aside
            className="alert alert-primary border-0 mt-4 mb-0 d-flex gap-3 align-items-start"
            aria-labelledby="phase-help-title"
          >
            <IoWarningOutline
              size={26}
              className="flex-shrink-0 mt-1"
              aria-hidden="true"
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 id="phase-help-title" className="h6 fw-bold mb-2">
                ไม่แน่ใจว่าบ้านใช้ไฟกี่เฟส?
              </h3>
              <p className="mb-2"></p>

              <details className="my-3">
                <summary
                  className="fw-semibold"
                  style={{ cursor: "pointer", padding: "8px 0" }}
                >
                  คลิกดูภาพวิธีเช็กเฟสไฟบ้าน
                </summary>
                <figure className="mt-2 mb-0">
                  <a
                    href={CheckPhase}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="เปิดภาพวิธีดูเฟสไฟบ้านขนาดเต็มในแท็บใหม่"
                  >
                    <img
                      src={CheckPhase}
                      alt="ภาพประกอบวิธีดูเฟสไฟบ้านจากมิเตอร์ไฟฟ้า"
                      className="d-block rounded border"
                      style={{
                        width: "50%",
                        maxWidth: "240px",
                        height: "auto",
                        objectFit: "contain",
                      }}
                    />
                  </a>
                  <figcaption className="small mt-2">
                    กดที่ภาพเพื่อดูขนาดเต็ม
                  </figcaption>
                </figure>
              </details>
              <p className="small mb-0">
                หากไม่สามารถสังเกตได้ แนะนำให้สอบถามช่างไฟฟ้า
                หรือการไฟฟ้าในเขตพื้นที่ของท่าน
                ไม่ควรเปิดตู้หรือสัมผัสสายไฟโดยตรง
              </p>
            </div>
          </aside>
        )}

        <div className="d-flex justify-content-between mt-5">
          {step > 0 && (
            <Button
              variant="light"
              onClick={() => setStep((prev) => Math.max(0, prev - 1))}
            >
              ย้อนกลับ
            </Button>
          )}

          <Button
            className="ms-auto"
            disabled={!canProceed}
            onClick={() => {
              if (!canProceed) return;
              if (step < question.length - 1) {
                setStep((previous) => previous + 1);
              } else {
                // บันทึกคำตอบก่อน
                localStorage.setItem("wizard_answers", JSON.stringify(answers));

                // เปิดหน้ากรอกข้อมูล แทนการไปหน้าผลลัพธ์ทันที
                setShowPersonalPage(true);
              }
            }}
          >
            {step === question.length - 1 ? "เสร็จสิ้น" : "ถัดไป →"}
          </Button>
        </div>
      </div> */}
    </div>
  );
}

export default WizardPage;
