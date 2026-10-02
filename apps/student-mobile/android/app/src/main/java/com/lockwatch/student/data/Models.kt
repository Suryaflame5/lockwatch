package com.lockwatch.student.data

data class User(
    val id: String,
    val email: String?,
    val phoneNumber: String?,
    val name: String,
    val role: String,
    val institutionId: String,
    val studentProfile: StudentProfile? = null,
    val device: Device? = null
)

data class StudentProfile(
    val id: String,
    val userId: String,
    val registerNumber: String,
    val admissionYear: String?,
    val department: String?,
    val program: String?,
    val status: String
)

data class Device(
    val id: String,
    val platform: String,
    val model: String?,
    val osVersion: String?,
    val isSupervised: Boolean = false,
    val enrollmentStatus: String
)

data class AcademicClass(
    val id: String,
    val name: String,
    val subject: String,
    val department: String,
    val year: String,
    val semester: String,
    val section: String,
    val classCode: String,
    val isActive: Boolean = true,
    val activeSession: SessionSummary? = null
)

data class SessionSummary(
    val id: String,
    val classId: String,
    val name: String,
    val status: String,
    val durationMinutes: Int,
    val joinCode: String?,
    val startsAt: String?,
    val endsAt: String?
)

data class SessionParticipant(
    val id: String,
    val sessionId: String,
    val studentId: String,
    val deviceId: String,
    val status: String,
    val batteryLevel: Int = 100,
    val isCharging: Boolean = false,
    val deviceLocked: Boolean = false,
    val networkQuality: String = "EXCELLENT"
)
