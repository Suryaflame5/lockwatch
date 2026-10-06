-- LockWatch Database Seed Data
-- 1 Institution, 1 Faculty (with bcrypt hashed password and PIN), 10 Students, Android & iOS devices

-- Passwords:
-- Faculty password: "FacultyPassword123!" (bcrypt hash below)
-- Faculty PIN: "123456" (bcrypt hash below)
-- Student password: "StudentPassword123!" (bcrypt hash below)

INSERT INTO institutions (id, code, name, domain, retention_days) VALUES 
('11111111-1111-1111-1111-111111111111', 'TECH-UNI', 'Apex Institute of Technology & Sciences', 'apextech.edu', 90)
ON CONFLICT (code) DO NOTHING;

-- Faculty User
INSERT INTO users (id, institution_id, role, email, password_hash, pin_hash, name, is_active) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'FACULTY', 'faculty@apextech.edu', '$2a$10$HGJQIKr/3.JtgowNECY05.oCIYnzka9aKAD20OsO8BRzP6uzt/X62', '$2a$10$9eJWxYAFlKWpgkHRxywRIOcJf7HPmoMizdm.J143NX80/lqfNOfuC', 'Dr. Rajesh Raman', TRUE)
ON CONFLICT (institution_id, email) DO NOTHING;

