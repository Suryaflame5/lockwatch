import Foundation
import AutomaticAssessmentConfiguration

/**
 * AssessmentSessionDelegate
 * Receives authoritative assessment lifecycle events directly from Apple's
 * Automatic Assessment Configuration (AEAssessmentSessionDelegate).
 */
public protocol AssessmentSecurityListener: AnyObject {
    func assessmentDidBegin()
    func assessmentDidEnd()
    func assessmentDidFail(error: Error)
    func assessmentWasInterrupted(reason: String)
}

public class AssessmentSessionDelegateHandler: NSObject, AEAssessmentSessionDelegate {
    
    private weak var listener: AssessmentSecurityListener?
    
    public init(listener: AssessmentSecurityListener) {
        self.listener = listener
        super.init()
    }
    
    public func assessmentSessionDidBegin(_ session: AEAssessmentSession) {
        NSLog("[LockWatch-iOS] AEAssessmentSession confirmed: Assessment session DID BEGIN.")
        listener?.assessmentDidBegin()
    }
    
    public func assessmentSessionDidEnd(_ session: AEAssessmentSession) {
        NSLog("[LockWatch-iOS] AEAssessmentSession confirmed: Assessment session DID END.")
        listener?.assessmentDidEnd()
    }
    
    public func assessmentSession(_ session: AEAssessmentSession, failedToBeginWithError error: Error) {
        NSLog("[LockWatch-iOS] AEAssessmentSession ERROR: Failed to begin: \(error.localizedDescription)")
        listener?.assessmentDidFail(error: error)
    }
    
    public func assessmentSessionWasInterrupted(_ session: AEAssessmentSession) {
        NSLog("[LockWatch-iOS] AEAssessmentSession WARNING: Assessment was INTERRUPTED by system event.")
        listener?.assessmentWasInterrupted(reason: "System interrupted assessment session (e.g. phone call or system prompt)")
    }
}
