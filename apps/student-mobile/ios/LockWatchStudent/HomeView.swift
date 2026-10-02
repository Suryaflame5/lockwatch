import SwiftUI

struct HomeView: View {
    @EnvironmentObject var authVM: StudentAuthViewModel
    @State private var joinCode = ""
    @State private var showJoinDialog = false
    @State private var joiningSession = false
    @State private var joinError: String?
    
    var body: some View {
        NavigationView {
            ZStack {
                Color(hex: "0D1117").ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 16) {
                        HStack {
                            Image(systemName: "person.circle.fill")
                                .font(.system(size: 48))
                                .foregroundColor(Color(hex: "10B981"))
                            VStack(alignment: .leading) {
                                Text(authVM.user?.name ?? "Student").font(.headline).foregroundColor(.white)
                                Text(authVM.user?.phoneNumber ?? authVM.user?.email ?? "").font(.subheadline).foregroundColor(Color(hex: "8B949E"))
                            }
                            Spacer()
                            Button("Logout") { authVM.logout() }
                                .foregroundColor(.red).font(.caption)
                        }
                        .padding()
                        .background(Color(hex: "161B22")).cornerRadius(12)
                        
                        Button(action: { showJoinDialog = true }) {
                            HStack {
                                Image(systemName: "qrcode.viewfinder")
                                Text("Join Session")
                                    .fontWeight(.semibold)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(hex: "10B981"))
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        
                        VStack(alignment: .leading, spacing: 12) {
                            Text("My Classes")
                                .font(.headline).foregroundColor(.white)
                                .padding(.horizontal)
                            
                            if authVM.classes.isEmpty {
                                Text("No classes enrolled")
                                    .foregroundColor(Color(hex: "8B949E"))
                                    .padding()
                            } else {
                                ForEach(authVM.classes) { classWithSession in
                                    ClassRow(classWithSession: classWithSession)
                                }
                            }
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("LockWatch")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { Task { await authVM.loadClasses() } }) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .refreshable { await authVM.loadClasses() }
        }
        .sheet(isPresented: $showJoinDialog) {
            JoinSessionSheet(isPresented: $showJoinDialog)
                .environmentObject(authVM)
        }
    }
}

struct ClassRow: View {
    let classWithSession: ClassWithSession
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(classWithSession.classInfo.name).font(.subheadline).bold().foregroundColor(.white)
                Text(classWithSession.classInfo.subject).font(.caption).foregroundColor(Color(hex: "8B949E"))
                if let session = classWithSession.activeSession {
                    Text("Active: \(session.name)").font(.caption).foregroundColor(Color(hex: "10B981"))
                }
            }
            Spacer()
            Image(systemName: "chevron.right").foregroundColor(Color(hex: "8B949E"))
        }
        .padding()
        .background(Color(hex: "161B22")).cornerRadius(10)
    }
}

struct JoinSessionSheet: View {
    @Binding var isPresented: Bool
    @EnvironmentObject var authVM: StudentAuthViewModel
    @State private var code = ""
    @State private var loading = false
    @State private var error: String?
    
    var body: some View {
        NavigationView {
            ZStack {
                Color(hex: "0D1117").ignoresSafeArea()
                VStack(spacing: 20) {
                    Text("Enter the session code provided by your faculty")
                        .foregroundColor(Color(hex: "8B949E"))
                        .multilineTextAlignment(.center)
                    
                    TextField("Session Code", text: $code)
                        .textFieldStyle(.roundedBorder)
                        .autocapitalization(.allCharacters)
                    
                    if let e = error { Text(e).foregroundColor(.red).font(.caption) }
                    
                    Button(action: {
                        Task {
                            loading = true
                            error = nil
                            do {
                                let participant = try await StudentAPIService.shared.joinSession(joinCode: code)
                                let session = ActiveSessionInfo(id: participant.sessionId, name: "Active Session", status: participant.status, joinCode: code)
                                await MainActor.run {
                                    authVM.activeSession = session
                                    isPresented = false
                                }
                            } catch let e {
                                error = e.localizedDescription
                            }
                            loading = false
                        }
                    }) {
                        Group {
                            if loading { ProgressView().tint(.white) }
                            else { Text("Join Session").fontWeight(.semibold) }
                        }
                        .frame(maxWidth: .infinity).padding()
                        .background(Color(hex: "10B981")).foregroundColor(.white).cornerRadius(12)
                    }
                    .disabled(loading || code.isEmpty)
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Join Session")
            .navigationBarItems(leading: Button("Cancel") { isPresented = false })
        }
    }
}