INSERT INTO faculty (id, user_id, institution_id, faculty_id_number, department, designation) VALUES
('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'FAC-CS-084', 'Computer Science & Engineering', 'Professor & Head')
ON CONFLICT (institution_id, faculty_id_number) DO NOTHING;

-- Students
INSERT INTO users (id, institution_id, role, email, password_hash, name, is_active) VALUES
('44444444-4444-4444-4444-444444444001', '11111111-1111-1111-1111-111111111111', 'STUDENT', 'arun.k@student.apextech.edu', '$2a$10$aAHO/FiiFzuCtpFJVrY6Q.Ehb5nz6ZFIc6YQ1aFsJ2WS.Srk8SRWe', 'Arun Kumar', TRUE),
('44444444-4444-4444-4444-444444444002', '11111111-1111-1111-1111-111111111111', 'STUDENT', 'priya.s@student.apextech.edu', '$2a$10$aAHO/FiiFzuCtpFJVrY6Q.Ehb5nz6ZFIc6YQ1aFsJ2WS.Srk8SRWe', 'Priya Sundaram', TRUE),
('44444444-4444-4444-4444-444444444003', '11111111-1111-1111-1111-111111111111', 'STUDENT', 'karthik.r@student.apextech.edu', '$2a$10$aAHO/FiiFzuCtpFJVrY6Q.Ehb5nz6ZFIc6YQ1aFsJ2WS.Srk8SRWe', 'Karthik Raja', TRUE),
('44444444-4444-4444-4444-444444444004', '11111111-1111-1111-1111-111111111111', 'STUDENT', 'deepa.m@student.apextech.edu', '$2a$10$aAHO/FiiFzuCtpFJVrY6Q.Ehb5nz6ZFIc6YQ1aFsJ2WS.Srk8SRWe', 'Deepa Murugan', TRUE),
('44444444-4444-4444-4444-444444444005', '11111111-1111-1111-1111-111111111111', 'STUDENT', 'vijay.v@student.apextech.edu', '$2a$10$aAHO/FiiFzuCtpFJVrY6Q.Ehb5nz6ZFIc6YQ1aFsJ2WS.Srk8SRWe', 'Vijay Venkat', TRUE),
('44444444-4444-4444-4444-444444444999', '11111111-1111-1111-1111-111111111111', 'STUDENT', 'suryaflame2007@gmail.com', '$2a$10$aAHO/FiiFzuCtpFJVrY6Q.Ehb5nz6ZFIc6YQ1aFsJ2WS.Srk8SRWe', 'Surya', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO students (id, user_id, institution_id, register_number, department, class_name) VALUES
('55555555-5555-5555-5555-555555555001', '44444444-4444-4444-4444-444444444001', '11111111-1111-1111-1111-111111111111', '23AIML104', 'Artificial Intelligence', 'B.Tech AI-A'),
('55555555-5555-5555-5555-555555555002', '44444444-4444-4444-4444-444444444002', '11111111-1111-1111-1111-111111111111', '23AIML118', 'Artificial Intelligence', 'B.Tech AI-A'),
('55555555-5555-5555-5555-555555555003', '44444444-4444-4444-4444-444444444003', '11111111-1111-1111-1111-111111111111', '23AIML122', 'Artificial Intelligence', 'B.Tech AI-A'),
('55555555-5555-5555-5555-555555555004', '44444444-4444-4444-4444-444444444004', '11111111-1111-1111-1111-111111111111', '23AIML130', 'Artificial Intelligence', 'B.Tech AI-A'),
('55555555-5555-5555-5555-555555555005', '44444444-4444-4444-4444-444444444005', '11111111-1111-1111-1111-111111111111', '23AIML145', 'Artificial Intelligence', 'B.Tech AI-A'),
('55555555-5555-5555-5555-555555555999', '44444444-4444-4444-4444-444444444999', '11111111-1111-1111-1111-111111111111', '23AIML007', 'Artificial Intelligence', 'B.Tech AI-A')
ON CONFLICT DO NOTHING;

-- Devices with actual enrollment & hardware metadata
INSERT INTO devices (id, student_id, institution_id, platform, manufacturer, model, os_version, app_version, enrollment_status, is_device_owner, has_aac_entitlement, public_key) VALUES
('66666666-6666-6666-6666-666666666001', '55555555-5555-5555-5555-555555555001', '11111111-1111-1111-1111-111111111111', 'ANDROID', 'Samsung', 'Galaxy A54 5G', 'Android 14 (API 34)', '1.0.0', 'SECURE_READY', TRUE, FALSE, 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAarun104secKey'),
('66666666-6666-6666-6666-666666666002', '55555555-5555-5555-5555-555555555002', '11111111-1111-1111-1111-111111111111', 'IOS', 'Apple', 'iPhone 15 Pro', 'iOS 17.5.1', '1.0.0', 'SECURE_READY', FALSE, TRUE, 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAappleSecKeyPriya'),
('66666666-6666-6666-6666-666666666003', '55555555-5555-5555-5555-555555555003', '11111111-1111-1111-1111-111111111111', 'ANDROID', 'Google', 'Pixel 8', 'Android 14 (API 34)', '1.0.0', 'SECURE_READY', TRUE, FALSE, 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkarthikSecKeyPixel'),
('66666666-6666-6666-6666-666666666004', '55555555-5555-5555-5555-555555555004', '11111111-1111-1111-1111-111111111111', 'IOS', 'Apple', 'iPad 10th Gen', 'iPadOS 17.4', '1.0.0', 'SECURE_READY', FALSE, TRUE, 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAdeepaSecKeyIpad'),
('66666666-6666-6666-6666-666666666005', '55555555-5555-5555-5555-555555555005', '11111111-1111-1111-1111-111111111111', 'ANDROID', 'Xiaomi', 'Redmi Note 13', 'Android 13 (MIUI 14)', '1.0.0', 'NOT_READY', FALSE, FALSE, 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvijaySecKeyRedmi'),
('66666666-6666-6666-6666-666666666999', '55555555-5555-5555-5555-555555555999', '11111111-1111-1111-1111-111111111111', 'ANDROID', 'vivo', 'V2521', 'Android 16 (API 36)', '1.0.0', 'SECURE_READY', TRUE, FALSE, 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsuryaVivoSecKey999')
ON CONFLICT DO NOTHING;

-- Initial Session
INSERT INTO sessions (id, institution_id, faculty_id, name, subject, department, class_name, join_code, join_token_secret, status, scheduled_start_time, duration_minutes, emergency_duration_seconds, join_window_minutes, rules) VALUES
('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Artificial Intelligence Internal Assessment I', 'CS804 - Artificial Intelligence & Neural Networks', 'Computer Science & Engineering', 'B.Tech AI-A', 'LW-AI-804', 'secret_token_lw_ai_804_signature_2026', 'READY', CURRENT_TIMESTAMP + INTERVAL '10 minutes', 90, 15, 30, '["Strict lockdown active", "No task switching", "Emergency access limited to 15 seconds", "All interruptions logged and reported"]')
ON CONFLICT (join_code) DO NOTHING;
