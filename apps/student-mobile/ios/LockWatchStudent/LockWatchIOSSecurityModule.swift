import Foundation
import React
import AutomaticAssessmentConfiguration

@objc(LockWatchIOSSecurityModule)
class LockWatchIOSSecurityModule: RCTEventEmitter {
    
    private var assessmentSession: AEAssessmentSession?
    private var isAssessmentActive: Bool = false

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func supportedEvents() -> [String]! {
        return [
            "assessmentBegan",
            "assessmentFailed",
            "assessmentInterrupted",
            "assessmentEnded"
        ]
    }

    @objc
    func checkCapabilities(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 13.4, *) {
            resolve([
                "isSupported": true,
                "hasAacEntitlement": true,
                "osVersion": UIDevice.current.systemVersion,
                "model": UIDevice.current.model
            ])
        } else {
            resolve([
                "isSupported": false,
                "hasAacEntitlement": false,
                "osVersion": UIDevice.current.systemVersion,
                "model": UIDevice.current.model
            ])
        }
    }

    @objc
    func verifyReadiness(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 13.4, *) {
            resolve([
                "isReady": true,
                "problem": NSNull()
            ])
        } else {
            resolve([
                "isReady": false,
                "problem": "Requires iOS 13.4+ for Automatic Assessment Configuration"
            ])
        }
    }

    @objc
    func startLock(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard #available(iOS 13.4, *) else {
            reject("UNSUPPORTED_OS", "Automatic Assessment Configuration requires iOS 13.4+", nil)
            return
        }

        DispatchQueue.main.async {
            do {
                let config = AEAssessmentConfiguration()
                if #available(iOS 14.0, *) {
                    config.autocorrectMode = .none
                    config.spellCheckMode = .none
                    config.allowsActivityContinuation = false
                    config.allowsDictation = false
                    config.allowsAccessibilitySpeech = false
                    config.allowsKeyboardShortcuts = false
                }

                self.assessmentSession = AEAssessmentSession(configuration: config)
                self.assessmentSession?.begin()
                self.isAssessmentActive = true

                self.sendEvent(withName: "assessmentBegan", body: [
                    "timestamp": ISO8601DateFormatter().string(from: Date()),
                    "mechanism": "IOS_AAC"
                ])

                resolve(["success": true])
            } catch {
                self.sendEvent(withName: "assessmentFailed", body: ["error": error.localizedDescription])
                reject("AAC_START_FAILED", error.localizedDescription, error)
            }
        }
    }

    @objc
    func stopLock(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            if let session = self.assessmentSession {
                session.end()
                self.assessmentSession = nil
                self.isAssessmentActive = false

                self.sendEvent(withName: "assessmentEnded", body: [
                    "timestamp": ISO8601DateFormatter().string(from: Date())
                ])
                resolve(["success": true])
            } else {
                resolve(["success": true])
            }
        }
    }

    @objc
    func getSecurityStatus(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve([
            "isSupported": true,
            "isEnrolled": true,
            "isLocked": self.isAssessmentActive,
            "activeMechanism": self.isAssessmentActive ? "IOS_AAC" : "NONE"
        ])
    }

    @objc
    func enterEmergency(_ durationSeconds: Double, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        self.stopLock(resolve, rejecter: reject)
    }

    @objc
    func exitEmergency(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        self.startLock(resolve, rejecter: reject)
    }
}
