import SwiftUI

struct FacultyClassDetailView: View {
    let facultyClass: FacultyClass
    @State private var sessions: [FacultySession] = []
    @State private var roster: [RosterMember] = []
    @State private var loading = true
    @State private var selectedTab = 0
    @State private var showCreateSession = false
    @State private var newSessionName = ""
    @State private var creating = false
    @State private var selectedSession: FacultySession?
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        ZStack {
            Color(hex: "0D1117").ignoresSafeArea()
            VStack(spacing: 0) {
                VStack(spacing: 4) {
                    Text("Join Code: \(facultyClass.joinCode)")
                        .font(.title2).bold().foregroundColor(Color(hex: "00BCD4"))
                    Text("\(facultyClass.subject)\(facultyClass.section.map { " · \($0)" } ?? "")").foregroundColor(Color(hex: "8B949E"))
                    Text("\(roster.count) students enrolled").font(.caption).foregroundColor(Color(hex: "8B949E"))
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color(hex: "161B22"))
                
                Picker("", selection: $selectedTab) {
                    Text("Sessions").tag(0)
                    Text("Roster").tag(1)
                }
                .pickerStyle(.segmented).padding()
                
                if loading {
                    ProgressView().tint(Color(hex: "2196F3"))
                } else if selectedTab == 0 {
                    if sessions.isEmpty {
                        Spacer()
                        VStack {
                            Image(systemName: "calendar.badge.plus").font(.system(size: 36)).foregroundColor(Color(hex: "8B949E"))
                            Text("No sessions yet").foregroundColor(Color(hex: "8B949E"))
                        }
                        Spacer()
                    } else {
                        List(sessions) { session in
                            Button(action: { selectedSession = session }) {
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(session.name).foregroundColor(.white).font(.headline)
                                        Text("Code: \(session.joinCode)").font(.caption).foregroundColor(Color(hex: "00BCD4"))
                                    }
                                    Spacer()
                                    Text(session.status.uppercased()).font(.caption).bold()
                                        .padding(.horizontal, 8).padding(.vertical, 4)
                                        .background(statusColor(session.status).opacity(0.2))
                                        .foregroundColor(statusColor(session.status))
                                        .cornerRadius(6)
                                }
                            }
                            .listRowBackground(Color(hex: "161B22"))
                        }
                        .listStyle(.plain).background(Color(hex: "0D1117")).scrollContentBackground(.hidden)
                    }
                } else {
                    List(roster) { member in
                        HStack {
                            Image(systemName: "person.fill").foregroundColor(Color(hex: "2196F3"))
                            VStack(alignment: .leading) {
                                Text(member.name).foregroundColor(.white)
                                if let rn = member.registerNumber { Text(rn).font(.caption).foregroundColor(Color(hex: "8B949E")) }
                            }
                        }
                        .listRowBackground(Color(hex: "161B22"))
                    }
                    .listStyle(.plain).background(Color(hex: "0D1117")).scrollContentBackground(.hidden)
                }
            }
        }
        .navigationTitle(facultyClass.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showCreateSession = true }) { Image(systemName: "plus") }
            }
        }
        .onAppear { load() }
        .sheet(item: $selectedSession) { session in
            FacultyLiveMonitorView(session: session)
        }
        .sheet(isPresented: $showCreateSession) {
            NavigationView {
                ZStack {
                    Color(hex: "0D1117").ignoresSafeArea()
                    VStack(spacing: 16) {
                        TextField("Session Name", text: $newSessionName).textFieldStyle(.roundedBorder)
                        Button(action: {
                            Task {
                                creating = true
                                do {
                                    let s = try await FacultyAPIService.shared.createSession(classId: facultyClass.id, name: newSessionName)
                                    await MainActor.run {
                                        sessions.append(s)
                                        showCreateSession = false
                                        newSessionName = ""
                                        creating = false
                                        selectedSession = s
                                    }
                                } catch {
                                    await MainActor.run { creating = false }
                                }
                            }
                        }) {
                            Group {
                                if creating { ProgressView().tint(.white) }
                                else { Text("Create Session").fontWeight(.semibold) }
                            }
                            .frame(maxWidth: .infinity).padding().background(Color(hex: "2196F3")).foregroundColor(.white).cornerRadius(12)
                        }
                        .disabled(creating || newSessionName.isEmpty)
                        Spacer()
                    }.padding()
                }
                .navigationTitle("New Session")
                .navigationBarItems(leading: Button("Cancel") { showCreateSession = false }.foregroundColor(.red))
            }
        }
    }
    
    func load() {
        Task {
            loading = true
            async let s = FacultyAPIService.shared.getSessions(classId: facultyClass.id)
            async let r = FacultyAPIService.shared.getRoster(classId: facultyClass.id)
            do {
                let (sv, rv) = try await (s, r)
                await MainActor.run { sessions = sv; roster = rv; loading = false }
            } catch {
                await MainActor.run { loading = false }
            }
        }
    }
    
    func statusColor(_ status: String) -> Color {
        switch status {
        case "active": return Color(hex: "10B981")
        case "paused": return Color(hex: "F59E0B")
        default: return Color(hex: "8B949E")
        }
    }
}
