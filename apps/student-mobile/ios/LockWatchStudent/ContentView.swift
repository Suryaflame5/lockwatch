import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authVM: StudentAuthViewModel
    
    var body: some View {
        Group {
            if authVM.isLoggedIn {
                if authVM.activeSession != nil {
                    ActiveSessionView()
                        .environmentObject(authVM)
                } else {
                    HomeView()
                        .environmentObject(authVM)
                }
            } else {
                LoginView()
                    .environmentObject(authVM)
            }
        }
        .animation(.easeInOut, value: authVM.isLoggedIn)
    }
}
