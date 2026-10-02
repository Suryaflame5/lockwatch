import SwiftUI

struct FacultyContentView: View {
    @EnvironmentObject var authVM: FacultyAuthViewModel
    
    var body: some View {
        Group {
            if authVM.isLoggedIn {
                FacultyDashboardView()
                    .environmentObject(authVM)
            } else {
                FacultyLoginView()
                    .environmentObject(authVM)
            }
        }
    }
}
