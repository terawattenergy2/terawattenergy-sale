import React, { useState } from "react";
import {
  Alert,
  Button,
  Col,
  Form,
  Row,
} from "react-bootstrap";

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

    const { firstName, lastName, email, phone } =
      personalData;

    if (!firstName || !lastName || !email || !phone) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(personalData)
    );

    // แจ้ง WizardPage ว่ากรอกเสร็จแล้ว
    onComplete?.(personalData);
  };

  return (
    <div className="personal-page">
      <div className="personal-card">
        <div className="mb-4">
          <h2>ข้อมูลผู้ใช้งาน</h2>

          <p className="text-secondary">
            กรุณากรอกข้อมูลก่อนแสดงผลลัพธ์
          </p>
        </div>

        {error && (
          <Alert variant="danger">{error}</Alert>
        )}

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
              name="phone"
              value={personalData.phone}
              onChange={handleChange}
              placeholder="08X-XXX-XXXX"
              required
            />
          </Form.Group>

          <div className="d-flex justify-content-between">
            <Button
              type="button"
              variant="light"
              onClick={onBack}
            >
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