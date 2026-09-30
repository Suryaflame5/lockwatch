-- LockWatch Class Management System Migration (003)
-- Persistent academic groups, rosters, class sessions, and class join tokens

CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    year VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    section VARCHAR(20) NOT NULL,
    description TEXT,
    class_code VARCHAR(30) UNIQUE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'UPCOMING', -- ACTIVE, UPCOMING, ENDED, ARCHIVED
    start_time VARCHAR(20), -- e.g. "09:00"
    end_time VARCHAR(20),   -- e.g. "10:30"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS class_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'ENROLLED', -- ENROLLED, PENDING, REMOVED, BLOCKED
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    removed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_class_student UNIQUE(class_id, student_id)
);

CREATE TABLE IF NOT EXISTS class_join_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Link sessions to persistent classes
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ends_at TIMESTAMP WITH TIME ZONE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_inst_status ON classes(institution_id, status);
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(class_code);
CREATE INDEX IF NOT EXISTS idx_classes_created_by ON classes(created_by);
CREATE INDEX IF NOT EXISTS idx_memberships_class ON class_memberships(class_id);
CREATE INDEX IF NOT EXISTS idx_memberships_student ON class_memberships(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_class ON sessions(class_id);
