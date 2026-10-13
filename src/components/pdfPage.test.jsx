import React from 'react';
import { render } from '@testing-library/react';
import PdfPage from './pdfPage';
import { getSaleScript } from './sale-script';

const props = {
  formatPrice: String, totalPrice: 1000, data: { label: 'SigenStor' },
  getDriveImageUrl: value => value, selectedOptions: { 1: 'EC 25.0 TP' },
  space: [{ id: 1, title: 'ขนาดอินเวอร์เตอร์' }],
  priceSummary: { totalWithMarkup: 1100, lines: [
    { title: 'inverter', text: 'Inverter 25 kW', status: false, saleScript: 'Inverter script' },
    { title: 'battery', text: 'Battery', end_text: 'ก้อน คิดเป็น', status: true, quantity: 4, endCalculateTotal: 36.16, saleScript: getSaleScript({ saleScpirt: 'Battery script' }) },
    { title: 'gateway', text: 'Gateway', saleScript: null },
  ] },
};

test('PDF keeps details and price on page one and moves the recommendation summary to page two', () => {
  const { container } = render(<PdfPage {...props} />);
  const pages = container.querySelectorAll('[data-pdf-page]');
  expect(pages).toHaveLength(2);
  expect(pages[0]).toHaveTextContent('รายละเอียดสเปกระบบ');
  expect(pages[0]).toHaveTextContent('ราคาโดยประมาณ');
  expect(pages[0]).not.toHaveTextContent('สรุประบบที่แนะนำสำหรับคุณ');
  expect(pages[1]).toHaveTextContent('สรุประบบที่แนะนำสำหรับคุณ');
  expect(pages[1]).not.toHaveTextContent('ราคาโดยประมาณ');
});

test('PDF appends each selected device script after its existing quantity and capacity summary', () => {
  const { container } = render(<PdfPage {...props} />);
  const summary = container.querySelector('[data-pdf-page="2"]');
  expect(summary).toHaveTextContent('Inverter 25 kW Inverter script');
  expect(summary).toHaveTextContent('Battery 4 ก้อน คิดเป็น 36.16 kWh Battery script');
  expect(summary).not.toHaveTextContent('null');
  expect(summary).not.toHaveTextContent('undefined');
});

test('reads the actual price_list saleScpirt column and preserves null values', () => {
  expect(getSaleScript({ saleScpirt: 'ข้อความจากตาราง' })).toBe('ข้อความจากตาราง');
  expect(getSaleScript({ saleScpirt: null })).toBeNull();
  expect(getSaleScript({ saleScript: 'legacy' })).toBe('legacy');
});
