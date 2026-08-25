import React, { useEffect, useState } from "react";
import { Button, Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router";
import LoadingPage from "./LoadingPage";
import PersonalPage from "./personalPage";
import { IoHome } from "react-icons/io5";

function WizardPage({ data }) {
  useEffect(() => {
    localStorage.removeItem("personal_data");
  }, []);
  const question = data?.question || [];
  const [showPersonalPage, setShowPersonalPage] = useState(false);
  const navigate = useNavigate();

  const [step, setStep] = useState(0);

  // 1. โหลดค่าเดิมจาก localStorage ถ้ามี (ป้องกันข้อมูลหายถ้ารีเฟรชหน้าเว็บ)
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem("wizard_answers");
    return saved ? JSON.parse(saved) : {};
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

  if (!data || question.length === 0) {
    return (
      <LoadingPage className="p-5 text-center">กำลังโหลดข้อมูล...</LoadingPage>
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
      <div className="wizard-header">
        <div className="progress-wrapper">
          {question.map((_, index) => (
            <div
              key={index}
              className={`progress-item ${index <= step ? "active" : ""}`}
            />
          ))}
        </div>

        <p className="step-text">
          ขั้นตอนที่ {step + 1} จาก {question.length}
        </p>
      </div>

      {/* Question */}
      <div className="question-card">
        <h2>{currentQuestion?.ques || currentQuestion?.title}</h2>
        <p className="sub-title">
          {currentQuestion?.sub_ques || currentQuestion?.subTitle}
        </p>

        <Row className="g-3">
          {answers[0].value === "large" && step === 1 ? (
            <Col
              key={currentQuestion?.options[1]?.id}
              xs={12}
              sm={12}
              lg={12 / currentQuestion?.options[1]?.length}
            >
              <>
                {" "}
                <div
                  className={`option-card h-100 ${
                    select === currentQuestion?.options[1]?.id ? "active" : ""
                  }`}
                  onClick={() =>
                    handleSelect(
                      currentQuestion?.id,
                      currentQuestion?.options[1]?.id,
                      currentQuestion?.options[1]?.value,
                      currentQuestion?.options[1]?.title ||
                        currentQuestion?.options[1]?.ans,
                    )
                  }
                >
                  <div className="option-icon">
                    <IoHome />
                  </div>

                  <h4>
                    {currentQuestion?.options[1]?.title ||
                      currentQuestion?.options[1]?.ans}
                  </h4>
                  <p>
                    {currentQuestion?.options[1]?.subTitle ||
                      currentQuestion?.options[1]?.sub_ans}
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
