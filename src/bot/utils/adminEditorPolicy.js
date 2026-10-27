const ENTITY_SCHEMAS = {
  faculty: {
    label: 'Fakultet',
    table: 'faculties',
    fields: [
      { key: 'name', label: 'Fakultet nomi', type: 'text', maxLength: 200, required: true },
      { key: 'dean_name', label: 'Dekan F.I.Sh.', type: 'text', maxLength: 200, nullable: true },
      { key: 'description', label: 'Yo‘nalishlar / tavsif', type: 'text', maxLength: 1500, nullable: true }
    ]
  },
  department: {
    label: 'Kafedra',
    table: 'departments',
    fields: [
      { key: 'name', label: 'Kafedra nomi', type: 'text', maxLength: 200, required: true },
      { key: 'head_name', label: 'Kafedra mudiri', type: 'text', maxLength: 200, nullable: true },
      { key: 'contact_phone', label: 'Mas’ul telefon', type: 'text', maxLength: 80, nullable: true },
      { key: 'location_notes', label: 'Joylashuv izohi', type: 'text', maxLength: 500, nullable: true }
    ]
  },
  subject: {
    label: 'Fan',
    table: 'subjects',
    fields: [
      { key: 'name', label: 'Fan nomi', type: 'text', maxLength: 200, required: true },
      { key: 'courses', label: 'Kurslar', type: 'text', maxLength: 100, nullable: true },
      { key: 'semesters', label: 'Semestrlar', type: 'text', maxLength: 100, nullable: true }
    ]
  },
  teacher: {
    label: 'O‘qituvchi',
    table: 'teachers',
    fields: [
      { key: 'full_name', label: 'F.I.Sh.', type: 'text', maxLength: 200, required: true },
      { key: 'position', label: 'Lavozim', type: 'text', maxLength: 150, nullable: true },
      { key: 'official_contact', label: 'Rasmiy aloqa', type: 'text', maxLength: 150, nullable: true },
      { key: 'source', label: 'Ma’lumot manbasi', type: 'text', maxLength: 300, nullable: true }
    ]
  },
  base: {
    label: 'Klinik baza',
    table: 'clinical_bases',
    fields: [
      { key: 'name', label: 'Muassasa nomi', type: 'text', maxLength: 250, required: true },
      { key: 'department_name', label: 'Biriktirilgan kafedra', type: 'text', maxLength: 200, nullable: true },
      { key: 'head_name', label: 'Mas’ul shaxs', type: 'text', maxLength: 200, nullable: true },
      { key: 'contact_phone', label: 'Telefon', type: 'text', maxLength: 80, nullable: true },
      { key: 'address', label: 'Manzil', type: 'text', maxLength: 500, nullable: true },
      { key: 'map_link', label: 'Xarita havolasi', type: 'url', maxLength: 2048, nullable: true },
      { key: 'total_rooms', label: 'Xonalar soni', type: 'integer', min: 0, max: 10000 },
      { key: 'total_capacity', label: 'Umumiy sig‘im', type: 'integer', min: 0, max: 100000 }
    ]
  },
  room: {
    label: 'Auditoriya',
    table: 'rooms',
    fields: [
      { key: 'room_number', label: 'Xona raqami', type: 'text', maxLength: 80, required: true },
      { key: 'room_type', label: 'Xona turi', type: 'text', maxLength: 100, required: true },
      { key: 'capacity', label: 'Sig‘im', type: 'integer', min: 0, max: 10000 },
      { key: 'department_name', label: 'Biriktirilgan kafedra', type: 'text', maxLength: 200, nullable: true },
      { key: 'notes', label: 'Izoh', type: 'text', maxLength: 1000, nullable: true }
    ]
  },
  book: {
    label: 'Kitob',
    table: 'books',
    fields: [
      { key: 'title', label: 'Kitob nomi', type: 'text', maxLength: 250, required: true },
      { key: 'author', label: 'Muallif', type: 'text', maxLength: 200, nullable: true },
      { key: 'subject_name', label: 'Fan nomi', type: 'text', maxLength: 200, nullable: true },
      { key: 'course', label: 'Kurs (1–6)', type: 'integer', min: 1, max: 6, nullable: true },
      { key: 'file_url', label: 'Kitob havolasi', type: 'url', maxLength: 2048, required: true },
      { key: 'source', label: 'Manba', type: 'text', maxLength: 300, nullable: true }
    ]
  },
  calendar: {
    label: 'O‘quv grafigi',
    table: 'academic_calendars',
    fields: [
      { key: 'direction_name', label: 'Ta’lim yo‘nalishi', type: 'text', maxLength: 250, required: true },
      { key: 'theory_weeks', label: 'Nazariy ta’lim haftalari', type: 'integer', min: 0, max: 52 },
      { key: 'attestation_weeks', label: 'Attestatsiya haftalari', type: 'integer', min: 0, max: 52 },
      { key: 'internship_weeks', label: 'Amaliyot haftalari', type: 'integer', min: 0, max: 52 },
      { key: 'credit_intro_weeks', label: 'Kredit tizimi haftalari', type: 'integer', min: 0, max: 52 },
      { key: 'vacation_weeks', label: 'Ta’til haftalari', type: 'integer', min: 0, max: 52 },
      { key: 'state_exam_weeks', label: 'Davlat attestatsiyasi haftalari', type: 'integer', min: 0, max: 52 },
      { key: 'gpa_weeks', label: 'GPA haftalari', type: 'integer', min: 0, max: 52 },
      { key: 'total_weeks', label: 'Jami haftalar', type: 'integer', min: 1, max: 52 },
      { key: 'academic_year', label: 'O‘quv yili', type: 'text', maxLength: 30, required: true },
      { key: 'source', label: 'Ma’lumot manbasi', type: 'text', maxLength: 500, nullable: true }
    ]
  },
  service: {
    label: 'Talaba xizmati',
    table: 'student_services',
    fields: [
      { key: 'title', label: 'Sarlavha', type: 'text', maxLength: 250, required: true },
      { key: 'short_description', label: 'Qisqa tavsif', type: 'text', maxLength: 500, nullable: true },
      { key: 'content', label: 'Asosiy matn', type: 'text', maxLength: 3500, required: true },
      { key: 'source_url', label: 'Rasmiy havola', type: 'url', maxLength: 2048, nullable: true }
    ]
  }
};

