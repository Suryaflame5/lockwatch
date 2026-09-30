import Foundation

/**
 * ManagedDeviceProfileHandler
 * Generates and validates Apple Mobile Device Management (MDM) configuration payload
 * for Supervised Device Single App Mode (App Lock payload).
 * Used for institution-managed iPhones and iPads (Section 3, Section 20).
 */
public class ManagedDeviceProfileHandler {
    
    public static func generateSingleAppModeProfile(
        bundleIdentifier: String = "com.lockwatch.app",
        institutionName: String
    ) -> String {
        let payloadUUID = UUID().uuidString
        let profileUUID = UUID().uuidString
        
        return """
        <?xml version="1.0" encoding="UTF-8"?>
        <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
        <plist version="1.0">
        <dict>
            <key>PayloadContent</key>
            <array>
                <dict>
                    <key>App</key>
                    <dict>
                        <key>Identifier</key>
                        <string>\(bundleIdentifier)</string>
                        <key>Options</key>
                        <dict>
                            <key>DisableTouch</key>
                            <false/>
                            <key>DisableDeviceRotation</key>
                            <false/>
                            <key>DisableVolumeButtons</key>
                            <false/>
                            <key>DisableRingerSwitch</key>
                            <false/>
                            <key>DisableSleepWakeButton</key>
                            <false/>
                            <key>DisableAutoLock</key>
                            <false/>
                            <key>EnableVoiceOver</key>
                            <false/>
                            <key>EnableZoom</key>
                            <false/>
                            <key>EnableInvertColors</key>
                            <false/>
                            <key>EnableAssistiveTouch</key>
                            <false/>
                            <key>EnableSpeakSelection</key>
                            <false/>
                            <key>EnableMonoAudio</key>
                            <false/>
                        </dict>
                    </dict>
                    <key>PayloadDescription</key>
                    <string>Configures LockWatch Single App Mode</string>
                    <key>PayloadDisplayName</key>
                    <string>LockWatch App Lock</string>
                    <key>PayloadIdentifier</key>
                    <string>com.lockwatch.mdm.applock.\(payloadUUID)</string>
                    <key>PayloadType</key>
                    <string>com.apple.app.lock</string>
                    <key>PayloadUUID</key>
                    <string>\(payloadUUID)</string>
                    <key>PayloadVersion</key>
                    <integer>1</integer>
                </dict>
            </array>
            <key>PayloadDisplayName</key>
            <string>\(institutionName) - LockWatch Supervised Assessment Profile</string>
            <key>PayloadIdentifier</key>
            <string>com.lockwatch.mdm.profile.\(profileUUID)</string>
            <key>PayloadOrganization</key>
            <string>\(institutionName)</string>
            <key>PayloadRemovalDisallowed</key>
            <true/>
            <key>PayloadType</key>
            <string>Configuration</string>
            <key>PayloadUUID</key>
            <string>\(profileUUID)</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
        </dict>
        </plist>
        """
    }
}
