package com.lockwatch.faculty.data

data class User(
    val id: String,
    val name: String,
    val email: String,
    val role: String
)

data class Faculty(
    val id: String,
    val userId: String,
    val institutionId: String,
    val department: String?,
    val designation: String?
)

data class Institution(
    val id: String,
    val name: String,
    val code: String
)

data class AcademicClass(
    val id: String,
    val name: String,
    val subject: String,
    val section: String?,
    val joinCode: String,
    val facultyId: String,
    val institutionId: String,
    val studentCount: Int = 0
)

data class Session(
    val id: String,
    val classId: String,
    val name: String,
    val status: String,
    val joinCode: String,
    val startedAt: String?,
    val endedAt: String?
)

data class SessionParticipant(
    val id: String,
    val studentId: String,
    val deviceId: String?,
    val status: String,
    val batteryLevel: Int?,
    val deviceLocked: Boolean,
    val networkQuality: String?,
    val studentName: String,
    val registerNumber: String?
)

data class ClassReport(
    val totalStudents: Int,
    val sessions: Int
)

data class RosterStudent(
    val id: String,
    val userId: String,
    val name: String,
    val registerNumber: String?,
    val email: String?
)

data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: User,
    val faculty: Faculty,
    val institution: Institution
)
