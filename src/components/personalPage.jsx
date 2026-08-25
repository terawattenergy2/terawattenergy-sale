import React, { useState } from "react";
import { Alert, Button, Col, Form, Row } from "react-bootstrap";

const STORAGE_KEY = "personal_data";

function PersonalPage({ onComplete, onBack }) {
  const [personalData, setPersonalData] = useState(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);

      return savedData
        ? JSON.parse(savedData)
        : {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
          };
    } catch {
      return {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      };
    }
  });

  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setPersonalData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const { firstName, lastName, email, phone } = personalData;

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !phone.trim()
    ) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    // ต้องเป็นเบอร์มือถือไทย 10 หลัก เริ่มต้นด้วย 06, 08 หรือ 09
    const thaiPhonePattern = /^0[689]\d{8}$/;

    if (!thaiPhonePattern.test(phone)) {
      setError("กรุณากรอกเบอร์โทรศัพท์มือถือให้ถูกต้อง เช่น 0812345678");
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(personalData));

    onComplete?.(personalData);
  };
  const handlePhoneChange = (event) => {
    // ลบตัวอักษรและเครื่องหมายทั้งหมด แล้วจำกัดไม่เกิน 10 ตัว
    const phoneNumber = event.target.value.replace(/\D/g, "").slice(0, 10);

    setPersonalData((previous) => ({
      ...previous,
      phone: phoneNumber,
    }));

    setError("");
  };
  return (
    <div className="personal-page">
      <div className="personal-card">
        <div className="mb-4">
          <h2>ข้อมูลผู้ใช้งาน</h2>

          <p className="text-secondary">กรุณากรอกข้อมูลก่อนแสดงผลลัพธ์</p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>ชื่อ</Form.Label>

                <Form.Control
                  type="text"
                  name="firstName"
                  value={personalData.firstName}
                  onChange={handleChange}
                  placeholder="กรอกชื่อ"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>นามสกุล</Form.Label>

                <Form.Control
                  type="text"
                  name="lastName"
                  value={personalData.lastName}
                  onChange={handleChange}
                  placeholder="กรอกนามสกุล"
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>อีเมล</Form.Label>

            <Form.Control
              type="email"
              name="email"
              value={personalData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>เบอร์โทรศัพท์</Form.Label>

            <Form.Control
              type="tel"
              inputMode="numeric"
              name="phone"
              value={personalData.phone}
              onChange={handlePhoneChange}
              placeholder="0XXXXXXXXX"
              minLength={10}
              maxLength={10}
              autoComplete="tel"
              required
            />

            <Form.Text className="text-secondary">
              กรอกตัวเลข 10 หลัก โดยขึ้นต้นด้วย 06, 08 หรือ 09
            </Form.Text>
          </Form.Group>

          <div className="d-flex justify-content-between">
            <Button type="button" variant="light" onClick={onBack}>
              ย้อนกลับ
            </Button>

            <Button type="submit" variant="primary">
              ดูผลลัพธ์ →
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default PersonalPage;
