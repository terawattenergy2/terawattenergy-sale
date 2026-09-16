import React, { useEffect, useState } from "react";
import { Button, Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PersonalPage from "./personalPage";
import { IoHome, IoWarningOutline } from "react-icons/io5";
import CheckPhase from "../components/assets/images/checkPhae.png";
function WizardPage({ question = [] }) {
  useEffect(() => {
    localStorage.removeItem("personal_data");
  }, []);

  const [showPersonalPage, setShowPersonalPage] = useState(false);
  const navigate = useNavigate();

  const [step, setStep] = useState(0);

  // 1. โหลดค่าเดิมจาก localStorage ถ้ามี (ป้องกันข้อมูลหายถ้ารีเฟรชหน้าเว็บ)
  const [answers, setAnswers] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("wizard_answers") || "{}");
      return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    } catch {
      return {};
    }
  });
  const [select, setSelect] = useState();
  // 2. บันทึกลง localStorage อัตโนมัติทุกครั้งที่ answers เปลี่ยนแปลง
  useEffect(() => {
    localStorage.setItem("wizard_answers", JSON.stringify(answers));
  }, [answers]);

  const currentQuestion = question[step];
  const handlePersonalComplete = (personalData) => {
    localStorage.setItem("wizard_answers", JSON.stringify(answers));

    navigate("/result", {
      state: {
        answers,
        personalData,
      },
    });
  };

  // 3. ปรับฟังก์ชันเลือก ให้เก็บทั้ง optionId, title (หรือ value) เข้าไปใน Object เดียวกัน
  const handleSelect = (questionId, optionId, optionValue, optionTitle) => {
    setSelect(optionId);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        value: optionValue || optionTitle, // เก็บค่า value (ถ้าไม่มีจะเก็บ title แทน)
      },
    }));
  };

  if (!question || question.length === 0) {
    return (
      <div className="p-5 text-center" role="status">ไม่พบข้อมูลคำถาม</div>
    );
  }

  if (showPersonalPage) {
    return (
      <PersonalPage
        onComplete={handlePersonalComplete}
        onBack={() => setShowPersonalPage(false)}
      />
    );
  }

  return (
    <div>
      <div className="wizard-step-summary">
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

      {/* Question */}
      <div className="question-card">
        <h2>{currentQuestion?.ques || currentQuestion?.title}</h2>
        <p className="sub-title">
          {currentQuestion?.sub_ques || currentQuestion?.subTitle}
        </p>

        <Row className="g-3">
          {answers[0]?.value === "large" && step === 1 ? (
            <Col
              key={currentQuestion?.options?.[1]?.id}
              xs={12}
              sm={12}
              lg={12}
            >
              <>
                {" "}
                <div
                  className={`option-card h-100 ${
                    select === currentQuestion?.options?.[1]?.id ? "active" : ""
                  }`}
                  onClick={() =>
                    handleSelect(
                      currentQuestion?.id,
                      currentQuestion?.options?.[1]?.id,
                      currentQuestion?.options?.[1]?.value,
                      currentQuestion?.options?.[1]?.title ||
                        currentQuestion?.options?.[1]?.ans,
                    )
                  }
                >
                  <div className="option-icon">
                    <IoHome />
                  </div>

                  <h4>
                    {currentQuestion?.options?.[1]?.title ||
                      currentQuestion?.options?.[1]?.ans}
                  </h4>
                  <p>
                    {currentQuestion?.options?.[1]?.subTitle ||
                      currentQuestion?.options?.[1]?.sub_ans}
                  </p>
                </div>
              </>
            </Col>
          ) : (
            <>
              {currentQuestion?.options?.map((option) => (
                <Col
                  key={option.id}
                  xs={12}
                  sm={6}
                  lg={12 / currentQuestion?.options?.length}
                >
                  <>
                    {" "}
                    <div
                      className={`option-card h-100 ${
                        select === option.id ? "active" : ""
                      }`}
                      onClick={() =>
                        handleSelect(
                          currentQuestion?.id,
                          option.id,
                          option.value,
                          option.title || option.ans,
                        )
                      }
                    >
                      <div className="option-icon">
                        <IoHome />
                      </div>

                      <h4>{option.title || option.ans}</h4>
                      <p>{option.subTitle || option.sub_ans}</p>
                    </div>
                  </>
                </Col>
              ))}
            </>
          )}
        </Row>

        {String(currentQuestion?.id) === "1" && (
          <aside
            className="alert alert-warning mt-4 mb-0 d-flex gap-3 align-items-start"
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
              <p className="mb-2">
                ดูข้อความระบุเฟสบนป้ายหน้ามิเตอร์ไฟฟ้า โดยไม่ต้องเปิดฝาครอบ
              </p>
              <ul className="mb-2 ps-3">
                <li>
                  <strong>1 เฟส:</strong> มองหาคำว่า “1 เฟส”, “1 Phase” หรือ
                  “Single Phase”
                </li>
                <li>
                  <strong>3 เฟส:</strong> มองหาคำว่า “3 เฟส”, “3 Phase” หรือ
                  “Three Phase”
                </li>
              </ul>
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
                        width: "100%",
                        maxWidth: "720px",
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
                อย่าใช้ขนาดบ้านหรือจำนวนเครื่องใช้ไฟฟ้าเป็นตัวตัดสิน
                หากอ่านป้ายไม่ชัด ให้สอบถามการไฟฟ้าหรือช่างไฟฟ้า
                และอย่าเปิดตู้หรือสัมผัสสายไฟเพื่อตรวจสอบเอง
              </p>
            </div>
          </aside>
        )}

        <div className="d-flex justify-content-between mt-5">
          <Button
            variant="light"
            disabled={step === 0}
            onClick={() => setStep((prev) => prev - 1)}
          >
            ย้อนกลับ
          </Button>

          <Button
            disabled={answers[currentQuestion?.id] === undefined}
            onClick={() => {
              if (step < question.length - 1) {
                setStep((previous) => previous + 1);
                setSelect(undefined);
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
      </div>
    </div>
  );
}

export default WizardPage;
