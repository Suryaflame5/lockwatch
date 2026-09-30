-- LockWatch PostgreSQL Production Database Schema
-- Multi-tenant isolation with high-integrity audit, device, and telemetry tracking

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Institutions (Tenants)
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    retention_days INT NOT NULL DEFAULT 90,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users (All roles: SUPER_ADMIN, INSTITUTION_ADMIN, FACULTY, INVIGILATOR, STUDENT)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    pin_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_institution_email UNIQUE(institution_id, email)
);

-- Faculty details
CREATE TABLE faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    faculty_id_number VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_faculty_institution_id_number UNIQUE(institution_id, faculty_id_number)
);

-- Student details
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    register_number VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_students_institution_regno UNIQUE(institution_id, register_number)
);

-- Registered student devices
CREATE TABLE devices (
    id UUID PRIMARY KEY, -- Application-generated cryptographic device UUID
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL, -- ANDROID | IOS
    manufacturer VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    os_version VARCHAR(50) NOT NULL,
    app_version VARCHAR(30) NOT NULL,
    enrollment_status VARCHAR(50) NOT NULL, -- SECURE_READY, NOT_READY, etc.
    is_device_owner BOOLEAN NOT NULL DEFAULT FALSE,
    has_aac_entitlement BOOLEAN NOT NULL DEFAULT FALSE,
    public_key TEXT NOT NULL,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Examination Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    join_code VARCHAR(20) UNIQUE NOT NULL,
    join_token_secret VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SCHEDULED, READY, ACTIVE, PAUSED, ENDING, ENDED
    scheduled_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INT NOT NULL,
    emergency_duration_seconds INT NOT NULL DEFAULT 15,
    join_window_minutes INT NOT NULL DEFAULT 30,
    rules JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Session Participants
CREATE TABLE session_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE RESTRICT,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'READY', -- READY, ACTIVE, EMERGENCY, LEFT_SUPERVISION, OFFLINE, etc.
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_heartbeat_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_event_at TIMESTAMP WITH TIME ZONE,
    battery_level INT NOT NULL DEFAULT 100,
    is_charging BOOLEAN NOT NULL DEFAULT FALSE,
    network_quality VARCHAR(20) NOT NULL DEFAULT 'ONLINE', -- ONLINE, STALE, OFFLINE
    screen_on BOOLEAN NOT NULL DEFAULT TRUE,
    device_locked BOOLEAN NOT NULL DEFAULT FALSE,
    emergency_usage_count INT NOT NULL DEFAULT 0,
    interruption_count INT NOT NULL DEFAULT 0,
    offline_duration_seconds INT NOT NULL DEFAULT 0,
    lock_verified BOOLEAN NOT NULL DEFAULT FALSE,
    lock_failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_session_participant_session_student UNIQUE(session_id, student_id)
);

-- Faculty-to-Device Session Commands
CREATE TABLE session_commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    command_type VARCHAR(50) NOT NULL, -- START_SESSION, PAUSE_SESSION, END_SESSION, etc.
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, RECEIVED, EXECUTING, SUCCESS, FAILED, TIMEOUT
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Immutable Realtime Session Events
CREATE TABLE session_events (
    id UUID PRIMARY KEY, -- Application eventId (UUID)
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    sequence INT NOT NULL,
    client_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    server_received_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT uq_event_device_sequence UNIQUE(device_id, sequence)
);

-- Real-time Faculty Alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- CRITICAL, WARNING, NORMAL, INFO
    message TEXT NOT NULL,
    student_name VARCHAR(255),
    register_number VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE
);

-- Immutable Security & Faculty Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    result VARCHAR(20) NOT NULL -- SUCCESS | FAILURE
);

-- Session Post-Examination Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    total_students INT NOT NULL,
    active_students INT NOT NULL,
    completed_students INT NOT NULL,
    interrupted_students INT NOT NULL,
    emergency_requests INT NOT NULL,
    lock_failures INT NOT NULL,
    summary_data JSONB NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Refresh Tokens for Token Rotation
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Device Enrollment & Platform Capabilities
CREATE TABLE device_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    enrollment_type VARCHAR(50) NOT NULL, -- ANDROID_ENTERPRISE_DO | APPLE_SUPERVISED_MDM | BYOD_STUDENT
    management_profile_id VARCHAR(100),
    verified_at TIMESTAMP WITH TIME ZONE,
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE platform_capabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    capability VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL, -- SUPPORTED, UNSUPPORTED, CONFIGURATION_REQUIRED, etc.
    details JSONB DEFAULT '{}'::jsonb,
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_device_capability UNIQUE(device_id, capability)
);
