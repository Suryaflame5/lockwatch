import Foundation

struct FacultyUser: Codable {
    let id: String
    let name: String
    let email: String
    let role: String
}

struct Faculty: Codable {
    let id: String
    let userId: String
    let institutionId: String
    let department: String?
    let designation: String?
}

struct Institution: Codable {
    let id: String
    let name: String
    let code: String
}

struct FacultyClass: Codable, Identifiable {
    let id: String
    let name: String
    let subject: String
    let section: String?
    let joinCode: String
    let studentCount: Int?
}

struct FacultySession: Codable, Identifiable {
    let id: String
    let classId: String
    let name: String
    let status: String
    let joinCode: String
    let startedAt: String?
    let endedAt: String?
}

struct LiveParticipant: Codable, Identifiable {
    let id: String
    let studentId: String
    let status: String
    let batteryLevel: Int?
    let deviceLocked: Bool
    let networkQuality: String?
    let student: StudentInfo?
    
    struct StudentInfo: Codable {
        let name: String
        let registerNumber: String?
    }
    
    var displayName: String { student?.name ?? "Unknown" }
    var displayRegNo: String? { student?.registerNumber }
}

struct RosterMember: Codable, Identifiable {
    let id: String
    let userId: String
    let name: String
    let registerNumber: String?
    let email: String?
}

struct FacultyLoginResponse: Codable {
    let accessToken: String
    let refreshToken: String
    let user: FacultyUser
    let faculty: Faculty
    let institution: Institution
}
