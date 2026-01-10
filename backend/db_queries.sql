-- Database DDL and DML for Cardio Sense
-- Generated from SQLAlchemy models in backend/app/models
-- PostgreSQL dialect

-- ENUM types
CREATE TYPE user_role AS ENUM ('patient','doctor','researcher','admin');
CREATE TYPE user_status AS ENUM ('pending','active','suspended','rejected');
CREATE TYPE upload_status AS ENUM ('queued','processing','completed','failed','pending_approval');
CREATE TYPE classification_result AS ENUM ('NORMAL','ABNORMAL','PENDING');
CREATE TYPE otp_type AS ENUM ('signup_verify','login_2fa','password_reset','phone_verify');
CREATE TYPE dataset_status AS ENUM ('available','restricted','archived');
CREATE TYPE access_request_status AS ENUM ('pending','approved','rejected','expired');

-- USERS table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role user_role NOT NULL DEFAULT 'patient',
  status user_status NOT NULL DEFAULT 'pending',
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  two_fa_enabled BOOLEAN DEFAULT FALSE,
  date_of_birth TIMESTAMP,
  gender VARCHAR(20),
  blood_group VARCHAR(10),
  medical_history TEXT,
  license_number VARCHAR(100),
  specialization VARCHAR(255),
  hospital VARCHAR(255),
  license_document_path VARCHAR(500),
  institution VARCHAR(255),
  research_area VARCHAR(255),
  affiliation_document_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  last_login TIMESTAMP
);

-- OTP TOKENS
CREATE TABLE IF NOT EXISTS otp_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  otp_code VARCHAR(10) NOT NULL,
  token_type otp_type NOT NULL,
  temp_token VARCHAR(255),
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP NOT NULL,
  used TIMESTAMP
);

-- PCG UPLOADS
CREATE TABLE IF NOT EXISTS pcg_uploads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  file_format VARCHAR(20),
  device VARCHAR(255),
  recording_time TIMESTAMP,
  duration_seconds INTEGER,
  status upload_status NOT NULL DEFAULT 'queued',
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  assigned_doctor_id INTEGER REFERENCES users(id),
  doctor_notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  processed_at TIMESTAMP
);

-- ANALYSIS RESULTS
CREATE TABLE IF NOT EXISTS analysis_results (
  id SERIAL PRIMARY KEY,
  upload_id INTEGER NOT NULL REFERENCES pcg_uploads(id) ON DELETE CASCADE,
  classification classification_result DEFAULT 'PENDING',
  classification_confidence FLOAT DEFAULT 0.0,
  probability_normal FLOAT DEFAULT 0.0,
  probability_abnormal FLOAT DEFAULT 0.0,
  results JSONB,
  total_s1_count INTEGER DEFAULT 0,
  total_s2_count INTEGER DEFAULT 0,
  average_confidence FLOAT DEFAULT 0.0,
  heart_rate_bpm FLOAT,
  visualization_url VARCHAR(500),
  report_pdf_url VARCHAR(500),
  waveform_data JSONB,
  doctor_comments TEXT,
  doctor_reviewed TIMESTAMP,
  doctor_id INTEGER REFERENCES users(id),
  doctor_agrees_with_ai INTEGER,
  doctor_classification classification_result,
  model_version VARCHAR(50),
  processing_time_seconds FLOAT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- DATASETS and ACCESS
CREATE TABLE IF NOT EXISTS datasets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status dataset_status NOT NULL DEFAULT 'available',
  total_samples INTEGER DEFAULT 0,
  file_path VARCHAR(500),
  requires_approval INTEGER DEFAULT 1,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dataset_access (
  id SERIAL PRIMARY KEY,
  dataset_id INTEGER NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  researcher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status access_request_status NOT NULL DEFAULT 'pending',
  purpose TEXT,
  reviewed_by INTEGER REFERENCES users(id),
  review_notes TEXT,
  requested_at TIMESTAMP DEFAULT now(),
  reviewed_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Example DML statements
-- Insert a user
INSERT INTO users (email, password_hash, full_name, role, status)
VALUES ('alice@example.com','$HASH','Alice Example','patient','active');

-- Create an OTP for signup flow
INSERT INTO otp_tokens (user_id, otp_code, token_type, expires_at)
VALUES (1,'123456','signup_verify', now() + interval '15 minutes');

-- Insert a PCG upload
INSERT INTO pcg_uploads (user_id, filename, original_filename, file_path, file_size, file_format)
VALUES (1,'a0007.wav','a0007.wav','/uploads/pcg/1/a0007.wav', 123456, 'wav');

-- Insert an analysis result
INSERT INTO analysis_results (upload_id, classification, classification_confidence, probability_normal, probability_abnormal)
VALUES (1,'NORMAL', 87.3, 0.873, 0.127);

-- Select queries
SELECT * FROM users WHERE email = 'alice@example.com';
SELECT * FROM pcg_uploads WHERE status = 'queued' ORDER BY created_at ASC LIMIT 20;
SELECT ar.* FROM analysis_results ar JOIN pcg_uploads p ON p.id = ar.upload_id WHERE p.user_id = 1;

-- Update statements
UPDATE pcg_uploads SET status = 'processing', progress = 10 WHERE id = 1;
UPDATE analysis_results SET doctor_comments = 'Reviewed, looks normal', doctor_reviewed = now(), doctor_id = 2 WHERE id = 1;

-- Delete example
DELETE FROM otp_tokens WHERE expires_at < now() - interval '1 day';

-- Migration (from backend/migrate_otp_user_id.py)
-- Make user_id column nullable in otp_tokens
ALTER TABLE otp_tokens ALTER COLUMN user_id DROP NOT NULL;
