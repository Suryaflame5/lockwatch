import Foundation

struct StudentUser: Codable {
    let id: String
    let name: String
    let email: String?
    let phoneNumber: String?
    let role: String
}

struct StudentProfile: Codable {
    let id: String
    let registerNumber: String?
    let institutionId: String
}

struct DeviceInfo: Codable {
    let id: String
    let platform: String
    let status: String?
}

struct AcademicClass: Codable, Identifiable {
    let id: String
    let name: String
    let subject: String
    let section: String?
    let joinCode: String
}

struct ClassMembership: Codable {
    let id: String
    let classId: String
    let status: String
}

struct ActiveSessionInfo: Codable {
    let id: String
    let name: String
    let status: String
    let joinCode: String
}

struct ClassWithSession: Codable, Identifiable {
    var id: String { classInfo.id }
    let classInfo: AcademicClass
    let membership: ClassMembership?
    let activeSession: ActiveSessionInfo?
    
    enum CodingKeys: String, CodingKey {
        case classInfo = "class"
        case membership
        case activeSession
    }
}

struct SessionParticipant: Codable {
    let id: String
    let sessionId: String
    let studentId: String
    let status: String
}

struct LoginResponse: Codable {
    let accessToken: String
    let refreshToken: String
    let user: StudentUser
}
