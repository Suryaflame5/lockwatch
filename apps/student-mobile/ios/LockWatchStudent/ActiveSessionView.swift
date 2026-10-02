import SwiftUI

struct ActiveSessionView: View {
    @EnvironmentObject var authVM: StudentAuthViewModel
    @StateObject private var wsService = LockWatchWebSocketService()
    @State private var heartbeatTimer: Timer?
    @State private var isEmergency = false
    @State private var emergencyCountdown = 15
    @State private var emergencyTimer: Timer?
    
    var body: some View {
        ZStack {
            Color(hex: "0D1117").ignoresSafeArea()
            
            VStack(spacing: 24) {
                VStack(spacing: 8) {
                    Image(systemName: wsService.sessionPaused ? "pause.circle.fill" : "checkmark.shield.fill")
                        .font(.system(size: 64))
                        .foregroundColor(wsService.sessionPaused ? Color(hex: "F59E0B") : Color(hex: "10B981"))
                    
                    Text(wsService.sessionPaused ? "SESSION PAUSED" : "SESSION ACTIVE")
                        .font(.title2).bold()
                        .foregroundColor(wsService.sessionPaused ? Color(hex: "F59E0B") : Color(hex: "10B981"))
                    
                    if let session = authVM.activeSession {
                        Text(session.name)
                            .foregroundColor(Color(hex: "8B949E"))
                    }
                }
                
                VStack(spacing: 8) {
                    HStack {
                        Image(systemName: "lock.fill")
                        Text("Device Monitoring Active")
                        Spacer()
                        Image(systemName: "circle.fill")
                            .foregroundColor(Color(hex: "10B981"))
                            .font(.caption)
                    }
                    .foregroundColor(.white)
                    .padding()
                    .background(Color(hex: "161B22")).cornerRadius(12)
                    
                    Text("Do not leave this screen during the exam")
                        .font(.caption)
                        .foregroundColor(Color(hex: "8B949E"))
                        .multilineTextAlignment(.center)
                }
                
                Spacer()
                
                if !isEmergency {
                    Button(action: {
                        Task {
                            try? await StudentAPIService.shared.requestEmergency()
                            isEmergency = true
                            emergencyCountdown = 15
                            emergencyTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { t in
                                if emergencyCountdown > 0 {
                                    emergencyCountdown -= 1
                                } else {
                                    t.invalidate()
                                    Task { try? await StudentAPIService.shared.exitEmergency() }
                                    isEmergency = false
                                }
                            }
                        }
                    }) {
                        Label("Emergency Break", systemImage: "exclamationmark.triangle.fill")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red.opacity(0.8))
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                } else {
                    VStack(spacing: 8) {
                        Text("Emergency Active")
                            .font(.headline).foregroundColor(.red)
                        Text("Ends in \(emergencyCountdown)s")
                            .font(.subheadline).foregroundColor(Color(hex: "8B949E"))
                        Button("End Emergency Now") {
                            emergencyTimer?.invalidate()
                            Task { try? await StudentAPIService.shared.exitEmergency() }
                            isEmergency = false
                        }
                        .foregroundColor(Color(hex: "10B981"))
                    }
                }
            }
            .padding()
        }
        .onAppear {
            if let token = authVM.accessToken, let session = authVM.activeSession {
                wsService.connect(token: token, sessionId: session.id)
            }
            heartbeatTimer = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { _ in
                Task { try? await StudentAPIService.shared.sendHeartbeat(deviceId: "ios-device") }
            }
        }
        .onDisappear {
            heartbeatTimer?.invalidate()
            wsService.disconnect()
        }
        .onChange(of: wsService.sessionEnded) { ended in
            if ended { authVM.activeSession = nil }
        }
    }
}
