import SwiftUI

@main
struct LockWatchFacultyApp: App {
    @StateObject private var authVM = FacultyAuthViewModel()
    
    var body: some Scene {
        WindowGroup {
            FacultyContentView()
                .environmentObject(authVM)
                .preferredColorScheme(.dark)
        }
    }
}
