-- FJSTI Talaba Hamrohi - Neon PostgreSQL Database Schema
-- Barcha jadvallar va indekslar

CREATE TABLE IF NOT EXISTS faculties (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    dean_name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    faculty_id INT REFERENCES faculties(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    level TEXT DEFAULT 'bakalavriat',
    head_name TEXT,
    contact_phone TEXT,
    location_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    department_id INT REFERENCES departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    courses TEXT,
    semesters TEXT,
    level TEXT DEFAULT 'bakalavriat',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clinical_bases (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    department_name TEXT,
    head_name TEXT,
    contact_phone TEXT,
    address TEXT,
    map_link TEXT,
    total_rooms INT DEFAULT 0,
    total_capacity INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    clinical_base_id INT REFERENCES clinical_bases(id) ON DELETE CASCADE,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    room_number TEXT NOT NULL,
    room_type TEXT NOT NULL DEFAULT 'Amaliy',
    capacity INT DEFAULT 0,
    department_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS academic_calendars (
    id SERIAL PRIMARY KEY,
    course INT NOT NULL,
    direction_name TEXT NOT NULL,
    theory_weeks INT DEFAULT 0,
    internship_weeks INT DEFAULT 0,
    attestation_weeks INT DEFAULT 0,
    credit_intro_weeks INT DEFAULT 0,
    vacation_weeks INT DEFAULT 0,
    state_exam_weeks INT DEFAULT 0,
    gpa_weeks INT DEFAULT 0,
    total_weeks INT DEFAULT 52,
    academic_year TEXT DEFAULT '2026/2027',
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    position TEXT,
    official_contact TEXT,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    faculty_id INT REFERENCES faculties(id) ON DELETE SET NULL,
    course INT,
    group_name TEXT,
    last_active_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    subject_name TEXT,
    faculty_id INT REFERENCES faculties(id) ON DELETE SET NULL,
    course INT,
    file_url TEXT NOT NULL,
    source TEXT DEFAULT 'Rasmiy ARM (library.fjsti.uz)',
    added_by BIGINT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_services (
    id SERIAL PRIMARY KEY,
    category TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    short_description TEXT,
    content TEXT NOT NULL,
    source_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_audience TEXT DEFAULT 'all',
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    user_name TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS unanswered_questions (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    query_text TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
    telegram_id BIGINT PRIMARY KEY,
    full_name TEXT,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS search_logs (
    id SERIAL PRIMARY KEY,
    user_id BIGINT,
    query TEXT NOT NULL,
    results_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS section_analytics (
    id SERIAL PRIMARY KEY,
    section_key TEXT NOT NULL UNIQUE,
    clicks_count INT DEFAULT 1,
    last_clicked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_edit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_telegram_id BIGINT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id BIGINT NOT NULL,
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seed_versions (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE admins ADD COLUMN IF NOT EXISTS created_by BIGINT;

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);
CREATE INDEX IF NOT EXISTS idx_subjects_dept ON subjects(department_id);
CREATE INDEX IF NOT EXISTS idx_rooms_room_number ON rooms(room_number);
CREATE INDEX IF NOT EXISTS idx_rooms_base ON rooms(clinical_base_id);
CREATE INDEX IF NOT EXISTS idx_academic_calendars_course ON academic_calendars(course);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_course ON books(course);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_unanswered_status ON unanswered_questions(status);
CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs(created_at);
