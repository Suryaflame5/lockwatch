import SwiftUI

struct FacultyLoginView: View {
    @EnvironmentObject var authVM: FacultyAuthViewModel
    @State private var email = ""
    @State private var password = ""
    
    var body: some View {
        ZStack {
            Color(hex: "0D1117").ignoresSafeArea()
            VStack(spacing: 32) {
                Spacer()
                VStack(spacing: 8) {
                    Image(systemName: "graduationcap.fill")
                        .font(.system(size: 60)).foregroundColor(Color(hex: "2196F3"))
                    Text("LockWatch").font(.largeTitle).bold().foregroundColor(.white)
                    Text("Faculty Portal").font(.subheadline).foregroundColor(Color(hex: "8B949E"))
                }
                VStack(spacing: 12) {
                    TextField("Email", text: $email)
                        .textFieldStyle(.roundedBorder).autocapitalization(.none).keyboardType(.emailAddress)
                    SecureField("Password", text: $password)
                        .textFieldStyle(.roundedBorder)
                    if let err = authVM.errorMessage {
                        Text(err).foregroundColor(.red).font(.caption)
                    }
                    Button(action: { Task { await authVM.login(email: email, password: password) } }) {
                        Group {
                            if authVM.isLoading { ProgressView().tint(.white) }
                            else { Text("Sign In").fontWeight(.semibold) }
                        }
                        .frame(maxWidth: .infinity).padding()
                        .background(Color(hex: "2196F3")).foregroundColor(.white).cornerRadius(12)
                    }
                    .disabled(authVM.isLoading || email.isEmpty || password.isEmpty)
                }
                .padding()
                .background(Color(hex: "161B22")).cornerRadius(16)
                Spacer()
            }
            .padding()
        }
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: Double(a) / 255)
    }
}
