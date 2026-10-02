import Foundation

class StudentAPIService {
    static let shared = StudentAPIService()
    private let baseURL = "https://lockwatch.onrender.com"
    var accessToken: String?
    
    private init() {}
    
    private func makeRequest(path: String, method: String = "GET", body: [String: Any]? = nil) -> URLRequest {
        var request = URLRequest(url: URL(string: baseURL + path)!)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body = body {
            request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        }
        return request
    }
    
    func login(identifier: String, password: String, identifierType: String) async throws -> LoginResponse {
        var body: [String: Any] = ["password": password]
        if identifierType == "phone" {
            body["phoneNumber"] = identifier
        } else if identifierType == "email" {
            body["email"] = identifier
        } else {
            body["registerNumber"] = identifier
        }
        let req = makeRequest(path: "/auth/student/login", method: "POST", body: body)
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let httpResp = resp as? HTTPURLResponse, httpResp.statusCode == 200 else {
            throw APIError.httpError((resp as? HTTPURLResponse)?.statusCode ?? 0)
        }
        let decoded = try JSONDecoder().decode(LoginResponse.self, from: data)
        accessToken = decoded.accessToken
        return decoded
    }
    
    func getClasses() async throws -> [ClassWithSession] {
        let req = makeRequest(path: "/students/classes")
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let httpResp = resp as? HTTPURLResponse, httpResp.statusCode == 200 else {
            throw APIError.httpError((resp as? HTTPURLResponse)?.statusCode ?? 0)
        }
        return try JSONDecoder().decode([ClassWithSession].self, from: data)
    }
    
    func joinClassByCode(joinCode: String) async throws -> ClassMembership {
        let req = makeRequest(path: "/students/classes/join-code", method: "POST", body: ["joinCode": joinCode])
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let httpResp = resp as? HTTPURLResponse, httpResp.statusCode == 200 || httpResp.statusCode == 201 else {
            throw APIError.httpError((resp as? HTTPURLResponse)?.statusCode ?? 0)
        }
        let json = try JSONDecoder().decode([String: ClassMembership].self, from: data)
        return json["membership"]!
    }
    
    func joinSession(joinCode: String) async throws -> SessionParticipant {
        let req = makeRequest(path: "/sessions/\(joinCode)/join", method: "POST")
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let httpResp = resp as? HTTPURLResponse, httpResp.statusCode == 200 || httpResp.statusCode == 201 else {
            throw APIError.httpError((resp as? HTTPURLResponse)?.statusCode ?? 0)
        }
        let json = try JSONDecoder().decode([String: SessionParticipant].self, from: data)
        return json["participant"]!
    }
    
    func sendHeartbeat(deviceId: String) async throws {
        let req = makeRequest(path: "/devices/\(deviceId)/heartbeat", method: "POST")
        let (_, _) = try await URLSession.shared.data(for: req)
    }
    
    func requestEmergency() async throws {
        let req = makeRequest(path: "/emergency/request", method: "POST")
        let (_, _) = try await URLSession.shared.data(for: req)
    }
    
    func exitEmergency() async throws {
        let req = makeRequest(path: "/emergency/exit", method: "POST")
        let (_, _) = try await URLSession.shared.data(for: req)
    }
}

enum APIError: LocalizedError {
    case httpError(Int)
    case decodingError
    case networkError
    
    var errorDescription: String? {
        switch self {
        case .httpError(let code): return "HTTP Error \(code)"
        case .decodingError: return "Failed to decode response"
        case .networkError: return "Network error"
        }
    }
}