export function getEditableEntitySchema(entityType) {
  return ENTITY_SCHEMAS[entityType] || null;
}

export function getEditableField(entityType, fieldKey) {
  const schema = getEditableEntitySchema(entityType);
  return schema?.fields.find((field) => field.key === fieldKey) || null;
}

export function validateEditableValue(entityType, fieldKey, input) {
  const field = getEditableField(entityType, fieldKey);
  if (!field) throw new Error('Bu maydonni tahrirlashga ruxsat berilmagan.');

  const raw = String(input ?? '').trim();
  if (raw === '-' && field.nullable) return null;
  if (!raw) {
    if (field.nullable) return null;
    throw new Error('Bu maydon bo‘sh qolmasligi kerak.');
  }
  if (raw.length > (field.maxLength || 3500)) {
    throw new Error(`Matn ${field.maxLength} belgidan oshmasligi kerak.`);
  }

  if (field.type === 'integer') {
    if (!/^-?\d+$/.test(raw)) throw new Error('Bu maydonga butun son kiriting.');
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < field.min || value > field.max) {
      throw new Error(`Qiymat ${field.min}–${field.max} oralig‘ida bo‘lishi kerak.`);
    }
    return value;
  }

  if (field.type === 'url') {
    let parsed;
    try {
      parsed = new URL(raw);
    } catch {
      throw new Error('To‘liq havola kiriting (https://... yoki http://...).');
    }
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      throw new Error('Faqat http yoki https havolalariga ruxsat beriladi.');
    }
  }

  return raw;
}
