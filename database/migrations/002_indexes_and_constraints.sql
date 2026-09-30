-- Indexes for Fast Query Optimization & Multi-tenant Performance

-- Session queries & live monitor indexes
CREATE INDEX idx_sessions_inst_status ON sessions(institution_id, status);
CREATE INDEX idx_sessions_faculty ON sessions(faculty_id);
CREATE INDEX idx_sessions_join_code ON sessions(join_code);

-- Participant queries
CREATE INDEX idx_participants_session_status ON session_participants(session_id, status);
CREATE INDEX idx_participants_student ON session_participants(student_id);
CREATE INDEX idx_participants_device ON session_participants(device_id);
CREATE INDEX idx_participants_heartbeat ON session_participants(session_id, last_heartbeat_at);

-- Events & sequence tracking
CREATE INDEX idx_events_session ON session_events(session_id, sequence);
CREATE INDEX idx_events_student ON session_events(student_id);
CREATE INDEX idx_events_type ON session_events(type);
CREATE INDEX idx_events_timestamp ON session_events(server_received_timestamp);

-- Real-time alerts
CREATE INDEX idx_alerts_session_ack ON alerts(session_id, acknowledged);
CREATE INDEX idx_alerts_severity ON alerts(severity);

-- Audit log
CREATE INDEX idx_audit_inst_timestamp ON audit_logs(institution_id, timestamp DESC);
CREATE INDEX idx_audit_session ON audit_logs(session_id);

-- Device & User lookups
CREATE INDEX idx_users_inst_email ON users(institution_id, email);
CREATE INDEX idx_devices_student ON devices(student_id);
CREATE INDEX idx_devices_inst ON devices(institution_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id, revoked);
