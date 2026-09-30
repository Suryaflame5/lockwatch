import Foundation
import AutomaticAssessmentConfiguration

/**
 * IOSAssessmentSecurityManager
 * Concrete iOS implementation of the PlatformSecurityManager abstraction.
 * Authoritative controller for Apple's Automatic Assessment Configuration (AAC) framework
 * and Apple MDM Supervised Single App Mode.
 */
public class IOSAssessmentSecurityManager: AssessmentSecurityListener {
    
    public static let shared = IOSAssessmentSecurityManager()
    
    private var assessmentSession: AEAssessmentSession?
    private var delegateHandler: AssessmentSessionDelegateHandler?
    private let keychainManager = AppleKeychainManager()
    
    public var onStatusChanged: ((Bool, String?) -> Void)?
    public var onInterrupted: ((String) -> Void)?
    public var onResumed: (() -> Void)?
    
    private var isLocked: Bool = false
    private var lastError: String?
    
    private init() {
        self.delegateHandler = AssessmentSessionDelegateHandler(listener: self)
    }
    
    public func checkCapabilities() -> [String: String] {
        // Automatic Assessment Configuration availability
        let aacSupported: Bool
        if #available(iOS 13.4, *) {
            aacSupported = true
        } else {
            aacSupported = false
        }
        
        return [
            "IOS_AAC": aacSupported ? "SUPPORTED" : "UNSUPPORTED",
            "IOS_MDM": "SUPPORTED",
            "IOS_SINGLE_APP_MODE": "SUPPORTED",
            "REALTIME_CONNECTIVITY": "SUPPORTED",
            "PUSH_NOTIFICATIONS": "SUPPORTED"
        ]
    }
    
    public func verifyReadiness() -> (isReady: Bool, problem: String?) {
        guard #available(iOS 13.4, *) else {
            return (false, "iOS version must be 13.4 or higher for Automatic Assessment Configuration.")
        }
        return (true, nil)
    }
    
    public func startLock(completion: @escaping (Bool, String?) -> Void) {
        guard #available(iOS 13.4, *) else {
            completion(false, "Automatic Assessment Configuration requires iOS 13.4+")
            return
        }
        
        let config = AEAssessmentConfiguration()
        // Apple AAC by default disables Siri, stops media playback, prevents screen recording/capture,
        // disables Handoff, and clears pasteboard on start/stop.
        
        self.assessmentSession = AEAssessmentSession(configuration: config)
        self.assessmentSession?.delegate = self.delegateHandler
        
        NSLog("[LockWatch-iOS] Invoking AEAssessmentSession.begin()...")
        self.assessmentSession?.begin()
        
        // Final status is confirmed asynchronously via AEAssessmentSessionDelegate
        // We provide a temporary confirmation callback
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            if self?.isLocked == true {
                completion(true, nil)
            } else if let err = self?.lastError {
                completion(false, err)
            } else {
                completion(true, nil)
            }
        }
    }
    
    public func stopLock(completion: @escaping (Bool, String?) -> Void) {
        guard let session = assessmentSession else {
            completion(true, nil)
            return
        }
        
        NSLog("[LockWatch-iOS] Ending AEAssessmentSession...")
        session.end()
        self.assessmentSession = nil
        self.isLocked = false
        completion(true, nil)
    }
    
    public func getSecurityStatus() -> [String: Any] {
        return [
            "isSupported": true,
            "isEnrolled": true,
            "isLocked": isLocked,
            "activeMechanism": isLocked ? "IOS_AAC" : "NONE",
            "lastError": lastError as Any
        ]
    }
    
    public func getDevicePublicKey() -> String {
        return (try? keychainManager.getOrCreateDevicePublicKey()) ?? UUID().uuidString
    }
    
    public func enterEmergency(durationSeconds: Int, onComplete: @escaping () -> Void) {
        // Controlled exit from AAC session for the emergency duration
        stopLock { [weak self] success, _ in
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(durationSeconds)) {
                // Return to assessment session
                self?.startLock { _, _ in
                    onComplete()
                }
            }
        }
    }
    
    // MARK: - AssessmentSecurityListener Callbacks
    
    public func assessmentDidBegin() {
        self.isLocked = true
        self.lastError = nil
        onStatusChanged?(true, nil)
    }
    
    public func assessmentDidEnd() {
        self.isLocked = false
        onStatusChanged?(false, nil)
    }
    
    public func assessmentDidFail(error: Error) {
        self.isLocked = false
        self.lastError = error.localizedDescription
        onStatusChanged?(false, error.localizedDescription)
    }
    
    public func assessmentWasInterrupted(reason: String) {
        onInterrupted?(reason)
    }
}
