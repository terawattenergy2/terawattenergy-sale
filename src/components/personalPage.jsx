import React, { useRef, useState } from "react";
import { Alert, Button, Col, Form, Row } from "react-bootstrap";
import { supabase } from "../supabase";

const STORAGE_KEY = "personal_data";
const EMPTY_DATA = { firstName: "", lastName: "", email: "", phone: "" };

function PersonalPage({ onComplete, onBack }) {
  const [personalData, setPersonalData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return Object.fromEntries(Object.keys(EMPTY_DATA).map((key) => [
        key, typeof saved?.[key] === "string" ? saved[key] : "",
      ]));
    } catch {
      return { ...EMPTY_DATA };
    }
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const savedPayload = useRef(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setPersonalData((previous) => ({ ...previous, [name]: value }));
    setError("");
  };
  const handlePhoneChange = (event) => {
    const phone = event.target.value.replace(/\D/g, "").slice(0, 10);
    setPersonalData((previous) => ({ ...previous, phone }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    const cleaned = Object.fromEntries(Object.entries(personalData).map(([key, value]) => [key, value.trim()]));
    if (Object.values(cleaned).some((value) => !value)) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    if (!/^0[689]\d{8}$/.test(cleaned.phone)) {
      setError("กรุณากรอกเบอร์โทรศัพท์มือถือให้ถูกต้อง เช่น 0812345678");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)) {
      setError("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }
    submitting.current = true;
    setSaving(true);
    setError("");
    const payload = {
      first_name: cleaned.firstName,
      last_name: cleaned.lastName,
      email: cleaned.email,
      phone: cleaned.phone,
    };
    const signature = JSON.stringify(payload);
    try {
      if (savedPayload.current !== signature) {
        const { error: insertError } = await supabase.from("customer_leads").insert(payload);
        if (insertError) throw insertError;
        savedPayload.current = signature;
      }
    } catch {
      setError("บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่");
      submitting.current = false;
      setSaving(false);
      return;
    }

    // A local cache failure must not trigger another database insert.
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned)); } catch { /* Optional cache. */ }
    try {
      await onComplete?.(cleaned);
    } catch {
      setError("บันทึกข้อมูลแล้ว แต่เปิดหน้าผลลัพธ์ไม่สำเร็จ กรุณากดดูผลลัพธ์อีกครั้ง");
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="personal-page">
      <div className="personal-card">
        <div className="mb-4">
          <h2>ข้อมูลผู้ใช้งาน</h2>
          <p className="text-secondary">กรุณากรอกข้อมูลก่อนแสดงผลลัพธ์</p>
        </div>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit} aria-busy={saving}>
          <fieldset disabled={saving}>
            <Row>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3" controlId="personal-first-name">
                  <Form.Label className="text-name">ชื่อ</Form.Label>
                  <Form.Control type="text" name="firstName" value={personalData.firstName} onChange={handleChange} placeholder="กรอกชื่อ" autoComplete="given-name" maxLength={100} required />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3" controlId="personal-last-name">
                  <Form.Label className="text-name">นามสกุล</Form.Label>
                  <Form.Control type="text" name="lastName" value={personalData.lastName} onChange={handleChange} placeholder="กรอกนามสกุล" autoComplete="family-name" maxLength={100} required />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3" controlId="personal-email">
              <Form.Label className="text-name">อีเมล</Form.Label>
              <Form.Control type="email" name="email" value={personalData.email} onChange={handleChange} placeholder="example@email.com" autoComplete="email" maxLength={254} required />
            </Form.Group>
            <Form.Group className="mb-4" controlId="personal-phone">
              <Form.Label className="text-name">เบอร์โทรศัพท์</Form.Label>
              <Form.Control type="tel" inputMode="numeric" name="phone" value={personalData.phone} onChange={handlePhoneChange} placeholder="0XXXXXXXXX" minLength={10} maxLength={10} autoComplete="tel" required />
              <Form.Text className="text-secondary">กรอกตัวเลข 10 หลัก โดยขึ้นต้นด้วย 06, 08 หรือ 09</Form.Text>
            </Form.Group>
            <div className="d-flex justify-content-between">
              <Button type="button" variant="light" onClick={onBack} disabled={saving}>ย้อนกลับ</Button>
              <Button type="submit" variant="primary" disabled={saving}>{saving ? "กำลังบันทึก..." : "ดูผลลัพธ์ →"}</Button>
            </div>
          </fieldset>
        </Form>
      </div>
    </div>
  );
}

export default PersonalPage;
