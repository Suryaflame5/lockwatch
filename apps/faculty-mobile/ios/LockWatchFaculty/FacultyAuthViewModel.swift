import SwiftUI

class FacultyAuthViewModel: ObservableObject {
    @Published var isLoggedIn = false
    @Published var loginResponse: FacultyLoginResponse?
    @Published var isLoading = false
    @Published var errorMessage: String?
    
    private let api = FacultyAPIService.shared
    
    func login(email: String, password: String) async {
        await MainActor.run { isLoading = true; errorMessage = nil }
        do {
            let resp = try await api.login(email: email, password: password)
            await MainActor.run {
                self.loginResponse = resp
                self.isLoggedIn = true
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                errorMessage = error.localizedDescription
                isLoading = false
            }
        }
    }
    
    func logout() {
        isLoggedIn = false
        loginResponse = nil
        api.accessToken = nil
    }
}
