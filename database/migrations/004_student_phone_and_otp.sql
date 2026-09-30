-- LockWatch Student Phone & OTP Challenges (004)
-- Multi-identifier login, E.164 phone uniqueness, and OTP authentication challenge verification

ALTER TABLE students ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) UNIQUE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone_number);

CREATE TABLE IF NOT EXISTS otp_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) NOT NULL,
    purpose VARCHAR(30) NOT NULL, -- SIGNUP, PASSWORD_RESET, PHONE_CHANGE
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,
    verified_at TIMESTAMP WITH TIME ZONE,
    consumed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_phone_purpose ON otp_challenges(phone_number, purpose);
