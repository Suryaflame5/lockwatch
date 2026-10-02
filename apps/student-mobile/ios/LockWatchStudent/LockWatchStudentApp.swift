import SwiftUI

@main
struct LockWatchStudentApp: App {
    @StateObject private var authVM = StudentAuthViewModel()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authVM)
                .preferredColorScheme(.dark)
        }
    }
}
