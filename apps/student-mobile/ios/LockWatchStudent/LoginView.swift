import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authVM: StudentAuthViewModel
    @State private var identifier = ""
    @State private var password = ""
    @State private var identifierType = "phone"
    
    let identifierTypes = [("phone", "Phone Number"), ("email", "Email"), ("regNo", "Reg. Number")]
    
    var body: some View {
        ZStack {
            Color(hex: "0D1117").ignoresSafeArea()
            
            VStack(spacing: 32) {
                Spacer()
                
                VStack(spacing: 8) {
                    Image(systemName: "lock.shield.fill")
                        .font(.system(size: 60))
                        .foregroundColor(Color(hex: "10B981"))
                    Text("LockWatch")
                        .font(.largeTitle).bold()
                        .foregroundColor(.white)
                    Text("Student App")
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "8B949E"))
                }
                
                VStack(spacing: 16) {
                    Picker("Login with", selection: $identifierType) {
                        ForEach(identifierTypes, id: \.0) { type in
                            Text(type.1).tag(type.0)
                        }
                    }
                    .pickerStyle(.segmented)
                    
                    VStack(spacing: 12) {
                        TextField(identifierPlaceholder, text: $identifier)
                            .textFieldStyle(.roundedBorder)
                            .autocapitalization(.none)
                            .keyboardType(identifierType == "phone" ? .phonePad : .emailAddress)
                        
                        SecureField("Password", text: $password)
                            .textFieldStyle(.roundedBorder)
                        
                        if let err = authVM.errorMessage {
                            Text(err).foregroundColor(.red).font(.caption)
                        }
                        
                        Button(action: {
                            Task { await authVM.login(identifier: identifier, password: password, identifierType: identifierType) }
                        }) {
                            Group {
                                if authVM.isLoading {
                                    ProgressView().tint(.white)
                                } else {
                                    Text("Sign In").fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(hex: "10B981"))
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        .disabled(authVM.isLoading || identifier.isEmpty || password.isEmpty)
                    }
                }
                .padding()
                .background(Color(hex: "161B22"))
                .cornerRadius(16)
                
                Spacer()
            }
            .padding()
        }
    }
    
    var identifierPlaceholder: String {
        switch identifierType {
        case "phone": return "Phone Number"
        case "email": return "Email Address"
        default: return "Register Number"
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
