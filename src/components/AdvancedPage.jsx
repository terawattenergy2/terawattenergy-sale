import React, { useState } from "react";
import { Row, Col, Form, Button } from "react-bootstrap";

export default function AdvancedPage({ data }) {
  const [monthlyBill, setMonthlyBill] = useState(3500);
  const [pricePerUnit, setPricePerUnit] = useState(4.4);
  const [daytimeUsage, setDaytimeUsage] = useState(40);
  const [selectedOptionsPhase, setSelectedOptionsPhase] = useState({});
  const [selectedOptionsEV, setSelectedOptionsEV] = useState({});
  const [dataResult, setDataResult] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [daytimeBill, setDaytimeBill] = useState(0);
  const [onSize, setOnSize] = useState(false);
  const [systemSize, setSystemSize] = useState(8);
  const [dailyEnergy, setDailyEnergy] = useState(18);
  const [backupEnergy, setBackupEnergy] = useState(10);
  const [budgetLevel, setBudgetLevel] = useState(8);


  const phase = [
    {
      id: 0,
      title: "เฟสเดียว (1P)",
    },
    {
      id: 1,
      title: "สามเฟส (3P)",
    },
  ];

  const EV = [
    {
      id: 0,
      title: "มี",
    },
    {
      id: 1,
      title: "มีแล้ว",
    },
    {
      id: 2,
      title: "วางแผนซื้อ",
    },
  ];

  const handleSelectOptionPhase = (itemId, value) => {
    setSelectedOptionsPhase((previous) => ({
      ...previous,
      [itemId]: value,
    }));
  };

  const handleSelectOptionEV = (itemId, value) => {
    setSelectedOptionsEV((previous) => ({
      ...previous,
      [itemId]: value,
    }));
  };
  const handleSuggest = () => {
    const bill = Number(monthlyBill);
    const unitPrice = Number(pricePerUnit);
    const daytimePercent = Number(daytimeUsage);

    if (
      bill <= 0 ||
      unitPrice <= 0 ||
      daytimePercent < 0 ||
      daytimePercent > 100
    ) {
      alert("กรุณากรอกข้อมูลให้ถูกต้อง");
      return;
    }

    const monthlyUsage = bill / unitPrice;

    const daytimeUsagePerMonth = monthlyUsage * (daytimePercent / 100);

    const totalUsagePerDay = monthlyUsage / 30;
    const daytimeUsagePerDay = daytimeUsagePerMonth / 30;
    const recommendedSolarSize = daytimeUsagePerDay / 4;

    const nighttimeUsagePerDay = totalUsagePerDay - daytimeUsagePerDay;

    const answers = {
      monthlyBill: bill,
      pricePerUnit: unitPrice,
      daytimeUsage: daytimePercent,
      monthlyUsage,
      totalUsagePerDay,
      daytimeUsagePerMonth,
      daytimeUsagePerDay,
      recommendedSolarSize,
      nighttimeUsagePerDay,
    };

    setDataResult(answers);
    setDaytimeBill(daytimeUsagePerMonth);
    setOnSize(true);

    // เติมค่าที่คำนวณได้ลงฟอร์มด้านล่าง
    setSystemSize(recommendedSolarSize.toFixed(2));
    setDailyEnergy(totalUsagePerDay.toFixed(2));
    setBackupEnergy(nighttimeUsagePerDay.toFixed(2));
  };

  const handleDirectSuggest = () => {
    const directAnswers = {
      systemSize: Number(systemSize),
      phase: selectedOptionsPhase.phase ?? "0",
      dailyEnergy: Number(dailyEnergy),
      backupEnergy: Number(backupEnergy),
      budgetLevel: Number(budgetLevel),
      evPlan: selectedOptionsEV.EV ?? "0",
    };

    console.log("สเปกที่ผู้ใช้ยืนยัน:", directAnswers);
  };
  return (
    <>
      <div className="advanced-card">
        <h3 className="card-text">💡 ประมาณขนาดระบบจากค่าไฟฟ้า</h3>

        <Row className="mt-3 card-text">
          <Col xs={12} md={6} className="mb-3">
            <Form.Group>
              <Form.Label>ค่าไฟเฉลี่ยต่อเดือน (บาท)</Form.Label>

              <Form.Control
                type="number"
                min="0"
                value={monthlyBill}
                onChange={(e) => setMonthlyBill(e.target.value)}
              />
            </Form.Group>
          </Col>

          <Col xs={12} md={6} className="mb-3">
            <Form.Group>
              <Form.Label className="card-text">
                ค่าไฟต่อหน่วย (บาท/kWh)
              </Form.Label>

              <Form.Control
                type="number"
                min="0"
                step="0.1"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row className="mt-3">
          <Col xs={12} md={6}>
            <Form.Group>
              <Form.Label className="card-text">
                ใช้ไฟช่วงกลางวัน (%)
              </Form.Label>

              <Form.Control
                type="number"
                min="0"
                max="100"
                value={daytimeUsage}
                onChange={(e) => setDaytimeUsage(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>

        <div className="text-end mt-5">
          <Button type="button" onClick={handleSuggest}>
            คำนวณขนาดที่แนะนำ →
          </Button>
        </div>

        {onSize && (
          <div className="card-onsize mt-4">
            <h3>ผลการประมาณการ</h3>

            <p>
              ใช้ไฟทั้งหมดประมาณ{" "}
              <strong>{dataResult.monthlyUsage?.toFixed(2)}</strong> หน่วย/เดือน
            </p>

            <p>
              ใช้ไฟช่วงกลางวันประมาณ{" "}
              <strong>{dataResult.daytimeUsagePerMonth?.toFixed(2)}</strong>{" "}
              หน่วย/เดือน หรือ{" "}
              <strong>{dataResult.daytimeUsagePerDay?.toFixed(2)}</strong>{" "}
              kWh/วัน
            </p>

            <p>
              แนะนำระบบโซลาร์ขนาดประมาณ{" "}
              <strong>{dataResult.recommendedSolarSize?.toFixed(2)}</strong> kWp
            </p>

            <p>
              พลังงานที่แบตเตอรี่ควรรองรับช่วงกลางคืนประมาณ{" "}
              <strong>{dataResult.nighttimeUsagePerDay?.toFixed(2)}</strong>{" "}
              kWh/วัน
            </p>
          </div>
        )}
      </div>

      <div className="advanced-card card-text">
        <h2>กรอกสเปกโดยตรง</h2>

        <p>สำหรับช่างติดตั้ง</p>

        <Row>
          <Col md={6}>
            <Form.Group>
              <Form.Label>ขนาดระบบ (kWp)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                value={systemSize}
                onChange={(e) => setSystemSize(e.target.value)}
              />{" "}
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label>เฟสไฟฟ้า</Form.Label>

              <Form.Select
                value={selectedOptionsPhase.phase ?? "0"}
                onChange={(event) =>
                  handleSelectOptionPhase("phase", event.target.value)
                }
              >
                {phase.map((option) => (
                  <option key={option.id} value={String(option.id)}>
                    {option.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mt-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>ปริมาณการใช้ไฟต่อวัน (kWh/day)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                value={dailyEnergy}
                onChange={(e) => setDailyEnergy(e.target.value)}
              />
              <Form.Text className="text-secondary">
                ระบบเติมค่าจากการคำนวณให้อัตโนมัติ สามารถปรับแก้ได้
              </Form.Text>{" "}
              <p className="text-secondary m-2 small">
                ดูได้จากบิลค่าไฟเฉลี่ยต่อเดือน ÷ 30
              </p>
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label>เป้าหมายไฟสำรอง (kWh)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                value={backupEnergy}
                onChange={(e) => setBackupEnergy(e.target.value)}
              />
              <Form.Text className="text-secondary">
                0 = ไม่ต้องการสำรองไฟ สามารถปรับตามหน้างานได้
              </Form.Text>{" "}
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group>
              <Form.Label>ระดับงบประมาณ</Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={budgetLevel}
                onChange={(e) => setBudgetLevel(e.target.value)}
              />{" "}
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group>
              <Form.Label>แผนรถ EV</Form.Label>

              <Form.Select
                value={selectedOptionsEV.EV ?? "0"}
                onChange={(event) =>
                  handleSelectOptionEV("EV", event.target.value)
                }
              >
                {EV.map((option) => (
                  <option key={option.id} value={String(option.id)}>
                    {option.title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <div className="text-end mt-5">
            <Button type="button" onClick={handleDirectSuggest}>
              คำนวณระบบที่แนะนำ →
            </Button>{" "}
          </div>
        </Row>
      </div>
    </>
  );
}
