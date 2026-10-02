import SwiftUI

struct FacultyLiveMonitorView: View {
    var session: FacultySession
    @State private var participants: [LiveParticipant] = []
    @State private var currentStatus: String
    @State private var loading = true
    @State private var refreshTask: Task<Void, Never>?
    @Environment(\.dismiss) var dismiss
    
    init(session: FacultySession) {
        self.session = session
        _currentStatus = State(initialValue: session.status)
    }
    
    var body: some View {
        ZStack {
            Color(hex: "0D1117").ignoresSafeArea()
            VStack(spacing: 0) {
                HStack(spacing: 12) {
                    statBox("Online", "\(participants.count { $0.status == "active" })", Color(hex: "10B981"))
                    statBox("Locked", "\(participants.count { $0.deviceLocked })", Color(hex: "00BCD4"))
                    statBox("Total", "\(participants.count)", Color(hex: "2196F3"))
                }
                .padding()
                
                if loading && participants.isEmpty {
                    Spacer()
                    ProgressView().tint(Color(hex: "2196F3"))
                    Spacer()
                } else if participants.isEmpty {
                    Spacer()
                    VStack {
                        Image(systemName: "person.3").font(.system(size: 36)).foregroundColor(Color(hex: "8B949E"))
                        Text("Waiting for students...").foregroundColor(Color(hex: "8B949E"))
                    }
                    Spacer()
                } else {
                    List(participants) { p in
                        HStack {
                            Circle().fill(p.deviceLocked ? Color(hex: "10B981") : Color(hex: "F59E0B")).frame(width: 10, height: 10)
                            VStack(alignment: .leading) {
                                Text(p.displayName).foregroundColor(.white).font(.subheadline)
                                if let rn = p.displayRegNo { Text(rn).font(.caption).foregroundColor(Color(hex: "8B949E")) }
                            }
                            Spacer()
                            VStack(alignment: .trailing) {
                                if let battery = p.batteryLevel {
                                    Text("🔋 \(battery)%").font(.caption).foregroundColor(battery < 20 ? Color(hex: "F59E0B") : Color(hex: "8B949E"))
                                }
                                Text(p.deviceLocked ? "LOCKED" : "UNLOCKED").font(.caption).bold().foregroundColor(p.deviceLocked ? Color(hex: "10B981") : Color(hex: "F59E0B"))
                            }
                        }
                        .listRowBackground(Color(hex: "161B22"))
                    }
                    .listStyle(.plain).background(Color(hex: "0D1117")).scrollContentBackground(.hidden)
                }
                
                HStack(spacing: 8) {
                    if currentStatus == "pending" || currentStatus == "created" {
                        controlBtn("Start", Color(hex: "10B981")) {
                            try await FacultyAPIService.shared.controlSession(sessionId: session.id, action: "start")
                            currentStatus = "active"
                        }
                    }
                    if currentStatus == "active" {
                        controlBtn("Pause", Color(hex: "F59E0B")) {
                            try await FacultyAPIService.shared.controlSession(sessionId: session.id, action: "pause")
                            currentStatus = "paused"
                        }
                        controlBtn("End", Color(hex: "DA3633")) {
                            try await FacultyAPIService.shared.controlSession(sessionId: session.id, action: "end")
                            currentStatus = "ended"
                            dismiss()
                        }
                    }
                    if currentStatus == "paused" {
                        controlBtn("Resume", Color(hex: "00BCD4")) {
                            try await FacultyAPIService.shared.controlSession(sessionId: session.id, action: "resume")
                            currentStatus = "active"
                        }
                        controlBtn("End", Color(hex: "DA3633")) {
                            try await FacultyAPIService.shared.controlSession(sessionId: session.id, action: "end")
                            currentStatus = "ended"
                            dismiss()
                        }
                    }
                }
                .padding()
                .background(Color(hex: "161B22"))
            }
        }
        .navigationTitle(session.name)
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            refreshTask = Task {
                while !Task.isCancelled {
                    do {
                        let ps = try await FacultyAPIService.shared.getLiveParticipants(sessionId: session.id)
                        await MainActor.run { participants = ps; loading = false }
                    } catch {}
                    try? await Task.sleep(nanoseconds: 3_000_000_000)
                }
            }
        }
        .onDisappear { refreshTask?.cancel() }
    }
    
    @ViewBuilder
    func statBox(_ label: String, _ value: String, _ color: Color) -> some View {
        VStack {
            Text(value).font(.title2).bold().foregroundColor(color)
            Text(label).font(.caption).foregroundColor(Color(hex: "8B949E"))
        }
        .frame(maxWidth: .infinity)
        .padding().background(Color(hex: "161B22")).cornerRadius(10)
    }
    
    func controlBtn(_ label: String, _ color: Color, action: @escaping () async throws -> Void) -> some View {
        Button(label) {
            Task { try? await action() }
        }
        .frame(maxWidth: .infinity).padding()
        .background(color).foregroundColor(.white).fontWeight(.semibold).cornerRadius(10)
    }
}
