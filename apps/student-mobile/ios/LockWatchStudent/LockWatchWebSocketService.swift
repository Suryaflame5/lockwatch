import Foundation
import Combine

class LockWatchWebSocketService: ObservableObject {
    static let shared = LockWatchWebSocketService()
    private var webSocketTask: URLSessionWebSocketTask?
    private let baseWsURL = "wss://lockwatch.onrender.com/ws"
    
    @Published var sessionEnded = false
    @Published var sessionPaused = false
    
    init() {}
    
    func connect(token: String, sessionId: String) {
        guard let url = URL(string: "\(baseWsURL)?token=\(token)&sessionId=\(sessionId)") else { return }
        let session = URLSession(configuration: .default)
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        receiveMessage()
    }
    
    func disconnect() {
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        webSocketTask = nil
        sessionEnded = false
        sessionPaused = false
    }
    
    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let msg):
                switch msg {
                case .string(let text):
                    self?.handleMessage(text)
                default: break
                }
                self?.receiveMessage()
            case .failure: break
            }
        }
    }
    
    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let event = json["event"] as? String else { return }
        
        DispatchQueue.main.async {
            switch event {
            case "session.ended": self.sessionEnded = true
            case "session.paused": self.sessionPaused = true
            case "session.resumed": self.sessionPaused = false
            default: break
            }
        }
    }
}
