import Foundation

class FacultyAPIService {
    static let shared = FacultyAPIService()
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
    
    func login(email: String, password: String) async throws -> FacultyLoginResponse {
        let req = makeRequest(path: "/auth/faculty/login", method: "POST", body: ["email": email, "password": password])
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let httpResp = resp as? HTTPURLResponse, httpResp.statusCode == 200 else {
            throw APIError.httpError((resp as? HTTPURLResponse)?.statusCode ?? 0)
        }
        let decoded = try JSONDecoder().decode(FacultyLoginResponse.self, from: data)
        accessToken = decoded.accessToken
        return decoded
    }
    
    func getClasses() async throws -> [FacultyClass] {
        let (data, resp) = try await URLSession.shared.data(for: makeRequest(path: "/classes"))
        guard let httpResp = resp as? HTTPURLResponse, httpResp.statusCode == 200 else {
            throw APIError.httpError((resp as? HTTPURLResponse)?.statusCode ?? 0)
        }
        return try JSONDecoder().decode([FacultyClass].self, from: data)
    }
    
    func createClass(name: String, subject: String, section: String?) async throws -> FacultyClass {
        var body: [String: Any] = ["name": name, "subject": subject]
        if let section = section { body["section"] = section }
        let (data, resp) = try await URLSession.shared.data(for: makeRequest(path: "/classes", method: "POST", body: body))
        guard let httpResp = resp as? HTTPURLResponse, (200...201).contains(httpResp.statusCode) else {
            throw APIError.httpError((resp as? HTTPURLResponse)?.statusCode ?? 0)
        }
        return try JSONDecoder().decode(FacultyClass.self, from: data)
    }
    
    func getSessions(classId: String) async throws -> [FacultySession] {
        let (data, resp) = try await URLSession.shared.data(for: makeRequest(path: "/classes/\(classId)/sessions"))
        guard let httpResp = resp as? HTTPURLResponse, httpResp.statusCode == 200 else {
            throw APIError.httpError((resp as? HTTPURLResponse)?.statusCode ?? 0)
        }
        return try JSONDecoder().decode([FacultySession].self, from: data)
    }
    
    func createSession(classId: String, name: String) async throws -> FacultySession {
        let (data, resp) = try await URLSession.shared.data(for: makeRequest(path: "/classes/\(classId)/sessions", method: "POST", body: ["name": name]))
        guard let httpResp = resp as? HTTPURLResponse, (200...201).contains(httpResp.statusCode) else {
            throw APIError.httpError((resp as? HTTPURLResponse)?.statusCode ?? 0)
        }
        return try JSONDecoder().decode(FacultySession.self, from: data)
    }
    
    func controlSession(sessionId: String, action: String) async throws {
        let (_, resp) = try await URLSession.shared.data(for: makeRequest(path: "/faculty/sessions/\(sessionId)/\(action)", method: "POST"))
        guard let httpResp = resp as? HTTPURLResponse, (200...204).contains(httpResp.statusCode) else {
            throw APIError.httpError((resp as? HTTPURLResponse)?.statusCode ?? 0)
        }
    }
    
    func getLiveParticipants(sessionId: String) async throws -> [LiveParticipant] {
        let (data, resp) = try await URLSession.shared.data(for: makeRequest(path: "/faculty/sessions/\(sessionId)/live"))
        guard let httpResp = resp as? HTTPURLResponse, httpResp.statusCode == 200 else {
            throw APIError.httpError((resp as? HTTPURLResponse)?.statusCode ?? 0)
        }
        let json = try JSONDecoder().decode([String: [LiveParticipant]].self, from: data)
        return json["participants"] ?? []
    }
    
    func getRoster(classId: String) async throws -> [RosterMember] {
        let (data, resp) = try await URLSession.shared.data(for: makeRequest(path: "/classes/\(classId)/roster"))
        guard let httpResp = resp as? HTTPURLResponse, httpResp.statusCode == 200 else {
            throw APIError.httpError((resp as? HTTPURLResponse)?.statusCode ?? 0)
        }
        return try JSONDecoder().decode([RosterMember].self, from: data)
    }
}
