import SwiftUI
import Combine

class StudentAuthViewModel: ObservableObject {
    @Published var isLoggedIn = false
    @Published var user: StudentUser?
    @Published var accessToken: String?
    @Published var activeSession: ActiveSessionInfo?
    @Published var classes: [ClassWithSession] = []
    @Published var errorMessage: String?
    @Published var isLoading = false
    
    private let api = StudentAPIService.shared
    
    func login(identifier: String, password: String, identifierType: String) async {
        await MainActor.run { isLoading = true; errorMessage = nil }
        do {
            let resp = try await api.login(identifier: identifier, password: password, identifierType: identifierType)
            await MainActor.run {
                self.user = resp.user
                self.accessToken = resp.accessToken
                self.isLoggedIn = true
                self.isLoading = false
            }
            await loadClasses()
        } catch {
            await MainActor.run {
                errorMessage = error.localizedDescription
                isLoading = false
            }
        }
    }
    
    func loadClasses() async {
        do {
            let cls = try await api.getClasses()
            await MainActor.run {
                self.classes = cls
                self.activeSession = cls.first(where: { $0.activeSession != nil })?.activeSession
            }
        } catch {}
    }
    
    func logout() {
        isLoggedIn = false
        user = nil
        accessToken = nil
        activeSession = nil
        classes = []
        api.accessToken = nil
    }
}
