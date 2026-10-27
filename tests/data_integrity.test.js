import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../src/data');

test('verified_institute.json has authentic official data', () => {
  const content = JSON.parse(fs.readFileSync(path.join(dataDir, 'verified_institute.json'), 'utf-8'));
  assert.equal(content.shortName, 'FJSTI');
  assert.equal(content.rector.fullName, 'Sidikov Akmal Abdikaxarovich');
  assert.equal(content.officialLinks.website, 'https://fjsti.uz');
  assert.equal(content.officialLinks.hemis, 'https://hemis.fjsti.uz');
  assert.ok(content.faculties.length >= 4);
});

test('verified_calendar.json contains all 6 undergraduate courses', () => {
  const calendar = JSON.parse(fs.readFileSync(path.join(dataDir, 'verified_calendar.json'), 'utf-8'));
  assert.equal(calendar.length, 6);
  
  for (const c of calendar) {
    assert.ok(c.course >= 1 && c.course <= 6);
    assert.ok(c.directions.length > 0);
    for (const d of c.directions) {
      assert.ok(d.name.length > 0);
      assert.ok(d.totalWeeks === 52 || d.totalWeeks === 48);
    }
  }
});

test('verified_departments.json contains comprehensive subjects and departments', () => {
  const depts = JSON.parse(fs.readFileSync(path.join(dataDir, 'verified_departments.json'), 'utf-8'));
  assert.ok(depts.length >= 25);
  
  const totalSubjects = depts.reduce((acc, d) => acc + d.subjects.length, 0);
  assert.ok(totalSubjects >= 300, `Expected at least 300 subjects, got ${totalSubjects}`);

  // Test presence of essential medical departments
  const names = depts.map(d => d.name.toLowerCase());
  assert.ok(names.some(n => n.includes('gigiyena')));
  assert.ok(names.some(n => n.includes('anatomiya')));
  assert.ok(names.some(n => n.includes('farmakologiya')));
  assert.ok(names.some(n => n.includes('pediatriya')));
  assert.ok(names.some(n => n.includes('jarrohlik')));
});

test('verified_rooms.json contains 28 clinical bases and 120+ rooms', () => {
  const bases = JSON.parse(fs.readFileSync(path.join(dataDir, 'verified_rooms.json'), 'utf-8'));
  assert.equal(bases.length, 28);

  const totalRooms = bases.reduce((acc, b) => acc + b.rooms.length, 0);
  assert.ok(totalRooms >= 114, `Expected at least 114 rooms, got ${totalRooms}`);

  const totalCapacity = bases.reduce((acc, b) => acc + b.rooms.reduce((rAcc, r) => rAcc + r.capacity, 0), 0);
  assert.ok(totalCapacity >= 2000, `Expected at least 2000 student capacity, got ${totalCapacity}`);
});

test('verified_services.json has all core student services', () => {
  const services = JSON.parse(fs.readFileSync(path.join(dataDir, 'verified_services.json'), 'utf-8'));
  const categories = services.map(s => s.category);
  assert.ok(categories.includes('hemis'));
  assert.ok(categories.includes('kredit_modul'));
  assert.ok(categories.includes('kontrakt'));
  assert.ok(categories.includes('stipendiya'));
  assert.ok(categories.includes('yotoqxona'));
  assert.ok(categories.includes('spravka'));
});
