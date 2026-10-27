import test from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeHtml,
  formatDepartmentCard,
  formatClinicalBaseCard,
  formatCalendarCard,
  formatBookCard
} from '../src/bot/utils/formatters.js';

test('escapeHtml prevents XSS injection', () => {
  assert.equal(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  assert.equal(escapeHtml('Tom & Jerry'), 'Tom &amp; Jerry');
});

test('formatDepartmentCard includes department details and official source', () => {
  const dept = {
    name: 'Kommunal va mehnat gigiyenasi',
    level: 'bakalavriat',
    head_name: 'Test Mudir',
    contact_phone: '90-123-45-67',
    subjects: [
      { name: 'Gigiyena', courses: '2-3', semesters: '4/5' }
    ]
  };
  const card = formatDepartmentCard(dept);
  assert.ok(card.includes('Kommunal va mehnat gigiyenasi'));
  assert.ok(card.includes('Test Mudir'));
  assert.ok(card.includes('90-123-45-67'));
  assert.ok(card.includes('Gigiyena'));
  assert.ok(card.includes('Manba: FJSTI'));
});

test('formatClinicalBaseCard formats rooms and total capacity correctly', () => {
  const base = {
    name: 'Uromed klinikasi',
    department_name: 'Urologiya va onkologiya',
    head_name: 'Yuldashov Fayzulla',
    contact_phone: '90-277-00-89',
    total_rooms: 5,
    total_capacity: 65,
    rooms: [
      { room_number: '1/1', room_type: 'Amaliy', capacity: 10 }
    ]
  };
  const card = formatClinicalBaseCard(base);
  assert.ok(card.includes('Uromed klinikasi'));
  assert.ok(card.includes('Yuldashov Fayzulla'));
  assert.ok(card.includes('65 nafar talaba'));
  assert.ok(card.includes('Xona <b>1/1</b>'));
});

test('formatCalendarCard includes weeks breakdown', () => {
  const item = {
    course: 1,
    direction_name: 'Davolash ishi',
    theory_weeks: 30,
    attestation_weeks: 4,
    internship_weeks: 5,
    credit_intro_weeks: 1,
    vacation_weeks: 11,
    state_exam_weeks: 0,
    gpa_weeks: 1,
    total_weeks: 52
  };
  const card = formatCalendarCard(item);
  assert.ok(card.includes('Davolash ishi (1-kurs)'));
  assert.ok(card.includes('Nazariy ta\'lim: <b>30</b> hafta'));
  assert.ok(card.includes('52 hafta'));
});

test('formatBookCard renders author and clickable link', () => {
  const book = {
    title: 'Odam anatomiyasi',
    author: 'B.X. Xamidov',
    subject_name: 'Anatomiya',
    course: 1,
    file_url: 'https://library.fjsti.uz/book/anatomiya',
    source: 'FJSTI ARM'
  };
  const card = formatBookCard(book);
  assert.ok(card.includes('Odam anatomiyasi'));
  assert.ok(card.includes('B.X. Xamidov'));
  assert.ok(card.includes('https://library.fjsti.uz/book/anatomiya'));
});
